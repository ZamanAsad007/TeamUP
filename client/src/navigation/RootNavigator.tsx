import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, LinkingOptions, InitialState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { LandingScreen } from '../screens/Landing/LandingScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { VerifyEmailScreen } from '../screens/Auth/VerifyEmailScreen';
import { TabNavigator } from './TabNavigator';
import { WorkspaceNavigator } from './WorkspaceNavigator';
import { ProjectDetailScreen } from '../screens/Marketplace/ProjectDetailScreen';
import { CreateProjectScreen } from '../screens/Marketplace/CreateProjectScreen';
import { SearchScreen } from '../screens/Search/SearchScreen';
import { SchedulerScreen } from '../screens/Scheduler/SchedulerScreen';
import { NotificationsScreen } from '../screens/Notifications/NotificationsScreen';
import { BookmarksScreen } from '../screens/Bookmarks/BookmarksScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { UserProfileScreen } from '../screens/Profile/UserProfileScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import { StateWrapper } from '../components/StateWrapper';
import { MyProjectsScreen } from '../screens/MyProjects/MyProjectsScreen';

export type RootStackParamList = {
  Landing: undefined;
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string };
  MainApp: undefined;
  ProjectDetail: { projectId: string };
  CreateProject: undefined;
  Workspace: { projectId: string; projectTitle?: string };
  Search: undefined;
  Scheduler: undefined;
  Calendar: undefined;
  Notifications: undefined;
  Bookmarks: undefined;
  Profile: undefined;
  UserProfile: { userId: string; userName?: string; projectId?: string; invited?: boolean };
  Settings: undefined;
  MyProjects: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const NAVIGATION_STATE_KEY = 'TEAMUP_NAVIGATION_STATE_V1';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'teamup://',
    'http://localhost:8081',
    'http://localhost:5001',
    'http://localhost:3000',
    'https://teamup.app',
  ],
  filter: (url: string) => !url.includes('+expo-auth-session') && !url.includes('auth/github/callback'),
  config: {
    screens: {
      Landing: 'landing',
      Login: 'login',
      Register: 'register',
      VerifyEmail: 'verify-email',
      MainApp: {
        screens: {
          Projects: '',
          Matching: 'matching',
          Create: 'create-tab',
          IdeaHub: 'ideahub',
          More: 'more',
        },
      },
      ProjectDetail: 'projects/:projectId',
      CreateProject: 'create-project',
      Workspace: {
        path: 'workspace/:projectId',
        screens: {
          WorkspaceHome: '',
          Kanban: 'kanban',
          Chat: 'chat',
          Members: 'members',
          Files: 'files',
          Evaluation: 'evaluation',
          Analytics: 'analytics',
        },
      } as any,
      Search: 'search',
      Scheduler: 'scheduler',
      Calendar: 'calendar',
      Notifications: 'notifications',
      Bookmarks: 'bookmarks',
      Profile: 'profile',
      UserProfile: 'users/:userId',
      Settings: 'settings',
      MyProjects: 'my-projects',
    },
  },
};

export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState<InitialState | undefined>();

  useEffect(() => {
    const restoreState = async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const saved =
            window.sessionStorage?.getItem(NAVIGATION_STATE_KEY) ||
            window.localStorage?.getItem(NAVIGATION_STATE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object') {
              const firstRoute = parsed.routes?.[0]?.name;
              const authRoutes = ['Landing', 'Login', 'Register', 'VerifyEmail'];
              const isSavedStateAuthOnly = authRoutes.includes(firstRoute);

              // Only restore state if authentication status matches the saved state
              if ((isAuthenticated && !isSavedStateAuthOnly) || (!isAuthenticated && isSavedStateAuthOnly)) {
                setInitialState(parsed);
              }
            }
          }
        }
      } catch {
        // Fall back to default initial route
      } finally {
        setIsReady(true);
      }
    };

    restoreState();
  }, [isAuthenticated]);

  const handleStateChange = (state: any) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && state) {
      try {
        const stateString = JSON.stringify(state);
        window.sessionStorage?.setItem(NAVIGATION_STATE_KEY, stateString);
        window.localStorage?.setItem(NAVIGATION_STATE_KEY, stateString);
      } catch {
        // Ignore quota or private browsing errors
      }
    }
  };

  useEffect(() => {
    if (!isAuthenticated && Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        window.sessionStorage?.removeItem(NAVIGATION_STATE_KEY);
        window.localStorage?.removeItem(NAVIGATION_STATE_KEY);
      } catch {
        // ignore
      }
    }
  }, [isAuthenticated]);

  if (isLoading || !isReady) {
    return <StateWrapper state="loading" />;
  }

  const themeConfig = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium: { fontFamily: 'System', fontWeight: '500' as const },
      bold: { fontFamily: 'System', fontWeight: '700' as const },
      heavy: { fontFamily: 'System', fontWeight: '800' as const },
    },
  };

  return (
    <NavigationContainer
      theme={themeConfig}
      linking={linking}
      initialState={initialState}
      onStateChange={handleStateChange}
    >
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainApp" component={TabNavigator} />
            <Stack.Screen
              name="ProjectDetail"
              component={ProjectDetailScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="CreateProject"
              component={CreateProjectScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen name="Workspace" component={WorkspaceNavigator} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="Scheduler" component={SchedulerScreen} />
            <Stack.Screen name="Calendar" component={SchedulerScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="MyProjects" component={MyProjectsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
