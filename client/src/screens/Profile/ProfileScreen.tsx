import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Badge } from '../../components/Badge';
import { StateWrapper, ScreenState } from '../../components/StateWrapper';
import { useAuth } from '../../context/AuthContext';
import { ProfileEditScreen } from './ProfileEditScreen';
import { GitHubStatsCard } from '../../components/GitHubStatsCard';
import { api, ApiError } from '../../api/client';

export const ProfileScreen = () => {
  const { colors, typography, spacing, isDark, toggleTheme } = useTheme();
  const { user, fetchProfile, logout, updateUser } = useAuth();

  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const loadData = async () => {
    setScreenState('loading');
    try {
      await fetchProfile();
      setScreenState('populated');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
        setErrorCode(err.code);
      } else {
        setErrorMessage('Failed to connect to profile service.');
      }
      if (user) {
        setScreenState('populated');
      } else {
        setScreenState('error');
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        if (typeof window !== 'undefined' && window.location && window.location.search) {
          const urlParams = new URLSearchParams(window.location.search);
          const githubCode = urlParams.get('code');
          if (githubCode) {
            try {
              const redirectUri = window.location.origin;
              const res = await api.post<{ username: string; avatarUrl?: string }>(
                '/github/link',
                { code: githubCode, redirectUri }
              );
              if (res?.username) {
                updateUser({
                  githubUsername: res.username,
                  ...(res.avatarUrl ? { avatarUrl: res.avatarUrl } : {}),
                });
              }
            } catch (linkErr: any) {
              console.warn('GitHub link error:', linkErr);
              if (isMounted && linkErr?.message) {
                setErrorMessage(linkErr.message);
              }
            } finally {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        }
        await fetchProfile();
        if (isMounted) {
          setScreenState('populated');
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof ApiError) {
            setErrorMessage(err.message);
            setErrorCode(err.code);
          } else {
            setErrorMessage('Failed to connect to profile service.');
          }
          setScreenState('populated'); // Show view with stored context profile if present
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [fetchProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchProfile();
    } catch {
      // keep current state
    } finally {
      setRefreshing(false);
    }
  };

  if (isEditing) {
    return (
      <ProfileEditScreen
        onClose={() => setIsEditing(false)}
        onSaved={() => setIsEditing(false)}
      />
    );
  }

  // Check if profile details exist
  const isProfileEmpty = !user?.fullName && !user?.email;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StateWrapper
        state={isProfileEmpty && screenState === 'populated' ? 'empty' : screenState}
        emptyTitle="Profile Incomplete"
        emptySubtitle="Add your bio, skills, and department details so project teams can discover you!"
        emptyActionLabel="Complete Profile Now"
        onEmptyAction={() => setIsEditing(true)}
        errorMessage={errorMessage}
        errorCode={errorCode}
        onRetry={loadData}
      >
        {user && (
          <View style={{ padding: spacing.md }}>
            {/* Header Profile Bento Card */}
            <Card style={styles.card}>
              <View style={styles.heroProfileCol}>
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: colors.primaryContainer },
                  ]}
                >
                  <Text style={{ fontSize: 32, fontWeight: '700', color: colors.onPrimaryContainer }}>
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.heroName,
                    {
                      color: colors.onSurface,
                      fontSize: typography.headlineMedium.fontSize,
                      marginTop: spacing.xs,
                    },
                  ]}
                >
                  {user.fullName || 'Anonymous User'}
                </Text>

                <Text
                  style={[
                    styles.heroRole,
                    { color: colors.onSurfaceVariant, marginTop: 2 },
                  ]}
                >
                  {user.department || user.experienceLevel || 'Fullstack Developer'}
                </Text>

                {/* Teammate Identity Stats: Projects, Skills, Ideas */}
                <View style={[styles.statsRow, { marginTop: spacing.md, backgroundColor: colors.surfaceVariant }]}>
                  <View style={styles.statCol}>
                    <Text style={[styles.statNumber, { color: colors.onSurface }]}>5</Text>
                    <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Projects</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
                  <View style={styles.statCol}>
                    <Text style={[styles.statNumber, { color: colors.onSurface }]}>
                      {user.skills ? user.skills.length : 12}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Skills</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
                  <View style={styles.statCol}>
                    <Text style={[styles.statNumber, { color: colors.onSurface }]}>8</Text>
                    <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Ideas</Text>
                  </View>
                </View>

                {/* Primary Edit Profile Button */}
                <Button
                  title="Edit Profile"
                  onPress={() => setIsEditing(true)}
                  variant="primary"
                  style={{ width: '100%', marginTop: spacing.md }}
                />
              </View>

              {user.bio ? (
                <Text
                  style={[
                    styles.bio,
                    {
                      color: colors.onSurface,
                      fontSize: typography.bodyMedium.fontSize,
                      marginTop: spacing.md,
                    },
                  ]}
                >
                  {user.bio}
                </Text>
              ) : null}

              {(user.department || user.semester) ? (
                <View style={[styles.infoRow, { marginTop: spacing.sm }]}>
                  {user.department ? (
                    <Chip label={user.department} variant="secondary" style={{ marginRight: 6 }} />
                  ) : null}
                  {user.semester ? (
                    <Chip label={user.semester} variant="secondary" />
                  ) : null}
                </View>
              ) : null}
            </Card>

            {/* Skills Bento Card */}
            <Card style={[styles.card, { marginTop: spacing.md }]}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.onSurface, fontSize: typography.titleMedium.fontSize },
                ]}
              >
                Skills
              </Text>
              {user.skills && user.skills.length > 0 ? (
                <View style={[styles.chipRow, { marginTop: spacing.sm }]}>
                  {user.skills.map((sk) => (
                    <Chip
                      key={sk.id}
                      label={sk.skillName}
                      selected
                      variant="primary"
                      style={{ marginRight: 6, marginBottom: 6 }}
                    />
                  ))}
                </View>
              ) : (
                <Text
                  style={{
                    color: colors.onSurfaceVariant,
                    marginTop: spacing.xs,
                    fontStyle: 'italic',
                  }}
                >
                  No skills added yet. Tap "Edit Profile" to add your skills.
                </Text>
              )}
            </Card>

            {/* GitHub Integration Stats Bento Card */}
            <GitHubStatsCard
              profileId={user.id || user.userId || 'me'}
              githubUsername={user.githubUsername}
            />

            {/* Links Bento Card */}
            {(user.githubUsername || user.portfolioUrl) ? (
              <Card style={[styles.card, { marginTop: spacing.md }]}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.onSurface, fontSize: typography.titleMedium.fontSize },
                  ]}
                >
                  Links & Profiles
                </Text>
                {user.githubUsername ? (
                  <TouchableOpacity
                    style={styles.linkRow}
                    onPress={() =>
                      Linking.openURL(`https://github.com/${user.githubUsername}`)
                    }
                  >
                    <Text
                      style={[
                        styles.linkText,
                        { color: colors.primary, marginLeft: 8 },
                      ]}
                    >
                      github.com/{user.githubUsername}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {user.portfolioUrl ? (
                  <TouchableOpacity
                    style={styles.linkRow}
                    onPress={() => Linking.openURL(user.portfolioUrl!)}
                  >
                    <Text
                      style={[
                        styles.linkText,
                        { color: colors.primary, marginLeft: 8 },
                      ]}
                    >
                      {user.portfolioUrl}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </Card>
            ) : null}

            {/* Settings & Theme */}
            <View style={{ marginTop: spacing.md }}>
              <Button
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
                onPress={toggleTheme}
                variant="secondary"
              />

              <Button
                title="Sign Out"
                onPress={logout}
                variant="outline"
                style={{ marginTop: spacing.sm }}
              />
            </View>
          </View>
        )}
      </StateWrapper>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    padding: 18,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontWeight: '700',
  },
  email: {
    fontSize: 13,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  bio: {
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  heroProfileCol: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  heroName: {
    fontWeight: '700',
    textAlign: 'center',
  },
  heroRole: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
});
