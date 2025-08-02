import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DatabaseService } from '../services/databaseService';
import { DemoAuthService } from '../services/demoAuth';
import { isDemoMode } from '../config/env';

export const AuthScreen: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !username)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      console.log('🔧 Auth attempt:', { email, isSignUp, demoMode: isDemoMode() });
      
      if (isSignUp) {
        const { error } = await DatabaseService.signUp(email, password, username);
        if (error) {
          console.log('🔧 Sign up error:', error);
          Alert.alert('Sign Up Error', error.message);
        } else {
          Alert.alert(
            'Success',
            'Account created! Please check your email to verify your account.',
            [{ text: 'OK' }]
          );
        }
      } else {
        const { error } = await DatabaseService.signIn(email, password);
        if (error) {
          console.log('🔧 Sign in error:', error);
          Alert.alert('Sign In Error', error.message);
        } else {
          console.log('🔧 Sign in successful');
        }
      }
    } catch (error) {
      console.log('🔧 Auth error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    const credentials = DemoAuthService.getDemoCredentials();
    setEmail(credentials.email);
    setPassword(credentials.password);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#334155']}
          style={{ flex: 1, justifyContent: 'center', padding: 24 }}
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
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
            <Text style={{ color: '#f8fafc', fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>
              Lokal
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 16, textAlign: 'center' }}>
              Mobile-first shoppable video app
            </Text>
          </View>

          {/* Auth Form */}
          <View style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 24, marginBottom: 24 }}>
            <Text style={{ color: '#f8fafc', fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' }}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>

            {isSignUp && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#f8fafc', fontSize: 16, marginBottom: 8 }}>
                  Username
                </Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  placeholderTextColor="#64748b"
                  style={{
                    backgroundColor: '#334155',
                    borderRadius: 8,
                    padding: 16,
                    color: '#f8fafc',
                    fontSize: 16,
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#f8fafc', fontSize: 16, marginBottom: 8 }}>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                placeholderTextColor="#64748b"
                style={{
                  backgroundColor: '#334155',
                  borderRadius: 8,
                  padding: 16,
                  color: '#f8fafc',
                  fontSize: 16,
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#f8fafc', fontSize: 16, marginBottom: 8 }}>
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor="#64748b"
                secureTextEntry
                style={{
                  backgroundColor: '#334155',
                  borderRadius: 8,
                  padding: 16,
                  color: '#f8fafc',
                  fontSize: 16,
                }}
              />
            </View>

            {/* Demo Credentials Button */}
            {isDemoMode() && (
              <TouchableOpacity
                onPress={fillDemoCredentials}
                style={{
                  backgroundColor: '#10b981',
                  borderRadius: 8,
                  padding: 12,
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                  Use Demo Credentials
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleAuth}
              disabled={loading}
              style={{
                backgroundColor: '#6366f1',
                borderRadius: 8,
                padding: 16,
                alignItems: 'center',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Toggle Auth Mode */}
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => setIsSignUp(!isSignUp)}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={{ color: '#94a3b8', fontSize: 16 }}>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <Text style={{ color: '#6366f1', fontSize: 16, fontWeight: 'bold', marginLeft: 4 }}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Demo Info */}
          <View style={{ marginTop: 32, alignItems: 'center' }}>
            <Text style={{ color: '#64748b', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
              For demo purposes, you can use any valid email format.{'\n'}
              The app will work with dummy data and simulated object detection.
            </Text>
          </View>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}; 