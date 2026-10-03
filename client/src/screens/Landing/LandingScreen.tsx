import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {
  Users,
  Calendar,
  GitBranch,
  Sun,
  Moon,
  ArrowRight,
  Code2,
  Sparkles,
} from 'lucide-react-native';
import { useSafeInsets } from '../../utils/useSafeInsets';
import { useTheme } from '../../theme/ThemeContext';
import { projectService, Project } from '../../services/projectService';
import { TeamUpLogo } from '../../components/TeamUpLogo';

export interface LandingScreenProps {
  navigation: any;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ navigation }) => {
  const { isDark, toggleTheme } = useTheme();
  const [liveProjects, setLiveProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    projectService
      .getProjects({ limit: 4 })
      .then((data) => {
        if (isMounted) {
          setLiveProjects(Array.isArray(data) ? data.slice(0, 4) : []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLiveProjects([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingProjects(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNavigateRegister = () => {
    navigation.navigate('Register');
  };

  const handleNavigateLogin = () => {
    navigation.navigate('Login');
  };

  const handleSelectProject = (projectId: string) => {
    navigation.navigate('ProjectDetail', { projectId });
  };

  const surfaceBg = isDark ? '#121215' : '#FFFFFF';
  const surfaceBorder = isDark ? '#27272A' : '#E4E4E7';
  const textMutedColor = isDark ? '#A1A1AA' : '#71717A';
  const textPrimaryColor = isDark ? '#FAFAFA' : '#09090B';

  const insets = useSafeInsets();
  const topInset = Platform.OS === 'android' ? Math.max(insets.top, StatusBar.currentHeight || 0) : insets.top;

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#09090B' : '#FFFFFF',
        },
      ]}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingTop: topInset + (Platform.OS === 'web' ? 14 : 10),
          paddingBottom: Math.max(insets.bottom, 20) + 40,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Ambient Lighting Accents */}
      <View style={styles.ambientGlowWrapper} pointerEvents="none">
        <View
          style={[
            styles.ambientGlowOrbPrimary,
            {
              backgroundColor: isDark
                ? 'rgba(99, 102, 241, 0.12)'
                : 'rgba(99, 102, 241, 0.05)',
            },
          ]}
        />
        <View
          style={[
            styles.ambientGlowOrbSecondary,
            {
              backgroundColor: isDark
                ? 'rgba(20, 184, 166, 0.08)'
                : 'rgba(20, 184, 166, 0.04)',
            },
          ]}
        />
      </View>

      {/* Navigation Header */}
      <View
        style={[
          styles.navbar,
          {
            backgroundColor: isDark
              ? 'rgba(18, 18, 21, 0.85)'
              : 'rgba(255, 255, 255, 0.92)',
            borderColor: surfaceBorder,
          },
        ]}
      >
        <View style={styles.brandRow}>
          <View
            style={[
              styles.logoBadge,
              {
                backgroundColor: isDark ? '#27272A' : '#F4F4F5',
                borderColor: surfaceBorder,
              },
            ]}
          >
            <TeamUpLogo size={20} />
          </View>
          <View style={styles.brandTextGroup}>
            <Text style={[styles.brandTitle, { color: textPrimaryColor }]}>
              TeamUp
            </Text>
            <Text style={[styles.brandSubtitle, { color: textMutedColor }]}>
              Campus Platform
            </Text>
          </View>
        </View>

        <View style={styles.navActions}>
          <TouchableOpacity
            style={[
              styles.themeToggleBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: surfaceBorder,
              },
            ]}
            onPress={toggleTheme}
            accessibilityLabel="Toggle theme"
          >
            {isDark ? (
              <Sun size={15} color="#FBBF24" />
            ) : (
              <Moon size={15} color="#6366F1" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNavigateLogin}
            style={[
              styles.navLoginBtn,
              {
                borderColor: surfaceBorder,
                backgroundColor: isDark ? 'transparent' : '#FFFFFF',
              },
            ]}
          >
            <Text style={[styles.navLoginText, { color: textPrimaryColor }]}>
              Log In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNavigateRegister}
            style={[
              styles.navJoinBtn,
              {
                backgroundColor: isDark ? '#FAFAFA' : '#09090B',
              },
            ]}
            activeOpacity={0.88}
          >
            <Text
              style={[
                styles.navJoinText,
                { color: isDark ? '#09090B' : '#FAFAFA' },
              ]}
            >
              Join TeamUp
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View
          style={[
            styles.heroPill,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              borderColor: surfaceBorder,
            },
          ]}
        >
          <View style={styles.pulseDot} />
          <Text style={[styles.heroPillText, { color: textPrimaryColor }]}>
            Campus Collaboration Platform
          </Text>
        </View>

        <Text style={[styles.heroHeadline, { color: textPrimaryColor }]}>
          Your next project starts with the right team.
        </Text>

        <Text style={[styles.heroSubtitle, { color: textMutedColor }]}>
          Connect with classmates who complement your stack, match your schedule, and actually want to build great software together.
        </Text>

        <View style={styles.heroActionsRow}>
          <TouchableOpacity
            onPress={handleNavigateRegister}
            style={[
              styles.primaryActionBtn,
              {
                backgroundColor: isDark ? '#FAFAFA' : '#09090B',
              },
            ]}
            activeOpacity={0.88}
          >
            <Text
              style={[
                styles.primaryActionText,
                { color: isDark ? '#09090B' : '#FAFAFA' },
              ]}
            >
              Join TeamUp
            </Text>
            <ArrowRight
              size={16}
              color={isDark ? '#09090B' : '#FAFAFA'}
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNavigateLogin}
            style={[
              styles.secondaryActionBtn,
              {
                backgroundColor: surfaceBg,
                borderColor: surfaceBorder,
              },
            ]}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.secondaryActionText,
                { color: textPrimaryColor },
              ]}
            >
              Log In
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroFeatureTagsRow}>
          <View
            style={[
              styles.heroFeatureTag,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                borderColor: surfaceBorder,
              },
            ]}
          >
            <Code2 size={13} color="#6366F1" style={{ marginRight: 6 }} />
            <Text style={[styles.heroFeatureTagText, { color: textPrimaryColor }]}>
              Stack Compatibility
            </Text>
          </View>

          <View
            style={[
              styles.heroFeatureTag,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                borderColor: surfaceBorder,
              },
            ]}
          >
            <GitBranch size={13} color="#14B8A6" style={{ marginRight: 6 }} />
            <Text style={[styles.heroFeatureTagText, { color: textPrimaryColor }]}>
              GitHub Activity Sync
            </Text>
          </View>

          <View
            style={[
              styles.heroFeatureTag,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                borderColor: surfaceBorder,
              },
            ]}
          >
            <Calendar size={13} color="#F43F5E" style={{ marginRight: 6 }} />
            <Text style={[styles.heroFeatureTagText, { color: textPrimaryColor }]}>
              Conflict-Free Scheduling
            </Text>
          </View>

          <View
            style={[
              styles.heroFeatureTag,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                borderColor: surfaceBorder,
              },
            ]}
          >
            <Sparkles size={13} color="#EAB308" style={{ marginRight: 6 }} />
            <Text style={[styles.heroFeatureTagText, { color: textPrimaryColor }]}>
              Capstone & Hackathons
            </Text>
          </View>
        </View>
      </View>

      {/* Live Projects From Backend */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionEyebrow, { color: '#6366F1' }]}>
            LIVE PROJECTS
          </Text>
          <Text style={[styles.sectionTitle, { color: textPrimaryColor }]}>
            Active projects seeking teammates
          </Text>
          <Text style={[styles.sectionSubtitle, { color: textMutedColor }]}>
            Explore real university projects organized by domains and required technical skills.
          </Text>
        </View>

        {loadingProjects ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#6366F1" />
            <Text style={[styles.loadingText, { color: textMutedColor }]}>
              Loading active campus projects...
            </Text>
          </View>
        ) : liveProjects.length > 0 ? (
          <View style={styles.projectsGrid}>
            {liveProjects.map((project) => {
              const creatorName =
                project.creator?.profile?.fullName ||
                project.creator?.email ||
                'Project Creator';
              const memberCount = project.members?.length || 1;

              return (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    styles.projectCard,
                    {
                      backgroundColor: surfaceBg,
                      borderColor: surfaceBorder,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleSelectProject(project.id)}
                >
                  <View style={styles.projectCardTopRow}>
                    <View style={styles.projectPillsRow}>
                      {project.domain ? (
                        <View
                          style={[
                            styles.domainPill,
                            {
                              backgroundColor: isDark ? '#1C1917' : '#F4F4F5',
                              borderColor: surfaceBorder,
                            },
                          ]}
                        >
                          <Text style={[styles.domainPillText, { color: textPrimaryColor }]}>
                            {project.domain}
                          </Text>
                        </View>
                      ) : null}

                      {project.semester ? (
                        <View
                          style={[
                            styles.semesterPill,
                            {
                              backgroundColor: isDark ? '#18181B' : '#F4F4F5',
                              borderColor: surfaceBorder,
                            },
                          ]}
                        >
                          <Text style={[styles.semesterPillText, { color: textMutedColor }]}>
                            {project.semester}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.memberCountBadge,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                          borderColor: surfaceBorder,
                        },
                      ]}
                    >
                      <Users size={12} color={textMutedColor} style={{ marginRight: 4 }} />
                      <Text style={[styles.memberCountText, { color: textMutedColor }]}>
                        {memberCount} / {project.maxMembers}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[styles.projectTitleText, { color: textPrimaryColor }]}
                    numberOfLines={1}
                  >
                    {project.title}
                  </Text>

                  <Text
                    style={[styles.projectDescText, { color: textMutedColor }]}
                    numberOfLines={2}
                  >
                    {project.description || 'No description provided.'}
                  </Text>

                  {/* Required Skills */}
                  {project.requiredSkills && project.requiredSkills.length > 0 ? (
                    <View style={styles.projectSkillsRow}>
                      {project.requiredSkills.slice(0, 4).map((req, idx) => {
                        const name =
                          req.skill?.name || req.skillName || 'Skill';
                        return (
                          <View
                            key={idx}
                            style={[
                              styles.skillChip,
                              {
                                backgroundColor: isDark
                                  ? 'rgba(99, 102, 241, 0.08)'
                                  : 'rgba(99, 102, 241, 0.05)',
                                borderColor: isDark
                                  ? 'rgba(99, 102, 241, 0.2)'
                                  : 'rgba(99, 102, 241, 0.15)',
                              },
                            ]}
                          >
                            <Text style={styles.skillChipText}>{name}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}

                  {/* Project Creator Footer */}
                  <View
                    style={[
                      styles.projectFooterRow,
                      {
                        borderTopColor: surfaceBorder,
                      },
                    ]}
                  >
                    <View style={styles.creatorInfoRow}>
                      <View
                        style={[
                          styles.creatorAvatar,
                          {
                            backgroundColor: isDark ? '#27272A' : '#E4E4E7',
                          },
                        ]}
                      >
                        <Text style={[styles.creatorAvatarText, { color: textPrimaryColor }]}>
                          {creatorName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={[styles.creatorNameText, { color: textMutedColor }]}
                        numberOfLines={1}
                      >
                        {creatorName}
                      </Text>
                    </View>

                    <View style={styles.viewProjectRow}>
                      <Text style={[styles.viewProjectText, { color: textPrimaryColor }]}>
                        View Project
                      </Text>
                      <ArrowRight size={13} color={textPrimaryColor} style={{ marginLeft: 4 }} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View
            style={[
              styles.emptyProjectsCard,
              {
                backgroundColor: surfaceBg,
                borderColor: surfaceBorder,
              },
            ]}
          >
            <TeamUpLogo size={32} />
            <Text style={[styles.emptyProjectsTitle, { color: textPrimaryColor }]}>
              No active projects yet
            </Text>
            <Text style={[styles.emptyProjectsDesc, { color: textMutedColor }]}>
              Be the first to propose a project and assemble your team on campus.
            </Text>
            <TouchableOpacity
              onPress={handleNavigateRegister}
              style={[
                styles.createProjectBtn,
                { backgroundColor: isDark ? '#FAFAFA' : '#09090B' },
              ]}
            >
              <Text
                style={[
                  styles.createProjectBtnText,
                  { color: isDark ? '#09090B' : '#FAFAFA' },
                ]}
              >
                Create a Project
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Platform Capabilities (Linear Bento Cards) */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionEyebrow, { color: '#14B8A6' }]}>
            PLATFORM CAPABILITIES
          </Text>
          <Text style={[styles.sectionTitle, { color: textPrimaryColor }]}>
            Engineered for campus collaboration
          </Text>
          <Text style={[styles.sectionSubtitle, { color: textMutedColor }]}>
            Precision tools designed to streamline teammate discovery, schedule alignment, and project execution.
          </Text>
        </View>

        <View style={styles.bentoGrid}>
          {/* Card 1 */}
          <View
            style={[
              styles.bentoCard,
              {
                backgroundColor: surfaceBg,
                borderColor: surfaceBorder,
              },
            ]}
          >
            <View
              style={[
                styles.bentoIconBox,
                {
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)',
                  borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.15)',
                },
              ]}
            >
              <Users size={20} color="#6366F1" />
            </View>
            <Text style={[styles.bentoTitle, { color: textPrimaryColor }]}>
              Skill-Based Matching
            </Text>
            <Text style={[styles.bentoBody, { color: textMutedColor }]}>
              Search for teammates based on verified technical proficiencies, course enrollment, and weekly schedule availability.
            </Text>
            <View style={styles.bentoChipsRow}>
              <View
                style={[
                  styles.bentoChip,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    borderColor: surfaceBorder,
                  },
                ]}
              >
                <Text style={[styles.bentoChipText, { color: textPrimaryColor }]}>
                  Weighted Algorithm
                </Text>
              </View>
              <View
                style={[
                  styles.bentoChip,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    borderColor: surfaceBorder,
                  },
                ]}
              >
                <Text style={[styles.bentoChipText, { color: textPrimaryColor }]}>
                  Skill Tag Queries
                </Text>
              </View>
            </View>
          </View>

          {/* Card 2 */}
          <View
            style={[
              styles.bentoCard,
              {
                backgroundColor: surfaceBg,
                borderColor: surfaceBorder,
              },
            ]}
          >
            <View
              style={[
                styles.bentoIconBox,
                {
                  backgroundColor: isDark ? 'rgba(20, 184, 166, 0.1)' : 'rgba(20, 184, 166, 0.08)',
                  borderColor: isDark ? 'rgba(20, 184, 166, 0.25)' : 'rgba(20, 184, 166, 0.15)',
                },
              ]}
            >
              <Calendar size={20} color="#14B8A6" />
            </View>
            <Text style={[styles.bentoTitle, { color: textPrimaryColor }]}>
              Smart Meeting Scheduler
            </Text>
            <Text style={[styles.bentoBody, { color: textMutedColor }]}>
              Propose candidate meeting slots and collect consensus votes from members to automatically resolve winning sync times.
            </Text>
            <View style={styles.bentoChipsRow}>
              <View
                style={[
                  styles.bentoChip,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    borderColor: surfaceBorder,
                  },
                ]}
              >
                <Text style={[styles.bentoChipText, { color: textPrimaryColor }]}>
                  Slot Voting
                </Text>
              </View>
              <View
                style={[
                  styles.bentoChip,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    borderColor: surfaceBorder,
                  },
                ]}
              >
                <Text style={[styles.bentoChipText, { color: textPrimaryColor }]}>
                  Consensus Lock
                </Text>
              </View>
            </View>
          </View>

          {/* Card 3 */}
          <View
            style={[
              styles.bentoCard,
              {
                backgroundColor: surfaceBg,
                borderColor: surfaceBorder,
              },
            ]}
          >
            <View
              style={[
                styles.bentoIconBox,
                {
                  backgroundColor: isDark ? 'rgba(244, 63, 94, 0.1)' : 'rgba(244, 63, 94, 0.08)',
                  borderColor: isDark ? 'rgba(244, 63, 94, 0.25)' : 'rgba(244, 63, 94, 0.15)',
                },
              ]}
            >
              <GitBranch size={20} color="#F43F5E" />
            </View>
            <Text style={[styles.bentoTitle, { color: textPrimaryColor }]}>
              Verified GitHub Activity
            </Text>
            <Text style={[styles.bentoBody, { color: textMutedColor }]}>
              Inspect verified commit velocity, public repository history, and primary languages directly synced via GitHub OAuth.
            </Text>
            <View style={styles.bentoChipsRow}>
              <View
                style={[
                  styles.bentoChip,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    borderColor: surfaceBorder,
                  },
                ]}
              >
                <Text style={[styles.bentoChipText, { color: textPrimaryColor }]}>
                  OAuth Verification
                </Text>
              </View>
              <View
                style={[
                  styles.bentoChip,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    borderColor: surfaceBorder,
                  },
                ]}
              >
                <Text style={[styles.bentoChipText, { color: textPrimaryColor }]}>
                  Repository Stats
                </Text>
              </View>
            </View>
          </View>

          {/* Card 4 */}
          <View
            style={[
              styles.bentoCard,
              {
                backgroundColor: surfaceBg,
                borderColor: surfaceBorder,
              },
            ]}
          >
            <View
              style={[
                styles.bentoIconBox,
                {
                  backgroundColor: isDark ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.08)',
                  borderColor: isDark ? 'rgba(234, 179, 8, 0.25)' : 'rgba(234, 179, 8, 0.15)',
                },
              ]}
            >
              <Sparkles size={20} color="#EAB308" />
            </View>
            <Text style={[styles.bentoTitle, { color: textPrimaryColor }]}>
              Collaborative Workspace
            </Text>
            <Text style={[styles.bentoBody, { color: textMutedColor }]}>
              Organize project tasks on sprint Kanban boards, access shared repositories, and complete structured peer reviews.
            </Text>
            <View style={styles.bentoChipsRow}>
              <View
                style={[
                  styles.bentoChip,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    borderColor: surfaceBorder,
                  },
                ]}
              >
                <Text style={[styles.bentoChipText, { color: textPrimaryColor }]}>
                  Kanban Sprints
                </Text>
              </View>
              <View
                style={[
                  styles.bentoChip,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    borderColor: surfaceBorder,
                  },
                ]}
              >
                <Text style={[styles.bentoChipText, { color: textPrimaryColor }]}>
                  Peer Evaluations
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 3-Step Workflow */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionEyebrow, { color: '#F43F5E' }]}>
            HOW IT WORKS
          </Text>
          <Text style={[styles.sectionTitle, { color: textPrimaryColor }]}>
            Three steps to your team
          </Text>
          <Text style={[styles.sectionSubtitle, { color: textMutedColor }]}>
            From account registration to active sprint collaboration in three simple phases.
          </Text>
        </View>

        <View style={styles.workflowGrid}>
          {/* Step 1 */}
          <View
            style={[
              styles.workflowCard,
              {
                backgroundColor: surfaceBg,
                borderColor: surfaceBorder,
              },
            ]}
          >
            <View
              style={[
                styles.stepNumberBadge,
                {
                  backgroundColor: isDark ? '#27272A' : '#F4F4F5',
                  borderColor: surfaceBorder,
                },
              ]}
            >
              <Text style={[styles.stepNumberText, { color: textPrimaryColor }]}>
                1
              </Text>
            </View>
            <Text style={[styles.workflowCardTitle, { color: textPrimaryColor }]}>
              Create Your Profile
            </Text>
            <Text style={[styles.workflowCardBody, { color: textMutedColor }]}>
              Specify your department, semester, and key technical skills. Connect your GitHub account with a single click.
            </Text>
          </View>

          {/* Step 2 */}
          <View
            style={[
              styles.workflowCard,
              {
                backgroundColor: surfaceBg,
                borderColor: surfaceBorder,
              },
            ]}
          >
            <View
              style={[
                styles.stepNumberBadge,
                {
                  backgroundColor: isDark ? '#27272A' : '#F4F4F5',
                  borderColor: surfaceBorder,
                },
              ]}
            >
              <Text style={[styles.stepNumberText, { color: textPrimaryColor }]}>
                2
              </Text>
            </View>
            <Text style={[styles.workflowCardTitle, { color: textPrimaryColor }]}>
              Match & Invite
            </Text>
            <Text style={[styles.workflowCardBody, { color: textMutedColor }]}>
              Search candidates by skill requirements, review compatibility metrics, and send invitations directly to peers.
            </Text>
          </View>

          {/* Step 3 */}
          <View
            style={[
              styles.workflowCard,
              {
                backgroundColor: surfaceBg,
                borderColor: surfaceBorder,
              },
            ]}
          >
            <View
              style={[
                styles.stepNumberBadge,
                {
                  backgroundColor: isDark ? '#27272A' : '#F4F4F5',
                  borderColor: surfaceBorder,
                },
              ]}
            >
              <Text style={[styles.stepNumberText, { color: textPrimaryColor }]}>
                3
              </Text>
            </View>
            <Text style={[styles.workflowCardTitle, { color: textPrimaryColor }]}>
              Schedule & Ship
            </Text>
            <Text style={[styles.workflowCardBody, { color: textMutedColor }]}>
              Vote on team meeting slots, track milestones on the project board, and submit confidential peer evaluations.
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom CTA Banner */}
      <View style={styles.bottomCtaSection}>
        <View
          style={[
            styles.bottomCtaCard,
            {
              backgroundColor: surfaceBg,
              borderColor: surfaceBorder,
            },
          ]}
        >
          <Text style={[styles.bottomCtaTitle, { color: textPrimaryColor }]}>
            Ready to start your next semester project?
          </Text>
          <Text style={[styles.bottomCtaSubtitle, { color: textMutedColor }]}>
            Join student creators, engineers, and researchers across campus. Assemble your team and build together.
          </Text>

          <View style={styles.bottomCtaBtnsRow}>
            <TouchableOpacity
              onPress={handleNavigateRegister}
              style={[
                styles.bottomPrimaryBtn,
                {
                  backgroundColor: isDark ? '#FAFAFA' : '#09090B',
                },
              ]}
              activeOpacity={0.88}
            >
              <Text
                style={[
                  styles.bottomPrimaryBtnText,
                  { color: isDark ? '#09090B' : '#FAFAFA' },
                ]}
              >
                Join TeamUp
              </Text>
              <ArrowRight
                size={16}
                color={isDark ? '#09090B' : '#FAFAFA'}
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNavigateLogin}
              style={[
                styles.bottomSecondaryBtn,
                {
                  borderColor: surfaceBorder,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.bottomSecondaryBtnText,
                  { color: textPrimaryColor },
                ]}
              >
                Log In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: surfaceBorder,
          },
        ]}
      >
        <Text style={[styles.footerText, { color: textMutedColor }]}>
          TeamUp Campus Collaboration Platform
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  ambientGlowWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 600,
    overflow: 'hidden',
  },
  ambientGlowOrbPrimary: {
    position: 'absolute',
    top: -120,
    left: '25%',
    width: 480,
    height: 480,
    borderRadius: 240,
  },
  ambientGlowOrbSecondary: {
    position: 'absolute',
    top: 60,
    right: '15%',
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 0,
    borderWidth: 1,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  brandTextGroup: {
    marginLeft: 10,
  },
  brandTitle: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggleBtn: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navLoginBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  navLoginText: {
    fontSize: 13,
    fontWeight: '600',
  },
  navJoinBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  navJoinText: {
    fontSize: 13,
    fontWeight: '600',
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 54,
    paddingBottom: 24,
    maxWidth: 820,
    width: '100%',
    alignSelf: 'center',
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  heroPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroHeadline: {
    fontWeight: '800',
    fontSize: Platform.OS === 'web' ? 44 : 32,
    lineHeight: Platform.OS === 'web' ? 52 : 40,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 640,
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 28,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  primaryActionText: {
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryActionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontWeight: '600',
    fontSize: 14,
  },
  heroFeatureTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
  },
  heroFeatureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  heroFeatureTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionContainer: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    marginTop: 64,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 26,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 580,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  projectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  projectCard: {
    flexBasis: Platform.OS === 'web' ? '48%' : '100%',
    minWidth: 280,
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
  },
  projectCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectPillsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  domainPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  domainPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  semesterPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  semesterPillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  memberCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  memberCountText: {
    fontSize: 11,
    fontWeight: '500',
  },
  projectTitleText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  projectDescText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  projectSkillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  skillChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  skillChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6366F1',
  },
  projectFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  creatorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  creatorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 7,
  },
  creatorAvatarText: {
    fontSize: 11,
    fontWeight: '700',
  },
  creatorNameText: {
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 120,
  },
  viewProjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewProjectText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyProjectsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyProjectsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyProjectsDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 360,
  },
  createProjectBtn: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createProjectBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  bentoCard: {
    flexBasis: Platform.OS === 'web' ? '48%' : '100%',
    minWidth: 280,
    borderRadius: 12,
    borderWidth: 1,
    padding: 22,
  },
  bentoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 14,
  },
  bentoTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  bentoBody: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  bentoChipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  bentoChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  bentoChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  workflowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  workflowCard: {
    flexBasis: Platform.OS === 'web' ? '31%' : '100%',
    minWidth: 260,
    borderRadius: 12,
    borderWidth: 1,
    padding: 22,
  },
  stepNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 14,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  workflowCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  workflowCardBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  bottomCtaSection: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    marginTop: 64,
  },
  bottomCtaCard: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  bottomCtaTitle: {
    fontWeight: '800',
    fontSize: Platform.OS === 'web' ? 28 : 22,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  bottomCtaSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 520,
  },
  bottomCtaBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  bottomPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  bottomPrimaryBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  bottomSecondaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  bottomSecondaryBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    borderTopWidth: 1,
    alignItems: 'center',
    paddingTop: 28,
    marginTop: 48,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
