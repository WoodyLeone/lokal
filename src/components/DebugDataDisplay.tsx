import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

interface DebugDataDisplayProps {
  detectedObjects: string[];
  matchedProducts: any[];
  aiSuggestions: string[];
  manualProductName: string;
  currentStep: string;
}

export const DebugDataDisplay: React.FC<DebugDataDisplayProps> = ({
  detectedObjects,
  matchedProducts,
  aiSuggestions,
  manualProductName,
  currentStep
}) => {
  if (!__DEV__) {
    return null; // Only show in development
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Debug Data Display</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Step: {currentStep}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detected Objects:</Text>
        <Text style={styles.dataText}>
          {JSON.stringify(detectedObjects, null, 2)}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Suggestions:</Text>
        <Text style={styles.dataText}>
          {JSON.stringify(aiSuggestions, null, 2)}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manual Product Name:</Text>
        <Text style={styles.dataText}>
          {manualProductName || 'None'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Matched Products Count:</Text>
        <Text style={styles.dataText}>
          {matchedProducts.length} products
        </Text>
      </View>

      {matchedProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>First 2 Matched Products:</Text>
          <ScrollView style={styles.scrollView}>
            <Text style={styles.dataText}>
              {JSON.stringify(matchedProducts.slice(0, 2), null, 2)}
            </Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  title: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  dataText: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  scrollView: {
    maxHeight: 100,
  },
}); 