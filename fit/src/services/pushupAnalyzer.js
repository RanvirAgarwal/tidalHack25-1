// Get your computer's IP address first (see Step 5)
// Then replace YOUR_IP with the actual IP
const API_BASE_URL = 'http://YOUR_IP:8000'; // e.g., http://192.168.1.100:8000

export class PushupAnalyzer {
  constructor() {
    this.apiUrl = API_BASE_URL;
  }

  async analyzeUserVideo(videoUri) {
    try {
      console.log('Uploading video to backend...');
      
      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'workout.mp4',
      });

      // Send to backend
      const response = await fetch(`${this.apiUrl}/analyze-video`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      console.log(`Analysis complete: ${result.frames_analyzed} frames processed`);
      
      return {
        report: result.report,
        framesAnalyzed: result.frames_analyzed
      };

    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  }

  async checkServerStatus() {
    try {
      const response = await fetch(`${this.apiUrl}/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.status === 'running';
    } catch (error) {
      console.error('Server check failed:', error);
      return false;
    }
  }
}