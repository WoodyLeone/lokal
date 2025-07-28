import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { VideoPlayer } from '../components/VideoPlayer';
import { ProductCard } from '../components/ProductCard';
import { Video, Product } from '../types';
import { SupabaseService } from '../services/supabase';
import { DemoDataService } from '../services/demoData';
import { ApiService } from '../services/api';
import { formatDate, isDemoMode } from '../utils/helpers';
import { ENV } from '../config/env';

export const HomeScreen: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [useDemoData, setUseDemoData] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<string>('Checking...');

  // Test network connectivity
  const testNetworkConnection = async () => {
    try {
      console.log('🔍 Testing network connection...');
      console.log('📍 API Base URL:', ENV.API_BASE_URL);
      
      // Check if we're in demo mode first
      if (isDemoMode()) {
        console.log('🔧 Demo mode detected - skipping network test');
        setNetworkStatus('Demo Mode');
        return;
      }
      
      // Try multiple times with different approaches
      let connected = false;
      let attempts = 0;
      const maxAttempts = 2; // Reduced attempts for faster fallback
      
      while (!connected && attempts < maxAttempts) {
        attempts++;
        console.log(`🔄 Attempt ${attempts}/${maxAttempts}`);
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const response = await fetch(`${ENV.API_BASE_URL.replace('/api', '')}/api/health`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          console.log('📡 Response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Network test successful:', data);
            setNetworkStatus('Connected');
            connected = true;
          } else {
            console.log('❌ Network test failed with status:', response.status);
            if (attempts === maxAttempts) {
              setNetworkStatus(`Failed: ${response.status}`);
            }
          }
        } catch (fetchError) {
          console.log(`❌ Attempt ${attempts} failed:`, fetchError);
          if (attempts === maxAttempts) {
            // Don't throw error, just set status and continue with demo mode
            setNetworkStatus('Offline - Using Demo Mode');
            console.log('🔄 Falling back to demo mode due to network issues');
          }
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('💥 Network test error:', error);
      if (error instanceof Error) {
        console.error('💥 Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        setNetworkStatus('Offline - Using Demo Mode');
      } else {
        console.error('💥 Unknown error type:', typeof error);
        setNetworkStatus('Offline - Using Demo Mode');
      }
    }
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading videos...');
      
      // Test network connection first
      await testNetworkConnection();
      
      // Check if Supabase is properly configured
      if (ENV.SUPABASE_URL === 'YOUR_SUPABASE_URL' || ENV.SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.log('🔧 Using demo data mode');
        // Use demo data if Supabase is not configured
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

  const renderVideoItem = ({ item }: { item: Video }) => (
    <View style={{ marginBottom: 24 }}>
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
        <Text style={{ color: '#64748b', fontSize: 12 }}>
          {formatDate(item.createdAt)}
        </Text>
      </View>

      {/* Products Section */}
      {item.products && item.products.length > 0 && (
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
            Shop This Video
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
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ color: '#f8fafc', marginTop: 16 }}>Loading videos...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* Network Status */}
      <View style={{ 
        backgroundColor: networkStatus === 'Connected' ? '#1e3a2e' : '#3a1e1e', 
        padding: 12, 
        margin: 16, 
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: networkStatus === 'Connected' ? '#22c55e' : '#ef4444'
      }}>
        <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
          Backend Connection: {networkStatus}
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 12 }}>
          {ENV.API_BASE_URL}
        </Text>
      </View>

      {/* Demo Data Notice */}
      {useDemoData && (
        <View style={{ 
          backgroundColor: '#1e293b', 
          padding: 12, 
          marginHorizontal: 16, 
          marginBottom: 16,
          borderRadius: 8,
          borderLeftWidth: 4,
          borderLeftColor: '#6366f1'
        }}>
          <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
            Demo Mode
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
            Showing demo videos. Configure Supabase to use real data.
          </Text>
        </View>
      )}

      <FlatList
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={['#6366f1']}
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center', 
            paddingVertical: 60 
          }}>
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