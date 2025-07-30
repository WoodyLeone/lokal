import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoPlayer } from '../components/VideoPlayer';
import { ProductCard } from '../components/ProductCard';
import { VideoFrontend, User } from '../types';
import { SupabaseService } from '../services/supabase';
import { formatDate, isDemoMode } from '../utils/helpers';
import { DemoDataService } from '../services/demoData';

export const ProfileScreen: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userVideos, setUserVideos] = useState<VideoFrontend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Check if we're in demo mode
      if (isDemoMode()) {
        // Use demo data
        const demoUser: User = {
          id: 'demo-user-123',
          email: 'demo@lokal.com',
          username: 'Demo User',
          avatarUrl: undefined,
          createdAt: new Date().toISOString(),
        };
        setUser(demoUser);
        
        // Get demo videos
        const demoVideos = DemoDataService.getVideos();
        setUserVideos(demoVideos);
        return;
      }
      
      // Real mode - get current user
      const userSession = await SupabaseService.getCurrentUser();
      if (!userSession.user) {
        throw new Error('User not authenticated');
      }

      // Create user object
      const userData: User = {
        id: userSession.user.id,
        email: userSession.user.email || '',
        username: userSession.user.user_metadata?.username || 'User',
        avatarUrl: userSession.user.user_metadata?.avatar_url,
        createdAt: userSession.user.created_at,
      };
      setUser(userData);

      // Get user's videos
      const { data: videos, error: videosError } = await SupabaseService.getVideos(userSession.user.id);
      if (videosError) {
        console.error('Error loading videos:', videosError);
      } else {
        setUserVideos(videos || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isDemoMode()) {
                // In demo mode, just show success message
                Alert.alert('Success', 'Signed out successfully (Demo Mode)');
              } else {
                const { error } = await SupabaseService.signOut();
                if (error) {
                  Alert.alert('Error', 'Failed to sign out');
                } else {
                  // Navigate to auth screen (would be handled by navigation)
                  Alert.alert('Success', 'Signed out successfully');
                }
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const renderVideoItem = ({ item }: { item: VideoFrontend }) => (
    <View style={{ marginBottom: 24, backgroundColor: '#1e293b', borderRadius: 12, overflow: 'hidden' }}>
      {/* Video Player */}
      <VideoPlayer uri={item.videoUrl} />
      
      {/* Video Info */}
      <View style={{ padding: 16 }}>
        <Text style={{ color: '#f8fafc', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
          {item.title}
        </Text>
        {item.description && (
          <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8 }}>
            {item.description}
          </Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="time-outline" size={14} color="#64748b" />
          <Text style={{ color: '#64748b', fontSize: 12, marginLeft: 4 }}>
            {formatDate(item.createdAt)}
          </Text>
        </View>

        {/* Detected Objects */}
        {item.detectedObjects && item.detectedObjects.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
              Detected Objects:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {item.detectedObjects.map((object: string, index: number) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: '#6366f1',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    marginRight: 6,
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12 }}>
                    {object}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Products */}
        {item.products && item.products.length > 0 && (
          <View>
            <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
              Matched Products:
            </Text>
            <FlatList
              data={item.products}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item: product }) => (
                <ProductCard product={product} />
              )}
              keyExtractor={(product) => product.id}
              contentContainerStyle={{ paddingRight: 16 }}
            />
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ color: '#f8fafc', marginTop: 16 }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* Profile Header */}
      <View style={{ padding: 24, backgroundColor: '#1e293b', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#6366f1',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
          }}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={{ width: 80, height: 80, borderRadius: 40 }} />
            ) : (
              <Ionicons name="person" size={40} color="#fff" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#f8fafc', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
              {user?.username || 'User'}
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 16 }}>
              {user?.email || 'user@example.com'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#f8fafc', fontSize: 24, fontWeight: 'bold' }}>
              {userVideos.length}
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>Videos</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#f8fafc', fontSize: 24, fontWeight: 'bold' }}>
              {userVideos.reduce((total, video) => total + (video.detectedObjects?.length || 0), 0)}
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>Objects Detected</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#f8fafc', fontSize: 24, fontWeight: 'bold' }}>
              {userVideos.reduce((total, video) => total + (video.products?.length || 0), 0)}
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>Products Matched</Text>
          </View>
        </View>
      </View>

      {/* Videos List */}
      <FlatList
        data={userVideos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center', 
            paddingVertical: 60 
          }}>
            <Ionicons name="videocam-outline" size={64} color="#64748b" style={{ marginBottom: 16 }} />
            <Text style={{ color: '#94a3b8', fontSize: 16, textAlign: 'center', marginBottom: 8 }}>
              No videos yet
            </Text>
            <Text style={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>
              Upload your first video to get started!
            </Text>
          </View>
        }
      />
    </View>
  );
}; 