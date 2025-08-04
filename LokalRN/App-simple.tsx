import React, { useState, useEffect } from 'react';
import { View, Text, StatusBar } from 'react-native';

export default function App() {
  const [testState, setTestState] = useState('Hello World');

  useEffect(() => {
    console.log('✅ React hooks are working!');
    setTestState('React is working!');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Text style={{ color: '#fff', fontSize: 24 }}>{testState}</Text>
      <Text style={{ color: '#0f0', fontSize: 16, marginTop: 20 }}>
        ✅ React Native App is Running!
      </Text>
      <Text style={{ color: '#0ff', fontSize: 14, marginTop: 10 }}>
        Railway Backend: Ready
      </Text>
    </View>
  );
} 