import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { AppHeader } from '../../components/AppHeader';
import { StateWrapper, ScreenState } from '../../components/StateWrapper';
import { projectService, Project } from '../../services/projectService';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Chip } from '../../components/Chip';
import { Button } from '../../components/Button';
import { Rocket, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export const MyProjectsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyProjects = useCallback(async () => {
    try {
      const data = await projectService.getMyProjects();
      setProjects(data);
      setScreenState(data.length === 0 ? 'empty' : 'populated');
      setErrorMessage(undefined);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load your projects');
      setScreenState('error');
    }
  }, []);

  useEffect(() => {
    fetchMyProjects();
  }, [fetchMyProjects]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyProjects();
    setRefreshing(false);
  };

  const renderProjectItem = ({ item }: { item: Project }) => {
    const currentUserId = user?.userId || user?.id;
    const isCreator = currentUserId === item.creatorId;
    const memberCount = item._count?.members ?? (item.members?.length || 1);
    const validSkills = (item.requiredSkills || []).filter(
      (req) => (req.skill?.name || req.skillName)?.trim()
    );

    return (
      <View style={{ marginBottom: spacing.md }}>
        <Card
          style={{ padding: 18 }}
          onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
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
              <Badge
                label={isCreator ? 'Owner' : 'Member'}
                variant={isCreator ? 'primary' : 'secondary'}
              />
            </View>

            <View style={[styles.metaRow, { marginTop: spacing.md }]}>
              <Chip label={item.domain} style={{ marginRight: spacing.xs }} />
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
              </View>
            )}
          </View>

          <View style={[styles.cardFooter, { marginTop: spacing.md }]}>
            <Button
              title="Open Workspace"
              variant="secondary"
              size="sm"
              onPress={() =>
                navigation.navigate('Workspace', {
                  projectId: item.id,
                  projectTitle: item.title,
                })
              }
              icon={<ArrowRight size={16} color={colors.text} />}
            />
          </View>
        </Card>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="My Projects"
        subtitle="Projects you are a member of"
        showBack
        onBack={() => {
          if (navigation.canGoBack()) navigation.goBack();
          else navigation.navigate('MainApp', { screen: 'More' });
        }}
      />
      <View style={styles.body}>
        <StateWrapper
          state={screenState}
          errorMessage={errorMessage}
          onRetry={() => {
            setScreenState('loading');
            fetchMyProjects();
          }}
          emptyTitle="No Projects Yet"
          emptySubtitle="You haven't joined or created any projects yet."
          emptyActionLabel="Explore Marketplace"
          onEmptyAction={() => navigation.navigate('MainApp', { screen: 'Projects' })}
        >
          <FlatList
            style={{ flex: 1 }}
            data={projects}
            keyExtractor={(item) => item.id}
            renderItem={renderProjectItem}
            contentContainerStyle={{
              paddingHorizontal: spacing.screenPadding,
              paddingTop: spacing.md,
              paddingBottom: 40,
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    paddingRight: 12,
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
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
    paddingTop: 12,
  },
});
