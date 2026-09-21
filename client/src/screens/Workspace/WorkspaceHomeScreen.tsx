import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export interface WorkspaceHomeScreenProps {
  route?: {
    params?: {
      projectId: string;
      projectTitle?: string;
    };
  };
  navigation?: any;
}

export const WorkspaceHomeScreen: React.FC<WorkspaceHomeScreenProps> = ({ route, navigation }) => {
  const { colors, typography, spacing } = useTheme();
  const projectId = route?.params?.projectId || 'default-project';
  const projectTitle = route?.params?.projectTitle || 'Project Workspace';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: spacing.md }}>
      <Text style={[typography.headlineMedium, { color: colors.onBackground, marginBottom: spacing.sm }]}>
        {projectTitle}
      </Text>
      <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.lg }]}>
        Workspace Hub • ID: {projectId}
      </Text>

      <Card style={{ marginBottom: spacing.md }}>
        <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: spacing.xs }]}>
          Kanban Board
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.md }]}>
          Organize and track tasks across columns.
        </Text>
        <Button
          title="Open Kanban Board"
          variant="primary"
          onPress={() => navigation?.navigate('Kanban', { projectId, projectTitle })}
        />
      </Card>

      <Card style={{ marginBottom: spacing.md }}>
        <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: spacing.xs }]}>
          Team Chat
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.md }]}>
          Real-time messaging with your teammates.
        </Text>
        <Button
          title="Open Team Chat"
          variant="secondary"
          onPress={() => navigation?.navigate('Chat', { projectId, projectTitle })}
        />
      </Card>

      <Card style={{ marginBottom: spacing.md }}>
        <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: spacing.xs }]}>
          Project Members
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.md }]}>
          View and manage team collaborators.
        </Text>
        <Button
          title="View Members"
          variant="outline"
          onPress={() => navigation?.navigate('Members', { projectId, projectTitle })}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
