/**
 * Monitoring Screen
 * System health monitoring and performance dashboard
 */

import React from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { MonitoringDashboard } from '../components/MonitoringDashboard';
import { Colors } from '../utils/designSystem';

export const MonitoringScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <View style={styles.content}>
        <MonitoringDashboard />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
});