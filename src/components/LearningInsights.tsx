import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LearningService } from '../services/learningService';

interface LearningInsightsProps {
  onClose?: () => void;
}

export const LearningInsights: React.FC<LearningInsightsProps> = ({ onClose }) => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const data = await LearningService.getLearningInsights();
      setInsights(data);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🧠 Learning Insights</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading insights...</Text>
        </View>
      </View>
    );
  }

  if (!insights) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🧠 Learning Insights</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="school-outline" size={48} color="#94a3b8" />
          <Text style={styles.emptyText}>No learning data available yet</Text>
          <Text style={styles.emptySubtext}>Upload more videos to see insights</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧠 Learning Insights</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="videocam" size={24} color="#6366f1" />
            <Text style={styles.statNumber}>{insights.totalVideos}</Text>
            <Text style={styles.statLabel}>Videos Processed</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color="#10b981" />
            <Text style={styles.statNumber}>{insights.accuracy.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>

        {/* Improvement Status */}
        <View style={styles.improvementContainer}>
          <View style={styles.improvementHeader}>
            <Ionicons name="bulb" size={20} color="#f59e0b" />
            <Text style={styles.improvementTitle}>Learning Progress</Text>
          </View>
          <Text style={styles.improvementText}>{insights.improvement}</Text>
        </View>

        {/* Top Categories */}
        {insights.topCategories.length > 0 && (
          <View style={styles.categoriesContainer}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            <View style={styles.categoriesList}>
              {insights.topCategories.map((category: string, index: number) => (
                <View key={category} style={styles.categoryItem}>
                  <View style={styles.categoryRank}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.categoryText}>{category}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Expandable Details */}
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.expandButtonText}>
            {expanded ? 'Show Less' : 'Show More Details'}
          </Text>
          <Ionicons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#6366f1" 
          />
        </TouchableOpacity>

        {expanded && (
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>How Learning Works</Text>
            <View style={styles.detailItem}>
              <Ionicons name="analytics" size={16} color="#6366f1" />
              <Text style={styles.detailText}>
                The app learns from each video you upload to improve detection accuracy
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.detailText}>
                Your feedback helps refine product suggestions
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="trending-up" size={16} color="#f59e0b" />
              <Text style={styles.detailText}>
                More uploads lead to better and more accurate detections
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  improvementContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  improvementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  improvementTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  improvementText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoriesList: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryText: {
    color: '#f8fafc',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  expandButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
}); 