import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoPlayer } from '../components/VideoPlayer';
import { ProductCard } from '../components/ProductCard';
import { VideoFrontend, ProductFrontend } from '../types';
import { SupabaseService } from '../services/supabase';
import { DemoDataService } from '../services/demoData';
import { ApiService, checkNetworkStatus } from '../services/api';
import { formatDate, isDemoMode } from '../utils/helpers';
import { ENV } from '../config/env';
import { useNavigation } from '@react-navigation/native';
import { LearningInsights } from '../components/LearningInsights';
import { LearningService } from '../services/learningService';
import { StyleSheet } from 'react-native';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [showLearningInsights, setShowLearningInsights] = useState(false);
  const [learningStats, setLearningStats] = useState<any>(null);
  const [videos, setVideos] = useState<VideoFrontend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [useDemoData, setUseDemoData] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<{ connected: boolean; latency?: number }>({ connected: false });

  // Test network connectivity with improved logic
  const testNetworkConnection = async () => {
    try {
      console.log('🔍 Testing network connection...');
      console.log('📍 API Base URL:', ENV.API_BASE_URL);
      
      // Check if we're in demo mode first
      if (isDemoMode()) {
        console.log('🔧 Demo mode detected - skipping network test');
        setNetworkStatus({ connected: true });
        return;
      }
      
      const status = await checkNetworkStatus();
      setNetworkStatus(status);
      
      if (status.connected) {
        console.log('✅ Network test successful, latency:', status.latency);
      } else {
        console.log('❌ Network test failed');
      }
    } catch (error) {
      console.error('💥 Network test error:', error);
      setNetworkStatus({ connected: false });
    }
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading videos...');
      
      // Test network connection first
      await testNetworkConnection();
      
      // Check if Supabase is properly configured
      if (isDemoMode()) {
        console.log('🔧 Using demo data mode');
        setUseDemoData(true);
        const demoVideos = DemoDataService.getVideos();
        setVideos(demoVideos);
        console.log('✅ Loaded demo videos:', demoVideos.length);
      } else {
        console.log('🔗 Using Supabase mode');
        // Try to load from Supabase
        const { data, error } = await SupabaseService.getVideos();
        if (error) {
          console.error('❌ Error loading videos from Supabase:', error);
          // Fallback to demo data
          setUseDemoData(true);
          const demoVideos = DemoDataService.getVideos();
          setVideos(demoVideos);
          console.log('🔄 Fallback to demo videos:', demoVideos.length);
        } else {
          setUseDemoData(false);
          setVideos(data || []);
          console.log('✅ Loaded Supabase videos:', (data || []).length);
        }
      }
    } catch (error) {
      console.error('💥 Error loading videos:', error);
      // Fallback to demo data
      setUseDemoData(true);
      const demoVideos = DemoDataService.getVideos();
      setVideos(demoVideos);
      console.log('🔄 Fallback to demo videos after error:', demoVideos.length);
    } finally {
      setLoading(false);
      console.log('🏁 Finished loading videos');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVideos();
    setRefreshing(false);
  };

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    loadLearningStats();
  }, []);

  const loadLearningStats = async () => {
    try {
      const stats = await LearningService.getLearningInsights();
      setLearningStats(stats);
    } catch (error) {
      console.error('Error loading learning stats:', error);
    }
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
      </View>

      {/* Products Section */}
      {item.products && item.products.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="bag-outline" size={16} color="#f8fafc" />
            <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
              Shop This Video
            </Text>
          </View>
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
  );

  const renderNetworkStatus = () => (
    <View style={{ 
      backgroundColor: networkStatus.connected ? '#1e3a2e' : '#3a1e1e', 
      padding: 12, 
      margin: 16, 
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: networkStatus.connected ? '#22c55e' : '#ef4444'
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
            Backend Connection: {networkStatus.connected ? 'Connected' : 'Offline'}
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
            {ENV.API_BASE_URL}
          </Text>
        </View>
        {networkStatus.connected && networkStatus.latency && (
          <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: '600' }}>
            {networkStatus.latency}ms
          </Text>
        )}
      </View>
    </View>
  );

  const renderDemoNotice = () => (
    <View style={{ 
      backgroundColor: '#1e293b', 
      padding: 12, 
      marginHorizontal: 16, 
      marginBottom: 16,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: '#6366f1'
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="information-circle-outline" size={20} color="#6366f1" />
        <View style={{ marginLeft: 8, flex: 1 }}>
          <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
            Demo Mode
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
            Showing demo videos. Configure Supabase to use real data.
          </Text>
        </View>
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 16,
      backgroundColor: '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: '#C6C6C8',
    },
    title: {
      color: '#000000',
      fontSize: 34,
      fontWeight: '700',
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    learningButton: {
      position: 'relative',
      marginRight: 16,
    },
    learningBadge: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: '#FF3B30',
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#fff',
    },
    learningBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    uploadButton: {
      backgroundColor: '#007AFF',
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0f172a',
    },
    loadingText: {
      color: '#94a3b8',
      fontSize: 18,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      backgroundColor: '#0f172a',
    },
    emptyTitle: {
      color: '#94a3b8',
      fontSize: 18,
      marginTop: 16,
    },
    emptySubtitle: {
      color: '#64748b',
      fontSize: 14,
      marginTop: 8,
      marginBottom: 16,
    },
    uploadFirstButton: {
      backgroundColor: '#6366f1',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    uploadFirstButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    videoList: {
      flex: 1,
      paddingBottom: 100,
    },
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading) {
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
          <Text style={{ color: '#94a3b8', marginTop: 16 }}>Loading videos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.learningButton}
            onPress={() => setShowLearningInsights(true)}
          >
            <Ionicons name="school" size={20} color="#007AFF" />
            {learningStats && learningStats.totalVideos > 0 && (
              <View style={styles.learningBadge}>
                <Text style={styles.learningBadgeText}>{learningStats.totalVideos}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={() => navigation.navigate('Upload' as never)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : videos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-outline" size={64} color="#94a3b8" />
          <Text style={styles.emptyTitle}>No videos yet</Text>
          <Text style={styles.emptySubtitle}>Upload your first video to get started</Text>
          <TouchableOpacity 
            style={styles.uploadFirstButton}
            onPress={() => navigation.navigate('Upload' as never)}
          >
            <Text style={styles.uploadFirstButtonText}>Upload Video</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.videoList} showsVerticalScrollIndicator={false}>
          {videos.map((video, index) => (
            <View key={video.id || video.title || index}>
              {renderVideoItem({ item: video })}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Learning Insights Modal */}
      {showLearningInsights && (
        <View style={styles.modalOverlay}>
          <LearningInsights onClose={() => setShowLearningInsights(false)} />
        </View>
      )}
    </View>
  );
}; 