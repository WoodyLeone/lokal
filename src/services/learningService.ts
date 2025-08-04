import { ApiService } from './api';
import { getApiEndpoint } from '../config/env';

export interface LearningStats {
  totalVideos: number;
  totalFeedback: number;
  lastUpdated: string;
  topDetectedObjects: Array<{ object: string; count: number }>;
  accuracyTrend: number;
  categoryDistribution: Record<string, number>;
}

export interface UserFeedback {
  accuracy: 'excellent' | 'good' | 'fair' | 'poor' | 'bad';
  suggestions?: string[];
  comments?: string;
}

export class LearningService {
  // Get learning statistics
  static async getLearningStats(): Promise<LearningStats | null> {
    try {
      // Return demo data for now since the API endpoint doesn't exist
      return {
        totalVideos: 4,
        totalFeedback: 2,
        lastUpdated: new Date().toISOString(),
        topDetectedObjects: [
          { object: 'shoe', count: 3 },
          { object: 'phone', count: 2 },
          { object: 'watch', count: 1 }
        ],
        accuracyTrend: 85,
        categoryDistribution: {
          'footwear': 2,
          'technology': 1,
          'fashion': 1
        }
      };
    } catch (error) {
      console.error('Error getting learning stats:', error);
      return null;
    }
  }

  // Record user feedback
  static async recordFeedback(videoId: string, feedback: UserFeedback): Promise<boolean> {
    try {
      // For now, just log the feedback since the API endpoint doesn't exist
      console.log('Recording feedback:', { videoId, feedback });
      return true;
    } catch (error) {
      console.error('Error recording feedback:', error);
      return false;
    }
  }

  // Update final product selection
  static async updateFinalSelection(
    videoId: string, 
    finalSelection: string, 
    userFeedback?: UserFeedback
  ): Promise<boolean> {
    try {
      // For now, just log the selection since the API endpoint doesn't exist
      console.log('Updating final selection:', { videoId, finalSelection, userFeedback });
      return true;
    } catch (error) {
      console.error('Error updating final selection:', error);
      return false;
    }
  }

  // Get learning insights for display
  static async getLearningInsights(): Promise<{
    totalVideos: number;
    accuracy: number;
    topCategories: string[];
    improvement: string;
  } | null> {
    try {
      const stats = await this.getLearningStats();
      if (!stats) return null;

      const topCategories = Object.entries(stats.categoryDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      const improvement = this.getImprovementMessage(stats);

      return {
        totalVideos: stats.totalVideos,
        accuracy: stats.accuracyTrend,
        topCategories,
        improvement
      };
    } catch (error) {
      console.error('Error getting learning insights:', error);
      return null;
    }
  }

  // Generate improvement message based on stats
  private static getImprovementMessage(stats: LearningStats): string {
    if (stats.totalVideos < 5) {
      return "Learning from your uploads to improve accuracy";
    } else if (stats.accuracyTrend < 50) {
      return "Working on improving detection accuracy";
    } else if (stats.accuracyTrend < 75) {
      return "Detection accuracy is improving with more data";
    } else {
      return "High accuracy achieved through learning";
    }
  }

  // Get category-specific insights
  static async getCategoryInsights(category: string): Promise<{
    category: string;
    videoCount: number;
    topObjects: string[];
    suggestions: string[];
  } | null> {
    try {
      const stats = await this.getLearningStats();
      if (!stats) return null;

      const categoryCount = stats.categoryDistribution[category] || 0;
      const topObjects = stats.topDetectedObjects
        .slice(0, 5)
        .map(item => item.object);

      const suggestions = this.getCategorySuggestions(category);

      return {
        category,
        videoCount: categoryCount,
        topObjects,
        suggestions
      };
    } catch (error) {
      console.error('Error getting category insights:', error);
      return null;
    }
  }

  // Get suggestions for specific category
  private static getCategorySuggestions(category: string): string[] {
    const categorySuggestions: Record<string, string[]> = {
      'footwear': [
        'Upload more footwear videos to improve shoe detection',
        'Include different angles of shoes for better recognition',
        'Try videos with various shoe types and styles'
      ],
      'outdoor': [
        'Upload outdoor activity videos for better context',
        'Include videos with different outdoor environments',
        'Try videos with various outdoor gear and equipment'
      ],
      'indoor': [
        'Upload indoor setting videos for better context',
        'Include videos with different indoor environments',
        'Try videos with various indoor products and furniture'
      ],
      'sports': [
        'Upload sports activity videos for better detection',
        'Include videos with different sports equipment',
        'Try videos with various athletic wear and gear'
      ],
      'fashion': [
        'Upload fashion-focused videos for better detection',
        'Include videos with different clothing styles',
        'Try videos with various accessories and jewelry'
      ],
      'technology': [
        'Upload tech product videos for better detection',
        'Include videos with different electronic devices',
        'Try videos with various gadgets and accessories'
      ],
      'automotive': [
        'Upload automotive videos for better detection',
        'Include videos with different vehicles and parts',
        'Try videos with various car accessories and equipment'
      ]
    };

    return categorySuggestions[category] || [
      'Upload more videos to improve detection accuracy',
      'Try different types of content for better learning',
      'Include various products and contexts in your uploads'
    ];
  }
} 