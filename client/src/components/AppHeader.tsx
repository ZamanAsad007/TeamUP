import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeInsets } from '../utils/useSafeInsets';
import { useTheme } from '../theme/ThemeContext';

export interface HeaderAction {
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
  badgeCount?: number;
}

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: HeaderAction[];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  actions = [],
  style,
  children,
}) => {
  const insets = useSafeInsets();
  const { colors, typography, spacing } = useTheme();

  const topPadding = Platform.OS === 'android' ? Math.max(insets.top, StatusBar.currentHeight || 0) : insets.top;

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          paddingTop: topPadding + spacing.xs,
        },
        style,
      ]}
    >
      <View style={[styles.container, { paddingHorizontal: spacing.screenPadding }]}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                styles.iconButton,
                {
                  backgroundColor: colors.surfaceMuted,
                  marginRight: spacing.sm,
                },
              ]}
            >
              <Text style={{ fontSize: 18, color: colors.text }}>←</Text>
            </TouchableOpacity>
          )}

          <View style={styles.titleContainer}>
            <Text
              numberOfLines={1}
              style={[
                styles.title,
                {
                  color: colors.text,
                  fontSize: typography.h2.fontSize,
                  fontWeight: typography.h2.fontWeight,
                  lineHeight: typography.h2.lineHeight,
                },
              ]}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                numberOfLines={1}
                style={[
                  styles.subtitle,
                  {
                    color: colors.textMuted,
                    fontSize: typography.bodySmall.fontSize,
                  },
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {actions.length > 0 && (
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                testID={action.testID}
                accessibilityRole="button"
                accessibilityLabel={action.accessibilityLabel}
                onPress={action.onPress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: colors.surfaceMuted,
                    marginLeft: spacing.xs + 2,
                  },
                ]}
              >
                {action.icon}
                {action.badgeCount && action.badgeCount > 0 ? (
                  <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                    <Text style={styles.badgeText}>
                      {action.badgeCount > 9 ? '9+' : action.badgeCount}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    zIndex: 10,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingBottom: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
