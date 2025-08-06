import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/designSystem';

const { width: screenWidth } = Dimensions.get('window');

interface AnalyticsData {
  pipeline: {
    totalVideos: number;
    successfulVideos: number;
    failedVideos: number;
    averageProcessingTime: number;
    successRate: number;
  };
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    totalUploads: number;
    averageSessionTime: number;
  };
  productMatching: {
    totalMatches: number;
    successfulMatches: number;
    averageConfidence: number;
    topCategories: Array<{ category: string; count: number }>;
  };
  performance: {
    memoryUsage: number;
    cpuUsage: number;
    queueSize: number;
    errorRate: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
  }>;
}

interface AnalyticsDashboardProps {
  onRefresh?: () => void;
  onNavigateToDetail?: (section: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  onRefresh,
  onNavigateToDetail
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // In production, this would fetch from your analytics API
      const mockData: AnalyticsData = {
        pipeline: {
          totalVideos: 1247,
          successfulVideos: 1189,
          failedVideos: 58,
          averageProcessingTime: 45000, // 45 seconds
          successRate: 95.3
        },
        userEngagement: {
          totalUsers: 892,
          activeUsers: 234,
          totalUploads: 1247,
          averageSessionTime: 420 // 7 minutes
        },
        productMatching: {
          totalMatches: 3456,
          successfulMatches: 3123,
          averageConfidence: 0.78,
          topCategories: [
            { category: 'Clothing', count: 1234 },
            { category: 'Electronics', count: 892 },
            { category: 'Home', count: 567 },
            { category: 'Beauty', count: 234 },
            { category: 'Sports', count: 189 }
          ]
        },
        performance: {
          memoryUsage: 0.65, // 65%
          cpuUsage: 0.42, // 42%
          queueSize: 23,
          errorRate: 0.047 // 4.7%
        },
        recentActivity: [
          {
            id: '1',
            type: 'video_upload',
            message: 'New video uploaded: "Nike Running Shoes Review"',
            timestamp: '2024-01-15T10:30:00Z',
            status: 'success'
          },
          {
            id: '2',
            type: 'pipeline_complete',
            message: 'Pipeline completed successfully for video ID: abc123',
            timestamp: '2024-01-15T10:25:00Z',
            status: 'success'
          },
          {
            id: '3',
            type: 'product_match',
            message: 'High confidence match found: Nike Air Max 270',
            timestamp: '2024-01-15T10:20:00Z',
            status: 'success'
          },
          {
            id: '4',
            type: 'error',
            message: 'Processing failed for video ID: def456 - Invalid format',
            timestamp: '2024-01-15T10:15:00Z',
            status: 'error'
          },
          {
            id: '5',
            type: 'warning',
            message: 'High memory usage detected: 85%',
            timestamp: '2024-01-15T10:10:00Z',
            status: 'warning'
          }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
    onRefresh?.();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return Colors.success;
      case 'warning': return Colors.warning;
      case 'error': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'close-circle';
      default: return 'information-circle';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load analytics data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAnalyticsData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <View style={styles.timeRangeSelector}>
          {(['24h', '7d', '30d'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                selectedTimeRange === range && styles.timeRangeButtonActive
              ]}
              onPress={() => setSelectedTimeRange(range)}
            >
              <Text style={[
                styles.timeRangeButtonText,
                selectedTimeRange === range && styles.timeRangeButtonTextActive
              ]}>
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Pipeline Overview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pipeline Performance</Text>
          <TouchableOpacity onPress={() => onNavigateToDetail?.('pipeline')}>
            <Ionicons name="chevron-forward-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatNumber(data.pipeline.totalVideos)}</Text>
            <Text style={styles.metricLabel}>Total Videos</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{data.pipeline.successRate.toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Success Rate</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatTime(data.pipeline.averageProcessingTime / 1000)}</Text>
            <Text style={styles.metricLabel}>Avg Processing Time</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{data.pipeline.failedVideos}</Text>
            <Text style={styles.metricLabel}>Failed Videos</Text>
          </View>
        </View>
      </View>

      {/* User Engagement */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>User Engagement</Text>
          <TouchableOpacity onPress={() => onNavigateToDetail?.('engagement')}>
            <Ionicons name="chevron-forward-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatNumber(data.userEngagement.totalUsers)}</Text>
            <Text style={styles.metricLabel}>Total Users</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatNumber(data.userEngagement.activeUsers)}</Text>
            <Text style={styles.metricLabel}>Active Users</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatNumber(data.userEngagement.totalUploads)}</Text>
            <Text style={styles.metricLabel}>Total Uploads</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatTime(data.userEngagement.averageSessionTime)}</Text>
            <Text style={styles.metricLabel}>Avg Session Time</Text>
          </View>
        </View>
      </View>

      {/* Product Matching */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Product Matching</Text>
          <TouchableOpacity onPress={() => onNavigateToDetail?.('matching')}>
            <Ionicons name="chevron-forward-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatNumber(data.productMatching.totalMatches)}</Text>
            <Text style={styles.metricLabel}>Total Matches</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{(data.productMatching.averageConfidence * 100).toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Avg Confidence</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatNumber(data.productMatching.successfulMatches)}</Text>
            <Text style={styles.metricLabel}>Successful Matches</Text>
          </View>
        </View>

        {/* Top Categories Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Top Product Categories</Text>
          <BarChart
            data={{
              labels: data.productMatching.topCategories.slice(0, 5).map(cat => cat.category),
              datasets: [{
                data: data.productMatching.topCategories.slice(0, 5).map(cat => cat.count)
              }]
            }}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              backgroundColor: Colors.surface,
              backgroundGradientFrom: Colors.surface,
              backgroundGradientTo: Colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: BorderRadius.md
              }
            }}
            style={styles.chart}
          />
        </View>
      </View>

      {/* System Performance */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>System Performance</Text>
          <TouchableOpacity onPress={() => onNavigateToDetail?.('performance')}>
            <Ionicons name="chevron-forward-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{(data.performance.memoryUsage * 100).toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Memory Usage</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{(data.performance.cpuUsage * 100).toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>CPU Usage</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{data.performance.queueSize}</Text>
            <Text style={styles.metricLabel}>Queue Size</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{(data.performance.errorRate * 100).toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Error Rate</Text>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => onNavigateToDetail?.('activity')}>
            <Ionicons name="chevron-forward-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.activityList}>
          {data.recentActivity.slice(0, 5).map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons
                  name={getStatusIcon(activity.status)}
                  size={16}
                  color={getStatusColor(activity.status)}
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityMessage}>{activity.message}</Text>
                <Text style={styles.activityTime}>
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: Typography.lg,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: Typography.lg,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: 2,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: Colors.primary,
  },
  timeRangeButtonText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  timeRangeButtonTextActive: {
    color: Colors.white,
  },
  section: {
    margin: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.sm,
  },
  metricCard: {
    width: '50%',
    padding: Spacing.sm,
  },
  metricValue: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  chartContainer: {
    marginTop: Spacing.lg,
  },
  chartTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  chart: {
    borderRadius: BorderRadius.md,
  },
  activityList: {
    marginTop: Spacing.base,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activityIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  activityTime: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
}; 