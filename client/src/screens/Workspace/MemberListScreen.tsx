import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { StateWrapper, ScreenState } from '../../components/StateWrapper';
import { workspaceService } from '../../services/workspaceService';
import { ProjectMember } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';

export interface MemberListScreenProps {
  route?: {
    params?: {
      projectId: string;
      projectTitle?: string;
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

  const currentMember = members.find((m) => m.userId === user?.id);
  const isLeader = currentMember?.role === 'LEADER';

  // Separate Accepted Members from Pending Applications
  const acceptedMembers = useMemo(() => members.filter((m) => m.status === 'ACCEPTED'), [members]);
  const pendingMembers = useMemo(() => members.filter((m) => m.status === 'PENDING'), [members]);
  const otherMembers = useMemo(() => members.filter((m) => m.status !== 'ACCEPTED' && m.status !== 'PENDING'), [members]);

  const handleUpdateStatus = async (memberId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await workspaceService.updateMember(projectId, memberId, { status });
      Alert.alert('Success', `Member ${status.toLowerCase()} successfully`);
      fetchMembers();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update member status');
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this project?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await workspaceService.removeMember(projectId, memberId);
              Alert.alert('Success', 'Member removed');
              fetchMembers();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const renderMemberCard = (item: ProjectMember) => {
    const displayName = item.user?.profile?.fullName || item.user?.email || 'Team Member';
    const email = item.user?.email || '';
    const department = item.user?.profile?.department || 'Department N/A';
    const isSelf = item.userId === user?.id;

    return (
      <Card key={item.id} style={[styles.memberCard, { marginBottom: spacing.sm }]}>
        <View style={styles.cardTopRow}>
          <View
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
          </View>

          <View style={{ flex: 1, marginLeft: 12, marginRight: spacing.sm }}>
            <Text style={[typography.h3, { color: colors.text }]}>
              {displayName} {isSelf && '(You)'}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 2 }]}>
              {email} • {department}
            </Text>
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
              <Button
                title="Remove"
                variant="outline"
                onPress={() => handleRemoveMember(item.id, displayName)}
                size="sm"
              />
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Team Members"
        subtitle={`${members.length} total • ${projectTitle}`}
        showBack={Boolean(navigation?.canGoBack && navigation.canGoBack())}
        onBack={() => navigation?.goBack?.()}
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
  },
});
