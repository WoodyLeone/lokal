/**
 * Monitoring Dashboard Component
 * Real-time system health and performance monitoring using enhanced health endpoints
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiAdapter } from '../services/apiAdapter';
import { healthService } from '../services/healthService';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/designSystem';

const { width: screenWidth } = Dimensions.get('window');

interface HealthMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
  database: {
    postgresql: string;
    redis: string;
    cache: string;
  };
  circuitBreakers?: {
    [key: string]: {
      state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
      failureCount: number;
    };
  };
  networkState?: {
    isConnected: boolean;
    type: string | null;
    latency: number;
  };
}

interface PerformanceMetrics {
  requestCount: number;
  successRate: number;
  averageLatency: number;
  cacheHitRate: number;
  activeBackend: string | null;
}

export const MonitoringDashboard: React.FC = () => {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      // Get comprehensive health data from all endpoints
      const comprehensiveHealth = await healthService.getComprehensiveHealth();
      
      // Extract health metrics from the response
      let healthData: HealthMetrics | null = null;
      
      if (comprehensiveHealth.basic?.data) {
        healthData = {
          status: comprehensiveHealth.basic.status as 'healthy' | 'degraded' | 'unhealthy',
          uptime: comprehensiveHealth.basic.data.uptime || 0,
          memory: comprehensiveHealth.basic.data.memory || {
            rss: 0,
            heapTotal: 0,
            heapUsed: 0,
          },
          database: comprehensiveHealth.basic.data.database || {
            postgresql: 'Unknown',
            redis: 'Unknown',
            cache: 'Unknown',
          },
        };

        // Add network state from performance metrics
        const performanceData = apiAdapter.getPerformanceMetrics();
        if (performanceData) {
          setPerformanceMetrics(performanceData as PerformanceMetrics);
        }
        
        // Add circuit breaker data if available from detailed health
        if (comprehensiveHealth.detailed?.success && comprehensiveHealth.detailed.health?.circuitBreakers) {
          healthData.circuitBreakers = comprehensiveHealth.detailed.health.circuitBreakers;
        }
        
        // Add network state
        const healthStatus = apiAdapter.getHealthStatus();
        if (healthStatus?.networkState) {
          healthData.networkState = {
            isConnected: healthStatus.networkState.isConnected,
            type: healthStatus.networkState.type,
            latency: healthStatus.activeBackendLatency || 0,
          };
        }
      }
      
      setHealthMetrics(healthData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'available':
      case 'closed':
        return Colors.success;
      case 'degraded':
      case 'half_open':
        return Colors.warning;
      case 'unhealthy':
      case 'unavailable':
      case 'open':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'available':
      case 'closed':
        return 'checkmark-circle';
      case 'degraded':
      case 'half_open':
        return 'warning';
      case 'unhealthy':
      case 'unavailable':
      case 'open':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const MetricCard: React.FC<{
    title: string;
    value: string;
    status?: string;
    icon?: string;
    color?: string;
  }> = ({ title, value, status, icon, color }) => (
    <View style={[styles.metricCard, { borderLeftColor: color || Colors.primary }]}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricTitle}>{title}</Text>
        {icon && (
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={color || Colors.primary} 
          />
        )}
      </View>
      <Text style={[styles.metricValue, { color: color || Colors.text }]}>
        {value}
      </Text>
      {status && (
        <Text style={[styles.metricStatus, { color: getStatusColor(status) }]}>
          {status}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="analytics" size={48} color={Colors.primary} />
        <Text style={styles.loadingText}>Loading metrics...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="analytics" size={24} color={Colors.primary} />
          <Text style={styles.headerTitle}>System Monitoring</Text>
        </View>
        {lastUpdate && (
          <Text style={styles.lastUpdate}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Overall Health Status */}
      {healthMetrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Health</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Overall Status"
              value={healthMetrics.status}
              status={healthMetrics.status}
              icon={getStatusIcon(healthMetrics.status)}
              color={getStatusColor(healthMetrics.status)}
            />
            <MetricCard
              title="Uptime"
              value={formatUptime(healthMetrics.uptime)}
              icon="time"
              color={Colors.success}
            />
          </View>
        </View>
      )}

      {/* Database Health */}
      {healthMetrics?.database && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Database Services</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="PostgreSQL"
              value={healthMetrics.database.postgresql}
              status={healthMetrics.database.postgresql}
              icon={getStatusIcon(healthMetrics.database.postgresql)}
              color={getStatusColor(healthMetrics.database.postgresql)}
            />
            <MetricCard
              title="Redis"
              value={healthMetrics.database.redis}
              status={healthMetrics.database.redis}
              icon={getStatusIcon(healthMetrics.database.redis)}
              color={getStatusColor(healthMetrics.database.redis)}
            />
            <MetricCard
              title="Cache"
              value={healthMetrics.database.cache}
              status={healthMetrics.database.cache}
              icon={getStatusIcon(healthMetrics.database.cache)}
              color={getStatusColor(healthMetrics.database.cache)}
            />
          </View>
        </View>
      )}

      {/* Memory Usage */}
      {healthMetrics?.memory && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Memory Usage</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Heap Used"
              value={formatBytes(healthMetrics.memory.heapUsed)}
              icon="hardware-chip"
              color={Colors.info}
            />
            <MetricCard
              title="Heap Total"
              value={formatBytes(healthMetrics.memory.heapTotal)}
              icon="hardware-chip-outline"
              color={Colors.info}
            />
            <MetricCard
              title="RSS"
              value={formatBytes(healthMetrics.memory.rss)}
              icon="server"
              color={Colors.info}
            />
          </View>
        </View>
      )}

      {/* Circuit Breakers */}
      {healthMetrics?.circuitBreakers && Object.keys(healthMetrics.circuitBreakers).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Circuit Breakers</Text>
          <View style={styles.metricsGrid}>
            {Object.entries(healthMetrics.circuitBreakers).map(([name, breaker]) => (
              <MetricCard
                key={name}
                title={name}
                value={breaker.state}
                status={`${breaker.failureCount} failures`}
                icon={getStatusIcon(breaker.state)}
                color={getStatusColor(breaker.state)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Network Status */}
      {healthMetrics?.networkState && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network Status</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Connection"
              value={healthMetrics.networkState.isConnected ? 'Connected' : 'Disconnected'}
              status={healthMetrics.networkState.type || 'Unknown'}
              icon={healthMetrics.networkState.isConnected ? 'wifi' : 'wifi-off'}
              color={healthMetrics.networkState.isConnected ? Colors.success : Colors.error}
            />
            <MetricCard
              title="Latency"
              value={`${healthMetrics.networkState.latency}ms`}
              icon="speedometer"
              color={healthMetrics.networkState.latency < 200 ? Colors.success : Colors.warning}
            />
          </View>
        </View>
      )}

      {/* Performance Metrics */}
      {performanceMetrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Success Rate"
              value={`${(performanceMetrics.successRate * 100).toFixed(1)}%`}
              icon="trending-up"
              color={performanceMetrics.successRate > 0.95 ? Colors.success : Colors.warning}
            />
            <MetricCard
              title="Avg Latency"
              value={`${performanceMetrics.averageLatency.toFixed(0)}ms`}
              icon="time"
              color={performanceMetrics.averageLatency < 500 ? Colors.success : Colors.warning}
            />
            <MetricCard
              title="Cache Hit Rate"
              value={`${(performanceMetrics.cacheHitRate * 100).toFixed(1)}%`}
              icon="flash"
              color={performanceMetrics.cacheHitRate > 0.8 ? Colors.success : Colors.warning}
            />
            <MetricCard
              title="Total Requests"
              value={performanceMetrics.requestCount.toString()}
              icon="stats-chart"
              color={Colors.info}
            />
          </View>
        </View>
      )}

      {/* Active Backend */}
      {performanceMetrics?.activeBackend && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Backend</Text>
          <View style={styles.backendCard}>
            <Ionicons name="server" size={20} color={Colors.success} />
            <Text style={styles.backendUrl}>{performanceMetrics.activeBackend}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  header: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    margin: Spacing.md,
    ...Shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  lastUpdate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  section: {
    margin: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    width: (screenWidth - Spacing.md * 3) / 2,
    borderLeftWidth: 4,
    ...Shadows.sm,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  metricTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  metricValue: {
    ...Typography.h3,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  metricStatus: {
    ...Typography.caption,
    fontWeight: '500',
  },
  backendCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.sm,
  },
  backendUrl: {
    ...Typography.body,
    color: Colors.text,
    marginLeft: Spacing.sm,
    flex: 1,
  },
});