import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { UploadScreen } from './src/screens/UploadScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { DatabaseService } from './src/services/databaseService';
import { validateEnvironment, ENV } from './src/config/env';
import { isDemoMode } from './src/utils/helpers';
import { Colors, Typography } from './src/utils/designSystem';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [envErrors, setEnvErrors] = useState<string[]>([]);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check environment configuration
      const envValidation = validateEnvironment();
      if (!envValidation.isValid) {
        setEnvErrors(envValidation.errors);
        setIsLoading(false);
        return;
      }

      // Check authentication status
      await checkAuthStatus();
    } catch (error) {
      console.error('App initialization error:', error);
      setIsLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      // Check if we're in demo mode
      const demoMode = isDemoMode();
      
      if (demoMode) {
        console.log('🔧 Running in demo mode - skipping authentication');
        setIsAuthenticated(true); // Auto-authenticate in demo mode
      } else {
        // Real authentication with Railway PostgreSQL
        const session = await DatabaseService.getCurrentUser();
        
        if (session.user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
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
      // Check if we're in demo mode
      const demoMode = isDemoMode();
      
      if (demoMode) {
        console.log('🔧 Demo mode - signing out');
        setIsAuthenticated(false);
      } else {
        // Real sign out with Railway PostgreSQL
        const { error } = await DatabaseService.signOut();
        if (error) {
          Alert.alert('Error', 'Failed to sign out');
        } else {
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  // Loading screen
  if (isLoading) {
    return (
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
            <Ionicons name="videocam" size={40} color="#fff" />
          </View>
          <Text style={{ color: '#fff', fontSize: Typography.xl, fontWeight: 'bold', marginBottom: 8 }}>
            Lokal
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: Typography.md }}>
            Shoppable Video Platform
          </Text>
        </View>
      </View>
    );
  }

  // Environment errors
  if (envErrors.length > 0) {
    return (
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
              • {error}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  // Authentication screen
  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <AuthScreen />
      </View>
    );
  }

  // Main app with tab navigation
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Upload') {
              iconName = focused ? 'add-circle' : 'add-circle-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: '#64748b',
          tabBarStyle: {
            backgroundColor: '#000',
            borderTopColor: '#1f2937',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          headerShown: false,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            title: 'Discover',
          }}
        />
        <Tab.Screen 
          name="Upload" 
          component={UploadScreen}
          options={{
            title: 'Create',
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{
            title: 'Profile',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
