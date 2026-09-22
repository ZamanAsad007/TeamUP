import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { StateWrapper, ScreenState } from '../../components/StateWrapper';
import { workspaceService, WorkspaceOverview } from '../../services/workspaceService';

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
  const { colors, typography, spacing, borderRadius } = useTheme();
  const projectId = route?.params?.projectId || '';
  const initialTitle = route?.params?.projectTitle || 'Project Workspace';

  const [overview, setOverview] = useState<WorkspaceOverview | null>(null);
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverview = useCallback(() => {
    if (!projectId) {
      return;
    }

    workspaceService
      .getWorkspaceOverview(projectId)
      .then((data) => {
        setOverview(data);
        setScreenState('populated');
        setErrorMessage(undefined);
      })
      .catch((err: any) => {
        const msg = err?.message || 'Access denied or workspace unavailable';
        setErrorMessage(msg);
        setScreenState('error');
      });
  }, [projectId]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await workspaceService.getWorkspaceOverview(projectId);
      setOverview(data);
      setScreenState('populated');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to refresh workspace');
    } finally {
      setRefreshing(false);
    }
  };

  const projectTitle = overview?.project?.title || initialTitle;
  const isLeader = overview?.userRole === 'LEADER';
  const taskMetrics = overview?.metrics?.tasks || {
    todo: 0,
    inProgress: 0,
    testing: 0,
    done: 0,
    total: 0,
    highPriority: 0,
    assignedToMe: 0,
  };
  const chatMetrics = overview?.metrics?.chat || { totalMessages: 0 };
  const memberCount = overview?.members?.length || 0;

  return (
    <StateWrapper
      state={screenState}
      errorMessage={errorMessage}
      errorCode="WORKSPACE_ACCESS"
      onRetry={fetchOverview}
      emptyTitle="Workspace Not Found"
      emptySubtitle="This project workspace could not be located."
      emptyActionLabel="Back to Projects"
      onEmptyAction={() => navigation?.navigate('MainApp', { screen: 'Projects' })}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl * 2 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Bento Card */}
        <Card style={{ marginBottom: spacing.md }}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Text style={[typography.headlineMedium, { color: colors.onSurface }]} numberOfLines={2}>
                {projectTitle}
              </Text>
              <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.xs }]}>
                {overview?.project?.domain || 'Workspace'} • {overview?.project?.semester || 'Active'}
              </Text>
            </View>
            <Badge
              label={isLeader ? 'Leader' : 'Member'}
              variant={isLeader ? 'primary' : 'secondary'}
            />
          </View>
        </Card>

        {/* Section: Kanban Board */}
        <Card style={{ marginBottom: spacing.md }}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]}>Kanban Board</Text>
            <Badge label={`${taskMetrics.total} Tasks`} variant="tertiary" />
          </View>

          <View style={[styles.taskBreakdownRow, { marginVertical: spacing.md }]}>
            <View style={[styles.metricPill, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}>
              <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant }]}>TODO</Text>
              <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '700' }]}>
                {taskMetrics.todo}
              </Text>
            </View>
            <View style={[styles.metricPill, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}>
              <Text style={[typography.labelMedium, { color: colors.primary }]}>IN PROGRESS</Text>
              <Text style={[typography.titleMedium, { color: colors.primary, fontWeight: '700' }]}>
                {taskMetrics.inProgress}
              </Text>
            </View>
            <View style={[styles.metricPill, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}>
              <Text style={[typography.labelMedium, { color: colors.secondary }]}>TESTING</Text>
              <Text style={[typography.titleMedium, { color: colors.secondary, fontWeight: '700' }]}>
                {taskMetrics.testing}
              </Text>
            </View>
            <View style={[styles.metricPill, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}>
              <Text style={[typography.labelMedium, { color: colors.tertiary }]}>DONE</Text>
              <Text style={[typography.titleMedium, { color: colors.tertiary, fontWeight: '700' }]}>
                {taskMetrics.done}
              </Text>
            </View>
          </View>

          <Button
            title="Open Kanban Board"
            variant="primary"
            onPress={() =>
              navigation?.navigate('Kanban', {
                projectId,
                projectTitle,
              })
            }
          />
        </Card>

        {/* Section: Team Chat */}
        <Card style={{ marginBottom: spacing.md }}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]}>Team Chat</Text>
            <Badge label={`${chatMetrics.totalMessages} Messages`} variant="secondary" />
          </View>

          {chatMetrics.lastMessage ? (
            <View
              style={[
                styles.lastMessageBox,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.outlineVariant,
                  borderRadius: borderRadius.md,
                  padding: spacing.sm,
                  marginVertical: spacing.sm,
                },
              ]}
            >
              <Text style={[typography.labelMedium, { color: colors.primary, fontWeight: '600' }]}>
                {chatMetrics.lastMessage.sender?.profile?.fullName || chatMetrics.lastMessage.sender?.email || 'Teammate'}
              </Text>
              <Text style={[typography.bodyMedium, { color: colors.onSurface, marginTop: 2 }]} numberOfLines={2}>
                {chatMetrics.lastMessage.content}
              </Text>
            </View>
          ) : (
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginVertical: spacing.sm }]}>
              No messages exchanged yet. Start collaborating with your team!
            </Text>
          )}

          <Button
            title="Open Team Chat"
            variant="secondary"
            onPress={() =>
              navigation?.navigate('Chat', {
                projectId,
                projectTitle,
              })
            }
          />
        </Card>

        {/* Section: Team Members */}
        <Card style={{ marginBottom: spacing.md }}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]}>Project Members</Text>
            <Badge label={`${memberCount} Confirmed`} variant="tertiary" />
          </View>

          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginVertical: spacing.sm }]}>
            Collaborators currently assigned to this project workspace.
          </Text>

          <Button
            title="View & Manage Members"
            variant="outline"
            onPress={() =>
              navigation?.navigate('Members', {
                projectId,
                projectTitle,
              })
            }
          />
        </Card>
      </ScrollView>
    </StateWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  lastMessageBox: {
    borderWidth: 1,
  },
});
