import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { registerForPushNotifications } from '../notifications';
import { colors, spacing, radius } from '../theme/colors';

export default function ProfileScreen() {
  const { employee, logout } = useAuth();
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const onToggleNotifications = async (value: boolean) => {
    if (!value) {
      // Expo doesn't support programmatically revoking permission; we just
      // stop trying to register. Actual OS-level revoke is done in Settings.
      setNotifEnabled(false);
      return;
    }
    setNotifBusy(true);
    try {
      const ok = await registerForPushNotifications();
      setNotifEnabled(ok);
      if (!ok) {
        Alert.alert(
          'Notifications disabled',
          'Please enable notification permissions for this app in your phone Settings.'
        );
      }
    } finally {
      setNotifBusy(false);
    }
  };

  const onLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(employee?.name)}</Text>
        </View>
        <Text style={styles.name}>{employee?.name}</Text>
        <Text style={styles.username}>@{employee?.username}</Text>
      </View>

      <View style={styles.card}>
        <Row label="Employee ID" value={employee?.employee_id || '—'} />
        <Row label="Department" value={employee?.department || '—'} />
        <Row label="Designation" value={employee?.designation || '—'} />
        <Row label="Shift" value={employee?.shift_name || 'Not assigned'} />
        <Row label="Email" value={employee?.email || '—'} last />
      </View>

      <View style={styles.card}>
        <View style={styles.notifRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.notifLabel}>Push Notifications</Text>
            <Text style={styles.notifHint}>Get notified when your leave or correction requests are decided.</Text>
          </View>
          {notifBusy ? <ActivityIndicator color={colors.brand} /> : (
            <Switch
              value={notifEnabled}
              onValueChange={onToggleNotifications}
              trackColor={{ true: colors.brand }}
            />
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout} disabled={loggingOut}>
        {loggingOut ? <ActivityIndicator color={colors.danger} /> : <Text style={styles.logoutText}>Log Out</Text>}
      </TouchableOpacity>
    </View>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function initials(name?: string) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '700' },
  name: { fontSize: 18, fontWeight: '700', color: colors.ink },
  username: { fontSize: 13, color: colors.muted, marginTop: 2 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowLabel: { color: colors.muted, fontSize: 13 },
  rowValue: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  notifRow: { flexDirection: 'row', alignItems: 'center' },
  notifLabel: { fontWeight: '600', color: colors.ink, fontSize: 14 },
  notifHint: { color: colors.muted, fontSize: 11.5, marginTop: 2 },
  logoutButton: {
    borderWidth: 1.5, borderColor: colors.danger, borderRadius: radius.md,
    paddingVertical: 13, alignItems: 'center', marginTop: spacing.sm,
  },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 14.5 },
});
