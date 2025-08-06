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
import { isDemoMode } from '../config/env';

export const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('🔧 Email auth attempt:', { email, demoMode: isDemoMode() });
      
      // Always use Railway backend - no more demo mode
      const { error } = await DatabaseService.sendVerificationEmail(email);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setVerificationSent(true);
        Alert.alert(
          'Verification Sent',
          'Please check your email and click the verification link to continue.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#334155']}
          style={{ flex: 1, justifyContent: 'center', padding: 20 }}
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#6366f1',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <Ionicons name="videocam-outline" size={40} color="#fff" />
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
            <Text style={{ color: '#f8fafc', fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
              Welcome to Lokal
            </Text>
            
            <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
              Enter your email to get started
            </Text>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#f8fafc', fontSize: 16, marginBottom: 8 }}>
                Email Address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
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
                editable={!verificationSent}
              />
            </View>



            <TouchableOpacity
              onPress={handleEmailAuth}
              disabled={loading || verificationSent}
              style={{
                backgroundColor: verificationSent ? '#64748b' : '#6366f1',
                borderRadius: 8,
                padding: 16,
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : verificationSent ? (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                  Verification Sent ✓
                </Text>
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                  Continue with Email
                </Text>
              )}
            </TouchableOpacity>

            {verificationSent && (
              <Text style={{ color: '#10b981', fontSize: 14, textAlign: 'center' }}>
                Check your email for the verification link
              </Text>
            )}
          </View>



          {/* Legal links */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
            <TouchableOpacity>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                Terms of Service
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}; 