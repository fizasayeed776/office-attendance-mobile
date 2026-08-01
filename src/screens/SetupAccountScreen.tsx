import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme/colors';
import api from '../api/client';

type Step = 'verify' | 'credentials';

export default function SetupAccountScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('verify');

  // Verify step
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');

  // Credentials step
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const emailRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const onVerify = async () => {
    setError('');
    if (!employeeId.trim() || !email.trim()) {
      setError('Please enter your Employee ID and email.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/employees/verify-setup/', {
        employee_id: employeeId.trim(),
        email: email.trim().toLowerCase(),
      });
      setStep('credentials');
    } catch (e: any) {
      setError(e.message || 'Verification failed. Check your Employee ID and email.');
    } finally {
      setBusy(false);
    }
  };

  const onCreate = async () => {
    setError('');
    if (!username.trim() || !password) {
      setError('Please choose a username and password.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/employees/setup-account/', {
        employee_id: employeeId.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim(),
        password,
      });
      navigation.replace('Login');
    } catch (e: any) {
      setError(e.message || 'Failed to set up account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const STEPS = ['Verify Identity', 'Create Login'];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Step indicator ── */}
        <View style={styles.stepRow}>
          {STEPS.map((label, i) => {
            const active = i === (step === 'verify' ? 0 : 1);
            const done = i === 0 && step === 'credentials';
            return (
              <React.Fragment key={label}>
                <View style={styles.stepItem}>
                  <View style={[
                    styles.stepDot,
                    active && styles.stepDotActive,
                    done && styles.stepDotDone,
                  ]}>
                    <Text style={[
                      styles.stepDotText,
                      (active || done) && styles.stepDotTextActive,
                    ]}>
                      {done ? <Ionicons name="checkmark" size={14} color="#fff" /> : String(i + 1)}
                    </Text>
                  </View>
                  <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
                    {label}
                  </Text>
                </View>
                {i < STEPS.length - 1 && (
                  <View style={[styles.stepConnector, done && styles.stepConnectorDone]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>
            {step === 'verify' ? 'Verify your identity' : 'Create your login'}
          </Text>
          <Text style={styles.cardSubheading}>
            {step === 'verify'
              ? 'Enter your Employee ID and the email your admin registered for you.'
              : 'Choose a username and password for your account.'}
          </Text>

          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {step === 'verify' ? (
            <>
              <Field label="Employee ID">
                <TextInput
                  style={styles.input}
                  value={employeeId}
                  onChangeText={setEmployeeId}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder="e.g. EMP-0001"
                  placeholderTextColor={colors.mutedLight}
                  editable={!busy}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              </Field>
              <Field label="Email address">
                <TextInput
                  ref={emailRef}
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="as provided by admin"
                  placeholderTextColor={colors.mutedLight}
                  editable={!busy}
                  returnKeyType="go"
                  onSubmitEditing={onVerify}
                />
              </Field>
              <TouchableOpacity
                style={[styles.btn, busy && styles.btnDisabled]}
                onPress={onVerify}
                disabled={busy}
              >
                {busy
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Verify Identity</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={14} color={colors.brand} />
                <Text style={styles.backBtnText}>Back to sign in</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Field label="Choose a username">
                <TextInput
                  ref={usernameRef}
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="e.g. jane.doe"
                  placeholderTextColor={colors.mutedLight}
                  editable={!busy}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </Field>
              <Field label="Password">
                <View style={styles.inputRow}>
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, styles.inputFlex]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!passwordVisible}
                    placeholder="Min. 4 characters"
                    placeholderTextColor={colors.mutedLight}
                    editable={!busy}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setPasswordVisible((v) => !v)}
                  >
                    <Ionicons
                      name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.muted}
                    />
                  </TouchableOpacity>
                </View>
              </Field>
              <Field label="Confirm password">
                <TextInput
                  ref={confirmRef}
                  style={styles.input}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry={!passwordVisible}
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.mutedLight}
                  editable={!busy}
                  returnKeyType="go"
                  onSubmitEditing={onCreate}
                />
              </Field>
              <TouchableOpacity
                style={[styles.btn, busy && styles.btnDisabled]}
                onPress={onCreate}
                disabled={busy}
              >
                {busy
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Create Account</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('verify')}>
                <Ionicons name="chevron-back" size={14} color={colors.brand} />
                <Text style={styles.backBtnText}>Back to verification</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.ink2,
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    padding: spacing.xl,
  },

  // ── Step indicator
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  stepItem: { alignItems: 'center', gap: spacing.xs },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: colors.brand },
  stepDotDone: { backgroundColor: colors.success },
  stepDotText: { fontSize: typography.sm, fontWeight: '700', color: colors.muted },
  stepDotTextActive: { color: '#fff' },
  stepLabel: { fontSize: typography.xs, color: colors.muted, fontWeight: '600' },
  stepLabelActive: { color: colors.brand },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },
  stepConnectorDone: { backgroundColor: colors.success },

  // ── Card
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  cardHeading: {
    fontSize: typography.xxl,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  cardSubheading: {
    fontSize: typography.base,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },

  // ── Error
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: typography.base, lineHeight: 20 },

  // ── Inputs
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: typography.md,
    color: colors.ink,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  inputFlex: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  eyeBtn: { paddingHorizontal: spacing.md },

  // ── Button
  btn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: typography.md, letterSpacing: 0.3 },

  backBtn: { marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 },
  backBtnText: { color: colors.brand, fontWeight: '600', fontSize: typography.base },
});
