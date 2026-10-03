import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const VerifyEmailScreen: React.FC = () => {
  const { colors, typography, spacing } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { email } = route.params || {};
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { verifyOtp } = useAuth();

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyOtp(email?.trim(), code.trim());
    } catch (err: any) {
      setError(err?.message || err?.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-otp', { email });
      if (Platform.OS === 'web') {
        window.alert('Verification code resent');
      } else {
        Alert.alert('Success', 'Verification code resent');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Verify Email" showBack onBack={() => navigation.goBack()} />
      <View style={[styles.content, { padding: spacing.screenPadding }]}>
        <Text style={[typography.bodyLarge, { color: colors.onSurface, marginBottom: spacing.lg }]}>
          We sent a 6-digit verification code to {email}. Please enter it below.
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.onSurface,
              borderColor: colors.border,
            },
          ]}
          placeholder="000000"
          placeholderTextColor={colors.onSurfaceVariant}
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
        />

        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

        <Button
          title={loading ? 'Verifying...' : 'Verify'}
          onPress={handleVerify}
          disabled={loading || code.length !== 6}
          style={{ marginTop: spacing.md }}
        />

        <Button
          title="Resend Code"
          variant="ghost"
          onPress={handleResend}
          style={{ marginTop: spacing.md }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
  },
  error: { marginTop: 8, textAlign: 'center' },
});
