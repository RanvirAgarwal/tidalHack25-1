/**
 * Dynamic Time Warping implementation
 */
export class DTW {
  constructor() {
    this.costMatrix = null;
    this.path = null;
  }

  calculate(seq1, seq2, angleKey) {
    const n = seq1.length;
    const m = seq2.length;
    
    this.costMatrix = Array(n + 1).fill(null).map(() => 
      Array(m + 1).fill(Infinity)
    );
    this.costMatrix[0][0] = 0;
    
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const cost = Math.abs(seq1[i - 1][angleKey] - seq2[j - 1][angleKey]);
        this.costMatrix[i][j] = cost + Math.min(
          this.costMatrix[i - 1][j],
          this.costMatrix[i][j - 1],
          this.costMatrix[i - 1][j - 1]
        );
      }
    }
    
    this.path = this.backtrack(n, m);
    return this.costMatrix[n][m];
  }

  backtrack(n, m) {
    const path = [];
    let i = n;
    let j = m;
    
    while (i > 0 && j > 0) {
      path.unshift([i - 1, j - 1]);
      
      const options = [
        this.costMatrix[i - 1][j],
        this.costMatrix[i][j - 1],
        this.costMatrix[i - 1][j - 1]
      ];
      
      const minIndex = options.indexOf(Math.min(...options));
      
      if (minIndex === 0) i--;
      else if (minIndex === 1) j--;
      else { i--; j--; }
    }
    
    return path;
  }

  getAlignedSequences(seq1, seq2) {
    const aligned1 = [];
    const aligned2 = [];
    
    for (const [i, j] of this.path) {
      aligned1.push(seq1[i]);
      aligned2.push(seq2[j]);
    }
    
    return { aligned1, aligned2 };
  }
}

export function alignSequences(referenceAngles, userAngles) {
  const dtw = new DTW();
  const alignedSequences = {};
  
  const angleTypes = ['leftElbow', 'leftShoulder', 'leftHip', 'leftKnee',
                      'rightElbow', 'rightShoulder', 'rightHip', 'rightKnee'];
  
  for (const angleType of angleTypes) {
    const distance = dtw.calculate(referenceAngles, userAngles, angleType);
    const { aligned1, aligned2 } = dtw.getAlignedSequences(referenceAngles, userAngles);
    
    alignedSequences[angleType] = {
      reference: aligned1.map(a => a[angleType]),
      user: aligned2.map(a => a[angleType]),
      distance: distance
    };
  }
  
  return alignedSequences;
}