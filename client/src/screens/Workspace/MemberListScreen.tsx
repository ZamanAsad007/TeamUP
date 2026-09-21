import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface MemberListScreenProps {
  route?: {
    params?: {
      projectId: string;
      projectTitle?: string;
    };
  };
}

export const MemberListScreen: React.FC<MemberListScreenProps> = ({ route }) => {
  const { colors, typography, spacing } = useTheme();
  const projectId = route?.params?.projectId || 'default-project';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.md }]}>
      <Text style={[typography.headlineMedium, { color: colors.onBackground }]}>Team Members</Text>
      <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>Project ID: {projectId}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
