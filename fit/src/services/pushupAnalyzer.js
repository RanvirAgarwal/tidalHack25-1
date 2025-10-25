// IMPORTANT: Change this to your computer's IP address!
// Find it by running: ipconfig (Windows) or ifconfig (Mac)
const API_BASE_URL = 'http://192.168.1.100:8000'; // ⚠️ CHANGE THIS!

// If testing on web browser (localhost), use:
// const API_BASE_URL = 'http://localhost:8000';

// If testing on Android emulator, use:
// const API_BASE_URL = 'http://10.0.2.2:8000';

export class PushupAnalyzer {
  constructor() {
    this.apiUrl = API_BASE_URL;
    console.log('🔧 PushupAnalyzer initialized with URL:', this.apiUrl);
  }

  async analyzeUserVideo(videoUri) {
    try {
      console.log('📤 Uploading video to:', `${this.apiUrl}/analyze-video`);
      console.log('📹 Video URI:', videoUri);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'workout.mp4',
      });

      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      // Send to backend
      const response = await fetch(`${this.apiUrl}/analyze-video`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Analysis result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      console.log(`✅ Analysis complete: ${result.frames_analyzed} frames processed`);
      
      return {
        report: result.report,
        framesAnalyzed: result.frames_analyzed
      };

    } catch (error) {
      console.error('❌ Analysis error:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - server took too long to respond');
      }
      
      throw error;
    }
  }

  async checkServerStatus() {
    try {
      console.log('🔍 Checking server at:', this.apiUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${this.apiUrl}/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      console.log('📡 Server response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ Server returned error status:', response.status);
        return false;
      }
      
      const data = await response.json();
      console.log('✅ Server data:', data);
      
      const isRunning = data.status === 'running';
      console.log('🎯 Server status:', isRunning ? 'ONLINE' : 'OFFLINE');
      
      return isRunning;
      
    } catch (error) {
      console.error('❌ Server check failed:', error.message);
      
      if (error.name === 'AbortError') {
        console.error('⏱️ Connection timeout - server not reachable');
      } else if (error.message === 'Network request failed') {
        console.error('🌐 Network error - check IP address and WiFi connection');
      }
      
      return false;
    }
  }
}