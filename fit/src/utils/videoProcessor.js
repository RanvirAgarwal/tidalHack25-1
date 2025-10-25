import * as FileSystem from 'expo-file-system';

export class VideoProcessor {
  static async extractFrames(videoUri, fps = 10) {
    // For YOLO backend, we send the whole video
    // Backend will handle frame extraction
    console.log(`Preparing video: ${videoUri}`);
    
    // Verify file exists
    const fileInfo = await FileSystem.getInfoAsync(videoUri);
    if (!fileInfo.exists) {
      throw new Error('Video file not found');
    }
    
    return videoUri; // Return the URI directly
  }

  static async getVideoInfo(videoUri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      return {
        exists: fileInfo.exists,
        size: fileInfo.size,
        uri: videoUri
      };
    } catch (error) {
      console.error('Error getting video info:', error);
      return null;
    }
  }

  static async compressVideo(videoUri) {
    // Optional: Add video compression here if needed
    return videoUri;
  }
}