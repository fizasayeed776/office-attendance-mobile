import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import UserProfileSummary from '../components/UserProfileSummary';
import NotificationToggle from '../components/NotificationToggle';
import api from '../api/client';
import { colors, spacing, radius, typography } from '../theme/colors';

export default function EmployeeSettingsScreen() {
  const { logout, employee } = useAuth();
  const insets     = useSafeAreaInsets();
  const [loggingOut, setLoggingOut] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [busy, setBusy]           = useState(false);
  const [message, setMessage]     = useState('');
  const [isError, setIsError]     = useState(false);

  const onLogout = () => { setLoggingOut(true); logout(); };

  const onChangePassword = async () => {
    setMessage(''); setIsError(false);
    if (!currentPw || !newPw) { setMessage('Please fill in both password fields.'); setIsError(true); return; }
    if (newPw.length < 4) { setMessage('New password must be at least 4 characters.'); setIsError(true); return; }
    if (newPw !== confirmPw) { setMessage('Passwords do not match.'); setIsError(true); return; }
    setBusy(true);
    try {
      await api.post('/api/employees/change-password/', {
        current_password: currentPw, new_password: newPw,
      });
      setMessage('Password changed successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: any) {
      setMessage(e.message || 'Failed to change password.');
      setIsError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.profileCard}>
        <UserProfileSummary />
      </View>
      <NotificationToggle />

      {/* ── App info ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>App Info</Text>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>App</Text>
          <Text style={s.infoValue}>Office Attendance Mobile</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Version</Text>
          <Text style={s.infoValue}>{Constants.expoConfig?.version || '1.0.0'}</Text>
        </View>
        <View style={[s.infoRow, s.infoRowLast]}>
          <Text style={s.infoLabel}>Support</Text>
          <Text style={s.infoValue}>Contact your system administrator</Text>
        </View>
      </View>

      {/* ── Change password card ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Change Password</Text>

        {!!message && (
          <View style={[s.messageBanner, isError ? s.messageBannerError : s.messageBannerSuccess]}>
            <Text style={[s.messageText, { color: isError ? colors.danger : colors.success }]}>
              {message}
            </Text>
          </View>
        )}

        <Text style={s.label}>Current password</Text>
        <TextInput style={s.input} secureTextEntry value={currentPw}
          onChangeText={setCurrentPw} placeholder="Current password"
          placeholderTextColor={colors.mutedLight} editable={!busy} />

        <Text style={s.label}>New password</Text>
        <TextInput style={s.input} secureTextEntry value={newPw}
          onChangeText={setNewPw} placeholder="Min. 4 characters"
          placeholderTextColor={colors.mutedLight} editable={!busy} />

        <Text style={s.label}>Confirm new password</Text>
        <TextInput style={s.input} secureTextEntry value={confirmPw}
          onChangeText={setConfirmPw} placeholder="Re-enter new password"
          placeholderTextColor={colors.mutedLight} editable={!busy} />

        <TouchableOpacity
          style={[s.saveBtn, busy && s.saveBtnDisabled]}
          onPress={onChangePassword}
          disabled={busy}
        >
          {busy
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.saveBtnText}>Update Password</Text>}
        </TouchableOpacity>
      </View>

      {/* ── Log out ── */}
      <TouchableOpacity style={s.logoutBtn} onPress={onLogout} disabled={loggingOut}>
        {loggingOut
          ? <ActivityIndicator color={colors.danger} />
          : <Text style={s.logoutText}>Log Out</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },

  card: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { fontSize: typography.sm, color: colors.muted, flex: 1 },
  infoValue: { fontSize: typography.sm, color: colors.ink, fontFamily: 'Inter_600SemiBold', flex: 1, textAlign: 'right', flexWrap: 'wrap' },
  profileCard: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    padding: 0, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardTitle: { fontSize: typography.lg, fontFamily: 'Inter_700Bold', color: colors.ink, marginBottom: spacing.md },

  messageBanner: {
    borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.md, borderLeftWidth: 3,
  },
  messageBannerError: { backgroundColor: colors.dangerSoft, borderLeftColor: colors.danger },
  messageBannerSuccess: { backgroundColor: colors.successSoft, borderLeftColor: colors.success },
  messageText: { fontSize: typography.sm, lineHeight: 19 },

  label: {
    fontSize: typography.sm, fontFamily: 'Inter_600SemiBold', color: colors.ink2,
    marginTop: spacing.md, marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12,
    fontSize: typography.md, color: colors.ink,
  },
  saveBtn: {
    backgroundColor: colors.brand, borderRadius: radius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: spacing.lg,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: typography.md },

  logoutBtn: {
    borderWidth: 1.5, borderColor: colors.danger,
    borderRadius: radius.lg, paddingVertical: 14,
    alignItems: 'center', marginTop: spacing.sm,
  },
  logoutText: { color: colors.danger, fontFamily: 'Inter_700Bold', fontSize: typography.md },
});
