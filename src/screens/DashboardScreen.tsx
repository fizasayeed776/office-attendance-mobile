import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius, shadows, typography } from '../theme/colors';

type DashboardData = {
  employee: {
    name: string; department: string; designation: string;
    employee_id: string; shift_name?: string;
  };
  today_attendance: {
    check_in: string | null; check_out: string | null; is_late?: boolean;
  } | null;
  leave_balance: {
    leave_type: string; allocated: number; used: number; remaining: number;
  }[];
  pending_leaves: number;
  pending_corrections: number;
};

type ActionDef = {
  label: string; sub: string; icon: string;
  screen: string; primary?: boolean;
};

const ACTIONS: ActionDef[] = [
  { label: 'Mark Attendance', sub: 'Face recognition',  icon: '📷', screen: 'FaceAttendance', primary: true  },
  { label: 'Apply for Leave', sub: 'Submit a request',  icon: '📋', screen: 'Leaves'                         },
  { label: 'Request Fix',     sub: 'Attendance correction',icon: '🔧', screen: 'Corrections'                 },
  { label: 'View History',    sub: 'Past records',      icon: '📅', screen: 'History'                        },
];

function initials(name?: string) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2)
    .map((w) => w[0]?.toUpperCase()).join('');
}

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
      setError(e.message || 'Unable to load dashboard.');
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const att = data?.today_attendance;
  const checkedIn  = !!att?.check_in;
  const checkedOut = !!att?.check_out;

  const statusLabel = !checkedIn
    ? 'Not checked in yet'
    : !checkedOut
    ? `Checked in at ${att?.check_in}`
    : `Checked out at ${att?.check_out}`;

  const statusColor = !checkedIn ? colors.muted : !checkedOut ? colors.success : colors.brand;
  const statusBg    = !checkedIn ? colors.bgDeep  : !checkedOut ? colors.successSoft : colors.brandSoft;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleAction = (screen: string) => {
    if (screen === 'FaceAttendance') {
      navigation.navigate('FaceAttendance');
    } else if (screen === 'History') {
      navigation.navigate('History');
    } else {
      navigation.navigate(screen);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Profile header ── */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(employee?.name)}</Text>
        </View>
        <View style={styles.profileMeta}>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.profileName}>{employee?.name?.split(' ')[0] ?? 'there'}</Text>
          <Text style={styles.profileSub} numberOfLines={1}>
            {[data?.employee?.designation, data?.employee?.department]
              .filter(Boolean).join(' · ') || employee?.department || ''}
          </Text>
        </View>
      </View>

      {!!error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ── Today's status hero card ── */}
      <View style={[styles.heroCard, { backgroundColor: statusBg, borderColor: statusColor + '33' }]}>
        <View style={styles.heroTop}>
          <Text style={styles.heroLabel}>TODAY'S STATUS</Text>
          <Text style={styles.heroDate}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </Text>
        </View>
        <Text style={[styles.heroStatus, { color: statusColor }]}>{statusLabel}</Text>
        {att?.is_late && (
          <View style={styles.lateBadge}>
            <Text style={styles.lateBadgeText}>⏱ Late arrival</Text>
          </View>
        )}
        {checkedIn && !checkedOut && (
          <View style={styles.heroTimeline}>
            <View style={styles.heroTimelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: colors.success }]} />
              <Text style={styles.heroTimelineText}>In  {att?.check_in}</Text>
            </View>
            <View style={styles.heroTimelineLine} />
            <View style={styles.heroTimelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: colors.border }]} />
              <Text style={styles.heroTimelineText}>Out  —</Text>
            </View>
          </View>
        )}
        {checkedOut && (
          <View style={styles.heroTimeline}>
            <View style={styles.heroTimelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: colors.success }]} />
              <Text style={styles.heroTimelineText}>In  {att?.check_in}</Text>
            </View>
            <View style={styles.heroTimelineLine} />
            <View style={styles.heroTimelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: colors.brand }]} />
              <Text style={styles.heroTimelineText}>Out  {att?.check_out}</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Pending alerts ── */}
      {(!!data?.pending_leaves || !!data?.pending_corrections) && (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>Pending approvals</Text>
          {!!data?.pending_leaves && (
            <Text style={styles.alertItem}>📋  {data.pending_leaves} leave request{data.pending_leaves > 1 ? 's' : ''} awaiting approval</Text>
          )}
          {!!data?.pending_corrections && (
            <Text style={styles.alertItem}>🔧  {data.pending_corrections} correction request{data.pending_corrections > 1 ? 's' : ''} awaiting approval</Text>
          )}
        </View>
      )}

      {/* ── Quick action grid ── */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={[styles.actionCard, action.primary && styles.actionCardPrimary]}
            onPress={() => handleAction(action.screen)}
            activeOpacity={0.75}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={[styles.actionLabel, action.primary && styles.actionLabelPrimary]}>
              {action.label}
            </Text>
            <Text style={[styles.actionSub, action.primary && styles.actionSubPrimary]}>
              {action.sub}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Leave balance ── */}
      {data?.leave_balance?.length ? (
        <>
          <Text style={styles.sectionTitle}>Leave Balance</Text>
          <View style={styles.balanceGrid}>
            {data.leave_balance.map((b) => {
              const pct = b.allocated > 0 ? b.remaining / b.allocated : 0;
              const barColor = pct > 0.5 ? colors.success : pct > 0.2 ? colors.warn : colors.danger;
              return (
                <View key={b.leave_type} style={styles.balanceCard}>
                  <Text style={styles.balanceType} numberOfLines={2}>{b.leave_type}</Text>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceValue}>{b.remaining}</Text>
                    <Text style={styles.balanceTotal}>/ {b.allocated}</Text>
                  </View>
                  {/* Progress bar */}
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: barColor }]} />
                  </View>
                  <Text style={styles.balanceUsed}>{b.used} used</Text>
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },

  // ── Profile header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },
  avatarText: { color: '#fff', fontSize: typography.lg, fontWeight: '700' },
  profileMeta: { flex: 1 },
  greeting: { fontSize: typography.sm, color: colors.muted, fontWeight: '500' },
  profileName: { fontSize: typography.xl, fontWeight: '800', color: colors.ink },
  profileSub: { fontSize: typography.sm, color: colors.muted, marginTop: 2 },

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

  // ── Hero card
  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  heroLabel: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 0.6,
  },
  heroDate: { fontSize: typography.sm, color: colors.muted, fontWeight: '500' },
  heroStatus: { fontSize: typography.xl, fontWeight: '700', marginBottom: spacing.sm },
  lateBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warnSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    marginBottom: spacing.sm,
  },
  lateBadgeText: { fontSize: typography.xs, color: colors.warn, fontWeight: '700' },
  heroTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  heroTimelineItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  heroTimelineText: { fontSize: typography.sm, color: colors.ink2, fontWeight: '600' },
  heroTimelineLine: { flex: 1, height: 1, backgroundColor: colors.borderStrong },

  // ── Alerts
  alertCard: {
    backgroundColor: colors.warnSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warn + '44',
    gap: spacing.xs,
  },
  alertTitle: { fontSize: typography.sm, fontWeight: '700', color: colors.warnDark },
  alertItem: { fontSize: typography.base, color: colors.ink2 },

  // ── Section title
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing.md,
  },

  // ── Actions grid
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
    gap: spacing.xxs,
    ...shadows.sm,
  },
  actionCardPrimary: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
    ...shadows.md,
  },
  actionIcon: { fontSize: 22, marginBottom: spacing.xs },
  actionLabel: { fontSize: typography.md, fontWeight: '700', color: colors.ink },
  actionLabelPrimary: { color: '#fff' },
  actionSub: { fontSize: typography.xs, color: colors.muted },
  actionSubPrimary: { color: 'rgba(255,255,255,0.75)' },

  // ── Leave balance
  balanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  balanceCard: {
    width: '47.5%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  balanceType: {
    fontSize: typography.xs,
    color: colors.muted,
    fontWeight: '600',
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginBottom: spacing.xs },
  balanceValue: { fontSize: typography.xxl, fontWeight: '800', color: colors.ink },
  balanceTotal: { fontSize: typography.sm, color: colors.muted, fontWeight: '500' },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.pill },
  balanceUsed: { fontSize: typography.xs, color: colors.muted },
});
