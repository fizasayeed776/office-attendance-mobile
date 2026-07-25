import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius } from '../theme/colors';

type DashboardData = {
  employee: { name: string; department: string; designation: string; shift_name?: string };
  today_attendance: { check_in: string | null; check_out: string | null; is_late?: boolean } | null;
  leave_balance: { leave_type: string; allocated: number; used: number; remaining: number }[];
  pending_leaves: number;
  pending_corrections: number;
};

export default function DashboardScreen({ navigation }: any) {
  const { employee } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/mobile/dashboard/');
      setData(res.data);
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const attendanceStatus = !data?.today_attendance
    ? { label: 'Not checked in yet', color: colors.muted }
    : !data.today_attendance.check_out
    ? { label: `Checked in at ${data.today_attendance.check_in}`, color: colors.success }
    : { label: `Checked out at ${data.today_attendance.check_out}`, color: colors.brand };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
    >
      <Text style={styles.greeting}>Hi, {employee?.name?.split(' ')[0] || 'there'} 👋</Text>
      <Text style={styles.subGreeting}>
        {employee?.designation} {employee?.department ? `· ${employee.department}` : ''}
      </Text>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>TODAY'S STATUS</Text>
        <Text style={[styles.statusValue, { color: attendanceStatus.color }]}>{attendanceStatus.label}</Text>
      </View>

      <View style={styles.actionsRow}>
        <ActionButton label="Mark Attendance" onPress={() => navigation.navigate('FaceAttendance')} primary />
        <ActionButton label="Apply Leave" onPress={() => navigation.navigate('Leaves', { openApply: true })} />
      </View>
      <View style={styles.actionsRow}>
        <ActionButton label="Request Correction" onPress={() => navigation.navigate('Corrections', { openApply: true })} />
        <ActionButton label="Attendance History" onPress={() => navigation.navigate('History')} />
      </View>

      {(data?.pending_leaves || data?.pending_corrections) ? (
        <View style={styles.pendingCard}>
          {!!data?.pending_leaves && (
            <Text style={styles.pendingText}>📋 {data.pending_leaves} leave request(s) pending approval</Text>
          )}
          {!!data?.pending_corrections && (
            <Text style={styles.pendingText}>🕓 {data.pending_corrections} correction request(s) pending approval</Text>
          )}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Leave Balance</Text>
      <View style={styles.balanceGrid}>
        {(data?.leave_balance || []).map((b) => (
          <View key={b.leave_type} style={styles.balanceCard}>
            <Text style={styles.balanceType}>{b.leave_type}</Text>
            <Text style={styles.balanceValue}>
              {b.remaining} <Text style={styles.balanceOf}>/ {b.allocated}</Text>
            </Text>
            <Text style={styles.balanceUsed}>{b.used} used this year</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function ActionButton({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, primary && styles.actionButtonPrimary]}
      onPress={onPress}
    >
      <Text style={[styles.actionButtonText, primary && styles.actionButtonTextPrimary]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.ink },
  subGreeting: { fontSize: 13.5, color: colors.muted, marginTop: 2, marginBottom: spacing.lg },
  errorText: { color: colors.danger, marginBottom: spacing.md },
  statusCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg,
  },
  statusLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.5 },
  statusValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  actionButton: {
    flex: 1, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingVertical: 14, alignItems: 'center',
  },
  actionButtonPrimary: { backgroundColor: colors.brand, borderColor: colors.brand },
  actionButtonText: { fontWeight: '600', color: colors.ink2, fontSize: 13.5 },
  actionButtonTextPrimary: { color: '#fff' },
  pendingCard: {
    backgroundColor: colors.warnSoft, borderRadius: radius.md, padding: spacing.md,
    marginTop: spacing.sm, marginBottom: spacing.lg,
  },
  pendingText: { color: colors.ink2, fontSize: 13, marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  balanceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  balanceCard: {
    width: '47%', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  balanceType: { fontSize: 11.5, color: colors.muted, fontWeight: '600' },
  balanceValue: { fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: 2 },
  balanceOf: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  balanceUsed: { fontSize: 11, color: colors.muted, marginTop: 2 },
});
