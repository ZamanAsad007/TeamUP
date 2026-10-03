import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { Bell, Plus, Rocket, Sparkles, ArrowRight, Users, Lightbulb, Bookmark } from 'lucide-react-native';
import { useSafeInsets } from '../../utils/useSafeInsets';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Chip } from '../../components/Chip';
import { Button } from '../../components/Button';
import { SearchBar } from '../../components/SearchBar';
import { SegmentedControl } from '../../components/SegmentedControl';
import { StateWrapper, ScreenState } from '../../components/StateWrapper';
import { projectService, Project } from '../../services/projectService';
import { notificationService } from '../../services/notificationService';
import { socketService } from '../../services/socketService';
import { bookmarkService } from '../../services/bookmarkService';
import { useAuth } from '../../context/AuthContext';

export interface MarketplaceScreenProps {
  navigation?: any;
}

const DOMAIN_FILTERS = ['All', 'Web', 'Mobile', 'AI', 'Design'];

export const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({ navigation }) => {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const insets = useSafeInsets();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [bookmarkedProjectIds, setBookmarkedProjectIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    notificationService
      .getUnreadCount()
      .then((count) => {
        if (isMounted) setUnreadCount(count);
      })
      .catch(() => {});

    bookmarkService
      .getBookmarkedIds()
      .then((ids) => {
        if (isMounted) setBookmarkedProjectIds(new Set(ids));
      })
      .catch(() => {});

    const unsubscribe = socketService.onNotification(() => {
      if (isMounted) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!navigation?.addListener) return;
    const unsubscribeFocus = navigation.addListener('focus', () => {
      notificationService
        .getUnreadCount()
        .then((count) => {
          setUnreadCount(count);
        })
        .catch(() => {});

      bookmarkService
        .getBookmarkedIds()
        .then((ids) => {
          setBookmarkedProjectIds(new Set(ids));
        })
        .catch(() => {});
    });
    return unsubscribeFocus;
  }, [navigation]);

  const handleToggleBookmark = async (project: Project) => {
    const isSaved = bookmarkedProjectIds.has(project.id);
    setBookmarkedProjectIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(project.id);
      else next.add(project.id);
      return next;
    });

    try {
      await bookmarkService.toggleBookmark(project);
    } catch {
      // Revert optimistic update on failure
      setBookmarkedProjectIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(project.id);
        else next.delete(project.id);
        return next;
      });
    }
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = user?.fullName ? user.fullName.split(' ')[0] : 'there';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 18) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  }, [user]);

  const fetchProjects = useCallback((search?: string, domain?: string) => {
    const params: Record<string, any> = {};
    if (search && search.trim().length > 0) {
      params.search = search.trim();
    }
    if (domain && domain !== 'All') {
      params.domain = domain;
    }

    projectService
      .getProjects(params)
      .then((data) => {
        setProjects(data);
        setScreenState(data.length === 0 ? 'empty' : 'populated');
        setErrorMessage(undefined);
      })
      .catch((err: any) => {
        setErrorMessage(err?.message || 'Failed to load projects');
        setScreenState('error');
      });
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const params: Record<string, any> = {};
      if (searchQuery.trim().length > 0) {
        params.search = searchQuery.trim();
      }
      if (selectedDomain !== 'All') {
        params.domain = selectedDomain;
      }
      const data = await projectService.getProjects(params);
      setProjects(data);
      setScreenState(data.length === 0 ? 'empty' : 'populated');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const executeSearch = () => {
    setScreenState('loading');
    fetchProjects(searchQuery, selectedDomain);
  };

  const handleSelectDomain = (domain: string) => {
    setSelectedDomain(domain);
    setScreenState('loading');
    fetchProjects(searchQuery, domain);
  };

  const { width } = useWindowDimensions();
  const isWide = width >= 680;

  const featuredProject = useMemo(() => {
    if (projects.length > 0) return projects[0];
    return null;
  }, [projects]);

  const regularProjects = useMemo(() => {
    if (projects.length > 1) return projects.slice(1);
    return [];
  }, [projects]);

  const displayProjects = useMemo(() => {
    if (searchQuery.trim().length > 0 || selectedDomain !== 'All') {
      return projects;
    }
    return regularProjects;
  }, [projects, regularProjects, searchQuery, selectedDomain]);

  const renderFeaturedCard = (item: Project) => {
    const currentUserId = user?.userId || user?.id;
    const isCreator =
      (currentUserId && currentUserId === item.creatorId) ||
      (user?.email && item.creator?.email && user.email.toLowerCase() === item.creator.email.toLowerCase());
    const isMember = item.members?.some(
      (m) =>
        ((currentUserId && m.userId === currentUserId) ||
          (user?.email && m.user?.email && m.user.email.toLowerCase() === user.email.toLowerCase())) &&
        m.status === 'ACCEPTED'
    );
    const memberCount = item._count?.members ?? (item.members?.length || 1);
    const validSkills = (item.requiredSkills || []).filter(
      (req) => (req.skill?.name || req.skillName)?.trim()
    );

    return (
      <Card
        style={[
          styles.featuredCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            marginBottom: spacing.base,
          },
        ]}
      >
        <View style={styles.featuredHeaderRow}>
          <View
            style={[
              styles.featuredBadge,
              {
                backgroundColor: colors.primary,
                borderRadius: borderRadius.sm,
              },
            ]}
          >
            <Sparkles size={13} color={colors.onPrimary} style={{ marginRight: 5 }} />
            <Text style={[styles.featuredBadgeText, { color: colors.onPrimary }]}>
              FEATURED PROJECT
            </Text>
          </View>
          <Badge
            label={item.status || 'OPEN'}
            variant={item.status === 'OPEN' ? 'secondary' : 'primary'}
          />
        </View>

        <View style={{ marginTop: spacing.md }}>
          <Text style={[typography.h2, { color: colors.text, fontSize: 20 }]}>
            {item.title}
          </Text>
          <Text
            style={[typography.body, { color: colors.textMuted, marginTop: 4, lineHeight: 22 }]}
            numberOfLines={3}
          >
            {item.description}
          </Text>
        </View>

        <View style={[styles.metaRow, { marginTop: spacing.md }]}>
          <Chip label={item.domain} style={{ marginRight: spacing.xs }} />
          {item.semester ? <Chip label={item.semester} style={{ marginRight: spacing.xs }} /> : null}
          <Badge
            label={`${memberCount}/${item.maxMembers || 4} Members`}
            variant="secondary"
          />
        </View>

        {validSkills.length > 0 && (
          <View style={[styles.skillsRow, { marginTop: spacing.xs }]}>
            {validSkills.slice(0, 5).map((req, idx) => {
              const skillName = req.skill?.name || req.skillName;
              return (
                <Chip
                  key={req.id || idx.toString()}
                  label={skillName!}
                  style={{ marginRight: spacing.xs, marginBottom: spacing.xs }}
                />
              );
            })}
          </View>
        )}

        <View style={[styles.cardFooter, { marginTop: spacing.base }]}>
          {isCreator || isMember ? (
            <Button
              title="Open Workspace"
              variant="secondary"
              size="md"
              onPress={() =>
                navigation?.navigate('Workspace', {
                  projectId: item.id,
                  projectTitle: item.title,
                })
              }
              icon={<ArrowRight size={16} color={colors.text} />}
            />
          ) : (
            <Button
              title="View Details"
              variant="primary"
              size="md"
              onPress={() => navigation?.navigate('ProjectDetail', { projectId: item.id })}
              icon={<ArrowRight size={16} color={colors.onPrimary} />}
            />
          )}
        </View>
      </Card>
    );
  };

  const renderActionTiles = () => (
    <View style={[styles.actionTilesRow, { marginBottom: spacing.lg }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Skill Radar"
        onPress={() => navigation?.navigate('Matching')}
        style={[
          styles.actionTile,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.md,
          },
        ]}
      >
        <View style={styles.actionTileTop}>
          <View
            style={[
              styles.actionTileIconWrapper,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
            ]}
          >
            <Users size={18} color={colors.primary} />
          </View>
          <ArrowRight size={15} color={colors.textMuted} />
        </View>
        <Text style={[typography.h3, { color: colors.text, fontSize: 16, marginTop: spacing.md }]}>
          Skill Radar
        </Text>
        <Text
          style={[typography.bodySmall, { color: colors.textMuted, marginTop: 4, lineHeight: 18 }]}
          numberOfLines={2}
        >
          Find peers matching your exact stack & availability.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Idea Hub"
        onPress={() => navigation?.navigate('IdeaHub')}
        style={[
          styles.actionTile,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.md,
          },
        ]}
      >
        <View style={styles.actionTileTop}>
          <View
            style={[
              styles.actionTileIconWrapper,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
            ]}
          >
            <Lightbulb size={18} color={colors.primary} />
          </View>
          <ArrowRight size={15} color={colors.textMuted} />
        </View>
        <Text style={[typography.h3, { color: colors.text, fontSize: 16, marginTop: spacing.md }]}>
          Idea Hub
        </Text>
        <Text
          style={[typography.bodySmall, { color: colors.textMuted, marginTop: 4, lineHeight: 18 }]}
          numberOfLines={2}
        >
          Explore community pitches or generate with AI.
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      {!searchQuery && selectedDomain === 'All' && featuredProject && renderFeaturedCard(featuredProject)}
      {!searchQuery && selectedDomain === 'All' && renderActionTiles()}

      <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
        <Text style={[typography.h3, { color: colors.text, fontSize: 18, fontWeight: '700' }]}>
          {searchQuery ? 'Search Results' : selectedDomain !== 'All' ? `${selectedDomain} Projects` : 'Explore Projects'}
        </Text>
        <Badge
          label={`${displayProjects.length} Available`}
          variant="secondary"
        />
      </View>
    </View>
  );

  const renderProjectItem = ({ item }: { item: Project }) => {
    const currentUserId = user?.userId || user?.id;
    const isCreator =
      (currentUserId && currentUserId === item.creatorId) ||
      (user?.email && item.creator?.email && user.email.toLowerCase() === item.creator.email.toLowerCase());
    const isMember = item.members?.some(
      (m) =>
        ((currentUserId && m.userId === currentUserId) ||
          (user?.email && m.user?.email && m.user.email.toLowerCase() === user.email.toLowerCase())) &&
        m.status === 'ACCEPTED'
    );
    const memberCount = item._count?.members ?? (item.members?.length || 1);
    const validSkills = (item.requiredSkills || []).filter(
      (req) => (req.skill?.name || req.skillName)?.trim()
    );

    const isBookmarked = bookmarkedProjectIds.has(item.id);

    return (
      <View style={[styles.projectCardWrapper, isWide && styles.projectCardWrapperWide]}>
        <Card
          style={styles.projectCard}
          onPress={() => navigation?.navigate('ProjectDetail', { projectId: item.id })}
        >
          <View>
            <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                <View style={styles.iconTitleRow}>
                  <View
                    style={[
                      styles.projectIconBadge,
                      {
                        backgroundColor: colors.surfaceMuted,
                        borderColor: colors.border,
                        borderWidth: 1,
                        borderRadius: borderRadius.md,
                      },
                    ]}
                  >
                    <Rocket size={17} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h3, { color: colors.text, fontSize: 16 }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text
                      style={[typography.bodySmall, { color: colors.textMuted, marginTop: 2 }]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Bookmark project"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{
                    padding: 6,
                    borderRadius: borderRadius.sm,
                    backgroundColor: isBookmarked ? colors.primaryContainer : colors.surfaceMuted,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    handleToggleBookmark(item);
                  }}
                >
                  <Bookmark
                    size={14}
                    color={isBookmarked ? colors.primary : colors.textMuted}
                    fill={isBookmarked ? colors.primary : 'none'}
                  />
                </TouchableOpacity>
                <Badge
                  label={item.status || 'OPEN'}
                  variant={item.status === 'OPEN' ? 'secondary' : 'primary'}
                />
              </View>
            </View>

            <View style={[styles.metaRow, { marginTop: spacing.md }]}>
              <Chip label={item.domain} style={{ marginRight: spacing.xs }} />
              {item.semester ? <Chip label={item.semester} style={{ marginRight: spacing.xs }} /> : null}
              <Badge
                label={`${memberCount}/${item.maxMembers || 4} Members`}
                variant="secondary"
              />
            </View>

            {validSkills.length > 0 && (
              <View style={[styles.skillsRow, { marginTop: spacing.xs }]}>
                {validSkills.slice(0, 3).map((req, idx) => {
                  const skillName = req.skill?.name || req.skillName;
                  return (
                    <Chip
                      key={req.id || idx.toString()}
                      label={skillName!}
                      style={{ marginRight: spacing.xs, marginBottom: spacing.xs }}
                    />
                  );
                })}
                {validSkills.length > 3 && (
                  <Chip
                    label={`+${validSkills.length - 3} more`}
                    style={{ marginBottom: spacing.xs }}
                  />
                )}
              </View>
            )}
          </View>

          <View style={[styles.cardFooter, { marginTop: spacing.md }]}>
            {isCreator || isMember ? (
              <Button
                title="Open Workspace"
                variant="secondary"
                size="sm"
                onPress={() =>
                  navigation?.navigate('Workspace', {
                    projectId: item.id,
                    projectTitle: item.title,
                  })
                }
              />
            ) : (
              <Button
                title="View Details"
                variant="outline"
                size="sm"
                onPress={() => navigation?.navigate('ProjectDetail', { projectId: item.id })}
              />
            )}
          </View>
        </Card>
      </View>
    );
  };

  const topPadding = Platform.OS === 'android' ? Math.max(insets.top, StatusBar.currentHeight || 0) : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header section with Greeting and Actions */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding + spacing.sm,
            backgroundColor: isDark
              ? 'rgba(9, 9, 11, 0.82)'
              : 'rgba(255, 255, 255, 0.85)',
            borderBottomColor: colors.border,
            ...Platform.select({
              web: {
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              },
            }),
          },
        ]}
      >
        <View style={styles.centerContainer}>
          <View style={styles.headerTop}>
            <View>
              <Text
                style={[
                  styles.greetingText,
                  { color: colors.text, fontSize: typography.h2.fontSize, fontWeight: '700' },
                ]}
              >
                {greeting}
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 2 }]}>
                Find something worth building.
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                onPress={() => navigation?.navigate('Notifications')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: borderRadius.md,
                    position: 'relative',
                  },
                ]}
              >
                <Bell size={18} color={colors.text} />
                {unreadCount > 0 && (
                  <View
                    testID="unread-badge"
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      backgroundColor: colors.error || '#ef4444',
                      borderRadius: 9,
                      minWidth: 18,
                      height: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: '#ffffff',
                        fontSize: 10,
                        fontWeight: '700',
                      }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Create Project"
                onPress={() => navigation?.navigate('CreateProject')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[
                  styles.createBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <Plus size={15} color={colors.onPrimary} style={{ marginRight: 4 }} />
                <Text style={[styles.createBtnText, { color: colors.onPrimary }]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Global Search Bar */}
          <View style={{ marginTop: spacing.md }}>
            <SearchBar
              value={searchQuery}
              onChangeText={handleSearch}
              onSubmitEditing={executeSearch}
              onClear={() => {
                setSearchQuery('');
                fetchProjects('', selectedDomain);
              }}
              placeholder="Search projects by title, domain, tech..."
            />
          </View>

          {/* Animated Segmented Control for Domain Filters */}
          <View style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
            <SegmentedControl
              options={DOMAIN_FILTERS}
              selectedOption={selectedDomain}
              onSelectOption={handleSelectDomain}
            />
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.body}>
        <View style={styles.bodyCenterContainer}>
          <StateWrapper
            state={screenState}
            errorMessage={errorMessage}
            onRetry={() => {
              setScreenState('loading');
              fetchProjects(searchQuery, selectedDomain);
            }}
            emptyTitle="No Projects Found"
            emptySubtitle="Be the first to create an exciting new project listing!"
            emptyActionLabel="Create Project"
            onEmptyAction={() => navigation?.navigate('CreateProject')}
          >
            <FlatList
              style={{ flex: 1 }}
              key={isWide ? 'bento-grid-2' : 'bento-list-1'}
              data={displayProjects}
              numColumns={isWide ? 2 : 1}
              columnWrapperStyle={isWide ? styles.columnWrapper : undefined}
              keyExtractor={(item) => item.id}
              renderItem={renderProjectItem}
              ListHeaderComponent={renderListHeader}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: spacing.screenPadding,
                paddingTop: spacing.md,
                paddingBottom: 110,
              }}
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  centerContainer: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 38,
    justifyContent: 'center',
  },
  createBtnText: {
    fontWeight: '600',
    fontSize: 13,
  },
  filtersScroll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    height: '100%',
  },
  bodyCenterContainer: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    flex: 1,
    height: '100%',
  },
  listHeaderContainer: {
    width: '100%',
  },
  featuredCard: {
    padding: 20,
    borderWidth: 1,
  },
  featuredHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionTilesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionTile: {
    width: '48.8%',
    padding: 16,
    borderWidth: 1,
  },
  actionTileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionTileIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectCardWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  projectCardWrapperWide: {
    width: '48.8%',
    marginBottom: 16,
  },
  projectCard: {
    flex: 1,
    height: '100%',
    justifyContent: 'space-between',
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  projectIconBadge: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
