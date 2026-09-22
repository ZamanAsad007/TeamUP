import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'primary' | 'secondary' | 'tertiary';
  testID?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  style,
  textStyle,
  variant = 'primary',
  testID,
}) => {
  const { colors, typography, borderRadius, spacing } = useTheme();

  const getBackgroundColor = () => {
    if (selected) {
      switch (variant) {
        case 'secondary':
          return colors.secondarySoft;
        case 'tertiary':
          return colors.tertiaryContainer;
        case 'primary':
        default:
          return colors.primarySoft;
      }
    }
    return colors.surfaceMuted;
  };

  const getTextColor = () => {
    if (selected) {
      switch (variant) {
        case 'secondary':
          return colors.secondary;
        case 'tertiary':
          return colors.accent;
        case 'primary':
        default:
          return colors.primary;
      }
    }
    return colors.textMuted;
  };

  const getBorderColor = () => {
    if (selected) {
      switch (variant) {
        case 'secondary':
          return colors.secondary;
        case 'tertiary':
          return colors.accent;
        case 'primary':
        default:
          return colors.primary;
      }
    }
    return colors.border;
  };

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      disabled={!onPress}
      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
      style={[
        styles.chip,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderRadius: borderRadius.pill,
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.xs + 3,
          minHeight: 36,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: typography.bodySmall.fontSize,
            fontWeight: selected ? '600' : '400',
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginBottom: 6,
  },
  text: {
    textAlign: 'center',
  },
});
