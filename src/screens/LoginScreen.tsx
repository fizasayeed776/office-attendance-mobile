import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, fonts} from '../theme/colors';

const SHOW_SERVER_FOOTER =
  __DEV__ || API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const loginTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current); };
  }, []);

  const onSubmit = async () => {
    setError('');
    if (!username.trim() || !password) {
      setError('Please enter your username and password.');
      return;
    }
    if (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')) {
      setError('Server is set to localhost — this build cannot reach the backend. Contact your administrator.');
      return;
    }
    setBusy(true);
    loginTimeoutRef.current = setTimeout(() => {
      setBusy(false);
      setError('Login timed out. Check your internet connection and try again.');
    }, 30000);
    try {
      await login(username.trim(), password);
      if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
    } catch (e: any) {
      if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
      setError(e?.message || 'Login failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.sidebar} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Brand block ── */}
        <View style={styles.brandBlock}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoLetter}>A</Text>
          </View>
          <Text style={styles.appName}>Verity</Text>
          <Text style={styles.tagline}>Office Attendance Management</Text>
        </View>

        {/* ── Form card ── */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Sign in to your account</Text>

          {!!error && (
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={16} color={colors.danger} style={{ marginTop: 1 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="e.g. john.doe"
                placeholderTextColor={colors.mutedLight}
                editable={!busy}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <TextInput
                ref={passwordRef}
                style={[styles.input, styles.inputWithAction]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedLight}
                editable={!busy}
                returnKeyType="go"
                onSubmitEditing={onSubmit}
              />
              <TouchableOpacity
                style={styles.inputAction}
                onPress={() => setPasswordVisible((v) => !v)}
              >
                <Ionicons
                  name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, busy && styles.btnDisabled]}
            onPress={onSubmit}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <View style={styles.btnInner}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.btnText}>Signing in…</Text>
              </View>
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Setup link */}
          <TouchableOpacity
            style={styles.setupBtn}
            onPress={() => navigation.navigate('SetupAccount')}
            disabled={busy}
          >
            <Text style={styles.setupBtnText}>Set up your login</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Don't have a login yet? Ask your admin to add you as an employee, then use "Set up your login" above.
          </Text>
        </View>

        {/* ── Server footer (dev / localhost builds only) ── */}
        {SHOW_SERVER_FOOTER && (
          <View style={styles.serverFooter}>
            <Text style={styles.serverLabel}>Server</Text>
            <Text
              style={[
                styles.serverUrl,
                (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1'))
                  && styles.serverUrlBad,
              ]}
              numberOfLines={1}
            >
              {API_BASE_URL}
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sidebar },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  // ── Brand
  brandBlock: { alignItems: 'center', marginBottom: spacing.xxl },
  logoWrap: {
    width: 72, height: 72, borderRadius: radius.xl,
    backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoLetter: { color: '#fff', fontSize: typography.display, fontFamily: 'Inter_800ExtraBold' },
  appName: { color: '#fff', fontSize: typography.xxxl, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
  tagline: { color: colors.tabBarInactive, fontSize: typography.sm, marginTop: spacing.xs, letterSpacing: 0.3 },

  // ── Card
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    padding: spacing.xl,
  },
  cardHeading: {
    fontSize: typography.xl,
    fontFamily: 'Inter_700Bold',
    color: colors.ink,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },

  // ── Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.dangerSoft,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: { flex: 1, color: colors.danger, fontSize: typography.base, lineHeight: 20 },

  // ── Fields
  fieldGroup: { marginBottom: spacing.md },
  fieldLabel: {
    fontSize: typography.sm,
    fontFamily: 'Inter_600SemiBold',
    color: colors.ink2,
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: typography.md,
    color: colors.ink,
  },
  inputWithAction: { paddingRight: 0 },
  inputAction: { paddingHorizontal: spacing.md, paddingVertical: 13 },

  // ── Button
  btn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.7 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  btnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: typography.md, letterSpacing: 0.3 },

  // ── Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.muted, fontSize: typography.sm },

  // ── Setup link
  setupBtn: {
    borderWidth: 1.5,
    borderColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  setupBtnText: { color: colors.brand, fontFamily: 'Inter_700Bold', fontSize: typography.md },

  hint: {
    color: colors.muted,
    fontSize: typography.xs,
    lineHeight: 17,
    textAlign: 'center',
  },

  // ── Server footer
  serverFooter: { marginTop: spacing.xl, alignItems: 'center' },
  serverLabel: {
    fontSize: 9,
    color: colors.tabBarInactive,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  serverUrl: { fontSize: 10, color: colors.tabBarInactive, marginTop: spacing.xxs },
  serverUrlBad: { color: colors.danger, fontFamily: 'Inter_700Bold' },
});
