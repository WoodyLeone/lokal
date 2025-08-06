import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from './src/screens/HomeScreen';
import { UploadScreen } from './src/screens/UploadScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
// import { AuthScreen } from './src/screens/AuthScreen'; // Temporarily disabled for testing
import { DatabaseService } from './src/services/databaseService';

import { Colors, Typography, ComponentStyles, SafeAreas } from './src/utils/designSystem';
import { ErrorBoundary } from './src/components/ErrorBoundary';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Set to true for testing
  const [isLoading, setIsLoading] = useState(true);
  const [envErrors, setEnvErrors] = useState<string[]>([]);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);

      // Validate environment variables
      const envValidation = validateEnvironment();
      if (!envValidation.isValid) {
        setEnvErrors(envValidation.errors);
        setIsLoading(false);
        return;
      }

      // Skip authentication check for testing
      // await checkAuthStatus();
      setIsLoading(false);
    } catch (error) {
      console.error('App initialization error:', error);
      setIsLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      // Real authentication with Railway PostgreSQL
      const session = await DatabaseService.getCurrentUser();
      
      if (session.user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // Real sign out with Railway PostgreSQL
      const { error } = await DatabaseService.signOut();
      if (error) {
        Alert.alert('Error', 'Failed to sign out');
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  // Loading screen
  if (isLoading) {
    return (
      <ErrorBoundary>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: Colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <Ionicons name="videocam-outline" size={40} color="#fff" />
            </View>
            <Text style={{ color: '#fff', fontSize: Typography.xl, fontWeight: 'bold', marginBottom: 8 }}>
              Lokal
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: Typography.md }}>
              Shoppable Video Platform
            </Text>
          </View>
        </View>
      </ErrorBoundary>
    );
  }

  // Environment errors
  if (envErrors.length > 0) {
    return (
      <ErrorBoundary>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 }}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="warning" size={64} color="#ef4444" />
            <Text style={{ color: '#fff', fontSize: Typography.lg, fontWeight: 'bold', marginTop: 20, marginBottom: 10 }}>
              Configuration Error
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: Typography.md, textAlign: 'center', marginBottom: 20 }}>
              Please check your environment configuration
            </Text>
            {envErrors.map((error, index) => (
              <Text key={index} style={{ color: '#ef4444', fontSize: Typography.sm, marginBottom: 5 }}>
                {error}
              </Text>
            ))}
          </View>
        </View>
      </ErrorBoundary>
    );
  }

  // Skip authentication screen for testing
  // if (!isAuthenticated) {
  //   return (
  //     <ErrorBoundary>
  //       <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />
  //     </ErrorBoundary>
  //   );
  // }

  // Main app
  return (
    <ErrorBoundary>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'Discover') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Create') {
                iconName = focused ? 'add-circle' : 'add-circle-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              } else {
                // Fallback for any unexpected route names
                iconName = focused ? 'ellipse' : 'ellipse-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: '#94a3b8',
            tabBarStyle: {
              ...ComponentStyles.navigation.container,
              paddingBottom: SafeAreas.bottom,
            },
            headerShown: false,
          })}
        >
          <Tab.Screen name="Discover" component={HomeScreen} />
          <Tab.Screen name="Create" component={UploadScreen} />
          <Tab.Screen 
            name="Profile" 
            component={ProfileScreen}
            initialParams={{ onSignOut: handleSignOut }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

function validateEnvironment() {
  const errors: string[] = [];
  
  // Check for API configuration - this is the main requirement
  if (!process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL === '') {
    errors.push('Missing or invalid EXPO_PUBLIC_API_BASE_URL');
  }
  
  // DATABASE_URL is not required since we use the Railway backend API
  // The backend handles database connections internally
  console.log('🚂 Using Railway backend API - database connection handled by backend');

  return {
    isValid: errors.length === 0,
    errors
  };
}
