import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Chip } from '../../components/Chip';
import { Button } from '../../components/Button';
import { StateWrapper, ScreenState } from '../../components/StateWrapper';
import { projectService, Project } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';

export interface ProjectDetailScreenProps {
  route?: {
    params?: {
      projectId: string;
    };
  };
  navigation?: any;
}

export const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({ route, navigation }) => {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { user } = useAuth();
  const projectId = route?.params?.projectId;

  const [project, setProject] = useState<Project | null>(null);
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isJoining, setIsJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState<string | null>(null);

  const fetchProjectDetails = useCallback(() => {
    if (!projectId) {
      return;
    }

    projectService
      .getProjectById(projectId)
      .then((data) => {
        if (!data) {
          setScreenState('empty');
        } else {
          setProject(data);
          setScreenState('populated');
        }
        setErrorMessage(undefined);
      })
      .catch((err: any) => {
        setErrorMessage(err?.message || 'Failed to load project details');
        setScreenState('error');
      });
  }, [projectId]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const isCreator = user?.id === project?.creatorId;
  const membership = project?.members?.find((m) => m.userId === user?.id);
  const isMember = membership?.status === 'ACCEPTED' || isCreator;
  const isPending = membership?.status === 'PENDING' || joinStatus === 'PENDING';

  const handleJoinProject = async () => {
    if (!project) return;
    setIsJoining(true);
    try {
      await projectService.joinProject(project.id);
      setJoinStatus('PENDING');
      Alert.alert('Application Sent', 'Your request to join this project has been sent to the leader.');
      fetchProjectDetails();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not join project.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <StateWrapper
      state={screenState}
      errorMessage={errorMessage}
      onRetry={fetchProjectDetails}
      emptyTitle="Project Not Found"
      emptySubtitle="The requested project listing could not be found."
      emptyActionLabel="Back to Marketplace"
      onEmptyAction={() => navigation?.goBack()}
    >
      {project && (
        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl * 2 }}
        >
          {/* Header Card */}
          <Card style={{ marginBottom: spacing.md }}>
            <View style={styles.headerRow}>
              <Text style={[typography.headlineMedium, { color: colors.onSurface, flex: 1, marginRight: spacing.sm }]}>
                {project.title}
              </Text>
              <Badge
                label={project.status || 'OPEN'}
                variant={project.status === 'OPEN' ? 'secondary' : 'primary'}
              />
            </View>

            <View style={[styles.chipGroup, { marginTop: spacing.sm }]}>
              <Chip label={project.domain} style={{ marginRight: spacing.xs, marginBottom: spacing.xs }} />
              <Chip label={project.semester} style={{ marginRight: spacing.xs, marginBottom: spacing.xs }} />
              <Badge
                label={`${project.members?.length || 1}/${project.maxMembers || 4} Members`}
                variant="tertiary"
              />
            </View>
          </Card>

          {/* Description Bento Card */}
          <Card style={{ marginBottom: spacing.md }}>
            <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: spacing.xs }]}>
              About the Project
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, lineHeight: 22 }]}>
              {project.description}
            </Text>
          </Card>

          {/* Required Skills Card */}
          <Card style={{ marginBottom: spacing.md }}>
            <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: spacing.sm }]}>
              Required Skills
            </Text>
            {project.requiredSkills && project.requiredSkills.length > 0 ? (
              <View style={styles.skillsContainer}>
                {project.requiredSkills.map((item, idx) => {
                  const skillName = item.skill?.name || item.skillName || 'Skill';
                  const exp = item.minimumExperience || 'BEGINNER';
                  return (
                    <View
                      key={item.id || idx.toString()}
                      style={[
                        styles.skillBadgeBox,
                        {
                          backgroundColor: colors.surfaceVariant,
                          borderColor: colors.outlineVariant,
                          borderRadius: borderRadius.md,
                          padding: spacing.sm,
                          marginRight: spacing.sm,
                          marginBottom: spacing.sm,
                        },
                      ]}
                    >
                      <Text style={[typography.bodyMedium, { color: colors.onSurface, fontWeight: '600' }]}>
                        {skillName}
                      </Text>
                      <Badge
                        label={exp}
                        variant={exp === 'ADVANCED' ? 'primary' : exp === 'INTERMEDIATE' ? 'secondary' : 'tertiary'}
                      />
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
                No specific skill requirements specified.
              </Text>
            )}
          </Card>

          {/* Team / Creator Card */}
          <Card style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: spacing.sm }]}>
              Team & Creator
            </Text>
            {project.creator && (
              <View style={[styles.creatorRow, { marginBottom: spacing.sm }]}>
                <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
                  Project Leader:{' '}
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>
                    {project.creator.profile?.fullName || project.creator.email}
                  </Text>
                </Text>
              </View>
            )}
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
              Total Confirmed Members: {project.members?.length || 1}
            </Text>
          </Card>

          {/* Action CTAs */}
          <View style={styles.actionsContainer}>
            {isMember ? (
              <Button
                title="Enter Workspace"
                variant="primary"
                onPress={() =>
                  navigation?.navigate('Workspace', {
                    projectId: project.id,
                    projectTitle: project.title,
                  })
                }
              />
            ) : isPending ? (
              <Button
                title="Application Pending"
                variant="outline"
                disabled
                onPress={() => {}}
              />
            ) : (
              <Button
                title={isJoining ? 'Submitting...' : 'Apply to Join Project'}
                variant="primary"
                loading={isJoining}
                disabled={isJoining}
                onPress={handleJoinProject}
              />
            )}
          </View>
        </ScrollView>
      )}
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
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadgeBox: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsContainer: {
    marginTop: 8,
  },
});
