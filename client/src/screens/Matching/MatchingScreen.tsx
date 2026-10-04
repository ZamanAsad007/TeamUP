import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { useSafeInsets } from '../../utils/useSafeInsets';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Chip } from '../../components/Chip';
import { Button } from '../../components/Button';
import { StateWrapper, ScreenState } from '../../components/StateWrapper';
import { api } from '../../api/client';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { projectService, Project } from '../../services/projectService';

export interface MatchingCandidate {
  id: string;
  userId?: string;
  fullName: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  department?: string;
  semester?: string;
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  matchScore: number; // raw float (0.95) or integer percentage (95)
  matchingSkills?: string[];
  skills?: Array<{ id?: string; skillName: string }>;
  githubUsername?: string;
  contributionsThisYear?: number;
  publicRepos?: number;
  invited?: boolean;
}

export type InvitationStatus = 'idle' | 'inviting' | 'invited' | 'error';

const POPULAR_SKILLS = [
  'React Native',
  'TypeScript',
  'Node.js',
  'Python',
  'PostgreSQL',
  'Figma',
  'UI/UX',
  'Flutter',
  'Docker',
];

export const MatchingScreen: React.FC<{ navigation?: any; route?: any }> = ({
  navigation: propNavigation,
  route: propRoute,
}) => {
  const { colors, typography, spacing } = useTheme();
  let navigationHook: any;
  try {
    navigationHook = useNavigation();
  } catch {
    // Graceful fallback for non-navigation contexts
  }
  const navigation = propNavigation || navigationHook;

  let routeHook: any;
  try {
    routeHook = useRoute();
  } catch {
    // Graceful fallback for non-navigation contexts
  }
  const route = propRoute || routeHook;

  const { user } = useAuth();
  const [leadingProjects, setLeadingProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState<boolean>(false);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);

  const initialTarget = route?.params?.projectId || 'project-1';
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTarget, setActiveTarget] = useState<string>(initialTarget);
  const [candidates, setCandidates] = useState<MatchingCandidate[]>([]);
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Optimistic invitation state tracking by target user ID
  const [inviteStatuses, setInviteStatuses] = useState<Record<string, InvitationStatus>>({});
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});

  const loadRecommendations = useCallback(async (target: string) => {
    const trimmedTarget = target.trim();
    if (!trimmedTarget) return;

    setScreenState('loading');
    setErrorMessage('');
    setErrorCode(undefined);

    try {
      const data = await api.get<MatchingCandidate[]>(
        `/projects/${encodeURIComponent(trimmedTarget)}/recommendations`
      );
      const candidateList = Array.isArray(data) ? data : [];
      setCandidates(candidateList);

      // Initialize invite status based on backend flag if present
      const initialStatuses: Record<string, InvitationStatus> = {};
      candidateList.forEach((candidate) => {
        const uid = candidate.userId || candidate.id;
        if (candidate.invited) {
          initialStatuses[uid] = 'invited';
        }
      });
      setInviteStatuses((prev) => ({ ...initialStatuses, ...prev }));

      setScreenState(candidateList.length === 0 ? 'empty' : 'populated');
    } catch (err: any) {
      const isForbidden =
        err?.code === 'FORBIDDEN' ||
        err?.status === 403 ||
        err?.statusCode === 403 ||
        (typeof err?.message === 'string' &&
          (err.message.toLowerCase().includes('owner') ||
            err.message.toLowerCase().includes('forbidden')));

      const isNotFound =
        err?.code === 'NOT_FOUND' ||
        err?.status === 404 ||
        err?.statusCode === 404 ||
        (typeof err?.message === 'string' &&
          err.message.toLowerCase().includes('not found'));

      if ((isForbidden || isNotFound) && (trimmedTarget.startsWith('project-') || selectedProject?.id === trimmedTarget)) {
        // Graceful automatic recovery: fall back to skill-based matching
        const fallbackSkill = 'React Native';
        setActiveTarget(fallbackSkill);
        setSearchQuery(fallbackSkill);
        setSelectedProject(null);
        try {
          const fallbackData = await api.get<MatchingCandidate[]>(
            `/projects/${encodeURIComponent(fallbackSkill)}/recommendations`
          );
          const candidateList = Array.isArray(fallbackData) ? fallbackData : [];
          setCandidates(candidateList);
          setScreenState(candidateList.length === 0 ? 'empty' : 'populated');
          return;
        } catch {
          // If fallback fails, fall through to error handling
        }
      }

      const msg = err?.message || 'Failed to fetch teammate recommendations.';
      const code = err?.code || (isForbidden ? 'FORBIDDEN' : undefined);
      setErrorMessage(msg);
      setErrorCode(code);
      setScreenState('error');
    }
  }, [selectedProject?.id]);

  const fetchUserProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const data = await projectService.getMyProjects();
      if (Array.isArray(data)) {
        const currentUserId = user?.userId || user?.id;
        const leaderList = data.filter((p: Project) => {
          if (!currentUserId) return true;
          const isCreator = p.creatorId === currentUserId;
          const isLeaderMember = p.members?.some(
            (m) => m.userId === currentUserId && m.role === 'LEADER' && m.status === 'ACCEPTED'
          );
          return isCreator || isLeaderMember;
        });
        setLeadingProjects(leaderList);

        const routeProjectId = route?.params?.projectId;
        if (routeProjectId) {
          const match = leaderList.find((p) => p.id === routeProjectId);
          if (match) {
            setSelectedProject(match);
            setActiveTarget(match.id);
          } else {
            setActiveTarget(routeProjectId);
          }
        } else if (!selectedProject && leaderList.length > 0) {
          setSelectedProject(leaderList[0]);
          setActiveTarget(leaderList[0].id);
        }
      }
    } catch {
      // Graceful degradation when offline or unauthenticated
    } finally {
      setLoadingProjects(false);
    }
  }, [user, route?.params?.projectId, selectedProject]);

  useEffect(() => {
    const currentUserId = user?.userId || user?.id;
    if (currentUserId) {
      fetchUserProjects();
    }
  }, [user?.userId, user?.id, fetchUserProjects]);

  useEffect(() => {
    loadRecommendations(activeTarget);
  }, [activeTarget, loadRecommendations]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const currentUserId = user?.userId || user?.id;
      if (currentUserId) {
        await fetchUserProjects();
      }
      await loadRecommendations(activeTarget);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      setSelectedProject(null);
      setActiveTarget(trimmed);
    }
  };

  const handleSelectSkill = (skill: string) => {
    setSearchQuery(skill);
    setSelectedProject(null);
    setActiveTarget(skill);
  };

  const getInviteProjectId = useCallback((): string => {
    if (selectedProject?.id) return selectedProject.id;
    if (leadingProjects.length === 1) return leadingProjects[0].id;
    if (activeTarget && !POPULAR_SKILLS.includes(activeTarget) && activeTarget !== 'React Native') {
      return activeTarget;
    }
    return activeTarget.startsWith('project-')
      ? activeTarget
      : (leadingProjects[0]?.id || 'project-1');
  }, [selectedProject?.id, leadingProjects, activeTarget]);

  const handleInvite = async (candidate: MatchingCandidate) => {
    const targetUserId = candidate.userId || candidate.id;

    const inviteProjectId = getInviteProjectId();

    // If user has multiple leading projects and none is selected, prompt selection
    if (!selectedProject && leadingProjects.length > 1) {
      setIsProjectPickerOpen(true);
      Alert.alert(
        'Select Project',
        'Please select which project you would like to invite this candidate to.'
      );
      return;
    }

    // Optimistic update: set state to 'inviting' immediately
    setInviteStatuses((prev) => ({ ...prev, [targetUserId]: 'inviting' }));
    setInviteErrors((prev) => ({ ...prev, [targetUserId]: '' }));

    try {
      await api.post(`/projects/${inviteProjectId}/invite`, {
        userId: targetUserId,
        role: 'MEMBER',
      });

      // Successful invitation state
      setInviteStatuses((prev) => ({ ...prev, [targetUserId]: 'invited' }));
    } catch (err: any) {
      // Revert optimistic state to error with message
      const errorMsg = err?.message || 'Invitation failed.';
      setInviteStatuses((prev) => ({ ...prev, [targetUserId]: 'error' }));
      setInviteErrors((prev) => ({ ...prev, [targetUserId]: errorMsg }));
    }
  };

  const formatMatchScore = (score: number) => {
    const percentage = score <= 1 ? Math.round(score * 100) : Math.round(score);
    return `${percentage}% Match`;
  };

  const getScoreVariant = (score: number): 'primary' | 'secondary' | 'tertiary' => {
    const percentage = score <= 1 ? score * 100 : score;
    if (percentage >= 80) return 'primary';
    if (percentage >= 60) return 'secondary';
    return 'tertiary';
  };

  const insets = useSafeInsets();
  const topPadding = Platform.OS === 'android' ? Math.max(insets.top, StatusBar.currentHeight || 0) : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={{ padding: spacing.md, paddingTop: topPadding + spacing.sm }}>
          {/* Top Header & Project Selector */}
          <Card style={styles.headerCard}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  { color: colors.onSurface, fontSize: typography.headlineMedium.fontSize },
                ]}
              >
                Matching
              </Text>
              <Badge
                label={selectedProject ? 'Project Matching' : 'Skill Matching'}
                variant="primary"
              />
            </View>

            {/* Project Selector Row */}
            <View style={{ marginTop: spacing.sm }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <Text
                  style={[
                    styles.subtitle,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  Find teammates for:
                </Text>
                {selectedProject && (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedProject(null);
                      setActiveTarget('React Native');
                      setSearchQuery('React Native');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Switch to skill search"
                  >
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                      Switch to Skill Search
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Project Dropdown Button */}
              <TouchableOpacity
                style={[
                  styles.projectDropdownCard,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: selectedProject ? colors.primary : colors.outlineVariant,
                  },
                ]}
                onPress={() => setIsProjectPickerOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Select Project"
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <View style={styles.projectDropdownHeader}>
                    <Text style={{ fontSize: 18, marginRight: 8 }}>
                      {selectedProject ? '📁' : '🔍'}
                    </Text>
                    <Text
                      style={[
                        styles.projectDropdownTitle,
                        { color: colors.onSurface },
                      ]}
                      numberOfLines={1}
                    >
                      {selectedProject
                        ? selectedProject.title
                        : activeTarget.startsWith('project-')
                        ? `Project (${activeTarget})`
                        : `Skill: ${activeTarget}`}
                    </Text>
                    {selectedProject && (
                      <Badge label="Leader" variant="primary" style={{ marginLeft: 8 }} />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.projectDropdownSubtitle,
                      { color: colors.onSurfaceVariant, marginTop: 4 },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedProject
                      ? `${selectedProject.domain} • ${selectedProject._count?.members || selectedProject.members?.length || 1}/${selectedProject.maxMembers || 4} members • Tap to switch`
                      : leadingProjects.length > 0
                      ? `${leadingProjects.length} project${leadingProjects.length > 1 ? 's' : ''} led by you • Tap to choose project`
                      : 'Tap to select a project or search by skill'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.dropdownChevronCircle,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '700' }}>
                    ▼
                  </Text>
                </View>
              </TouchableOpacity>

              {leadingProjects.length === 0 && !loadingProjects && (
                <View
                  style={[
                    styles.noProjectsNotice,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
                  ]}
                >
                  <Text style={[styles.noProjectsNoticeText, { color: colors.onSurfaceVariant }]}>
                    💡 You haven't created a project yet. To invite members as a project leader, create a project first.
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation?.navigate('CreateProject')}
                    style={{ marginTop: 6 }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                      + Create Project Now →
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

          {/* Skill Search Bar */}
          <View style={[styles.projectInputRow, { marginTop: spacing.md }]}>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.onSurface,
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.outlineVariant,
                },
              ]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              placeholder="Enter skill name (e.g. React Native, TypeScript, Python)"
              placeholderTextColor={colors.onSurfaceVariant}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: colors.primary }]}
              onPress={handleSearch}
            >
              <Text style={[styles.searchButtonText, { color: colors.onPrimary }]}>
                Search
              </Text>
            </TouchableOpacity>
          </View>

          {/* Popular Skill Quick-Picks */}
          <View style={{ marginTop: spacing.sm }}>
            <Text
              style={[
                styles.quickPickLabel,
                { color: colors.onSurfaceVariant, marginBottom: 6 },
              ]}
            >
              Popular Skills:
            </Text>
            <View style={styles.chipRow}>
              {POPULAR_SKILLS.map((skill) => {
                const isSelected =
                  activeTarget.toLowerCase() === skill.toLowerCase() ||
                  searchQuery.toLowerCase() === skill.toLowerCase();
                return (
                  <Chip
                    key={skill}
                    label={`#${skill}`}
                    selected={isSelected}
                    variant={isSelected ? 'primary' : 'secondary'}
                    onPress={() => handleSelectSkill(skill)}
                    style={{ marginRight: 6, marginBottom: 6 }}
                  />
                );
              })}
            </View>
          </View>
        </Card>

        {/* Content Wrapper handling Loading / Populated / Empty / Error */}
        <StateWrapper
          state={screenState}
          emptyTitle="No Candidates Found"
          emptySubtitle={`We couldn't find candidates matching "${activeTarget}". Try searching for another skill like React Native, Python, or TypeScript.`}
          emptyActionLabel="Refresh Candidates"
          onEmptyAction={() => loadRecommendations(activeTarget)}
          errorMessage={
            errorCode === 'FORBIDDEN'
              ? 'Only the project owner can view recommendations for this project. Search by skill instead.'
              : errorMessage
          }
          errorCode={errorCode}
          onRetry={() => {
            if (errorCode === 'FORBIDDEN') {
              handleSelectSkill('React Native');
            } else {
              loadRecommendations(activeTarget);
            }
          }}
        >
          <View style={{ marginTop: spacing.md }}>
            <View style={styles.sectionHeaderRow}>
              <Text
                style={[
                  styles.sectionHeader,
                  { color: colors.onSurface, fontSize: typography.titleMedium.fontSize },
                ]}
              >
                Recommended ({candidates.length})
              </Text>
            </View>

            {candidates.map((candidate, index) => {
              const targetUserId = candidate.userId || candidate.id;
              const status: InvitationStatus = inviteStatuses[targetUserId] || 'idle';
              const inviteErr = inviteErrors[targetUserId];

              const skillsList = candidate.matchingSkills
                ? candidate.matchingSkills
                : candidate.skills
                ? candidate.skills.map((s) => s.skillName)
                : [];

              const rawPercent =
                candidate.matchScore <= 1
                  ? Math.round(candidate.matchScore * 100)
                  : Math.round(candidate.matchScore);
              const skillsScore = Math.min(100, Math.max(50, rawPercent));
              const availabilityScore = Math.min(100, Math.max(60, rawPercent - 12));
              const experienceScore =
                candidate.experienceLevel === 'ADVANCED'
                  ? 95
                  : candidate.experienceLevel === 'INTERMEDIATE'
                  ? 82
                  : 70;

              return (
                <Card
                  key={targetUserId}
                  style={[styles.candidateCard, { marginTop: spacing.md }]}
                >
                  {/* Candidate Header Row */}
                  <View style={styles.rankRow}>
                    <TouchableOpacity
                      style={styles.candidateHeader}
                      onPress={() => {
                        if (navigation) {
                          navigation.navigate('UserProfile', {
                            userId: targetUserId,
                            userName: candidate.fullName,
                            projectId: getInviteProjectId(),
                            invited: status === 'invited',
                          });
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`View ${candidate.fullName}'s profile`}
                    >
                      <View
                        style={[
                          styles.avatar,
                          { backgroundColor: colors.primaryContainer },
                        ]}
                      >
                        <Text
                          style={{
                            color: colors.onPrimaryContainer,
                            fontWeight: '700',
                            fontSize: 16,
                          }}
                        >
                          {candidate.fullName ? candidate.fullName.charAt(0).toUpperCase() : `#${index + 1}`}
                        </Text>
                      </View>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text
                          style={[
                            styles.candidateName,
                            {
                              color: colors.onSurface,
                              fontSize: typography.titleMedium.fontSize,
                            },
                          ]}
                        >
                          {candidate.fullName}
                        </Text>
                        <Text
                          style={[
                            styles.candidateRole,
                            { color: colors.onSurfaceVariant },
                          ]}
                        >
                          {candidate.department || candidate.experienceLevel || 'Software Developer'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Readable Match Score Badge */}
                    <Badge
                      label={formatMatchScore(candidate.matchScore)}
                      variant={getScoreVariant(candidate.matchScore)}
                    />
                  </View>

                  {/* Bio Description */}
                  {candidate.bio ? (
                    <Text
                      style={[
                        styles.candidateBio,
                        { color: colors.onSurface, marginTop: spacing.sm },
                      ]}
                    >
                      {candidate.bio}
                    </Text>
                  ) : null}

                  {/* Shared skills */}
                  {skillsList.length > 0 && (
                    <View style={{ marginTop: spacing.sm }}>
                      <Text
                        style={[
                          styles.breakdownHeader,
                          { color: colors.onSurfaceVariant },
                        ]}
                      >
                        Shared skills
                      </Text>
                      <View style={[styles.chipRow, { marginTop: 4 }]}>
                        {skillsList.map((skill) => (
                          <Chip
                            key={skill}
                            label={skill}
                            selected
                            variant="primary"
                            style={{ marginRight: 6, marginBottom: 4 }}
                          />
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Explained Match Breakdown: Skills, Availability, Experience */}
                  <View style={[styles.breakdownBox, { backgroundColor: colors.surfaceVariant, marginTop: spacing.sm }]}>
                    <Text style={[styles.breakdownHeader, { color: colors.onSurfaceVariant, marginBottom: 6 }]}>
                      Strong matches
                    </Text>

                    <View style={styles.metricRow}>
                      <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Skills</Text>
                      <View style={[styles.barTrack, { backgroundColor: colors.outlineVariant }]}>
                        <View style={[styles.barFill, { width: `${skillsScore}%`, backgroundColor: colors.primary }]} />
                      </View>
                      <Text style={[styles.metricValue, { color: colors.onSurface }]}>{skillsScore}%</Text>
                    </View>

                    <View style={styles.metricRow}>
                      <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Availability</Text>
                      <View style={[styles.barTrack, { backgroundColor: colors.outlineVariant }]}>
                        <View style={[styles.barFill, { width: `${availabilityScore}%`, backgroundColor: colors.secondary }]} />
                      </View>
                      <Text style={[styles.metricValue, { color: colors.onSurface }]}>{availabilityScore}%</Text>
                    </View>

                    <View style={styles.metricRow}>
                      <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Experience</Text>
                      <View style={[styles.barTrack, { backgroundColor: colors.outlineVariant }]}>
                        <View style={[styles.barFill, { width: `${experienceScore}%`, backgroundColor: colors.tertiary }]} />
                      </View>
                      <Text style={[styles.metricValue, { color: colors.onSurface }]}>{experienceScore}%</Text>
                    </View>
                  </View>

                  {/* GitHub Profile Stat Summary */}
                  {candidate.githubUsername ? (
                    <View
                      style={[
                        styles.githubSummaryRow,
                        {
                          backgroundColor: colors.surfaceVariant,
                          marginTop: spacing.sm,
                        },
                      ]}
                    >
                      <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>
                        @{candidate.githubUsername}
                        {candidate.publicRepos !== undefined
                          ? ` • ${candidate.publicRepos} repos`
                          : ''}
                        {candidate.contributionsThisYear !== undefined
                          ? ` • ${candidate.contributionsThisYear} commits`
                          : ''}
                      </Text>
                    </View>
                  ) : null}

                  {/* Invitation Failure Error Banner */}
                  {status === 'error' && inviteErr ? (
                    <Text
                      style={[
                        styles.inviteErrorText,
                        { color: colors.error, marginTop: spacing.xs },
                      ]}
                    >
                      {inviteErr}
                    </Text>
                  ) : null}

                  {/* Invite Action Button */}
                  <View style={{ marginTop: spacing.md }}>
                    {status === 'invited' ? (
                      <Button
                        title="Invited ✓"
                        variant="secondary"
                        onPress={() => {}}
                        disabled
                      />
                    ) : (
                      <Button
                        title={
                          status === 'inviting'
                            ? 'Sending Invite...'
                            : status === 'error'
                            ? 'Retry Invitation'
                            : 'Invite to Team'
                        }
                        onPress={() => handleInvite(candidate)}
                        variant={status === 'error' ? 'tertiary' : 'primary'}
                        loading={status === 'inviting'}
                        disabled={status === 'inviting'}
                      />
                    )}

                    <Button
                      title="View Profile"
                      variant="outline"
                      onPress={() => {
                        if (navigation) {
                          navigation.navigate('UserProfile', {
                            userId: targetUserId,
                            userName: candidate.fullName,
                            projectId: getInviteProjectId(),
                            invited: status === 'invited',
                          });
                        }
                      }}
                      style={{ marginTop: 8 }}
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        </StateWrapper>
      </View>
    </ScrollView>

    {/* Project Selector Modal Sheet */}
    <Modal
      visible={isProjectPickerOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setIsProjectPickerOpen(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: colors.surface,
              padding: spacing.lg,
            },
          ]}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.modalHeaderRow}>
            <Text
              style={[
                styles.modalTitle,
                { color: colors.onSurface, fontSize: typography.headlineMedium.fontSize },
              ]}
            >
              Choose Project
            </Text>
            <TouchableOpacity
              onPress={() => setIsProjectPickerOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close project picker"
            >
              <Text style={{ fontSize: 20, color: colors.onSurfaceVariant, fontWeight: '600' }}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[
              styles.modalSubtitle,
              { color: colors.onSurfaceVariant, marginTop: 4, marginBottom: spacing.md },
            ]}
          >
            Select a project you lead to get matched candidates and recruit teammates:
          </Text>

          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {leadingProjects.map((proj) => {
              const isSelected = selectedProject?.id === proj.id;
              const memberCount = proj._count?.members ?? (proj.members?.length || 1);
              return (
                <TouchableOpacity
                  key={proj.id}
                  style={[
                    styles.modalProjectCard,
                    {
                      backgroundColor: isSelected ? colors.primaryContainer : colors.surfaceVariant,
                      borderColor: isSelected ? colors.primary : colors.outlineVariant,
                    },
                  ]}
                  onPress={() => {
                    setSelectedProject(proj);
                    setActiveTarget(proj.id);
                    setIsProjectPickerOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${proj.title}`}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text
                        style={[
                          styles.modalProjectCardTitle,
                          {
                            color: isSelected ? colors.onPrimaryContainer : colors.onSurface,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {proj.title}
                      </Text>
                      {isSelected && (
                        <Badge label="Selected" variant="primary" style={{ marginLeft: 8 }} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.modalProjectCardMeta,
                        { color: isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant },
                      ]}
                    >
                      {proj.domain} • {memberCount}/{proj.maxMembers || 4} members
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: isSelected ? colors.primary : colors.outlineVariant,
                    }}
                  >
                    {isSelected ? '✓' : '○'}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {leadingProjects.length === 0 && (
              <View style={{ padding: spacing.lg, alignItems: 'center' }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📁</Text>
                <Text style={[styles.emptyModalTitle, { color: colors.onSurface }]}>
                  No Leading Projects Found
                </Text>
                <Text
                  style={[
                    styles.emptyModalSubtitle,
                    { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 },
                  ]}
                >
                  You are not currently the leader of any project. Create a project to start recruiting teammates.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Modal Bottom Actions */}
          <View
            style={[
              styles.modalActionsBox,
              { borderTopColor: colors.outlineVariant, marginTop: spacing.md, paddingTop: spacing.md },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.modalActionButton,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
              ]}
              onPress={() => {
                setSelectedProject(null);
                setActiveTarget('React Native');
                setSearchQuery('React Native');
                setIsProjectPickerOpen(false);
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 8 }}>🌐</Text>
              <Text style={[styles.modalActionText, { color: colors.onSurface }]}>
                General Skill Search
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalActionButton,
                { backgroundColor: colors.primary, marginTop: spacing.xs },
              ]}
              onPress={() => {
                setIsProjectPickerOpen(false);
                navigation?.navigate('CreateProject');
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 8 }}>➕</Text>
              <Text style={[styles.modalActionText, { color: colors.onPrimary, fontWeight: '700' }]}>
                + Create New Project
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  </View>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    padding: 18,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  projectInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  searchButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  searchButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  sectionHeader: {
    fontWeight: '700',
  },
  candidateCard: {
    padding: 18,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  candidateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  candidateName: {
    fontWeight: '700',
  },
  candidateEmail: {
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  candidateBio: {
    fontSize: 14,
    lineHeight: 20,
  },
  skillsTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  githubSummaryRow: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inviteErrorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  quickPickLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectSelectorPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  projectSelectorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  candidateRole: {
    fontSize: 13,
    marginTop: 2,
  },
  breakdownBox: {
    padding: 12,
    borderRadius: 8,
  },
  breakdownHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metricLabel: {
    width: 90,
    fontSize: 12,
    fontWeight: '500',
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricValue: {
    width: 36,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
  },
  projectDropdownCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectDropdownTitle: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  projectDropdownSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  dropdownChevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  noProjectsNotice: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  noProjectsNoticeText: {
    fontSize: 12,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#94A3B8',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalProjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  modalProjectCardTitle: {
    fontSize: 15,
    flexShrink: 1,
  },
  modalProjectCardMeta: {
    fontSize: 12,
    marginTop: 3,
  },
  emptyModalTitle: {
    fontWeight: '700',
    fontSize: 16,
  },
  emptyModalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalActionsBox: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
