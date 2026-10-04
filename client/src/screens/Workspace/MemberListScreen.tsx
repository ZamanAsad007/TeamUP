import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { StateWrapper, ScreenState } from '../../components/StateWrapper';
import { WorkspaceTabBar } from '../../components/WorkspaceTabBar';
import { workspaceService } from '../../services/workspaceService';
import { ProjectMember } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';

export interface MemberListScreenProps {
  route?: {
    params?: {
      projectId: string;
      projectTitle?: string;
      isLeader?: boolean;
    };
  };
  navigation?: any;
}

export const MemberListScreen: React.FC<MemberListScreenProps> = ({ route, navigation }) => {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { user } = useAuth();
  const projectId = route?.params?.projectId || '';
  const projectTitle = route?.params?.projectTitle || 'Team Members';

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  const fetchMembers = useCallback(() => {
    if (!projectId) return;

    workspaceService
      .getProjectMembers(projectId)
      .then((data) => {
        setMembers(data || []);
        setScreenState(data.length === 0 ? 'empty' : 'populated');
        setErrorMessage(undefined);
      })
      .catch((err: any) => {
        setErrorMessage(err?.message || 'Failed to load project members');
        setScreenState('error');
      });
  }, [projectId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await workspaceService.getProjectMembers(projectId);
      setMembers(data || []);
      setScreenState(data.length === 0 ? 'empty' : 'populated');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to refresh members');
    } finally {
      setRefreshing(false);
    }
  };

  const currentUserId = user?.userId || user?.id;
  const currentMember = members.find(
    (m) =>
      (currentUserId && m.userId === currentUserId) ||
      (user?.email && m.user?.email && m.user.email.toLowerCase() === user.email.toLowerCase())
  );
  const isLeader =
    Boolean(route?.params?.isLeader) ||
    currentMember?.role === 'LEADER' ||
    members.some(
      (m) =>
        m.role === 'LEADER' &&
        ((currentUserId && m.userId === currentUserId) ||
          (user?.email && m.user?.email && m.user.email.toLowerCase() === user.email.toLowerCase()))
    );

  // Separate Accepted Members from Pending Applications
  const acceptedMembers = useMemo(() => members.filter((m) => m.status === 'ACCEPTED'), [members]);
  const pendingMembers = useMemo(() => members.filter((m) => m.status === 'PENDING'), [members]);
  const otherMembers = useMemo(() => members.filter((m) => m.status !== 'ACCEPTED' && m.status !== 'PENDING'), [members]);

  const handleUpdateStatus = async (memberId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await workspaceService.updateMember(projectId, memberId, { status });
      await fetchMembers();
      if (Platform.OS === 'web') {
        console.log(`Member ${status.toLowerCase()} successfully`);
      } else {
        Alert.alert('Success', `Member ${status.toLowerCase()} successfully`);
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(err?.message || 'Failed to update member status');
      } else {
        Alert.alert('Error', err?.message || 'Failed to update member status');
      }
    }
  };

  const handleKickMember = (memberId: string, memberName: string) => {
    const confirmAction = async () => {
      try {
        await workspaceService.kickMember(projectId, memberId);
        await fetchMembers();
        if (Platform.OS !== 'web') {
          Alert.alert('Success', `${memberName} has been removed from the project`);
        }
      } catch (err: any) {
        if (Platform.OS === 'web') {
          window.alert(err?.message || 'Failed to remove member');
        } else {
          Alert.alert('Error', err?.message || 'Failed to remove member');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to kick ${memberName} from this project? They will lose access to the workspace.`)) {
        confirmAction();
      }
    } else {
      Alert.alert(
        'Kick Member',
        `Are you sure you want to kick ${memberName} from this project? They will lose access to the workspace.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Kick Member', style: 'destructive', onPress: confirmAction },
        ]
      );
    }
  };

  const handleLeaveProject = () => {
    const confirmLeave = async () => {
      try {
        await workspaceService.leaveProject(projectId, currentMember?.id);
        if (Platform.OS !== 'web') {
          Alert.alert('Success', 'You have left the project workspace');
        }
        navigation?.navigate('MainApp', { screen: 'Projects' });
      } catch (err: any) {
        if (Platform.OS === 'web') {
          window.alert(err?.message || 'Failed to leave project');
        } else {
          Alert.alert('Error', err?.message || 'Failed to leave project');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to leave this project? You will lose access to the workspace, tasks, and project chat.')) {
        confirmLeave();
      }
    } else {
      Alert.alert(
        'Leave Project',
        'Are you sure you want to leave this project? You will lose access to the workspace, tasks, and project chat.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Leave Project', style: 'destructive', onPress: confirmLeave },
        ]
      );
    }
  };

  const handleViewProfile = (member: ProjectMember) => {
    const targetUserId = member.userId || member.user?.id;
    if (!targetUserId) return;
    const memberName = member.user?.profile?.fullName || member.user?.email || 'Member Profile';
    navigation?.navigate('UserProfile', {
      userId: targetUserId,
      userName: memberName,
      projectId,
    });
  };

  const renderMemberCard = (item: ProjectMember) => {
    const displayName = item.user?.profile?.fullName || item.user?.email || 'Team Member';
    const email = item.user?.email || '';
    const department = item.user?.profile?.department || 'Department N/A';
    const isSelf =
      (currentUserId && item.userId === currentUserId) ||
      (user?.email && item.user?.email && item.user.email.toLowerCase() === user.email.toLowerCase());
    const targetUserId = item.userId || item.user?.id;

    return (
      <Card key={item.id} style={[styles.memberCard, { marginBottom: spacing.sm }]}>
        <View style={styles.cardTopRow}>
          <TouchableOpacity
            disabled={!targetUserId}
            onPress={() => handleViewProfile(item)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`View ${displayName}'s profile`}
            style={[
              styles.memberAvatar,
              {
                backgroundColor: item.role === 'LEADER' ? colors.primarySoft : colors.secondarySoft,
                borderColor: item.role === 'LEADER' ? colors.primary : colors.secondary,
              },
            ]}
          >
            <Text
              style={{
                color: item.role === 'LEADER' ? colors.primary : colors.secondary,
                fontWeight: '700',
                fontSize: 16,
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 12, marginRight: spacing.sm }}>
            <TouchableOpacity
              disabled={!targetUserId}
              onPress={() => handleViewProfile(item)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`View ${displayName}'s profile`}
            >
              <Text style={[typography.h3, { color: colors.text }]}>
                {displayName} {isSelf && '(You)'}
              </Text>
            </TouchableOpacity>
            <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 2 }]}>
              {email} | {department}
            </Text>
            {targetUserId && (
              <TouchableOpacity
                onPress={() => handleViewProfile(item)}
                style={{ marginTop: 4, alignSelf: 'flex-start' }}
                accessibilityRole="link"
                accessibilityLabel="View Profile"
              >
                <Text
                  style={[
                    typography.bodySmall,
                    {
                      color: colors.primary,
                      fontWeight: '600',
                      textDecorationLine: 'underline',
                    },
                  ]}
                >
                  View Profile →
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.badgesCol}>
            <Badge
              label={item.role}
              variant={item.role === 'LEADER' ? 'primary' : 'secondary'}
            />
            <View style={{ marginTop: 4 }}>
              <Badge
                label={item.status}
                variant={
                  item.status === 'ACCEPTED'
                    ? 'secondary'
                    : item.status === 'PENDING'
                    ? 'tertiary'
                    : 'error'
                }
              />
            </View>
          </View>
        </View>

        {isLeader && !isSelf && (
          <View style={[styles.actionsRow, { marginTop: spacing.md }]}>
            {item.status === 'PENDING' && (
              <>
                <Button
                  title="View Profile"
                  variant="outline"
                  onPress={() => handleViewProfile(item)}
                  size="sm"
                  style={{ marginRight: spacing.sm }}
                />
                <Button
                  title="Accept"
                  variant="primary"
                  onPress={() => handleUpdateStatus(item.id, 'ACCEPTED')}
                  size="sm"
                  style={{ marginRight: spacing.sm }}
                />
                <Button
                  title="Reject"
                  variant="outline"
                  onPress={() => handleUpdateStatus(item.id, 'REJECTED')}
                  size="sm"
                  style={{ marginRight: spacing.sm }}
                />
              </>
            )}
            {item.status === 'ACCEPTED' && (
              <>
                <Button
                  title="View Profile"
                  variant="outline"
                  onPress={() => handleViewProfile(item)}
                  size="sm"
                  style={{ marginRight: spacing.sm }}
                />
                <Button
                  title="Kick Member"
                  variant="outline"
                  onPress={() => handleKickMember(item.id, displayName)}
                  size="sm"
                  style={{ borderColor: colors.accent }}
                />
              </>
            )}
          </View>
        )}

        {isSelf && item.status === 'ACCEPTED' && (
          <View style={[styles.actionsRow, { marginTop: spacing.md }]}>
            <Button
              title="Leave Project"
              variant="outline"
              onPress={handleLeaveProject}
              size="sm"
              style={{ borderColor: colors.accent }}
            />
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Team Members"
        subtitle={`${members.length} total | ${projectTitle}`}
        showBack={Boolean(navigation?.canGoBack && navigation.canGoBack())}
        onBack={() => navigation?.goBack?.()}
      />

      <WorkspaceTabBar
        activeTab="Team"
        projectId={projectId}
        projectTitle={projectTitle}
        navigation={navigation}
        isLeader={Boolean(isLeader)}
      />

      <StateWrapper
        state={screenState}
        errorMessage={errorMessage}
        onRetry={fetchMembers}
        emptyTitle="No Members Found"
        emptySubtitle="No collaborators are currently part of this project."
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 60 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Pending Applications Section (If any) */}
          {pendingMembers.length > 0 && (
            <View style={{ marginBottom: spacing.md }}>
              <Text
                style={[
                  styles.sectionHeading,
                  { color: colors.accent, fontSize: typography.label.fontSize },
                ]}
              >
                PENDING APPLICATIONS ({pendingMembers.length})
              </Text>
              {pendingMembers.map(renderMemberCard)}
            </View>
          )}

          {/* Confirmed Members Section */}
          <View>
            <Text
              style={[
                styles.sectionHeading,
                { color: colors.textMuted, fontSize: typography.label.fontSize },
              ]}
            >
              MEMBERS ({acceptedMembers.length})
            </Text>
            {acceptedMembers.map(renderMemberCard)}
          </View>

          {/* Other/Rejected Members if any */}
          {otherMembers.length > 0 && (
            <View style={{ marginTop: spacing.md }}>
              <Text
                style={[
                  styles.sectionHeading,
                  { color: colors.textMuted, fontSize: typography.label.fontSize },
                ]}
              >
                PREVIOUS ({otherMembers.length})
              </Text>
              {otherMembers.map(renderMemberCard)}
            </View>
          )}

          {/* Danger Zone: Leave Project */}
          {currentMember?.status === 'ACCEPTED' && (
            <Card style={[styles.dangerCard, { marginTop: spacing.xl, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={[typography.h3, { color: colors.accent, marginBottom: 4 }]}>
                Leave Project
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textMuted, marginBottom: spacing.md }]}>
                If you leave this project, you will forfeit access to team tasks, calendar events, shared files, and chats.
              </Text>
              <Button
                title="Leave Project"
                variant="outline"
                onPress={handleLeaveProject}
                style={{ borderColor: colors.accent }}
              />
            </Card>
          )}
        </ScrollView>
      </StateWrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeading: {
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  memberCard: {
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesCol: {
    alignItems: 'flex-end',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  dangerCard: {
    padding: 16,
  },
});
