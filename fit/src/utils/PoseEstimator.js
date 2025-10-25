// This file is now simplified since YOLO backend handles pose detection
export class PoseEstimator {
  constructor() {
    console.log('PoseEstimator initialized (using YOLO backend)');
  }

  async processFrames(videoUri) {
    // Video processing is handled by backend
    console.log('Video will be processed by YOLO backend');
    return videoUri;
  }
}