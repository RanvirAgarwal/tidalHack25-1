// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LandingScreen from './LandingScreen.js';
import SkillWebScreen from './SkillWebScreen';

// Create the navigator
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        // Start on the 'Landing' screen
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false, // Hide the top bar for a clean, full-screen app
        }}
      >
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="SkillWeb" component={SkillWebScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}