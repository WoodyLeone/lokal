import React, { useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { EnhancedButton } from './EnhancedButton';
import { EnhancedCard } from './EnhancedCard';
import { EnhancedLoading, VideoLoading, ProcessingLoading } from './EnhancedLoading';
import { Colors, Typography, Spacing } from '../utils/designSystem';

export const ComponentTest: React.FC = () => {
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Simulate progress
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) return 0;
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background, padding: Spacing.lg }}>
      <Text style={{ 
        color: Colors.textPrimary, 
        fontSize: Typography['2xl'], 
        fontWeight: Typography.bold,
        marginBottom: Spacing.xl,
        textAlign: 'center'
      }}>
        UI Component Test
      </Text>

      {/* Enhanced Buttons */}
      <EnhancedCard title="Enhanced Buttons" subtitle="Testing different button variants">
        <View style={{ gap: Spacing.base }}>
          <EnhancedButton
            title="Primary Button"
            onPress={() => console.log('Primary pressed')}
            variant="primary"
            size="large"
            fullWidth
          />
          
          <EnhancedButton
            title="Secondary Button"
            onPress={() => console.log('Secondary pressed')}
            variant="secondary"
            size="medium"
            fullWidth
          />
          
          <EnhancedButton
            title="Outline Button"
            onPress={() => console.log('Outline pressed')}
            variant="outline"
            size="medium"
            fullWidth
          />
          
          <EnhancedButton
            title="Ghost Button"
            onPress={() => console.log('Ghost pressed')}
            variant="ghost"
            size="medium"
            fullWidth
          />
          
          <EnhancedButton
            title="Loading Button"
            onPress={() => console.log('Loading pressed')}
            loading={true}
            size="medium"
            fullWidth
          />
          
          <EnhancedButton
            title="Disabled Button"
            onPress={() => console.log('Disabled pressed')}
            disabled={true}
            size="medium"
            fullWidth
          />
          
          <EnhancedButton
            title="Icon Button"
            onPress={() => console.log('Icon pressed')}
            icon="heart"
            iconPosition="right"
            variant="primary"
            size="medium"
            fullWidth
          />
        </View>
      </EnhancedCard>

      {/* Enhanced Cards */}
      <EnhancedCard 
        title="Enhanced Cards" 
        subtitle="Testing different card variants"
        style={{ marginTop: Spacing.lg }}
      >
        <View style={{ gap: Spacing.base }}>
          <EnhancedCard
            title="Default Card"
            subtitle="This is a default card"
            variant="default"
            interactive
            onPress={() => console.log('Default card pressed')}
          >
            <Text style={{ color: Colors.textSecondary }}>
              This is the content of a default card.
            </Text>
          </EnhancedCard>
          
          <EnhancedCard
            title="Elevated Card"
            subtitle="This is an elevated card"
            variant="elevated"
            interactive
            onPress={() => console.log('Elevated card pressed')}
          >
            <Text style={{ color: Colors.textSecondary }}>
              This card has enhanced shadows and elevation.
            </Text>
          </EnhancedCard>
          
          <EnhancedCard
            title="Outlined Card"
            subtitle="This is an outlined card"
            variant="outlined"
            interactive
            onPress={() => console.log('Outlined card pressed')}
          >
            <Text style={{ color: Colors.textSecondary }}>
              This card has a border outline.
            </Text>
          </EnhancedCard>
          
          <EnhancedCard
            title="Gradient Card"
            subtitle="This is a gradient card"
            variant="gradient"
            interactive
            onPress={() => console.log('Gradient card pressed')}
            gradientColors={[Colors.primary, Colors.primaryDark]}
          >
            <Text style={{ color: Colors.textPrimary }}>
              This card has a beautiful gradient background.
            </Text>
          </EnhancedCard>
          
          <EnhancedCard
            title="Loading Card"
            subtitle="This card is loading"
            loading={true}
          >
            <Text style={{ color: Colors.textSecondary }}>
              This content won't be visible while loading.
            </Text>
          </EnhancedCard>
        </View>
      </EnhancedCard>

      {/* Enhanced Loading */}
      <EnhancedCard 
        title="Enhanced Loading" 
        subtitle="Testing different loading types"
        style={{ marginTop: Spacing.lg }}
      >
        <View style={{ gap: Spacing.lg, alignItems: 'center' }}>
          <View>
            <Text style={{ color: Colors.textSecondary, marginBottom: Spacing.sm }}>
              Spinner Loading:
            </Text>
            <EnhancedLoading
              type="spinner"
              text="Loading..."
              size="medium"
            />
          </View>
          
          <View>
            <Text style={{ color: Colors.textSecondary, marginBottom: Spacing.sm }}>
              Dots Loading:
            </Text>
            <EnhancedLoading
              type="dots"
              text="Processing"
              subtitle="Please wait..."
              size="medium"
            />
          </View>
          
          <View>
            <Text style={{ color: Colors.textSecondary, marginBottom: Spacing.sm }}>
              Pulse Loading:
            </Text>
            <EnhancedLoading
              type="pulse"
              text="Connecting"
              subtitle="Establishing connection..."
              size="medium"
            />
          </View>
          
          <View>
            <Text style={{ color: Colors.textSecondary, marginBottom: Spacing.sm }}>
              Progress Loading ({loadingProgress}%):
            </Text>
            <EnhancedLoading
              type="progress"
              text="Uploading"
              subtitle="Uploading your video..."
              progress={loadingProgress}
              size="medium"
            />
          </View>
          
          <View>
            <Text style={{ color: Colors.textSecondary, marginBottom: Spacing.sm }}>
              Video Loading:
            </Text>
            <VideoLoading progress={loadingProgress} />
          </View>
          
          <View>
            <Text style={{ color: Colors.textSecondary, marginBottom: Spacing.sm }}>
              Processing Loading:
            </Text>
            <ProcessingLoading />
          </View>
        </View>
      </EnhancedCard>

      {/* Design System Colors */}
      <EnhancedCard 
        title="Design System Colors" 
        subtitle="Testing color palette"
        style={{ marginTop: Spacing.lg, marginBottom: Spacing.xl }}
      >
        <View style={{ gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View style={{ 
              width: 20, 
              height: 20, 
              backgroundColor: Colors.primary, 
              borderRadius: 4 
            }} />
            <Text style={{ color: Colors.textSecondary }}>Primary: {Colors.primary}</Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View style={{ 
              width: 20, 
              height: 20, 
              backgroundColor: Colors.secondary, 
              borderRadius: 4 
            }} />
            <Text style={{ color: Colors.textSecondary }}>Secondary: {Colors.secondary}</Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View style={{ 
              width: 20, 
              height: 20, 
              backgroundColor: Colors.success, 
              borderRadius: 4 
            }} />
            <Text style={{ color: Colors.textSecondary }}>Success: {Colors.success}</Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View style={{ 
              width: 20, 
              height: 20, 
              backgroundColor: Colors.warning, 
              borderRadius: 4 
            }} />
            <Text style={{ color: Colors.textSecondary }}>Warning: {Colors.warning}</Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View style={{ 
              width: 20, 
              height: 20, 
              backgroundColor: Colors.error, 
              borderRadius: 4 
            }} />
            <Text style={{ color: Colors.textSecondary }}>Error: {Colors.error}</Text>
          </View>
        </View>
      </EnhancedCard>
    </ScrollView>
  );
}; 