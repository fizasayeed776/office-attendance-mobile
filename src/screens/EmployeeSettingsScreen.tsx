import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import UserProfileSummary from '../components/UserProfileSummary';
import NotificationToggle from '../components/NotificationToggle';
import api from '../api/client';
import { colors, spacing, radius, typography, fonts} from '../theme/colors';

export default function EmployeeSettingsScreen() {
  const { logout, employee, updateEmployee } = useAuth();
  const insets     = useSafeAreaInsets();
  const [loggingOut, setLoggingOut] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [selectedImage, setSelectedImage] = useState(employee?.profile_picture || '');
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

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setMessage('Image picker permission is required to select a profile photo.');
      setIsError(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
      base64: false,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const image = result.assets[0];
    if (!image.uri) {
      return;
    }

    const manipulated = await ImageManipulator.manipulateAsync(
      image.uri,
      [{ resize: { width: 400, height: 400 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    setSelectedImage(`data:image/jpeg;base64,${manipulated.base64}`);
  };

  const handleSaveProfile = async () => {
    setMessage(''); setIsError(false);
    setBusy(true);
    try {
      const payload: any = {};
      if (selectedImage) {
        payload.profile_picture = selectedImage;
      }
      await api.patch('/api/employees/profile/', payload);
      setMessage('Profile updated successfully.');
      updateEmployee({ profile_picture: selectedImage });
    } catch (e: any) {
      setMessage(e.message || 'Failed to save profile.');
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
        <UserProfileSummary profilePictureUrl={selectedImage || employee?.profile_picture} onAvatarPress={handlePickImage} />
        <View style={s.profileActions}>
          <TouchableOpacity style={s.smallButton} onPress={handlePickImage}>
            <Text style={s.smallButtonText}>Change photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.smallButton, s.smallButtonSecondary]} onPress={() => { setSelectedImage(employee?.profile_picture || ''); }}>
            <Text style={[s.smallButtonText, s.smallButtonSecondaryText]}>Reset</Text>
          </TouchableOpacity>
        </View>
        <View style={s.profileBody}>
          <TouchableOpacity
            style={[s.saveBtn, busy && s.saveBtnDisabled]}
            onPress={handleSaveProfile}
            disabled={busy}
          >
            {busy
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.saveBtnText}>Save profile</Text>}
          </TouchableOpacity>
        </View>
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
  profileActions: {
    flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm,
  },
  profileBody: {
    paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
  },
  smallButton: {
    flex: 1, paddingVertical: 12, borderRadius: radius.md,
    backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center',
  },
  smallButtonSecondary: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
  },
  smallButtonText: {
    fontSize: typography.sm, fontFamily: 'Inter_700Bold', color: colors.brand,
  },
  smallButtonSecondaryText: {
    color: colors.ink,
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
