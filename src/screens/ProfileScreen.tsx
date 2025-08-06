import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoPlayer } from '../components/VideoPlayer';
import { ProductCard } from '../components/ProductCard';
import { VideoFrontend, ProductFrontend } from '../types';
import { DatabaseService } from '../services/databaseService';

import { formatDate } from '../utils/helpers';
import { Colors, Typography, Spacing, BorderRadius, Shadows, TouchTargets, Icons, ComponentStyles } from '../utils/designSystem';
import { EnhancedButton } from '../components/EnhancedButton';

export const ProfileScreen: React.FC = () => {
  const [userVideos, setUserVideos] = useState<VideoFrontend[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalProducts: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Always use Railway backend - no demo mode
      const { data, error } = await DatabaseService.getVideos();
      if (error) {
        console.error('Error loading user videos:', error);
        setUserVideos([]);
      } else {
        setUserVideos(data || []);
        
        // Calculate stats
        setStats({
          totalVideos: data?.length || 0,
          totalViews: data?.reduce((sum, video) => sum + (video.views || 0), 0) || 0,
          totalProducts: data?.reduce((sum, video) => sum + video.products.length, 0) || 0,
          totalRevenue: 0, // Would be calculated from actual sales data
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserVideos([]);
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
              const { error } = await DatabaseService.signOut();
              if (error) {
                Alert.alert('Error', 'Failed to sign out');
              } else {
                Alert.alert('Success', 'Signed out successfully');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const renderStatsCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={{
      backgroundColor: Colors.surface,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      flex: 1,
      marginHorizontal: Spacing.xs,
      alignItems: 'center',
      ...Shadows.sm,
    }}>
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: color,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
      }}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={Colors.textPrimary} />
      </View>
      <Text style={{
        color: Colors.textPrimary,
        fontSize: Typography.lg,
        fontWeight: 'bold',
        marginBottom: Spacing.xs,
      }}>
        {value}
      </Text>
      <Text style={{
        color: Colors.textSecondary,
        fontSize: Typography.xs,
        textAlign: 'center',
      }}>
        {title}
      </Text>
    </View>
  );

  const renderVideoItem = ({ item }: { item: VideoFrontend }) => (
    <View style={{ 
      marginBottom: Spacing.lg, 
      backgroundColor: Colors.surface, 
      borderRadius: BorderRadius.lg, 
      overflow: 'hidden',
      ...Shadows.md,
    }}>
      {/* Video Player */}
      <VideoPlayer uri={item.videoUrl} />
      
      {/* Video Info */}
      <View style={{ padding: Spacing.md }}>
        <Text style={{ 
          color: Colors.textPrimary, 
          fontSize: Typography.md, 
          fontWeight: 'bold', 
          marginBottom: Spacing.xs 
        }}>
          {item.title}
        </Text>
        
        {item.description && (
          <Text style={{ 
            color: Colors.textSecondary, 
            fontSize: Typography.sm, 
            marginBottom: Spacing.sm 
          }}>
            {item.description}
          </Text>
        )}
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
          <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
          <Text style={{ 
            color: Colors.textSecondary, 
            fontSize: Typography.xs, 
            marginLeft: Spacing.xs 
          }}>
            {formatDate(item.createdAt)}
          </Text>
          
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginLeft: Spacing.md 
          }}>
            <Ionicons name="eye-outline" size={14} color={Colors.textSecondary} />
            <Text style={{ 
              color: Colors.textSecondary, 
              fontSize: Typography.xs, 
              marginLeft: Spacing.xs 
            }}>
              {item.views || 0} views
            </Text>
          </View>
        </View>

        {/* Shoppable Items */}
        {item.products && item.products.length > 0 && (
          <View style={{ marginBottom: Spacing.sm }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginBottom: Spacing.sm 
            }}>
              <Ionicons name="bag-outline" size={16} color={Colors.primary} />
              <Text style={{ 
                color: Colors.primary, 
                fontSize: Typography.sm,
                fontWeight: '600',
                marginLeft: Spacing.xs 
              }}>
                {item.products.length} shoppable items
              </Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {item.products.slice(0, 3).map((product) => (
                <View key={product.id} style={{ marginRight: Spacing.sm, width: 120 }}>
                  <ProductCard 
                    product={product} 
                    compact={true}
                    variant="minimal"
                    animated={true}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <TouchableOpacity style={{
            flex: 1,
            backgroundColor: Colors.primary,
            padding: Spacing.sm,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}>
            <Ionicons name="analytics-outline" size={16} color={Colors.textPrimary} />
            <Text style={{ 
              color: Colors.textPrimary, 
              fontSize: Typography.sm,
              fontWeight: '600',
              marginLeft: Spacing.xs 
            }}>
              Analytics
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={{
            flex: 1,
            backgroundColor: Colors.background,
            padding: Spacing.sm,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: Colors.border,
          }}>
            <Ionicons name="share-outline" size={16} color={Colors.textSecondary} />
            <Text style={{ 
              color: Colors.textSecondary, 
              fontSize: Typography.sm,
              fontWeight: '600',
              marginLeft: Spacing.xs 
            }}>
              Share
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: Colors.background, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Text style={{ color: Colors.textPrimary, fontSize: Typography.lg }}>
          Loading profile...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ 
          backgroundColor: Colors.surface, 
          padding: Spacing.lg,
          paddingTop: 60,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: Colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: Spacing.md,
              }}>
                <Ionicons name="person" size={30} color={Colors.textPrimary} />
              </View>
              <View>
                <Text style={{ 
                  color: Colors.textPrimary, 
                  fontSize: Typography.lg, 
                  fontWeight: 'bold' 
                }}>
                  Creator Profile
                </Text>
                <Text style={{ 
                  color: Colors.textSecondary, 
                  fontSize: Typography.sm 
                }}>
                  Shoppable Video Creator
                </Text>
              </View>
            </View>
            
            <TouchableOpacity onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', marginBottom: Spacing.lg }}>
                    {renderStatsCard('Videos', stats.totalVideos, 'videocam-outline', Colors.primary)}
        {renderStatsCard('Views', stats.totalViews.toLocaleString(), 'eye-outline', Colors.success)}
        {renderStatsCard('Products', stats.totalProducts, 'bag-outline', Colors.warning)}
        {renderStatsCard('Revenue', `$${stats.totalRevenue}`, 'card-outline', Colors.error)}
          </View>

          {/* Quick Actions */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <View style={{ flex: 1 }}>
              <EnhancedButton
                title="Create Video"
                variant="primary"
                size="medium"
                icon="add-circle-outline"
                onPress={() => console.log('Create video pressed')}
              />
            </View>
            
            <TouchableOpacity style={{
              backgroundColor: Colors.surface,
              padding: Spacing.md,
              borderRadius: BorderRadius.lg,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: Colors.border,
              minHeight: TouchTargets.comfortable,
              justifyContent: 'center',
              ...Shadows.sm,
            }}>
              <Ionicons name="settings-outline" size={Icons.sizes.md} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={{ padding: Spacing.lg }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: Spacing.lg 
          }}>
            <Text style={{ 
              color: Colors.textPrimary, 
              fontSize: Typography.xl, 
              fontWeight: 'bold' 
            }}>
              Your Videos
            </Text>
            <TouchableOpacity>
              <Ionicons name="filter-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {userVideos.length === 0 ? (
            <View style={{ 
              alignItems: 'center', 
              paddingVertical: Spacing.xl 
            }}>
              <Ionicons name="videocam-outline" size={64} color={Colors.textSecondary} />
              <Text style={{ 
                color: Colors.textPrimary, 
                fontSize: Typography.lg, 
                fontWeight: 'bold',
                marginTop: Spacing.md,
                marginBottom: Spacing.sm,
              }}>
                No videos yet
              </Text>
              <Text style={{ 
                color: Colors.textSecondary, 
                fontSize: Typography.md,
                textAlign: 'center',
                marginBottom: Spacing.lg,
              }}>
                Create your first shoppable video to get started
              </Text>
              <EnhancedButton
                title="Create First Video"
                variant="primary"
                size="large"
                icon="add-circle-outline"
                onPress={() => console.log('Create first video pressed')}
              />
            </View>
          ) : (
            <FlatList
              data={userVideos}
              renderItem={renderVideoItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}; 