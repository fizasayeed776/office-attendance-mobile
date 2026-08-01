import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import UserProfileSummary from '../components/UserProfileSummary';
import NotificationToggle from '../components/NotificationToggle';
import { colors, spacing, radius, typography } from '../theme/colors';

export default function SettingsScreen({
  route,
  forceOnly = false,
}: {
  route?: any;
  forceOnly?: boolean;
}) {
  const { logout, setMustChangePassword } = useAuth();
  const insets   = useSafeAreaInsets();
  const isForced = forceOnly || route?.params?.forceOnly === true;

  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [busy, setBusy]             = useState(false);
  const [message, setMessage]       = useState('');
  const [isError, setIsError]       = useState(false);

  const onChangePassword = async () => {
    setMessage(''); setIsError(false);
    if (!currentPw || !newPw || !confirmPw) {
      setMessage('Please fill in all password fields.');
      setIsError(true);
      return;
    }
    if (newPw !== confirmPw) {
      setMessage('New password and confirmation do not match.');
      setIsError(true);
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/admin/change-password/', {
        current_password: currentPw,
        new_password: newPw,
      });
      setMessage('Password changed successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setMustChangePassword(false);
    } catch (err: any) {
      setMessage(err.message || 'Failed to change password.');
      setIsError(true);
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {!isForced && <UserProfileSummary />}

      {/* ── Force-change banner ── */}
      {isForced && (
        <View style={s.forceBanner}>
          <View style={s.forceBannerIconWrap}>
            <Ionicons name="lock-closed-outline" size={24} color={colors.warnDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.forceBannerTitle}>Password change required</Text>
            <Text style={s.forceBannerBody}>
              Your account was created with a temporary password. Please set a new password before continuing.
            </Text>
          </View>
        </View>
      )}

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
        <TextInput style={s.input} value={currentPw} onChangeText={setCurrentPw}
          secureTextEntry placeholder="Current password"
          placeholderTextColor={colors.mutedLight} editable={!busy} />

        <Text style={s.label}>New password</Text>
        <TextInput style={s.input} value={newPw} onChangeText={setNewPw}
          secureTextEntry placeholder="New password"
          placeholderTextColor={colors.mutedLight} editable={!busy} />

        <Text style={s.label}>Confirm new password</Text>
        <TextInput style={s.input} value={confirmPw} onChangeText={setConfirmPw}
          secureTextEntry placeholder="Confirm new password"
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

      {!isForced && <NotificationToggle />}

      {/* ── App info ── */}
      {!isForced && (
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
      )}

      {/* ── Log out ── */}
      {!isForced && (
        <TouchableOpacity style={s.logoutBtn} onPress={onLogout}>
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },

  forceBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    backgroundColor: colors.warnSoft, borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.warn + '44',
  },
  forceBannerIconWrap: { width: 36, height: 36, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  forceBannerTitle: { fontSize: typography.md, fontWeight: '700', color: colors.warnDark, marginBottom: spacing.xs },
  forceBannerBody: { fontSize: typography.sm, color: colors.ink2, lineHeight: 19 },

  card: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },

  messageBanner: {
    borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.md, borderLeftWidth: 3,
  },
  messageBannerError: { backgroundColor: colors.dangerSoft, borderLeftColor: colors.danger },
  messageBannerSuccess: { backgroundColor: colors.successSoft, borderLeftColor: colors.success },
  messageText: { fontSize: typography.sm, lineHeight: 19 },

  label: {
    fontSize: typography.sm, fontWeight: '600', color: colors.ink2,
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
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: typography.md },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { fontSize: typography.sm, color: colors.muted },
  infoValue: { fontSize: typography.sm, color: colors.ink, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  logoutBtn: {
    borderWidth: 1.5, borderColor: colors.danger,
    borderRadius: radius.lg, paddingVertical: 14,
    alignItems: 'center', marginTop: spacing.sm,
  },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: typography.md },
});
