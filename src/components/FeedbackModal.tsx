import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LearningService, UserFeedback } from '../services/learningService';

interface FeedbackModalProps {
  videoId: string;
  detectedObjects: string[];
  finalSelection: string;
  onClose: () => void;
  onFeedbackSubmitted: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  videoId,
  detectedObjects,
  finalSelection,
  onClose,
  onFeedbackSubmitted
}) => {
  const [accuracy, setAccuracy] = useState<'excellent' | 'good' | 'fair' | 'poor' | 'bad' | null>(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!accuracy) {
      Alert.alert('Please Rate Accuracy', 'Please select how accurate the detection was.');
      return;
    }

    try {
      setSubmitting(true);
      
      const feedback: UserFeedback = {
        accuracy,
        comments: comments.trim() || undefined
      };

      const success = await LearningService.recordFeedback(videoId, feedback);
      
      if (success) {
        Alert.alert(
          'Thank You!', 
          'Your feedback helps improve our detection accuracy.',
          [{ text: 'OK', onPress: onFeedbackSubmitted }]
        );
      } else {
        Alert.alert('Error', 'Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderAccuracyButton = (
    value: 'excellent' | 'good' | 'fair' | 'poor' | 'bad',
    label: string,
    icon: string,
    color: string
  ) => (
    <TouchableOpacity
      style={[
        styles.accuracyButton,
        accuracy === value && styles.accuracyButtonSelected,
        { borderColor: color }
      ]}
      onPress={() => setAccuracy(value)}
    >
      <Ionicons 
        name={icon as any} 
        size={24} 
        color={accuracy === value ? color : '#94a3b8'} 
      />
      <Text style={[
        styles.accuracyButtonText,
        accuracy === value && { color }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Rate Detection Accuracy</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Detection Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Detection Summary</Text>
            <Text style={styles.summaryText}>
              Detected: {detectedObjects.join(', ') || 'No objects'}
            </Text>
            <Text style={styles.summaryText}>
              Selected: {finalSelection}
            </Text>
          </View>

          {/* Accuracy Rating */}
          <View style={styles.accuracyContainer}>
            <Text style={styles.accuracyTitle}>How accurate was this detection?</Text>
            <View style={styles.accuracyButtons}>
              {renderAccuracyButton('excellent', 'Excellent', 'star', '#10b981')}
              {renderAccuracyButton('good', 'Good', 'thumbs-up', '#6366f1')}
              {renderAccuracyButton('fair', 'Fair', 'remove', '#f59e0b')}
              {renderAccuracyButton('poor', 'Poor', 'thumbs-down', '#ef4444')}
              {renderAccuracyButton('bad', 'Bad', 'close-circle', '#dc2626')}
            </View>
          </View>

          {/* Comments */}
          <View style={styles.commentsContainer}>
            <Text style={styles.commentsTitle}>Additional Comments (Optional)</Text>
            <TextInput
              style={styles.commentsInput}
              placeholder="Tell us how we can improve..."
              placeholderTextColor="#64748b"
              value={comments}
              onChangeText={setComments}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onClose}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.submitButton,
              !accuracy && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitFeedback}
            disabled={!accuracy || submitting}
          >
            {submitting ? (
              <Text style={styles.submitButtonText}>Submitting...</Text>
            ) : (
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  summaryContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#0f172a',
    borderRadius: 8,
  },
  summaryTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryText: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 4,
  },
  accuracyContainer: {
    marginBottom: 24,
  },
  accuracyTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  accuracyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accuracyButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderRadius: 8,
    marginHorizontal: 4,
    borderColor: '#374151',
  },
  accuracyButtonSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  accuracyButtonText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  commentsContainer: {
    marginBottom: 24,
  },
  commentsTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  commentsInput: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#374151',
    minHeight: 80,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#374151',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
}); 