import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Chip } from '../../components/Chip';
import { Button } from '../../components/Button';
import { StateWrapper, ScreenState } from '../../components/StateWrapper';
import { projectService, Project } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';

export interface MarketplaceScreenProps {
  navigation?: any;
}

export const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({ navigation }) => {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = useCallback((search?: string) => {
    const params: Record<string, any> = {};
    if (search && search.trim().length > 0) {
      params.search = search.trim();
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
    fetchProjects(searchQuery);
  };

  const renderProjectItem = ({ item }: { item: Project }) => {
    const isCreator = user?.id === item.creatorId;
    const isMember = item.members?.some((m) => m.userId === user?.id && m.status === 'ACCEPTED');
    const memberCount = item._count?.members ?? (item.members?.length || 1);

    return (
      <Card
        style={[styles.projectCard, { marginBottom: spacing.md }]}
        onPress={() => navigation?.navigate('ProjectDetail', { projectId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.xs }]} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
          <Badge
            label={item.status || 'OPEN'}
            variant={item.status === 'OPEN' ? 'secondary' : 'primary'}
          />
        </View>

        <View style={[styles.metaRow, { marginTop: spacing.sm }]}>
          <Chip label={item.domain} style={{ marginRight: spacing.xs }} />
          <Chip label={item.semester} style={{ marginRight: spacing.xs }} />
          <Badge
            label={`${memberCount}/${item.maxMembers || 4} Members`}
            variant="tertiary"
          />
        </View>

        {item.requiredSkills && item.requiredSkills.length > 0 && (
          <View style={[styles.skillsRow, { marginTop: spacing.sm }]}>
            {item.requiredSkills.slice(0, 3).map((req, idx) => {
              const skillName = req.skill?.name || req.skillName || 'Skill';
              return (
                <Chip
                  key={req.id || idx.toString()}
                  label={skillName}
                  style={{ marginRight: spacing.xs, marginBottom: spacing.xs }}
                />
              );
            })}
            {item.requiredSkills.length > 3 && (
              <Chip
                label={`+${item.requiredSkills.length - 3} more`}
                style={{ marginBottom: spacing.xs }}
              />
            )}
          </View>
        )}

        <View style={[styles.cardFooter, { marginTop: spacing.md }]}>
          {(isCreator || isMember) ? (
            <Button
              title="Open Workspace"
              variant="secondary"
              onPress={() => navigation?.navigate('Workspace', { projectId: item.id, projectTitle: item.title })}
            />
          ) : (
            <Button
              title="View Details"
              variant="outline"
              onPress={() => navigation?.navigate('ProjectDetail', { projectId: item.id })}
            />
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { padding: spacing.md, backgroundColor: colors.surface }]}>
        <View style={styles.headerTop}>
          <Text style={[typography.headlineMedium, { color: colors.onSurface }]}>Marketplace</Text>
          <Button
            title="+ Create"
            variant="primary"
            onPress={() => navigation?.navigate('CreateProject')}
          />
        </View>

        <View style={[styles.searchBarContainer, { marginTop: spacing.sm }]}>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: colors.surfaceVariant,
                color: colors.onSurface,
                borderRadius: borderRadius.md,
                borderColor: colors.outlineVariant,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              },
            ]}
            placeholder="Search projects by title, domain, tech..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={handleSearch}
            onSubmitEditing={executeSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={executeSearch} style={[styles.searchBtn, { marginLeft: spacing.xs }]}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Search</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.body}>
        <StateWrapper
          state={screenState}
          errorMessage={errorMessage}
          onRetry={() => {
            setScreenState('loading');
            fetchProjects(searchQuery);
          }}
          emptyTitle="No Projects Found"
          emptySubtitle="Be the first to create an exciting new project listing!"
          emptyActionLabel="Create Project"
          onEmptyAction={() => navigation?.navigate('CreateProject')}
        >
          <FlatList
            data={projects}
            keyExtractor={(item) => item.id}
            renderItem={renderProjectItem}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    fontSize: 14,
  },
  searchBtn: {
    paddingHorizontal: 8,
  },
  body: {
    flex: 1,
  },
  projectCard: {},
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
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
