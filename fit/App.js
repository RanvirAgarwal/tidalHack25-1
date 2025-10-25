import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
  Modal,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Import our services
import { PushupAnalyzer } from './src/services/pushupAnalyzer';
import { VideoProcessor } from './src/utils/videoProcessor';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const App = () => {
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [userName, setUserName] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [workoutData, setWorkoutData] = useState({ sets: '', reps: '' });
  const [availablePoints, setAvailablePoints] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [scale, setScale] = useState(1);
  
  // New states for video analysis
  const [showVideoAnalysisModal, setShowVideoAnalysisModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');
  
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastPanValue = useRef({ x: 0, y: 0 });
  const analyzerRef = useRef(new PushupAnalyzer());

  const [skills, setSkills] = useState([
    // Core Exercises - Center
    { 
      id: 1, 
      name: 'Push-ups', 
      icon: '💪', 
      x: -100, 
      y: -150, 
      unlocked: true, 
      active: true, 
      level: 0,
      maxLevel: 10,
      description: 'Basic upper body strength. Master this before moving to advanced variations.',
      sets: '3 sets',
      reps: '10-15 reps',
      cost: 0,
      requires: [],
      category: 'push',
      targetSets: 3,
      targetReps: 10,
      hasVideoAnalysis: true,
      tips: [
        '• Keep your body in a straight line',
        '• Engage your core throughout',
        '• Lower yourself until chest nearly touches ground',
        '• Push through your palms, not fingers',
        '• Start with knee push-ups if too difficult',
        '• Take 2-3 minute rest between sets'
      ]
    },
    { 
      id: 2, 
      name: 'Pull-ups', 
      icon: '🦾', 
      x: 100, 
      y: -150, 
      unlocked: true, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Essential back and bicep exercise. Foundation for all pulling movements.',
      sets: '3 sets',
      reps: '5-8 reps',
      cost: 0,
      requires: [],
      category: 'pull',
      targetSets: 3,
      targetReps: 5,
      hasVideoAnalysis: true,
      tips: [
        '• Use full range of motion',
        '• Pull until chin is over the bar',
        '• Control the descent slowly',
        '• Avoid swinging or kipping',
        '• Use resistance bands for assistance',
        '• Practice dead hangs to build grip strength'
      ]
    },
    { 
      id: 3, 
      name: 'Squats', 
      icon: '🦵', 
      x: -100, 
      y: 50, 
      unlocked: true, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Lower body foundation. Build powerful legs and improve mobility.',
      sets: '3 sets',
      reps: '15-20 reps',
      cost: 0,
      requires: [],
      category: 'legs',
      targetSets: 3,
      targetReps: 15,
      hasVideoAnalysis: true,
      tips: [
        '• Keep chest up and back straight',
        '• Push knees outward, not inward',
        '• Go down until thighs are parallel to ground',
        '• Weight on heels, not toes',
        '• Practice bodyweight first before adding weight',
        '• Stretch hip flexors regularly'
      ]
    },
    { 
      id: 4, 
      name: 'Plank', 
      icon: '🧘', 
      x: 100, 
      y: 50, 
      unlocked: true, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Core stability and endurance. Essential for all movements.',
      sets: '3 sets',
      reps: '30-60 sec',
      cost: 0,
      requires: [],
      category: 'core',
      targetSets: 3,
      targetReps: 30,
      hasVideoAnalysis: true,
      tips: [
        '• Keep body in straight line from head to heels',
        '• Engage core by pulling belly button to spine',
        '• Don\'t let hips sag or pike up',
        '• Breathe steadily throughout',
        '• Start with shorter holds and build up',
        '• Focus on form over duration'
      ]
    },
    
    // Push Progressions
    { 
      id: 5, 
      name: 'Diamond\nPush-ups', 
      icon: '💎', 
      x: -250, 
      y: -150, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Target triceps with this challenging variation. Hands form a diamond shape.',
      sets: '3 sets',
      reps: '8-12 reps',
      cost: 5,
      requires: [1],
      category: 'push',
      targetSets: 3,
      targetReps: 8,
      hasVideoAnalysis: true,
      tips: [
        '• Place hands close together forming a diamond',
        '• Keep elbows close to body',
        '• This variation heavily targets triceps',
        '• If too hard, start with hands slightly wider',
        '• Build up regular push-up strength first',
        '• Focus on controlled movement'
      ]
    },
    { 
      id: 6, 
      name: 'Archer\nPush-ups', 
      icon: '🏹', 
      x: -250, 
      y: -50, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Single arm strength builder. Step toward one-arm push-ups.',
      sets: '3 sets',
      reps: '6-10 reps',
      cost: 6,
      requires: [5],
      category: 'push',
      targetSets: 3,
      targetReps: 6,
      hasVideoAnalysis: true,
      tips: [
        '• Shift weight to one arm while other extends',
        '• Extended arm stays straight',
        '• Core stability is crucial here',
        '• Practice with elevated hands first',
        '• Alternate sides each rep',
        '• Master diamond push-ups before attempting'
      ]
    },
    { 
      id: 7, 
      name: 'One-Arm\nPush-ups', 
      icon: '🦾', 
      x: -380, 
      y: -100, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Ultimate pushing strength. Elite level bodyweight exercise.',
      sets: '3 sets',
      reps: '3-6 reps',
      cost: 8,
      requires: [6],
      category: 'push',
      targetSets: 3,
      targetReps: 3,
      hasVideoAnalysis: true,
      tips: [
        '• Place hand under shoulder, feet wide',
        '• Keep body rigid to prevent rotation',
        '• Free arm can rest on back or hip',
        '• Takes months of training to achieve',
        '• Use a basketball to elevate hand initially',
        '• Practice negatives (lowering only) first'
      ]
    },
    { 
      id: 8, 
      name: 'Pike\nPush-ups', 
      icon: '🔺', 
      x: -100, 
      y: -280, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Shoulder focused variation. Build boulder shoulders.',
      sets: '3 sets',
      reps: '8-12 reps',
      cost: 5,
      requires: [1],
      category: 'push',
      targetSets: 3,
      targetReps: 8,
      hasVideoAnalysis: true,
      tips: [
        '• Form an inverted V with your body',
        '• Keep legs straight, hips high',
        '• Lower head toward ground between hands',
        '• Push back up to starting position',
        '• Elevate feet for increased difficulty',
        '• Great preparation for handstand push-ups'
      ]
    },
    { 
      id: 9, 
      name: 'Handstand\nPush-ups', 
      icon: '🤸', 
      x: -100, 
      y: -400, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Advanced shoulder strength and balance. True test of upper body power.',
      sets: '3 sets',
      reps: '5-8 reps',
      cost: 10,
      requires: [8],
      category: 'push',
      targetSets: 3,
      targetReps: 5,
      hasVideoAnalysis: true,
      tips: [
        '• Master handstand hold first (60+ seconds)',
        '• Use wall for support initially',
        '• Lower head to ground with control',
        '• Keep core tight to maintain balance',
        '• Practice pike push-ups extensively first',
        '• Consider using parallettes for more range'
      ]
    },
    
    // Pull Progressions
    { 
      id: 10, 
      name: 'Chin-ups', 
      icon: '💪', 
      x: 250, 
      y: -150, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Underhand grip variation. More bicep emphasis.',
      sets: '3 sets',
      reps: '6-10 reps',
      cost: 5,
      requires: [2],
      category: 'pull',
      targetSets: 3,
      targetReps: 6,
      hasVideoAnalysis: true,
      tips: [
        '• Palms facing toward you',
        '• Slightly easier than pull-ups',
        '• Great for building bicep strength',
        '• Pull shoulder blades down and back',
        '• Use full range of motion',
        '• Focus on squeezing at the top'
      ]
    },
    { 
      id: 11, 
      name: 'Weighted\nPull-ups', 
      icon: '🏋️', 
      x: 100, 
      y: -280, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Add extra resistance to build maximum strength.',
      sets: '3 sets',
      reps: '5-8 reps',
      cost: 6,
      requires: [2],
      category: 'pull',
      targetSets: 3,
      targetReps: 5,
      hasVideoAnalysis: false,
      tips: [
        '• Start with small weight (5-10 lbs)',
        '• Use a weight belt or vest',
        '• Master 15+ bodyweight pull-ups first',
        '• Maintain strict form with added weight',
        '• Increase weight gradually',
        '• Deload every 4-6 weeks'
      ]
    },
    { 
      id: 12, 
      name: 'Muscle-ups', 
      icon: '🔥', 
      x: 100, 
      y: -400, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Combine pull-up and dip in one explosive movement. Elite skill.',
      sets: '3 sets',
      reps: '3-5 reps',
      cost: 10,
      requires: [11],
      category: 'pull',
      targetSets: 3,
      targetReps: 3,
      hasVideoAnalysis: false,
      tips: [
        '• Requires explosive pull to transition',
        '• Practice high pull-ups first',
        '• Learn false grip for rings',
        '• Lean back slightly at top of pull',
        '• Practice dips separately (15+ reps)',
        '• Use resistance band for assistance'
      ]
    },
    { 
      id: 13, 
      name: 'Archer\nPull-ups', 
      icon: '🎯', 
      x: 250, 
      y: -50, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Single arm pull-up progression. Shift weight to one side.',
      sets: '3 sets',
      reps: '4-8 reps',
      cost: 7,
      requires: [10],
      category: 'pull',
      targetSets: 3,
      targetReps: 4,
      hasVideoAnalysis: true,
      tips: [
        '• Pull up while keeping one arm straight',
        '• Shift weight to pulling side',
        '• Alternate arms each rep',
        '• Core engagement prevents rotation',
        '• Practice with assistance band',
        '• Progress slowly with this movement'
      ]
    },
    { 
      id: 14, 
      name: 'One-Arm\nPull-ups', 
      icon: '👑', 
      x: 380, 
      y: -100, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'The king of pulling exercises. Ultimate back and arm strength.',
      sets: '3 sets',
      reps: '1-3 reps',
      cost: 12,
      requires: [13],
      category: 'pull',
      targetSets: 3,
      targetReps: 1,
      hasVideoAnalysis: true,
      tips: [
        '• Requires exceptional strength',
        '• Can take 1-2 years to achieve',
        '• Practice weighted pull-ups (50+ lbs)',
        '• Master archer pull-ups first',
        '• Use other hand for slight assistance',
        '• Practice negatives extensively'
      ]
    },
    
    // Leg Progressions
    { 
      id: 15, 
      name: 'Lunges', 
      icon: '🚶', 
      x: -250, 
      y: 50, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Single leg strength and balance. Functional movement pattern.',
      sets: '3 sets',
      reps: '12-15 reps',
      cost: 4,
      requires: [3],
      category: 'legs',
      targetSets: 3,
      targetReps: 12,
      hasVideoAnalysis: true,
      tips: [
        '• Step forward and lower back knee',
        '• Front knee shouldn\'t pass toes',
        '• Keep torso upright',
        '• Push through front heel to return',
        '• Builds single leg stability',
        '• Add dumbbells for progression'
      ]
    },
    { 
      id: 16, 
      name: 'Bulgarian\nSplit Squats', 
      icon: '🏔️', 
      x: -250, 
      y: 150, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Elevated rear foot increases difficulty. Unilateral leg strength.',
      sets: '3 sets',
      reps: '10-12 reps',
      cost: 6,
      requires: [15],
      category: 'legs',
      targetSets: 3,
      targetReps: 10,
      hasVideoAnalysis: true,
      tips: [
        '• Place rear foot on elevated surface',
        '• Most weight on front leg',
        '• Drop back knee toward ground',
        '• Excellent for quad development',
        '• Start with low elevation (12-16 inches)',
        '• Holds dumbbells for added resistance'
      ]
    },
    { 
      id: 17, 
      name: 'Pistol\nSquats', 
      icon: '🔫', 
      x: -100, 
      y: 180, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Single leg squat requiring strength, balance, and mobility.',
      sets: '3 sets',
      reps: '5-8 reps',
      cost: 8,
      requires: [16],
      category: 'legs',
      targetSets: 3,
      targetReps: 5,
      hasVideoAnalysis: true,
      tips: [
        '• Squat on one leg, other leg extended forward',
        '• Requires excellent mobility',
        '• Hold onto something for balance initially',
        '• Work on ankle and hip mobility',
        '• Practice box pistol squats first',
        '• Keep heel down throughout movement'
      ]
    },
    { 
      id: 18, 
      name: 'Jump\nSquats', 
      icon: '🦘', 
      x: -100, 
      y: 320, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Explosive power training. Build fast-twitch muscle fibers.',
      sets: '3 sets',
      reps: '10-15 reps',
      cost: 5,
      requires: [3],
      category: 'legs',
      targetSets: 3,
      targetReps: 10,
      hasVideoAnalysis: true,
      tips: [
        '• Squat down then explode upward',
        '• Jump as high as possible',
        '• Land softly with bent knees',
        '• Great for power development',
        '• Rest 2-3 minutes between sets',
        '• Don\'t do if knees hurt'
      ]
    },
    
    // Core Progressions
    { 
      id: 19, 
      name: 'Side\nPlank', 
      icon: '↔️', 
      x: 250, 
      y: 50, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Lateral core strength and stability. Prevent injuries.',
      sets: '3 sets',
      reps: '30-45 sec',
      cost: 4,
      requires: [4],
      category: 'core',
      targetSets: 3,
      targetReps: 30,
      hasVideoAnalysis: true,
      tips: [
        '• Balance on one forearm and side of foot',
        '• Keep body in straight line',
        '• Stack feet or stagger for easier variation',
        '• Engage obliques throughout',
        '• Don\'t let hips sag',
        '• Hold at top of hip for best activation'
      ]
    },
    { 
      id: 20, 
      name: 'Hollow\nBody Hold', 
      icon: '🌙', 
      x: 100, 
      y: 180, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Gymnastics fundamental. Total core tension and control.',
      sets: '3 sets',
      reps: '20-40 sec',
      cost: 5,
      requires: [4],
      category: 'core',
      targetSets: 3,
      targetReps: 20,
      hasVideoAnalysis: true,
      tips: [
        '• Lie on back, press lower back to floor',
        '• Raise shoulders and legs off ground',
        '• Arms extended overhead',
        '• Creates a "hollow" position',
        '• Essential for gymnastics movements',
        '• Bend knees to make easier'
      ]
    },
    { 
      id: 21, 
      name: 'L-Sit', 
      icon: '🪑', 
      x: 250, 
      y: 150, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Hold legs parallel to ground. Core, hip flexor, and shoulder strength.',
      sets: '3 sets',
      reps: '15-30 sec',
      cost: 7,
      requires: [19, 20],
      category: 'core',
      targetSets: 3,
      targetReps: 15,
      hasVideoAnalysis: false,
      tips: [
        '• Sit with hands by hips, lift body up',
        '• Extend legs forward parallel to ground',
        '• Requires strong hip flexors',
        '• Practice on parallettes or dip bars',
        '• Start with one leg tucked',
        '• Build up to full L-sit gradually'
      ]
    },
    { 
      id: 22, 
      name: 'Dragon\nFlag', 
      icon: '🐉', 
      x: 100, 
      y: 320, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Bruce Lee\'s signature move. Maximum core strength.',
      sets: '3 sets',
      reps: '5-8 reps',
      cost: 10,
      requires: [20],
      category: 'core',
      targetSets: 3,
      targetReps: 5,
      hasVideoAnalysis: false,
      tips: [
        '• Lie on bench, hold behind head',
        '• Raise body up keeping it straight',
        '• Only shoulders touch bench',
        '• Lower with control, don\'t arch back',
        '• Extremely advanced movement',
        '• Practice negatives for months first'
      ]
    },
    { 
      id: 23, 
      name: 'Hanging\nLeg Raises', 
      icon: '🦵', 
      x: 250, 
      y: 280, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Lower abs and hip flexor development. Hanging core work.',
      sets: '3 sets',
      reps: '10-15 reps',
      cost: 6,
      requires: [21],
      category: 'core',
      targetSets: 3,
      targetReps: 10,
      hasVideoAnalysis: true,
      tips: [
        '• Hang from pull-up bar',
        '• Raise legs to 90 degrees',
        '• Control the descent',
        '• Don\'t swing momentum',
        '• Start with knee raises',
        '• Eventually touch toes to bar'
      ]
    },
    
    // Bonus/Hybrid Skills
    { 
      id: 24, 
      name: 'Burpees', 
      icon: '💥', 
      x: 0, 
      y: -50, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Full body conditioning. Combines multiple movements.',
      sets: '3 sets',
      reps: '10-20 reps',
      cost: 5,
      requires: [1, 3],
      category: 'cardio',
      targetSets: 3,
      targetReps: 10,
      hasVideoAnalysis: true,
      tips: [
        '• Squat down, hands on ground',
        '• Jump feet back to plank',
        '• Do a push-up',
        '• Jump feet forward, stand and jump',
        '• Great for conditioning',
        '• Pace yourself, maintain form'
      ]
    },
    { 
      id: 25, 
      name: 'Front\nLever', 
      icon: '⚡', 
      x: 0, 
      y: 200, 
      unlocked: false, 
      active: false, 
      level: 0,
      maxLevel: 10,
      description: 'Advanced static hold. Full body tension and control.',
      sets: '3 sets',
      reps: '10-20 sec',
      cost: 12,
      requires: [2, 4],
      category: 'static',
      targetSets: 3,
      targetReps: 10,
      hasVideoAnalysis: false,
      tips: [
        '• Hang from bar, body parallel to ground',
        '• Requires exceptional back and core strength',
        '• Can take years to achieve',
        '• Start with tuck front lever',
        '• Progress to advanced tuck, then straddle',
        '• Practice German hangs for shoulder prep'
      ]
    },
  ]);

  const connections = [
    // Push connections
    [1, 5], [5, 6], [6, 7], [1, 8], [8, 9],
    
    // Pull connections
    [2, 10], [10, 13], [13, 14], [2, 11], [11, 12],
    
    // Leg connections
    [3, 15], [15, 16], [16, 17], [3, 18],
    
    // Core connections
    [4, 19], [4, 20], [19, 21], [20, 21], [20, 22], [21, 23],
    
    // Hybrid connections
    [1, 24], [3, 24], [2, 25], [4, 25],
  ];

  // Pan responder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: lastPanValue.current.x,
          y: lastPanValue.current.y,
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gesture) => {
        pan.flattenOffset();
        lastPanValue.current = {
          x: gesture.dx + lastPanValue.current.x,
          y: gesture.dy + lastPanValue.current.y,
        };
      },
    })
  ).current;

  // Check if skill can be unlocked
  const canUnlock = (skill) => {
    if (skill.unlocked) return false;
    if (availablePoints < skill.cost) return false;
    if (!skill.requires || skill.requires.length === 0) return true;
    
    return skill.requires.every(reqId => {
      const requiredSkill = skills.find(s => s.id === reqId);
      return requiredSkill && requiredSkill.unlocked && requiredSkill.level >= 3;
    });
  };

  // Calculate points from workout
  const calculatePoints = (sets, reps, targetSets, targetReps) => {
    const setsCompleted = Math.min(parseInt(sets) || 0, targetSets);
    const repsCompleted = Math.min(parseInt(reps) || 0, targetReps * 1.5);
    
    const setsRatio = setsCompleted / targetSets;
    const repsRatio = repsCompleted / targetReps;
    
    const totalRatio = (setsRatio + repsRatio) / 2;
    
    // Award 1-3 points based on performance
    if (totalRatio >= 1) return 3; // Met or exceeded targets
    if (totalRatio >= 0.7) return 2; // Good effort
    if (totalRatio >= 0.4) return 1; // Some progress
    return 0; // Need more work
  };

  // Log workout
  const logWorkout = () => {
    if (!selectedSkill) return;
    
    const sets = parseInt(workoutData.sets) || 0;
    const reps = parseInt(workoutData.reps) || 0;
    
    if (sets === 0 || reps === 0) {
      Alert.alert('Invalid Input', 'Please enter valid numbers for sets and reps.');
      return;
    }

    const points = calculatePoints(sets, reps, selectedSkill.targetSets, selectedSkill.targetReps);
    const newLevel = Math.min(selectedSkill.level + 1, selectedSkill.maxLevel);
    
    // Update skill level
    setSkills(prevSkills =>
      prevSkills.map(s =>
        s.id === selectedSkill.id ? { ...s, level: newLevel } : s
      )
    );
    
    // Award points
    setAvailablePoints(prev => prev + points);
    setTotalWorkouts(prev => prev + 1);
    
    // Show feedback
    let message = '';
    if (points === 3) {
      message = `Excellent work! 🔥\n+${points} skill points earned!`;
    } else if (points === 2) {
      message = `Good effort! 💪\n+${points} skill points earned!`;
    } else if (points === 1) {
      message = `Keep pushing! 👍\n+${points} skill point earned!`;
    } else {
      message = 'Keep trying! Check the tips below. 📚';
    }
    
    Alert.alert('Workout Logged!', message);
    
    setWorkoutData({ sets: '', reps: '' });
  };

  // Unlock or upgrade skill
  const handleUnlockSkill = (skillId) => {
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return;

    if (!skill.unlocked && canUnlock(skill)) {
      setSkills(prevSkills =>
        prevSkills.map(s =>
          s.id === skillId ? { ...s, unlocked: true } : s
        )
      );
      setAvailablePoints(prev => prev - skill.cost);
      Alert.alert(
        'Exercise Unlocked! 🎉',
        `${skill.name.replace('\n', ' ')} is now available in your training routine!`
      );
    }
  };

  // === VIDEO ANALYSIS FUNCTIONS ===

  // Check server status
  const checkServer = async () => {
    setServerStatus('checking');
    const isOnline = await analyzerRef.current.checkServerStatus();
    setServerStatus(isOnline ? 'online' : 'offline');
    return isOnline;
  };

  // Pick video from library
  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to analyze videos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 30,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedVideo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to select video');
    }
  };

  // Record new video
  const recordVideo = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to record videos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 30,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedVideo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video');
    }
  };

  // Analyze the video with YOLO backend
  const analyzeVideo = async () => {
    if (!selectedVideo) {
      Alert.alert('No Video', 'Please select or record a video first.');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Check server status first
      console.log('Checking YOLO backend server...');
      const serverOnline = await analyzerRef.current.checkServerStatus();
      
      if (!serverOnline) {
        throw new Error('Cannot connect to YOLO analysis server.\n\nPlease ensure:\n• Backend server is running\n• Phone and computer are on same network\n• Firewall allows connection');
      }

      console.log('Server online, sending video for analysis...');
      
      // Send video to YOLO backend
      const result = await analyzerRef.current.analyzeUserVideo(selectedVideo);
      
      console.log('Analysis complete!');
      
      // Store results
      setAnalysisResult(result);
      setIsAnalyzing(false);
      setShowVideoAnalysisModal(false);
      setShowResultsModal(true);

      // Award bonus points for using video analysis
      const bonusPoints = Math.floor(result.report.score / 20); // 0-5 bonus points
      if (bonusPoints > 0) {
        setAvailablePoints(prev => prev + bonusPoints);
      }

      // Update skill level if performance was good
      if (result.report.score >= 70 && selectedSkill) {
        const newLevel = Math.min(selectedSkill.level + 1, selectedSkill.maxLevel);
        setSkills(prevSkills =>
          prevSkills.map(s =>
            s.id === selectedSkill.id ? { ...s, level: newLevel } : s
          )
        );
        setTotalWorkouts(prev => prev + 1);
      }

    } catch (error) {
      console.error('Analysis error:', error);
      setIsAnalyzing(false);
      Alert.alert(
        'Analysis Failed',
        error.message || 'Unable to analyze video.\n\nPlease ensure:\n• Video shows full body\n• Camera is positioned from the side\n• Good lighting\n• Backend server is running at:\n  http://YOUR_IP:8000'
      );
    }
  };

  // Open video analysis modal
  const openVideoAnalysis = async () => {
    setShowVideoAnalysisModal(true);
    setSelectedVideo(null);
    setAnalysisResult(null);
    
    // Check server status when opening
    await checkServer();
  };

  const zoomIn = () => setScale(Math.min(2, scale + 0.15));
  const zoomOut = () => setScale(Math.max(0.5, scale - 0.15));
  
  const resetView = () => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
    lastPanValue.current = { x: 0, y: 0 };
    setScale(1);
  };

  // Get category color
  const getCategoryColor = (category) => {
    switch(category) {
      case 'push': return '#3b82f6';
      case 'pull': return '#10b981';
      case 'legs': return '#f59e0b';
      case 'core': return '#8b5cf6';
      case 'cardio': return '#ef4444';
      case 'static': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  // Render connection line
  const renderConnection = (from, to, index) => {
    const fromNode = skills.find(n => n.id === from);
    const toNode = skills.find(n => n.id === to);
    
    if (!fromNode || !toNode) return null;

    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const isActive = fromNode.unlocked && toNode.unlocked;

    return (
      <View
        key={`connection-${index}`}
        style={[
          styles.connectionLine,
          {
            width: length,
            left: SCREEN_WIDTH / 2 + fromNode.x,
            top: SCREEN_HEIGHT / 2 + fromNode.y,
            transform: [{ rotate: `${angle}rad` }],
            backgroundColor: isActive ? getCategoryColor(fromNode.category) : '#334155',
            opacity: isActive ? 0.6 : 0.2,
          },
        ]}
      />
    );
  };

  // Start Screen
  if (showStartScreen) {
    return (
      <View style={styles.startContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.startContent}>
          <Text style={styles.startTitle}>CALISTHENICS</Text>
          <Text style={styles.startSubtitle}>SKILL TREE</Text>
          
          <View style={styles.startIconContainer}>
            <Text style={styles.startIcon}>💪</Text>
          </View>
          
          <Text style={styles.startDescription}>
            Master bodyweight exercises with AI-powered YOLO pose analysis
          </Text>
          
          <TextInput
            style={styles.nameInput}
            placeholder="Enter your name (optional)"
            placeholderTextColor="#64748b"
            value={userName}
            onChangeText={setUserName}
          />
          
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => setShowStartScreen(false)}
          >
            <Text style={styles.startButtonText}>BEGIN TRAINING</Text>
          </TouchableOpacity>
          
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureText}>Track Progress</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureText}>Unlock Skills</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🤖</Text>
              <Text style={styles.featureText}>YOLO AI Analysis</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background */}
      <View style={styles.background} />

      {/* Header with points */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.pointsValue}>{availablePoints}</Text>
          <Text style={styles.pointsLabel}>SKILL POINTS</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.workoutsValue}>{totalWorkouts}</Text>
          <Text style={styles.workoutsLabel}>WORKOUTS</Text>
        </View>
      </View>

      {/* Skill Tree Canvas */}
      <Animated.View
        style={[
          styles.canvas,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: scale },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Connection lines */}
        {connections.map(([from, to], index) => renderConnection(from, to, index))}

        {/* Skill nodes */}
        {skills.map((skill) => {
          const categoryColor = getCategoryColor(skill.category);
          
          return (
            <TouchableOpacity
              key={skill.id}
              style={[
                styles.skillNode,
                {
                  left: SCREEN_WIDTH / 2 + skill.x - 35,
                  top: SCREEN_HEIGHT / 2 + skill.y - 35,
                  opacity: !skill.unlocked && !canUnlock(skill) ? 0.3 : 1,
                },
              ]}
              onPress={() => setSelectedSkill(skill)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.circle,
                {
                  backgroundColor: skill.unlocked ? categoryColor : '#1e293b',
                  borderColor: skill.unlocked ? categoryColor : '#334155',
                  borderWidth: skill.active ? 4 : 2,
                }
              ]}>
                <Text style={styles.skillIcon}>{skill.icon}</Text>
                {skill.level > 0 && (
                  <View style={[styles.levelBadge, { backgroundColor: categoryColor }]}>
                    <Text style={styles.levelText}>{skill.level}</Text>
                  </View>
                )}
                {skill.hasVideoAnalysis && skill.unlocked && (
                  <View style={styles.aiIndicator}>
                    <Text style={styles.aiIndicatorText}>🤖</Text>
                  </View>
                )}
              </View>
              <Text style={styles.skillName}>{skill.name}</Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Control buttons */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={zoomIn}>
          <Text style={styles.controlBtnText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={zoomOut}>
          <Text style={styles.controlBtnText}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, styles.resetBtn]} onPress={resetView}>
          <Text style={styles.controlBtnText}>⟲</Text>
        </TouchableOpacity>
      </View>

      {/* Skill Info Modal */}
      <Modal
        visible={selectedSkill !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedSkill(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setSelectedSkill(null)}
          />
          <View style={styles.skillInfoPanel}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSelectedSkill(null)}
            >
              <Text style={styles.closeBtnText}>×</Text>
            </TouchableOpacity>

            {selectedSkill && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.skillInfoHeader}>
                  <View style={[
                    styles.modalIconContainer,
                    { backgroundColor: getCategoryColor(selectedSkill.category) }
                  ]}>
                    <Text style={styles.modalIcon}>{selectedSkill.icon}</Text>
                  </View>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.skillInfoTitle}>{selectedSkill.name.replace('\n', ' ')}</Text>
                    <Text style={[
                      styles.categoryBadge,
                      { color: getCategoryColor(selectedSkill.category) }
                    ]}>
                      {selectedSkill.category.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.skillInfoDescription}>
                  {selectedSkill.description}
                </Text>

                {/* AI VIDEO ANALYSIS BUTTON */}
                {selectedSkill.unlocked && selectedSkill.hasVideoAnalysis && (
                  <TouchableOpacity
                    style={styles.aiAnalysisButton}
                    onPress={openVideoAnalysis}
                  >
                    <View style={styles.aiAnalysisButtonContent}>
                      <Text style={styles.aiAnalysisIcon}>🤖</Text>
                      <View style={styles.aiAnalysisTextContainer}>
                        <Text style={styles.aiAnalysisTitle}>YOLO AI FORM ANALYSIS</Text>
                        <Text style={styles.aiAnalysisSubtitle}>
                          Get instant feedback with pose detection
                        </Text>
                      </View>
                      <Text style={styles.aiAnalysisArrow}>→</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Log Workout Section */}
                {selectedSkill.unlocked && (
                  <View style={styles.logWorkoutSection}>
                    <Text style={styles.sectionTitle}>LOG TODAY'S WORKOUT</Text>
                    <View style={styles.inputRow}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Sets Completed</Text>
                        <TextInput
                          style={styles.workoutInput}
                          placeholder={`Target: ${selectedSkill.targetSets}`}
                          placeholderTextColor="#64748b"
                          keyboardType="number-pad"
                          value={workoutData.sets}
                          onChangeText={(text) => setWorkoutData({...workoutData, sets: text})}
                        />
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Reps per Set</Text>
                        <TextInput
                          style={styles.workoutInput}
                          placeholder={`Target: ${selectedSkill.targetReps}`}
                          placeholderTextColor="#64748b"
                          keyboardType="number-pad"
                          value={workoutData.reps}
                          onChangeText={(text) => setWorkoutData({...workoutData, reps: text})}
                        />
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.logWorkoutBtn,
                        { backgroundColor: getCategoryColor(selectedSkill.category) }
                      ]}
                      onPress={logWorkout}
                    >
                      <Text style={styles.logWorkoutBtnText}>LOG WORKOUT & EARN POINTS</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.workoutInfo}>
                  <View style={styles.workoutItem}>
                    <Text style={styles.workoutLabel}>Target Sets</Text>
                    <Text style={styles.workoutValue}>{selectedSkill.sets}</Text>
                  </View>
                  <View style={styles.workoutDivider} />
                  <View style={styles.workoutItem}>
                    <Text style={styles.workoutLabel}>Target Reps</Text>
                    <Text style={styles.workoutValue}>{selectedSkill.reps}</Text>
                  </View>
                </View>

                <View style={styles.skillStats}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Progress</Text>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View style={[
                          styles.progressFill,
                          { 
                            width: `${(selectedSkill.level / selectedSkill.maxLevel) * 100}%`,
                            backgroundColor: getCategoryColor(selectedSkill.category)
                          }
                        ]} />
                      </View>
                      <Text style={styles.statValue}>
                        {selectedSkill.level}/{selectedSkill.maxLevel}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Status</Text>
                    <Text style={[
                      styles.statValue,
                      selectedSkill.unlocked ? styles.unlocked : styles.locked
                    ]}>
                      {selectedSkill.unlocked ? '✓ Unlocked' : '🔒 Locked'}
                    </Text>
                  </View>

                  {!selectedSkill.unlocked && (
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Unlock Cost</Text>
                      <Text style={styles.statValue}>{selectedSkill.cost} pts</Text>
                    </View>
                  )}

                  {selectedSkill.requires && selectedSkill.requires.length > 0 && (
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Requires</Text>
                      <Text style={styles.statValue}>
                        {selectedSkill.requires.map(reqId => {
                          const req = skills.find(s => s.id === reqId);
                          return req ? `${req.name.replace('\n', ' ')} Lv.3` : '';
                        }).join(' + ')}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Tips Section */}
                <View style={styles.tipsSection}>
                  <Text style={styles.sectionTitle}>💡 TIPS & TECHNIQUE</Text>
                  {selectedSkill.tips.map((tip, index) => (
                    <Text key={index} style={styles.tipText}>{tip}</Text>
                  ))}
                </View>

                {!selectedSkill.unlocked && (
                  <TouchableOpacity
                    style={[
                      styles.unlockBtn,
                      { backgroundColor: getCategoryColor(selectedSkill.category) },
                      (!canUnlock(selectedSkill) || availablePoints < selectedSkill.cost) && 
                      styles.unlockBtnDisabled
                    ]}
                    onPress={() => {
                      handleUnlockSkill(selectedSkill.id);
                      setSelectedSkill(null);
                    }}
                    disabled={!canUnlock(selectedSkill) || availablePoints < selectedSkill.cost}
                  >
                    <Text style={styles.unlockBtnText}>
                      {canUnlock(selectedSkill) ? 
                        `UNLOCK EXERCISE (${selectedSkill.cost} PTS)` : 
                        'REQUIREMENTS NOT MET'
                      }
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* VIDEO ANALYSIS MODAL */}
      <Modal
        visible={showVideoAnalysisModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !isAnalyzing && setShowVideoAnalysisModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => !isAnalyzing && setShowVideoAnalysisModal(false)}
          />
          <View style={styles.videoAnalysisPanel}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => !isAnalyzing && setShowVideoAnalysisModal(false)}
              disabled={isAnalyzing}
            >
              <Text style={styles.closeBtnText}>×</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.videoAnalysisHeader}>
                <Text style={styles.videoAnalysisIcon}>🤖</Text>
                <Text style={styles.videoAnalysisTitle}>YOLO AI Form Analysis</Text>
                <Text style={styles.videoAnalysisSubtitle}>
                  {selectedSkill ? selectedSkill.name.replace('\n', ' ') : 'Exercise'}
                </Text>
              </View>

              {/* Server Status */}
              <View style={styles.serverStatusCard}>
                <Text style={styles.serverStatusLabel}>Backend Server Status:</Text>
                <View style={styles.serverStatusRow}>
                  <View style={[
                    styles.serverStatusDot,
                    { backgroundColor: serverStatus === 'online' ? '#10b981' : serverStatus === 'offline' ? '#ef4444' : '#f59e0b' }
                  ]} />
                  <Text style={[
                    styles.serverStatusText,
                    { color: serverStatus === 'online' ? '#10b981' : serverStatus === 'offline' ? '#ef4444' : '#f59e0b' }
                  ]}>
                    {serverStatus === 'online' ? 'Connected' : serverStatus === 'offline' ? 'Disconnected' : 'Checking...'}
                  </Text>
                </View>
                {serverStatus === 'offline' && (
                  <TouchableOpacity style={styles.retryButton} onPress={checkServer}>
                    <Text style={styles.retryButtonText}>↻ Retry Connection</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Instructions */}
              <View style={styles.instructionsCard}>
                <Text style={styles.instructionsTitle}>📹 Recording Tips</Text>
                <Text style={styles.instructionText}>✓ Position camera from the side (90° angle)</Text>
                <Text style={styles.instructionText}>✓ Show your full body in frame</Text>
                <Text style={styles.instructionText}>✓ Ensure good lighting</Text>
                <Text style={styles.instructionText}>✓ Keep camera stable</Text>
                <Text style={styles.instructionText}>✓ Perform 3-5 complete reps</Text>
                <Text style={styles.instructionText}>✓ Video should be 10-30 seconds</Text>
              </View>

              {/* Video Preview */}
              {selectedVideo && !isAnalyzing && (
                <View style={styles.videoPreviewContainer}>
                  <Text style={styles.videoPreviewLabel}>✓ Video Selected</Text>
                  <View style={styles.videoPreview}>
                    <Text style={styles.videoPreviewIcon}>🎥</Text>
                    <Text style={styles.videoPreviewText}>Ready for Analysis</Text>
                  </View>
                </View>
              )}

              {/* Analyzing State */}
              {isAnalyzing && (
                <View style={styles.analyzingContainer}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text style={styles.analyzingText}>Analyzing your form...</Text>
                  <Text style={styles.analyzingSubtext}>YOLO AI is processing your video</Text>
                  <View style={styles.analyzingSteps}>
                    <Text style={styles.analyzingStep}>✓ Video uploaded to server</Text>
                    <Text style={styles.analyzingStep}>⏳ Detecting body keypoints (YOLO)</Text>
                    <Text style={styles.analyzingStep}>⏳ Analyzing movement angles</Text>
                    <Text style={styles.analyzingStep}>⏳ Comparing with ideal form</Text>
                    <Text style={styles.analyzingStep}>⏳ Generating feedback</Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              {!isAnalyzing && serverStatus === 'online' && (
                <View style={styles.videoActionButtons}>
                  <TouchableOpacity
                    style={styles.videoActionButton}
                    onPress={recordVideo}
                  >
                    <Text style={styles.videoActionIcon}>📹</Text>
                    <Text style={styles.videoActionText}>Record Video</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.videoActionButton}
                    onPress={pickVideo}
                  >
                    <Text style={styles.videoActionIcon}>📁</Text>
                    <Text style={styles.videoActionText}>Choose Video</Text>
                  </TouchableOpacity>
                </View>
              )}

              {selectedVideo && !isAnalyzing && serverStatus === 'online' && (
                <TouchableOpacity
                  style={styles.analyzeButton}
                  onPress={analyzeVideo}
                >
                  <Text style={styles.analyzeButtonText}>🚀 START YOLO ANALYSIS</Text>
                </TouchableOpacity>
              )}

              {/* Reference Form Diagram */}
              <View style={styles.referenceFormCard}>
                <Text style={styles.referenceFormTitle}>✅ Correct Form Reference</Text>
                <View style={styles.referenceFormContent}>
                  <Text style={styles.referenceFormIcon}>{selectedSkill?.icon || '💪'}</Text>
                  <View style={styles.referenceFormPoints}>
                    {selectedSkill?.tips.slice(0, 4).map((tip, index) => (
                      <Text key={index} style={styles.referenceFormPoint}>
                        {tip.replace('•', '✓')}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ANALYSIS RESULTS MODAL */}
      <Modal
        visible={showResultsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowResultsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowResultsModal(false)}
          />
          <View style={styles.resultsPanel}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowResultsModal(false)}
            >
              <Text style={styles.closeBtnText}>×</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {analysisResult && (
                <>
                  {/* Score Card */}
                  <View style={styles.scoreCard}>
                    <Text style={styles.scoreTitle}>Your Form Score</Text>
                    <Text style={[
                      styles.scoreValue,
                      analysisResult.report.score >= 90 ? styles.scoreExcellent :
                      analysisResult.report.score >= 70 ? styles.scoreGood :
                      analysisResult.report.score >= 50 ? styles.scoreFair :
                      styles.scorePoor
                    ]}>
                      {analysisResult.report.score}
                    </Text>
                    <Text style={styles.scoreGrade}>Grade: {analysisResult.report.grade}</Text>
                    
                    {analysisResult.report.score >= 90 && (
                      <Text style={styles.scoreEmoji}>🏆 Excellent Form!</Text>
                    )}
                    {analysisResult.report.score >= 70 && analysisResult.report.score < 90 && (
                      <Text style={styles.scoreEmoji}>💪 Great Job!</Text>
                    )}
                    {analysisResult.report.score >= 50 && analysisResult.report.score < 70 && (
                      <Text style={styles.scoreEmoji}>👍 Good Effort!</Text>
                    )}
                    {analysisResult.report.score < 50 && (
                      <Text style={styles.scoreEmoji}>📚 Keep Practicing!</Text>
                    )}
                  </View>

                  {/* Summary */}
                  <View style={styles.resultsSummary}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryIcon}>❌</Text>
                      <View>
                        <Text style={styles.summaryValue}>{analysisResult.report.summary.errors}</Text>
                        <Text style={styles.summaryLabel}>Errors</Text>
                      </View>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryIcon}>⚠️</Text>
                      <View>
                        <Text style={styles.summaryValue}>{analysisResult.report.summary.warnings}</Text>
                        <Text style={styles.summaryLabel}>Warnings</Text>
                      </View>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryIcon}>
                        {analysisResult.report.summary.passed ? '✅' : '❌'}
                      </Text>
                      <View>
                        <Text style={styles.summaryValue}>
                          {analysisResult.report.summary.passed ? 'Pass' : 'Fail'}
                        </Text>
                        <Text style={styles.summaryLabel}>Status</Text>
                      </View>
                    </View>
                  </View>

                  {/* Detailed Feedback */}
                  <Text style={styles.feedbackSectionTitle}>📋 Detailed Feedback (YOLO Analysis)</Text>
                  
                  {analysisResult.report.feedback.length === 0 ? (
                    <View style={styles.perfectFormCard}>
                      <Text style={styles.perfectFormIcon}>🎯</Text>
                      <Text style={styles.perfectFormTitle}>Perfect Form!</Text>
                      <Text style={styles.perfectFormText}>
                        YOLO detected no issues. Your technique is excellent!
                      </Text>
                    </View>
                  ) : (
                    analysisResult.report.feedback.map((item, index) => (
                      <View
                        key={index}
                        style={[
                          styles.feedbackCard,
                          item.type === 'error' ? styles.feedbackCardError : styles.feedbackCardWarning
                        ]}
                      >
                        <View style={styles.feedbackHeader}>
                          <Text style={styles.feedbackIcon}>
                            {item.type === 'error' ? '❌' : '⚠️'}
                          </Text>
                          <View style={styles.feedbackHeaderText}>
                            <Text style={styles.feedbackCategory}>
                              {item.category.toUpperCase()}
                            </Text>
                            <Text style={[
                              styles.feedbackSeverity,
                              item.severity === 'high' ? styles.severityHigh :
                              item.severity === 'medium' ? styles.severityMedium :
                              styles.severityLow
                            ]}>
                              {item.severity.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.feedbackMessage}>{item.message}</Text>
                        <View style={styles.feedbackCorrection}>
                          <Text style={styles.feedbackCorrectionIcon}>💡</Text>
                          <Text style={styles.feedbackCorrectionText}>{item.correction}</Text>
                        </View>
                      </View>
                    ))
                  )}

                  {/* Angle Details */}
                  {analysisResult.report.angles && (
                    <View style={styles.angleDetailsCard}>
                      <Text style={styles.angleDetailsTitle}>📐 Detected Angles (YOLO)</Text>
                      <View style={styles.angleDetailsRow}>
                        <Text style={styles.angleDetailsLabel}>Min Elbow Angle:</Text>
                        <Text style={styles.angleDetailsValue}>
                          {analysisResult.report.angles.min_elbow.toFixed(1)}°
                        </Text>
                      </View>
                      <View style={styles.angleDetailsRow}>
                        <Text style={styles.angleDetailsLabel}>Avg Hip Angle:</Text>
                        <Text style={styles.angleDetailsValue}>
                          {analysisResult.report.angles.avg_hip.toFixed(1)}°
                        </Text>
                      </View>
                      {analysisResult.framesAnalyzed && (
                        <View style={styles.angleDetailsRow}>
                          <Text style={styles.angleDetailsLabel}>Frames Analyzed:</Text>
                          <Text style={styles.angleDetailsValue}>
                            {analysisResult.framesAnalyzed}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Points Earned */}
                  {analysisResult.report.score >= 70 && (
                    <View style={styles.pointsEarnedCard}>
                      <Text style={styles.pointsEarnedIcon}>🎁</Text>
                      <Text style={styles.pointsEarnedTitle}>Bonus Points Earned!</Text>
                      <Text style={styles.pointsEarnedValue}>
                        +{Math.floor(analysisResult.report.score / 20)} skill points
                      </Text>
                      <Text style={styles.pointsEarnedText}>
                        Keep using YOLO AI analysis to improve faster!
                      </Text>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.resultsActions}>
                    <TouchableOpacity
                      style={styles.resultsActionButton}
                      onPress={() => {
                        setShowResultsModal(false);
                        setShowVideoAnalysisModal(true);
                        setSelectedVideo(null);
                      }}
                    >
                      <Text style={styles.resultsActionButtonText}>📹 Analyze Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.resultsActionButton, styles.resultsActionButtonPrimary]}
                      onPress={() => {
                        setShowResultsModal(false);
                        setAnalysisResult(null);
                        setSelectedVideo(null);
                      }}
                    >
                      <Text style={styles.resultsActionButtonTextPrimary}>✓ Done</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Start Screen Styles
  startContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  startContent: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  startTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2,
    marginBottom: -8,
  },
  startSubtitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#3b82f6',
    letterSpacing: 4,
    marginBottom: 40,
  },
  startIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1e293b',
    borderWidth: 3,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  startIcon: {
    fontSize: 64,
  },
  startDescription: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  nameInput: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  startButton: {
    width: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 40,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },

  // Main App Styles
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#0f172a',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  headerLeft: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerRight: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  pointsValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  pointsLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  workoutsValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  workoutsLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  canvas: {
    flex: 1,
    width: SCREEN_WIDTH * 3,
    height: SCREEN_HEIGHT * 3,
    position: 'absolute',
  },
  skillNode: {
    position: 'absolute',
    width: 70,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  skillIcon: {
    fontSize: 32,
  },
  skillName: {
    color: '#cbd5e1',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  levelBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  levelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  aiIndicator: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  aiIndicatorText: {
    fontSize: 12,
  },
  connectionLine: {
    position: 'absolute',
    height: 2,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    gap: 12,
    zIndex: 100,
  },
  controlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    backgroundColor: '#1e293b',
  },
  controlBtnText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  skillInfoPanel: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    color: '#cbd5e1',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
  skillInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    paddingRight: 40,
  },
  modalIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIcon: {
    fontSize: 40,
  },
  headerTextContainer: {
    flex: 1,
  },
  skillInfoTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  skillInfoDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    color: '#94a3b8',
  },

  // AI Analysis Button
  aiAnalysisButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#60a5fa',
  },
  aiAnalysisButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiAnalysisIcon: {
    fontSize: 32,
  },
  aiAnalysisTextContainer: {
    flex: 1,
  },
  aiAnalysisTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  aiAnalysisSubtitle: {
    color: '#bfdbfe',
    fontSize: 12,
  },
  aiAnalysisArrow: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },

  logWorkoutSection: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workoutInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  logWorkoutBtn: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logWorkoutBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1,
  },
  workoutInfo: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  workoutItem: {
    flex: 1,
    alignItems: 'center',
  },
  workoutDivider: {
    width: 1,
    backgroundColor: '#334155',
    marginHorizontal: 16,
  },
  workoutLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  workoutValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  skillStats: {
    gap: 16,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  statValue: {
    fontWeight: '700',
    color: '#fff',
    fontSize: 14,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    width: 120,
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  unlocked: {
    color: '#10b981',
  },
  locked: {
    color: '#ef4444',
  },
  tipsSection: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tipText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  unlockBtn: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  unlockBtnDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  unlockBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1,
  },

  // Video Analysis Modal Styles
  videoAnalysisPanel: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  videoAnalysisHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingRight: 40,
  },
  videoAnalysisIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  videoAnalysisTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  videoAnalysisSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  serverStatusCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  serverStatusLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 8,
  },
  serverStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serverStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  serverStatusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: '#334155',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  instructionsCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
    lineHeight: 18,
  },
  videoPreviewContainer: {
    marginBottom: 20,
  },
  videoPreviewLabel: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  videoPreview: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  videoPreviewIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  videoPreviewText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  analyzingContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  analyzingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
  analyzingSubtext: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
  analyzingSteps: {
    marginTop: 24,
    width: '100%',
  },
  analyzingStep: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 8,
  },
  videoActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  videoActionButton: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  videoActionIcon: {
    fontSize: 32,
  },
  videoActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  analyzeButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  referenceFormCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  referenceFormTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  referenceFormContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  referenceFormIcon: {
    fontSize: 48,
  },
  referenceFormPoints: {
    flex: 1,
  },
  referenceFormPoint: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
    lineHeight: 16,
  },

  // Results Modal Styles
  resultsPanel: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  scoreCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#334155',
  },
  scoreTitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 72,
    fontWeight: '900',
    marginBottom: 8,
  },
  scoreExcellent: {
    color: '#10b981',
  },
  scoreGood: {
    color: '#3b82f6',
  },
  scoreFair: {
    color: '#f59e0b',
  },
  scorePoor: {
    color: '#ef4444',
  },
  scoreGrade: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 12,
  },
  scoreEmoji: {
    fontSize: 24,
    marginTop: 8,
  },
  resultsSummary: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    fontSize: 32,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#334155',
    marginHorizontal: 12,
  },
  feedbackSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
  },
  perfectFormCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  perfectFormIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  perfectFormTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 8,
  },
  perfectFormText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  feedbackCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  feedbackCardError: {
    borderColor: '#ef4444',
  },
  feedbackCardWarning: {
    borderColor: '#f59e0b',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  feedbackIcon: {
    fontSize: 24,
  },
  feedbackHeaderText: {
    flex: 1,
  },
  feedbackCategory: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 2,
  },
  feedbackSeverity: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  severityHigh: {
    color: '#ef4444',
  },
  severityMedium: {
    color: '#f59e0b',
  },
  severityLow: {
    color: '#3b82f6',
  },
  feedbackMessage: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 12,
  },
  feedbackCorrection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
  },
  feedbackCorrectionIcon: {
    fontSize: 16,
  },
  feedbackCorrectionText: {
    flex: 1,
    fontSize: 13,
    color: '#10b981',
    lineHeight: 18,
  },
  angleDetailsCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  angleDetailsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  angleDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  angleDetailsLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  angleDetailsValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
  pointsEarnedCard: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  pointsEarnedIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  pointsEarnedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  pointsEarnedValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  pointsEarnedText: {
    fontSize: 13,
    color: '#bfdbfe',
    textAlign: 'center',
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 12,
  },
  resultsActionButton: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  resultsActionButtonPrimary: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  resultsActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  resultsActionButtonTextPrimary: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default App;