import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../api/client';
import { colors, spacing, radius } from '../theme/colors';

type AttendanceSummary = {
  employee_name: string;
  department: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
};

export default function AdminDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    todaysScans: 0,
    dateTag: '',
  });
  const [recentAttendance, setRecentAttendance] = useState<AttendanceSummary[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      setError('');
      setLoading(true);
      try {
        const [employeesRes, attendanceRes] = await Promise.all([
          api.get('/api/employees/'),
          api.get('/api/attendance/?date=' + new Date().toISOString().slice(0, 10)),
        ]);

        const employees = employeesRes.data.employees || [];
        const today = new Date().toISOString().slice(0, 10);
        const attendance = attendanceRes.data.attendance || [];
        const presentIds = new Set(attendance.map((a: any) => a.employee_id));
        const isHolidayToday = false;

        setSummary({
          totalEmployees: employees.length,
          presentToday: presentIds.size,
          absentToday: isHolidayToday ? 0 : Math.max(employees.length - presentIds.size, 0),
          todaysScans: attendance.length,
          dateTag: isHolidayToday ? `${today} · Holiday` : today,
        });

        setRecentAttendance(attendance.slice(0, 6));
      } catch (err: any) {
        console.error('AdminDashboardScreen loadDashboard failed', err);
        setError(err.message || 'Unable to load dashboard.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Admin Dashboard</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Employees</Text>
          <Text style={styles.statValue}>{summary.totalEmployees}</Text>
        </View>
        <View style={[styles.statCard, styles.statCardSuccess]}>
          <Text style={styles.statLabel}>Present Today</Text>
          <Text style={styles.statValue}>{summary.presentToday}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCardWarn]}>
          <Text style={styles.statLabel}>Absent Today</Text>
          <Text style={styles.statValue}>{summary.absentToday}</Text>
        </View>
        <View style={[styles.statCard, styles.statCardBrand]}>
          <Text style={styles.statLabel}>Today's Scans</Text>
          <Text style={styles.statValue}>{summary.todaysScans}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Attendance</Text>
        {recentAttendance.length ? (
          recentAttendance.map((attendance, index) => (
            <View key={index} style={styles.row}>
              <View>
                <Text style={styles.rowTitle}>{attendance.employee_name}</Text>
                <Text style={styles.rowSubtitle}>{attendance.department}</Text>
              </View>
              <View style={styles.rowMeta}>
                <Text style={styles.rowMetaText}>{attendance.date}</Text>
                <Text style={styles.rowMetaText}>{attendance.check_in || '—'} / {attendance.check_out || '—'}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No attendance records for today.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  heading: { fontSize: 24, fontWeight: '700', color: colors.ink, marginBottom: spacing.lg },
  error: { color: colors.danger, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg, gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statCardSuccess: { backgroundColor: colors.successSoft, borderColor: 'rgba(29, 185, 84, 0.3)' },
  statCardWarn: { backgroundColor: colors.warnSoft, borderColor: 'rgba(245, 166, 35, 0.3)' },
  statCardBrand: { backgroundColor: colors.brandSoft, borderColor: 'rgba(14, 124, 134, 0.3)' },
  statLabel: { color: colors.muted, fontSize: 13, marginBottom: spacing.xs },
  statValue: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  section: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  rowSubtitle: { color: colors.muted, fontSize: 13 },
  rowMeta: { alignItems: 'flex-end' },
  rowMetaText: { color: colors.muted, fontSize: 12 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: spacing.lg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
