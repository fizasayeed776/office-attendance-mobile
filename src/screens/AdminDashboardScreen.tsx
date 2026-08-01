import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { colors, spacing, radius, typography } from '../theme/colors';

import { Ionicons } from '@expo/vector-icons';

type AttendanceRow = {
  employee_name: string;
  employee_id: string;
  department: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  is_late: boolean;
};

type Summary = {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  todaysScans: number;
  dateTag: string;
};

const STAT_CONFIGS = [
  { key: 'totalEmployees',  label: 'TOTAL EMPLOYEES', badge: 'Registered',     badgeBg: colors.brandSoft,   badgeFg: colors.brand   },
  { key: 'presentToday',    label: 'PRESENT TODAY',   badge: 'Checked in',     badgeBg: colors.successSoft, badgeFg: colors.success },
  { key: 'absentToday',     label: 'ABSENT TODAY',    badge: 'Not yet scanned',badgeBg: colors.warnSoft,    badgeFg: colors.warn    },
  { key: 'todaysScans',     label: "TODAY'S SCANS",   badge: null,             badgeBg: '',                 badgeFg: ''             },
];

const QUICK_ACTIONS = [
  { label: 'Add Employee',    ionicon: 'person-add-outline', tab: 'Employees', screen: 'AddEmployee'    },
  { label: 'Employees List',  ionicon: 'people-outline',     tab: 'Employees', screen: 'EmployeeList'   },
  { label: 'Mark Attendance', ionicon: 'camera-outline',     tab: 'Attendance',screen: 'MarkAttendance' },
  { label: 'Attendance List', ionicon: 'list-outline',       tab: 'Attendance',screen: 'AttendanceList' },
];

export default function AdminDashboardScreen({ navigation }: any) {
  const { adminUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<Summary>({
    totalEmployees: 0, presentToday: 0, absentToday: 0, todaysScans: 0, dateTag: '',
  });
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRow[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [empRes, attRes] = await Promise.all([
        api.get('/api/employees/'),
        api.get(`/api/attendance/?date=${today}`),
      ]);
      const employees  = empRes.data.employees  || [];
      const attendance = attRes.data.attendance || [];
      const presentIds = new Set(attendance.map((a: any) => a.employee_id));

      setSummary({
        totalEmployees: employees.length,
        presentToday:   presentIds.size,
        absentToday:    Math.max(employees.length - presentIds.size, 0),
        todaysScans:    attendance.length,
        dateTag:        today,
      });
      setRecentAttendance(attendance.slice(0, 8));
    } catch (err: any) {
      setError(err.message || 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const navigate = (tab: string, screen: string) => {
    navigation.navigate(tab, { screen });
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.adminName}>{adminUser?.name ?? 'Administrator'}</Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{(adminUser?.staff_role ?? 'ADMIN').toUpperCase()}</Text>
        </View>
      </View>

      {/* ── Date bar ── */}
      <View style={styles.datebar}>
        <Text style={styles.datebarText}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {!!error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ── Stat cards (2×2 grid matching web) ── */}
      <View style={styles.statsGrid}>
        {STAT_CONFIGS.map((cfg) => {
          const value = summary[cfg.key as keyof Summary];
          return (
            <View key={cfg.key} style={styles.statCard}>
              <Text style={styles.statLabel}>{cfg.label}</Text>
              <Text style={styles.statValue}>{value}</Text>
              {cfg.badge ? (
                <View style={[styles.statBadge, { backgroundColor: cfg.badgeBg }]}>
                  <Text style={[styles.statBadgeText, { color: cfg.badgeFg }]}>{cfg.badge}</Text>
                </View>
              ) : (
                <View style={[styles.statBadge, { backgroundColor: colors.brandSoft }]}>
                  <Text style={[styles.statBadgeText, { color: colors.brand }]}>{summary.dateTag}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* ── Quick actions (2×2 grid matching web shortcuts) ── */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.actionCard}
            onPress={() => navigate(action.tab, action.screen)}
            activeOpacity={0.75}
          >
            <Ionicons name={action.ionicon as any} size={24} color={colors.brand} />
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Recent attendance table ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleInline}>Recent Attendance</Text>
          <TouchableOpacity onPress={() => navigate('Attendance', 'AttendanceList')}>
            <Text style={styles.viewAll}>View all →</Text>
          </TouchableOpacity>
        </View>

        {/* Table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>EMPLOYEE</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>DATE</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>IN</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>OUT</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>STATUS</Text>
        </View>

        {recentAttendance.length ? (
          recentAttendance.map((row, i) => (
            <View
              key={`${row.employee_id}-${row.date}-${i}`}
              style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}
            >
              {/* Avatar + name */}
              <View style={[styles.tableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }]}>
                <View style={styles.miniAvatar}>
                  <Text style={styles.miniAvatarText}>
                    {(row.employee_name?.[0] ?? '?').toUpperCase()}
                    {(row.employee_name?.split(' ')?.[1]?.[0] ?? '').toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tableCellPrimary} numberOfLines={1}>{row.employee_name}</Text>
                  <Text style={styles.tableCellSecondary} numberOfLines={1}>{row.employee_id}</Text>
                </View>
              </View>

              <Text style={[styles.tableCellText, { flex: 1.2 }]}>{row.date}</Text>
              <Text style={[styles.tableCellText, { flex: 1 }]}>{row.check_in || '—'}</Text>
              <Text style={[styles.tableCellText, { flex: 1 }]}>{row.check_out || '—'}</Text>

              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={[
                  styles.statusChip,
                  row.is_late
                    ? { backgroundColor: colors.lateBg }
                    : { backgroundColor: colors.presentBg },
                ]}>
                  <Text style={[
                    styles.statusChipText,
                    { color: row.is_late ? colors.lateFg : colors.presentFg },
                  ]}>
                    {row.is_late ? 'Late' : 'On time'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No attendance records today.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  loadingWrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },

  // ── Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  greeting: { fontSize: typography.base, color: colors.muted, fontWeight: '500' },
  adminName: { fontSize: typography.xxl, fontWeight: '800', color: colors.ink, marginTop: 2 },
  roleBadge: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  roleText: { fontSize: typography.xs, fontWeight: '700', color: colors.brand, letterSpacing: 0.5 },

  // ── Date bar
  datebar: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  datebarText: { fontSize: typography.sm, color: colors.muted, fontWeight: '500' },

  // ── Error
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  errorText: { color: colors.danger, fontSize: typography.base },

  // ── Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '47.5%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.ink,
    lineHeight: 44,
    marginBottom: spacing.sm,
  },
  statBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  statBadgeText: { fontSize: typography.xs, fontWeight: '700' },

  // ── Quick actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionCard: {
    width: '47.5%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  actionLabel: { fontSize: typography.md, fontWeight: '700', color: colors.ink },

  // ── Section
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  // sectionTitle used standalone (with bottom margin) — e.g. "Quick Actions"
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing.md,
  },
  // sectionTitleInline — same type style but no margin; used inside
  // sectionHeader which already supplies its own vertical padding.
  sectionTitleInline: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: colors.ink,
  },
  viewAll: { fontSize: typography.sm, color: colors.brand, fontWeight: '600' },

  // ── Table
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgDeep,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tableRowAlt: { backgroundColor: colors.bgDeep },
  tableCell: { flexDirection: 'row', alignItems: 'center' },
  tableCellPrimary: { fontSize: typography.sm, fontWeight: '600', color: colors.ink },
  tableCellSecondary: { fontSize: typography.xs, color: colors.muted, marginTop: 1 },
  tableCellText: { fontSize: typography.sm, color: colors.ink2 },

  miniAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: { fontSize: 10, fontWeight: '700', color: colors.brand },

  statusChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statusChipText: { fontSize: typography.xs, fontWeight: '700' },

  emptyRow: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: { color: colors.muted, fontSize: typography.base },
});
