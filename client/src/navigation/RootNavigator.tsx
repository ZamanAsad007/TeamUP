import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { LandingScreen } from '../screens/Landing/LandingScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { TabNavigator } from './TabNavigator';
import { WorkspaceNavigator } from './WorkspaceNavigator';
import { ProjectDetailScreen } from '../screens/Marketplace/ProjectDetailScreen';
import { CreateProjectScreen } from '../screens/Marketplace/CreateProjectScreen';
import { StateWrapper } from '../components/StateWrapper';

export type RootStackParamList = {
  Landing: undefined;
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  MainApp: undefined;
  ProjectDetail: { projectId: string };
  CreateProject: undefined;
  Workspace: { projectId: string; projectTitle?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, isDark } = useTheme();

  if (isLoading) {
    return <StateWrapper state="loading" />;
  }

  const themeConfig = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.onSurface,
      border: colors.outlineVariant,
      notification: colors.tertiary,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium: { fontFamily: 'System', fontWeight: '500' as const },
      bold: { fontFamily: 'System', fontWeight: '700' as const },
      heavy: { fontFamily: 'System', fontWeight: '800' as const },
    },
  };

  return (
    <NavigationContainer theme={themeConfig}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainApp" component={TabNavigator} />
            <Stack.Screen
              name="ProjectDetail"
              component={ProjectDetailScreen}
              options={{
                headerShown: true,
                title: 'Project Details',
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.onSurface,
              }}
            />
            <Stack.Screen
              name="CreateProject"
              component={CreateProjectScreen}
              options={{
                headerShown: true,
                title: 'Create Project',
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.onSurface,
              }}
            />
            <Stack.Screen name="Workspace" component={WorkspaceNavigator} />
          </>
        ) : (
          <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
