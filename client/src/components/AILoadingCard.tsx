import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Card } from './Card';

export const AILoadingCard: React.FC = () => {
  const { colors, typography, spacing } = useTheme();
  const [pulseAnim] = useState(() => new Animated.Value(0.3));
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    '✦ Thinking about your interests',
    '✦ Exploring project possibilities',
    '○ Creating suggestions',
  ];

  useEffect(() => {
    // Pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Step message rotation
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [pulseAnim, steps.length]);

  return (
    <Card style={[styles.card, { marginTop: spacing.md }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.aiLabel, { color: colors.primary, fontSize: typography.titleMedium.fontSize }]}>
          Generating ideas...
        </Text>
      </View>

      <View style={{ marginTop: spacing.sm }}>
        {steps.map((step, idx) => {
          const isActive = idx === stepIndex;
          const isDone = idx < stepIndex;
          return (
            <View key={step} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 3 }}>
              <Text
                style={{
                  color: isActive ? colors.primary : isDone ? colors.onSurface : colors.onSurfaceVariant,
                  fontWeight: isActive ? '700' : '500',
                  fontSize: 14,
                }}
              >
                {step}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Idea card geometry skeleton shapes */}
      <Animated.View style={{ opacity: pulseAnim }}>
        <View
          style={[
            styles.titleSkeleton,
            { backgroundColor: colors.surfaceVariant, marginTop: spacing.sm },
          ]}
        />
        <View
          style={[
            styles.descSkeleton,
            { backgroundColor: colors.surfaceVariant, marginTop: spacing.xs },
          ]}
        />
        <View
          style={[
            styles.descSkeletonShort,
            { backgroundColor: colors.surfaceVariant, marginTop: spacing.xs },
          ]}
        />

        {/* Tech Stack Chip Skeletons */}
        <View style={[styles.chipSkeletonRow, { marginTop: spacing.md }]}>
          <View
            style={[
              styles.chipSkeleton,
              { backgroundColor: colors.primaryContainer },
            ]}
          />
          <View
            style={[
              styles.chipSkeleton,
              { backgroundColor: colors.secondaryContainer },
            ]}
          />
          <View
            style={[
              styles.chipSkeleton,
              { backgroundColor: colors.surfaceVariant },
            ]}
          />
        </View>
      </Animated.View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeSkeleton: {
    width: 60,
    height: 24,
    borderRadius: 12,
  },
  aiLabel: {
    marginLeft: 10,
    fontWeight: '700',
    fontSize: 14,
  },
  stepText: {
    marginTop: 10,
    fontStyle: 'italic',
  },
  titleSkeleton: {
    height: 24,
    borderRadius: 6,
    width: '80%',
  },
  descSkeleton: {
    height: 14,
    borderRadius: 4,
    width: '100%',
  },
  descSkeletonShort: {
    height: 14,
    borderRadius: 4,
    width: '60%',
  },
  chipSkeletonRow: {
    flexDirection: 'row',
  },
  chipSkeleton: {
    width: 80,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
});
