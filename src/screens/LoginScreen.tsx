import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius } from '../theme/colors';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError('');
    if (!username.trim() || !password) {
      setError('Please enter your username and password.');
      return;
    }
    setBusy(true);
    console.log('LoginScreen.onSubmit start', { username: username.trim() });
    try {
      await login(username.trim(), password);
      console.log('LoginScreen.onSubmit success');
    } catch (e: any) {
      console.error('LoginScreen.onSubmit error', e);
      setError(e.message || 'Login failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.brandBlock}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>A</Text>
        </View>
        <Text style={styles.title}>Office Attendance</Text>
        <Text style={styles.subtitle}>Sign in with the account your admin set up for you</Text>
      </View>

      <View style={styles.card}>
        {!!error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="e.g. john.doe"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
        />

        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Don't have a login yet? Ask your administrator or HR to add you as an employee, then
          use the "Set up your login" link on the office kiosk to create your username and password.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: spacing.xl },
  brandBlock: { alignItems: 'center', marginBottom: spacing.xxl },
  logoCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 13.5, color: colors.muted, marginTop: spacing.xs, textAlign: 'center' },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.ink2, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 15, color: colors.ink,
  },
  button: {
    backgroundColor: colors.brand, borderRadius: radius.sm, paddingVertical: 13,
    alignItems: 'center', marginTop: spacing.lg,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  error: {
    backgroundColor: colors.dangerSoft, color: colors.danger, padding: spacing.sm,
    borderRadius: radius.sm, marginBottom: spacing.sm, fontSize: 13,
  },
  hint: { fontSize: 11.5, color: colors.muted, marginTop: spacing.lg, lineHeight: 16 },
});
