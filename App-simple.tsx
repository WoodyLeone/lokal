import React, { useState, useEffect } from 'react';
import { View, Text, StatusBar, TouchableOpacity, StyleSheet } from 'react-native';

export default function App() {
  const [testState, setTestState] = useState('Hello World');
  const [counter, setCounter] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    console.log('✅ React hooks are working!');
    setTestState('React is working!');
    setIsLoaded(true);
  }, []);

  const handleIncrement = () => {
    setCounter(prev => prev + 1);
  };

  const handleReset = () => {
    setCounter(0);
    setTestState('Counter Reset!');
  };

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <Text style={styles.title}>{testState}</Text>
      
      <Text style={styles.subtitle}>
        ✅ React Native App is Running!
      </Text>
      
      <Text style={styles.info}>
        Railway Backend: Ready
      </Text>

      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>Counter: {counter}</Text>
        
        <TouchableOpacity style={styles.button} onPress={handleIncrement}>
          <Text style={styles.buttonText}>Increment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.status}>
        React Version: {React.version}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    color: '#0f0',
    fontSize: 16,
    marginBottom: 10,
  },
  info: {
    color: '#0ff',
    fontSize: 14,
    marginBottom: 30,
  },
  counterContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  counterText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  resetButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    color: '#888',
    fontSize: 12,
    position: 'absolute',
    bottom: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
}); 