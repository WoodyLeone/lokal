import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { UploadScreen } from './src/screens/UploadScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { DatabaseService } from './src/services/databaseService';
import { validateEnvironment, ENV } from './src/config/env';
import { isDemoMode } from './src/utils/helpers';

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
        // Real authentication with Supabase
        const session = await DatabaseService.getCurrentUser();
        
        if (session.user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }

        // Set up auth state listener
        DatabaseService.onAuthStateChange((user) => {
          setIsAuthenticated(!!user);
        });
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
        // Real sign out with Supabase
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#6366f1',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Ionicons name="videocam" size={40} color="#fff" />
          </View>
          <Text style={{ color: '#f8fafc', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
            Lokal
          </Text>
          <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 16 }} />
          <Text style={{ color: '#94a3b8', marginTop: 16 }}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Environment configuration error screen
  if (envErrors.length > 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', padding: 24 }}>
        <View style={{ alignItems: 'center', maxWidth: 400 }}>
          <Ionicons name="warning" size={64} color="#f59e0b" style={{ marginBottom: 16 }} />
          <Text style={{ color: '#f8fafc', fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
            Configuration Required
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 16, textAlign: 'center', marginBottom: 24, lineHeight: 24 }}>
            Please configure the following environment variables to run the app:
          </Text>
          
          <View style={{ width: '100%', marginBottom: 24 }}>
            {envErrors.map((error, index) => (
              <View key={index} style={{ 
                backgroundColor: '#1e293b', 
                padding: 12, 
                borderRadius: 8, 
                marginBottom: 8 
              }}>
                <Text style={{ color: '#f59e0b', fontSize: 14 }}>• {error}</Text>
              </View>
            ))}
          </View>

          <Text style={{ color: '#64748b', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
            Create a .env file in the LokalRN directory with your Supabase credentials.{'\n'}
            See README.md for detailed setup instructions.
          </Text>
        </View>
      </View>
    );
  }

  // Authentication screen
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Main app with navigation
  return (
    <NavigationContainer>
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
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#C6C6C8',
            paddingBottom: 8,
            paddingTop: 8,
            height: 60,
          },
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#000000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Discover' }}
        />
        <Tab.Screen 
          name="Upload" 
          component={UploadScreen}
          options={{ title: 'Upload Video' }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ 
            title: 'Profile',
            headerRight: () => (
              <Ionicons 
                name="log-out-outline" 
                size={24} 
                color="#f8fafc" 
                style={{ marginRight: 16 }}
                onPress={handleSignOut}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
