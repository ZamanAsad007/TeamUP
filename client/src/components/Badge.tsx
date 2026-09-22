import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export interface BadgeProps {
  label: string | number;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'warning' | 'accent';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  style,
  textStyle,
}) => {
  const { colors, typography, borderRadius, spacing } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'secondary':
        return colors.secondarySoft;
      case 'tertiary':
      case 'accent':
        return colors.tertiaryContainer;
      case 'warning':
        return '#FEF3C7';
      case 'error':
        return colors.errorContainer;
      case 'primary':
      default:
        return colors.primarySoft;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'secondary':
        return colors.secondary;
      case 'tertiary':
      case 'accent':
        return colors.accent;
      case 'warning':
        return '#B45309';
      case 'error':
        return colors.error;
      case 'primary':
      default:
        return colors.primary;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: borderRadius.pill,
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: spacing.xs,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: typography.label.fontSize,
            fontWeight: typography.label.fontWeight,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
});