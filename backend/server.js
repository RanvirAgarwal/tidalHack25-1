const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Enable CORS
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Mock analysis function
function analyzePushup() {
  const score = Math.floor(Math.random() * (100 - 60) + 60);
  const feedback = [];

  if (score < 90) {
    feedback.push({
      type: 'warning',
      category: 'depth',
      severity: 'medium',
      message: 'Try to go slightly deeper on your push-ups.',
      correction: 'Lower your chest closer to the ground until elbows reach 90 degrees.'
    });
  }

  if (score < 75) {
    feedback.push({
      type: 'error',
      category: 'form',
      severity: 'high',
      message: 'Your hips are sagging during the movement.',
      correction: 'Engage your core and glutes to maintain a straight body line.'
    });
  }

  if (score < 80 && Math.random() > 0.5) {
    feedback.push({
      type: 'warning',
      category: 'form',
      severity: 'medium',
      message: 'Your elbows are flaring out slightly.',
      correction: 'Keep your elbows at about 45° from your body.'
    });
  }

  if (score < 85 && Math.random() > 0.6) {
    feedback.push({
      type: 'warning',
      category: 'balance',
      severity: 'low',
      message: 'Slight asymmetry detected between left and right sides.',
      correction: 'Focus on distributing weight evenly throughout the movement.'
    });
  }

  const grade = score >= 90 ? 'A' :
                score >= 80 ? 'B' :
                score >= 70 ? 'C' :
                score >= 60 ? 'D' : 'F';

  return {
    score,
    grade,
    feedback,
    summary: {
      errors: feedback.filter(f => f.type === 'error').length,
      warnings: feedback.filter(f => f.type === 'warning').length,
      passed: score >= 70
    },
    angles: {
      min_elbow: parseFloat((Math.random() * (105 - 85) + 85).toFixed(1)),
      avg_hip: parseFloat((Math.random() * (180 - 170) + 170).toFixed(1))
    }
  };
}

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Fitness AI API (Mock Mode)', 
    status: 'running',
    version: '1.0.0',
    endpoints: {
      analyze: 'POST /analyze-video',
      health: 'GET /'
    }
  });
});

app.post('/analyze-video', upload.single('file'), async (req, res) => {
  try {
    console.log('📹 Received video for analysis');
    console.log('   File:', req.file ? req.file.originalname : 'No file');
    console.log('   Size:', req.file ? `${(req.file.size / 1024 / 1024).toFixed(2)} MB` : 'N/A');
    
    // Simulate processing time (realistic delay)
    console.log('⏳ Processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate mock analysis
    const analysis = analyzePushup();
    
    console.log('✅ Analysis complete');
    console.log(`   Score: ${analysis.score}/100 (${analysis.grade})`);
    console.log(`   Errors: ${analysis.summary.errors}`);
    console.log(`   Warnings: ${analysis.summary.warnings}`);

    // Clean up uploaded file
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️  Cleaned up temporary file');
      } catch (err) {
        console.error('Warning: Could not delete temp file:', err.message);
      }
    }

    res.json({
      success: true,
      report: analysis,
      frames_analyzed: Math.floor(Math.random() * (50 - 20) + 20),
      mode: 'mock',
      message: 'This is a mock analysis. Real YOLO analysis coming soon!'
    });

  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 8000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 FITNESS AI BACKEND SERVER');
  console.log('='.repeat(60));
  console.log(`📍 Server running on:`);
  console.log(`   - Local:   http://localhost:${PORT}`);
  console.log(`   - Network: http://${getLocalIP()}:${PORT}`);
  console.log('='.repeat(60));
  console.log('📱 Use the Network URL in your React Native app');
  console.log('🔧 Mode: Mock Analysis (no YOLO yet)');
  console.log('📊 Ready to receive workout videos!');
  console.log('='.repeat(60) + '\n');
});

// Get local IP address
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});