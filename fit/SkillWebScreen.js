// SkillWebScreen.js
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// --- Define the Skill Tree Data ---
// 'status': 'locked', 'unlocked', 'completed'
// 'dependencies': List of 'id's that must be 'completed' to unlock
const INITIAL_SKILLS = [
  // --- LEVEL 1: The 4 Fundamentals (Start Unlocked) ---
  {
    id: 'core',
    name: 'Core',
    status: 'unlocked',
    dependencies: [],
    position: { x: width / 2, y: height / 2 },
  },
  {
    id: 'push',
    name: 'Push',
    status: 'unlocked',
    dependencies: [],
    position: { x: width / 2, y: height / 2 - 120 },
  },
  {
    id: 'pull',
    name: 'Pull',
    status: 'unlocked',
    dependencies: [],
    position: { x: width / 2, y: height / 2 + 120 },
  },
  {
    id: 'legs',
    name: 'Legs',
    status: 'unlocked',
    dependencies: [],
    position: { x: width / 2 - 120, y: height / 2 },
  },

  // --- LEVEL 2: Intermediate Skills (Start Locked) ---
  {
    id: 'handstand',
    name: 'Handstand',
    status: 'locked',
    dependencies: ['push', 'core'],
    position: { x: width / 2 + 120, y: height / 2 - 120 },
  },
  {
    id: 'muscle_up',
    name: 'Muscle Up',
    status: 'locked',
    dependencies: ['pull'],
    position: { x: width / 2 + 120, y: height / 2 + 120 },
  },
  {
    id: 'pistol_squat',
    name: 'Pistol Squat',
    status: 'locked',
    dependencies: ['legs', 'core'],
    position: { x: width / 2 - 150, y: height / 2 + 90 },
  },
];

// --- Define Colors ---
const COLORS = {
  locked: '#333333',
  unlocked: '#3b82f6',
  completed: '#16a34a',
  line: '#444444',
  lineCompleted: '#16a34a',
};

export default function SkillWebScreen() {
  const navigation = useNavigation();
  const [skills, setSkills] = useState(INITIAL_SKILLS);

  // --- Core Progression Logic ---
  const handleSkillPress = (pressedSkill) => {
    // In a real app, this would navigate to the video submission page
    // For this demo, we'll just simulate completion
    
    if (pressedSkill.status === 'locked') {
      Alert.alert('Skill Locked', 'Complete the previous skills to unlock this one.');
      return;
    }

    if (pressedSkill.status === 'completed') {
      Alert.alert('Skill Mastered', 'You have already completed this skill.');
      return;
    }
    
    // 1. Mark the pressed skill as 'completed'
    let newSkills = skills.map((skill) =>
      skill.id === pressedSkill.id ? { ...skill, status: 'completed' } : skill
    );

    // 2. Check all skills to see if any new ones can be unlocked
    newSkills = newSkills.map((skill) => {
      if (skill.status === 'locked') {
        // Check if all dependencies are met
        const allDependenciesMet = skill.dependencies.every((depId) => {
          const dependency = newSkills.find((s) => s.id === depId);
          return dependency && dependency.status === 'completed';
        });

        if (allDependenciesMet) {
          // UNLOCK IT!
          return { ...skill, status: 'unlocked' };
        }
      }
      return skill;
    });

    // 3. Update the state
    setSkills(newSkills);
  };

  // --- Render Functions ---
  const renderLines = () => {
    const skillMap = new Map(skills.map(s => [s.id, s]));

    return skills.map((skill) => {
      return skill.dependencies.map((depId) => {
        const dependency = skillMap.get(depId);
        if (!dependency) return null;

        const isCompleted = skill.status === 'completed' || skill.status === 'unlocked';
        
        return (
          <Line
            key={`${skill.id}-${depId}`}
            x1={dependency.position.x}
            y1={dependency.position.y}
            x2={skill.position.x}
            y2={skill.position.y}
            stroke={isCompleted ? COLORS.unlocked : COLORS.line}
            strokeWidth="2"
          />
        );
      });
    });
  };

  const renderNodes = () => {
    return skills.map((skill) => {
      let color = COLORS.locked;
      if (skill.status === 'unlocked') color = COLORS.unlocked;
      if (skill.status === 'completed') color = COLORS.completed;

      return (
        // We use <TouchableOpacity> *around* the <Circle> and <Text>
        // because SVG elements don't have the same touch feedback
        <TouchableOpacity
          key={skill.id}
          style={{
            position: 'absolute',
            left: skill.position.x - 40,
            top: skill.position.y - 40,
          }}
          onPress={() => handleSkillPress(skill)}
        >
          <View style={[styles.nodeTouchable, { backgroundColor: color }]}>
            <Text style={styles.nodeText}>{skill.name}</Text>
          </View>
        </TouchableOpacity>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Skill Web</Text>
      </View>

      <View style={styles.webContainer}>
        <Svg height="100%" width="100%">
          {renderLines()}
        </Svg>
        {/* Nodes are rendered as standard <View>s on top of the SVG */}
        {renderNodes()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: 15,
    color: '#3b82f6',
    fontSize: 18,
  },
  webContainer: {
    flex: 1,
    position: 'relative',
  },
  // We use this trick to render standard <View>s on top of the <Svg>
  // This gives us better touch handling and easier text styling
  nodeTouchable: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  nodeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});