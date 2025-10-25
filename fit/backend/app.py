from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import torch
from torchvision import transforms
import time
import tempfile
import os
from typing import List, Dict
import json

app = FastAPI()

# Enable CORS for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLO model
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
model = None
input_size = 640

def load_model():
    global model
    try:
        # Load your YOLO pose model
        model = torch.load('yolov7-w6-pose.pt', map_location=device)
        model.float().eval()
        print("Model loaded successfully")
    except Exception as e:
        print(f"Error loading model: {e}")

def letterbox(im, new_shape=(640, 640), color=(114, 114, 114), auto=True, scaleup=True, stride=32):
    """Resize and pad image while meeting stride-multiple constraints"""
    shape = im.shape[:2]
    if isinstance(new_shape, int):
        new_shape = (new_shape, new_shape)

    r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])
    if not scaleup:
        r = min(r, 1.0)

    new_unpad = int(round(shape[1] * r)), int(round(shape[0] * r))
    dw, dh = new_shape[1] - new_unpad[0], new_shape[0] - new_unpad[1]

    if auto:
        dw, dh = np.mod(dw, stride), np.mod(dh, stride)

    dw /= 2
    dh /= 2

    if shape[::-1] != new_unpad:
        im = cv2.resize(im, new_unpad, interpolation=cv2.INTER_LINEAR)
    top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
    left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
    im = cv2.copyMakeBorder(im, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color)
    return im, r, (dw, dh)

def non_max_suppression_kpt(prediction, conf_thres=0.25, iou_thres=0.45, classes=None, agnostic=False, multi_label=False, labels=(), kpt_label=False, nc=None, nkpt=None):
    """Runs Non-Maximum Suppression (NMS) on inference results"""
    nc = nc or (prediction.shape[2] - 5)
    xc = prediction[..., 4] > conf_thres

    min_wh, max_wh = 2, 7680
    max_det = 300
    max_nms = 30000
    time_limit = 10.0
    redundant = True
    multi_label &= nc > 1
    merge = False

    t = time.time()
    output = [torch.zeros((0, 6 + nkpt * 3), device=prediction.device)] * prediction.shape[0]
    
    for xi, x in enumerate(prediction):
        x = x[xc[xi]]

        if labels and len(labels[xi]):
            lb = labels[xi]
            v = torch.zeros((len(lb), nc + 5 + nkpt * 3), device=x.device)
            v[:, :4] = lb[:, 1:5]
            v[:, 4] = 1.0
            v[:, 5:] = lb[:, 6:]
            x = torch.cat((x, v), 0)

        if not x.shape[0]:
            continue

        x[:, 5:5+nc] *= x[:, 4:5]

        box = xywh2xyxy(x[:, :4])
        kpts = x[:, 6:]

        if multi_label:
            i, j = (x[:, 5:5+nc] > conf_thres).nonzero(as_tuple=False).T
            x = torch.cat((box[i], x[i, j + 5, None], j[:, None].float(), kpts[i]), 1)
        else:
            conf, j = x[:, 5:5+nc].max(1, keepdim=True)
            x = torch.cat((box, conf, j.float(), kpts), 1)[conf.view(-1) > conf_thres]

        if classes is not None:
            x = x[(x[:, 5:6] == torch.tensor(classes, device=x.device)).any(1)]

        n = x.shape[0]
        if not n:
            continue
        elif n > max_nms:
            x = x[x[:, 4].argsort(descending=True)[:max_nms]]

        c = x[:, 5:6] * (0 if agnostic else max_wh)
        boxes, scores = x[:, :4] + c, x[:, 4]
        i = torchvision.ops.nms(boxes, scores, iou_thres)
        if i.shape[0] > max_det:
            i = i[:max_det]
        if merge and (1 < n < 3E3):
            iou = box_iou(boxes[i], boxes) > iou_thres
            weights = iou * scores[None]
            x[i, :4] = torch.mm(weights, x[:, :4]).float() / weights.sum(1, keepdim=True)
            if redundant:
                i = i[iou.sum(1) > 1]

        output[xi] = x[i]
        if (time.time() - t) > time_limit:
            break

    return output

def xywh2xyxy(x):
    """Convert nx4 boxes from [x, y, w, h] to [x1, y1, x2, y2]"""
    y = x.clone() if isinstance(x, torch.Tensor) else np.copy(x)
    y[:, 0] = x[:, 0] - x[:, 2] / 2
    y[:, 1] = x[:, 1] - x[:, 3] / 2
    y[:, 2] = x[:, 0] + x[:, 2] / 2
    y[:, 3] = x[:, 1] + x[:, 3] / 2
    return y

def output_to_keypoint(output):
    """Convert model output to keypoint array"""
    targets = []
    for i, (batch_id, *xyxy, conf, cls_id, *kpts) in enumerate(output):
        targets.append([batch_id.item(), *xyxy, conf.item(), cls_id.item(), *kpts])
    return np.array(targets)

def pose_video_frame(frame):
    """Process single frame for pose detection"""
    mapped_img = frame.copy()
    
    # Letterbox resizing
    img = letterbox(frame, input_size, stride=64, auto=True)[0]
    img_ = img.copy()
    
    # Convert to tensor
    img = transforms.ToTensor()(img)
    img = torch.tensor(np.array([img.numpy()]))
    img = img.to(device)
    
    # Inference
    with torch.no_grad():
        t1 = time.time()
        output, _ = model(img)
        t2 = time.time()
        fps = 1/(t2 - t1)
        
        output = non_max_suppression_kpt(
            output,
            0.25,    # Conf. Threshold
            0.65,    # IoU Threshold
            nc=1,    # Number of classes
            nkpt=17, # Number of keypoints
            kpt_label=True
        )
        output = output_to_keypoint(output)
    
    return output, fps

def extract_keypoints_from_output(output):
    """Extract keypoints in MediaPipe format for compatibility"""
    if output.shape[0] == 0:
        return None
    
    # YOLO pose has 17 keypoints, we'll map them to MediaPipe's 33-point format
    # YOLO keypoints: nose, eyes, ears, shoulders, elbows, wrists, hips, knees, ankles
    keypoints_17 = output[0, 7:].reshape(-1, 3)  # [17, 3] (x, y, conf)
    
    # Map to MediaPipe format (simplified mapping)
    landmarks = []
    
    # YOLO indices:
    # 0: nose, 1-2: eyes, 3-4: ears, 5-6: shoulders, 7-8: elbows, 
    # 9-10: wrists, 11-12: hips, 13-14: knees, 15-16: ankles
    
    # MediaPipe indices we care about:
    # 11-12: shoulders, 13-14: elbows, 15-16: wrists
    # 23-24: hips, 25-26: knees, 27-28: ankles
    
    # Create full 33-point array (fill unused with zeros)
    mediapipe_landmarks = np.zeros((33, 3))
    
    # Map YOLO to MediaPipe indices
    mapping = {
        5: 11,   # left shoulder
        6: 12,   # right shoulder
        7: 13,   # left elbow
        8: 14,   # right elbow
        9: 15,   # left wrist
        10: 16,  # right wrist
        11: 23,  # left hip
        12: 24,  # right hip
        13: 25,  # left knee
        14: 26,  # right knee
        15: 27,  # left ankle
        16: 28,  # right ankle
    }
    
    for yolo_idx, mp_idx in mapping.items():
        if yolo_idx < len(keypoints_17):
            mediapipe_landmarks[mp_idx] = keypoints_17[yolo_idx]
    
    # Convert to list of dicts
    landmarks = []
    for i, (x, y, conf) in enumerate(mediapipe_landmarks):
        landmarks.append({
            'x': float(x),
            'y': float(y),
            'z': 0.0,  # YOLO doesn't provide z
            'visibility': float(conf)
        })
    
    return landmarks

def calculate_angle(a, b, c):
    """Calculate angle between three points"""
    ba = np.array([a['x'] - b['x'], a['y'] - b['y']])
    bc = np.array([c['x'] - b['x'], c['y'] - b['y']])
    
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    
    return np.degrees(angle)

def analyze_pushup_form(landmarks_sequence):
    """Analyze pushup form from sequence of landmarks"""
    feedback = []
    
    # Extract key angles across frames
    elbow_angles = []
    hip_angles = []
    
    for landmarks in landmarks_sequence:
        if landmarks is None:
            continue
        
        # Left elbow angle
        left_elbow = calculate_angle(
            landmarks[11],  # shoulder
            landmarks[13],  # elbow
            landmarks[15]   # wrist
        )
        elbow_angles.append(left_elbow)
        
        # Hip angle (body alignment)
        hip_angle = calculate_angle(
            landmarks[11],  # shoulder
            landmarks[23],  # hip
            landmarks[25]   # knee
        )
        hip_angles.append(hip_angle)
    
    # Analyze form
    min_elbow_angle = min(elbow_angles) if elbow_angles else 180
    avg_hip_angle = np.mean(hip_angles) if hip_angles else 180
    
    score = 100
    
    # Check elbow depth
    if min_elbow_angle > 110:
        feedback.append({
            'type': 'error',
            'category': 'depth',
            'severity': 'high',
            'message': f"Not going deep enough. Elbow angle: {min_elbow_angle:.1f}° (target: 90°)",
            'correction': 'Lower your chest closer to the ground until elbows reach 90 degrees.'
        })
        score -= 20
    elif min_elbow_angle > 100:
        feedback.append({
            'type': 'warning',
            'category': 'depth',
            'severity': 'medium',
            'message': f"Could go slightly deeper. Elbow angle: {min_elbow_angle:.1f}°",
            'correction': 'Try to reach a 90-degree elbow bend.'
        })
        score -= 10
    
    # Check hip alignment
    if avg_hip_angle < 170:
        feedback.append({
            'type': 'error',
            'category': 'form',
            'severity': 'high',
            'message': f"Hips are sagging. Hip angle: {avg_hip_angle:.1f}° (target: 180°)",
            'correction': 'Engage your core and glutes to maintain a straight body line.'
        })
        score -= 20
    elif avg_hip_angle < 175:
        feedback.append({
            'type': 'warning',
            'category': 'form',
            'severity': 'medium',
            'message': 'Slight hip sag detected.',
            'correction': 'Focus on keeping your core tight throughout the movement.'
        })
        score -= 10
    
    # Calculate grade
    if score >= 90:
        grade = 'A'
    elif score >= 80:
        grade = 'B'
    elif score >= 70:
        grade = 'C'
    elif score >= 60:
        grade = 'D'
    else:
        grade = 'F'
    
    return {
        'score': max(0, score),
        'grade': grade,
        'feedback': feedback,
        'summary': {
            'errors': len([f for f in feedback if f['type'] == 'error']),
            'warnings': len([f for f in feedback if f['type'] == 'warning']),
            'passed': score >= 70
        },
        'angles': {
            'min_elbow': float(min_elbow_angle),
            'avg_hip': float(avg_hip_angle)
        }
    }

@app.on_event("startup")
async def startup_event():
    load_model()

@app.get("/")
async def root():
    return {"message": "YOLO Pose Detection API", "status": "running"}

@app.post("/analyze-video")
async def analyze_video(file: UploadFile = File(...)):
    """Analyze uploaded video for pushup form"""
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        # Process video
        cap = cv2.VideoCapture(tmp_path)
        frame_count = 0
        max_frames = 150  # Limit to ~10 seconds at 15fps
        landmarks_sequence = []
        
        while cap.isOpened() and frame_count < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Process every 2nd frame for speed
            if frame_count % 2 == 0:
                output, fps = pose_video_frame(frame)
                landmarks = extract_keypoints_from_output(output)
                if landmarks:
                    landmarks_sequence.append(landmarks)
            
            frame_count += 1
        
        cap.release()
        os.unlink(tmp_path)  # Delete temp file
        
        if len(landmarks_sequence) < 5:
            raise HTTPException(status_code=400, detail="Could not detect person in video")
        
        # Analyze form
        analysis = analyze_pushup_form(landmarks_sequence)
        
        return JSONResponse(content={
            'success': True,
            'report': analysis,
            'frames_analyzed': len(landmarks_sequence)
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={'success': False, 'error': str(e)}
        )

@app.post("/analyze-frame")
async def analyze_frame(file: UploadFile = File(...)):
    """Analyze single frame for real-time feedback"""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        output, fps = pose_video_frame(frame)
        landmarks = extract_keypoints_from_output(output)
        
        if landmarks is None:
            raise HTTPException(status_code=400, detail="No person detected in frame")
        
        return JSONResponse(content={
            'success': True,
            'landmarks': landmarks,
            'fps': fps
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={'success': False, 'error': str(e)}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)