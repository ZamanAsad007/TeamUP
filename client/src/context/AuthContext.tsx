import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import { tokenStorage } from '../services/tokenStorage';
import { api, ApiError } from '../api/client';
import { pushNotificationService } from '../services/pushNotificationService';

export interface ProfileSkill {
  id: string;
  skillName: string;
  category?: string;
  yearsOfExp?: number;
}

export interface UserProfile {
  id?: string;
  userId?: string;
  email: string;
  fullName: string;
  bio?: string;
  avatarUrl?: string;
  department?: string;
  semester?: string;
  availability?: boolean;
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  githubUsername?: string;
  portfolioUrl?: string;
  skills?: ProfileSkill[];
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  loginWithGithub: (code: string, redirectUri?: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<UserProfile>) => void;
  fetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    if (typeof atob === 'function') {
      return JSON.parse(atob(padded));
    }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = '';
    for (let i = 0; i < padded.length; i += 4) {
      const enc1 = chars.indexOf(padded.charAt(i));
      const enc2 = chars.indexOf(padded.charAt(i + 1));
      const enc3 = chars.indexOf(padded.charAt(i + 2));
      const enc4 = chars.indexOf(padded.charAt(i + 3));
      const chr1 = (enc1 << 2) | (enc2 >> 4);
      const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      const chr3 = ((enc3 & 3) << 6) | enc4;
      str += String.fromCharCode(chr1);
      if (enc3 !== 64 && enc3 !== -1) str += String.fromCharCode(chr2);
      if (enc4 !== 64 && enc4 !== -1) str += String.fromCharCode(chr3);
    }
    return JSON.parse(str);
  } catch {
    return null;
  }
}

const normalizeUserProfile = (
  data: any,
  existing?: UserProfile | null,
  fallbackEmail?: string
): UserProfile => {
  const resolvedUserId = data?.userId || existing?.userId || existing?.id || data?.id || '';
  const resolvedEmail = data?.email || existing?.email || fallbackEmail || '';
  return {
    ...existing,
    ...data,
    id: resolvedUserId,
    userId: resolvedUserId,
    email: resolvedEmail,
    fullName: data?.fullName || existing?.fullName || (resolvedEmail ? resolvedEmail.split('@')[0] : 'User'),
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const profileData = await api.get<UserProfile>('/profiles/me');
      setUser((prev) => normalizeUserProfile(profileData, prev));
    } catch (err) {
      if (err instanceof ApiError && err.code === 'UNAUTHORIZED') {
        await tokenStorage.clearAll();
        setToken(null);
        setUser(null);
      }
      throw err;
    }
  };

  const loginWithGithub = async (code: string, redirectUri?: string): Promise<void> => {
    setIsLoading(true);
    try {
      const payload: { code: string; redirectUri?: string } = { code };
      if (redirectUri) {
        payload.redirectUri = redirectUri;
      }
      const res = await api.post<any>('/auth/github', payload);
      const accessToken = res?.tokens?.accessToken || res?.accessToken;
      const refreshToken = res?.tokens?.refreshToken || res?.refreshToken;

      if (accessToken) {
        await tokenStorage.setAccessToken(accessToken);
        if (refreshToken) {
          await tokenStorage.setRefreshToken(refreshToken);
        }
        setToken(accessToken);

        const tokenPayload = parseJwtPayload(accessToken);
        const tokenEmail = tokenPayload?.email || '';

        if (res.user) {
          try {
            const profile = await api.get<UserProfile>('/profiles/me');
            setUser(normalizeUserProfile(profile, res.user, tokenEmail));
          } catch {
            setUser(normalizeUserProfile(res.user, null, tokenEmail));
          }
        } else {
          try {
            const profile = await api.get<UserProfile>('/profiles/me');
            setUser(normalizeUserProfile(profile, null, tokenEmail));
          } catch {
            setUser(normalizeUserProfile({ email: tokenEmail, fullName: 'GitHub User' }, null, tokenEmail));
          }
        }

        await pushNotificationService.registerDevicePushToken();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadAuth() {
      try {
        let storedToken = await tokenStorage.getAccessToken();

        // Check if there is a GitHub OAuth code in the URL (Web)
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.search) {
          const params = new URLSearchParams(window.location.search);
          const code = params.get('code');
          if (code) {
            try {
              window.history.replaceState({}, document.title, window.location.pathname);
              await loginWithGithub(code, window.location.origin);
              return;
            } catch (err) {
              console.error('GitHub web OAuth login failed:', err);
            }
          }
        }

        // Check if there is a GitHub OAuth deep link URL (Mobile cold start)
        if (Platform.OS !== 'web' && Linking.getInitialURL) {
          try {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl) {
              const match = initialUrl.match(/[?&]code=([^&]+)/);
              const code = match ? decodeURIComponent(match[1]) : null;
              if (code) {
                await loginWithGithub(code, 'teamup://github-callback');
                return;
              }
            }
          } catch (err) {
            console.error('GitHub native initial URL check failed:', err);
          }
        }

        if (storedToken && isMounted) {
          setToken(storedToken);
          try {
            const tokenPayload = parseJwtPayload(storedToken);
            const tokenEmail = tokenPayload?.email || '';
            const tokenUserId = tokenPayload?.sub || '';

            const profileData = await api.get<UserProfile>('/profiles/me');
            if (isMounted) {
              setUser(normalizeUserProfile(profileData, null, tokenEmail || tokenUserId));
              // Register push notification token if not already done
              await pushNotificationService.registerDevicePushToken().catch(console.warn);
            }
          } catch {
            await tokenStorage.clearAll();
            if (isMounted) {
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch {
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAuth();

    const subscription = Linking.addEventListener?.('url', async ({ url }) => {
      const match = url.match(/[?&]code=([^&]+)/);
      const code = match ? decodeURIComponent(match[1]) : null;
      if (code) {
        try {
          await loginWithGithub(code, 'teamup://github-callback');
        } catch (err) {
          console.error('GitHub runtime deep link login failed:', err);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.remove?.();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await api.post<any>('/auth/login', {
        email,
        password,
      });

      const accessToken = res?.tokens?.accessToken || res?.accessToken;
      const refreshToken = res?.tokens?.refreshToken || res?.refreshToken;

      if (accessToken) {
        await tokenStorage.setAccessToken(accessToken);
        if (refreshToken) {
          await tokenStorage.setRefreshToken(refreshToken);
        }
        setToken(accessToken);

        // Fetch or assign full user profile with normalized user id and email
        if (res.user) {
          try {
            const profile = await api.get<UserProfile>('/profiles/me');
            setUser(normalizeUserProfile(profile, res.user, email));
          } catch {
            setUser(normalizeUserProfile(res.user, null, email));
          }
        } else {
          try {
            const profile = await api.get<UserProfile>('/profiles/me');
            setUser(normalizeUserProfile(profile, null, email));
          } catch {
            setUser(normalizeUserProfile({ email, fullName: email.split('@')[0] }, null, email));
          }
        }

        // Register push notification token
        await pushNotificationService.registerDevicePushToken();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, code: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await api.post<any>('/auth/verify-otp', {
        email,
        code,
      });

      const accessToken = res?.tokens?.accessToken || res?.accessToken;
      const refreshToken = res?.tokens?.refreshToken || res?.refreshToken;

      if (accessToken) {
        await tokenStorage.setAccessToken(accessToken);
        if (refreshToken) {
          await tokenStorage.setRefreshToken(refreshToken);
        }
        setToken(accessToken);

        if (res.user) {
          try {
            const profile = await api.get<UserProfile>('/profiles/me');
            setUser(normalizeUserProfile(profile, res.user, email));
          } catch {
            setUser(normalizeUserProfile(res.user, null, email));
          }
        } else {
          try {
            const profile = await api.get<UserProfile>('/profiles/me');
            setUser(normalizeUserProfile(profile, null, email));
          } catch {
            setUser(normalizeUserProfile({ email, fullName: email.split('@')[0] }, null, email));
          }
        }

        await pushNotificationService.registerDevicePushToken();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await api.post<any>('/auth/register', {
        fullName,
        email,
        password,
      });

      const accessToken = res?.tokens?.accessToken || res?.accessToken;
      const refreshToken = res?.tokens?.refreshToken || res?.refreshToken;

      if (accessToken) {
        await tokenStorage.setAccessToken(accessToken);
        if (refreshToken) {
          await tokenStorage.setRefreshToken(refreshToken);
        }
        setToken(accessToken);
        try {
          const profile = await api.get<UserProfile>('/profiles/me');
          setUser(normalizeUserProfile(profile, res.user, email));
        } catch {
          setUser(normalizeUserProfile({ ...(res.user || {}), email, fullName }, null, email));
        }

        // Register push notification token
        await pushNotificationService.registerDevicePushToken();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken().catch(() => null);
      if (refreshToken) {
        api.post('/auth/logout', { refreshToken }).catch(() => {});
      }
    } catch {
      // Suppress network/token lookup errors during logout
    }

    // Immediately clear tokens and user state to trigger navigation to unauthenticated stack
    setToken(null);
    setUser(null);

    // Safely clear stored auth tokens from persistent storage and memory
    try {
      await tokenStorage.clearAll();
    } catch {
      // Ignore storage errors
    }

    // Deregister push token in background without blocking UI
    pushNotificationService.deregisterDevicePushToken().catch(() => {});
  };

  const updateUser = (updatedUser: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : (updatedUser as UserProfile)));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        verifyOtp,
        loginWithGithub,
        register,
        logout,
        updateUser,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      login: async () => {},
      verifyOtp: async () => {},
      loginWithGithub: async () => {},
      register: async () => {},
      logout: async () => {},
      updateUser: () => {},
      fetchProfile: async () => {},
    };
  }
  return context;
};
