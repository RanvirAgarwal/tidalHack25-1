export class FeedbackGenerator {
  constructor(thresholds = {}) {
    this.thresholds = {
      elbowDepth: 15,
      hipSag: 10,
      elbowFlare: 20,
      kneeStability: 15,
      ...thresholds
    };
    
    this.feedback = [];
  }

  analyze(alignedSequences) {
    this.feedback = [];
    
    this.checkElbowDepth(alignedSequences);
    this.checkHipStability(alignedSequences);
    this.checkElbowFlare(alignedSequences);
    this.checkKneeStability(alignedSequences);
    this.checkSymmetry(alignedSequences);
    
    return this.generateReport();
  }

  checkElbowDepth(sequences) {
    const refMinElbow = Math.min(...sequences.leftElbow.reference);
    const userMinElbow = Math.min(...sequences.leftElbow.user);
    
    const difference = userMinElbow - refMinElbow;
    
    if (difference > this.thresholds.elbowDepth) {
      this.feedback.push({
        type: 'error',
        category: 'depth',
        severity: 'high',
        message: `You're not going deep enough. Your elbows only bent to ${userMinElbow.toFixed(1)}°, but should reach ${refMinElbow.toFixed(1)}°.`,
        correction: 'Lower your chest closer to the ground. Aim for a 90-degree bend at the elbow.',
        timestamp: sequences.leftElbow.user.indexOf(userMinElbow)
      });
    }
  }

  checkHipStability(sequences) {
    const refHipAngles = sequences.leftHip.reference;
    const userHipAngles = sequences.leftHip.user;
    
    let totalDeviation = 0;
    let sagFrames = 0;
    
    for (let i = 0; i < refHipAngles.length; i++) {
      const deviation = refHipAngles[i] - userHipAngles[i];
      totalDeviation += Math.abs(deviation);
      
      if (deviation > this.thresholds.hipSag) {
        sagFrames++;
      }
    }
    
    const sagPercentage = (sagFrames / refHipAngles.length) * 100;
    
    if (sagPercentage > 30) {
      this.feedback.push({
        type: 'error',
        category: 'form',
        severity: 'high',
        message: `Your hips are sagging for ${sagPercentage.toFixed(0)}% of the movement.`,
        correction: 'Engage your core and glutes. Imagine a straight line from your head to your heels.',
        affectedFrames: sagFrames
      });
    }
  }

  checkElbowFlare(sequences) {
    const refShoulder = sequences.leftShoulder.reference;
    const userShoulder = sequences.leftShoulder.user;
    
    let flareCount = 0;
    
    for (let i = 0; i < refShoulder.length; i++) {
      const difference = Math.abs(userShoulder[i] - refShoulder[i]);
      
      if (difference > this.thresholds.elbowFlare) {
        flareCount++;
      }
    }
    
    const flarePercentage = (flareCount / refShoulder.length) * 100;
    
    if (flarePercentage > 40) {
      this.feedback.push({
        type: 'error',
        category: 'form',
        severity: 'high',
        message: 'Your elbows are flaring out too much.',
        correction: 'Keep your elbows at about 45° from your body, not perpendicular.',
        affectedFrames: flareCount
      });
    }
  }

  checkKneeStability(sequences) {
    const userKnee = sequences.leftKnee.user;
    const idealKneeAngle = 180;
    
    let bentFrames = 0;
    
    for (const angle of userKnee) {
      if (Math.abs(angle - idealKneeAngle) > this.thresholds.kneeStability) {
        bentFrames++;
      }
    }
    
    const bentPercentage = (bentFrames / userKnee.length) * 100;
    
    if (bentPercentage > 25) {
      this.feedback.push({
        type: 'warning',
        category: 'form',
        severity: 'medium',
        message: 'Your knees are bending during the pushup.',
        correction: 'Keep your legs completely straight and engage your quads.',
        affectedFrames: bentFrames
      });
    }
  }

  checkSymmetry(sequences) {
    const leftElbow = sequences.leftElbow.user;
    const rightElbow = sequences.rightElbow.user;
    
    let asymmetryCount = 0;
    const symmetryThreshold = 10;
    
    for (let i = 0; i < Math.min(leftElbow.length, rightElbow.length); i++) {
      const difference = Math.abs(leftElbow[i] - rightElbow[i]);
      
      if (difference > symmetryThreshold) {
        asymmetryCount++;
      }
    }
    
    const asymmetryPercentage = (asymmetryCount / leftElbow.length) * 100;
    
    if (asymmetryPercentage > 30) {
      this.feedback.push({
        type: 'warning',
        category: 'balance',
        severity: 'medium',
        message: 'Your movement is asymmetric between left and right sides.',
        correction: 'Focus on distributing weight evenly.',
        affectedFrames: asymmetryCount
      });
    }
  }

  generateReport() {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    this.feedback.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    
    const errorCount = this.feedback.filter(f => f.type === 'error').length;
    const warningCount = this.feedback.filter(f => f.type === 'warning').length;
    
    let overallScore = 100;
    overallScore -= errorCount * 15;
    overallScore -= warningCount * 5;
    overallScore = Math.max(0, overallScore);
    
    return {
      score: overallScore,
      grade: this.calculateGrade(overallScore),
      feedback: this.feedback,
      summary: {
        errors: errorCount,
        warnings: warningCount,
        passed: errorCount === 0
      }
    };
  }

  calculateGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}