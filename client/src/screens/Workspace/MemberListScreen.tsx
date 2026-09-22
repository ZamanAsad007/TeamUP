import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
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

export const MemberListScreen: React.FC<MemberListScreenProps> = ({ route }) => {
  const { colors, typography, spacing } = useTheme();
  const { user } = useAuth();
  const projectId = route?.params?.projectId || '';

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

  // Check if current user is LEADER
  const currentMember = members.find((m) => m.userId === user?.id);
  const isLeader = currentMember?.role === 'LEADER';

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

  const renderMemberItem = ({ item }: { item: ProjectMember }) => {
    const displayName = item.user?.profile?.fullName || item.user?.email || 'Team Member';
    const email = item.user?.email || '';
    const department = item.user?.profile?.department || 'Department N/A';
    const isSelf = item.userId === user?.id;

    return (
      <Card style={[styles.memberCard, { marginBottom: spacing.md }]}>
        <View style={styles.cardTopRow}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
              {displayName} {isSelf && '(You)'}
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
              {email} • {department}
            </Text>
          </View>
          <View style={styles.badgesCol}>
            <Badge
              label={item.role}
              variant={item.role === 'LEADER' ? 'primary' : 'secondary'}
            />
            <View style={{ marginTop: spacing.xs }}>
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
                  style={{ marginRight: spacing.sm }}
                />
                <Button
                  title="Reject"
                  variant="outline"
                  onPress={() => handleUpdateStatus(item.id, 'REJECTED')}
                  style={{ marginRight: spacing.sm }}
                />
              </>
            )}
            {item.status === 'ACCEPTED' && (
              <Button
                title="Remove"
                variant="outline"
                onPress={() => handleRemoveMember(item.id, displayName)}
              />
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StateWrapper
        state={screenState}
        errorMessage={errorMessage}
        onRetry={fetchMembers}
        emptyTitle="No Members Found"
        emptySubtitle="No collaborators are currently part of this project."
      >
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderMemberItem}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      </StateWrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  memberCard: {},
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgesCol: {
    alignItems: 'flex-end',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
