import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { colors, spacing, radius, typography, fonts} from '../theme/colors';

type AttendanceRow = {
  date: string; check_in: string | null; check_out: string | null;
  is_late: boolean; is_early_departure: boolean;
  overtime_minutes: number; is_holiday: boolean;
};
type SummaryRow = {
  working_days: number; present_days: number; absent_days: number;
  leave_days: number; late_days: number; early_departure_days: number;
  overtime_hours: number; punctuality_score: number;
};

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <View style={[badgeS.wrap, { backgroundColor: bg }]}>
      <Text style={[badgeS.text, { color }]}>{text}</Text>
    </View>
  );
}
const badgeS = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  text: { fontSize: typography.xs, fontFamily: 'Inter_700Bold' },
});

const SUMMARY_ITEMS = [
  { key: 'working_days',      label: 'Working Days', color: colors.ink     },
  { key: 'present_days',      label: 'Present',      color: colors.success },
  { key: 'absent_days',       label: 'Absent',       color: colors.danger  },
  { key: 'leave_days',        label: 'Leave',        color: colors.warn    },
  { key: 'late_days',         label: 'Late',         color: colors.warn    },
  { key: 'early_departure_days', label: 'Early Out', color: colors.info    },
];

export default function AttendanceHistoryScreen() {
  const [tab, setTab]           = useState<'history' | 'summary'>('history');
  const [rows, setRows]         = useState<AttendanceRow[]>([]);
  const [summary, setSummary]   = useState<SummaryRow | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [attRes, sumRes] = await Promise.all([
        api.get('/api/attendance/'),
        api.get('/api/reports/summary/?period=monthly'),
      ]);
      setRows(attRes.data.attendance || []);
      setSummary(sumRes.data.rows?.[0] || null);
    } catch { /* empty states below */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={styles.screen}>
      {/* ── Tab bar ── */}
      <View style={styles.tabBar}>
        {(['history', 'summary'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'history' ? 'History' : 'Monthly Summary'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'summary' ? (
        <View style={styles.summaryWrap}>
          {/* Score hero */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>PUNCTUALITY SCORE</Text>
            <Text style={[
              styles.scoreValue,
              { color: (summary?.punctuality_score ?? 0) >= 80 ? colors.success
                      : (summary?.punctuality_score ?? 0) >= 50 ? colors.warn
                      : colors.danger },
            ]}>
              {summary?.punctuality_score ?? '—'}%
            </Text>
            <Text style={styles.scoreSubLabel}>this month</Text>
          </View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            {SUMMARY_ITEMS.map((item) => (
              <View key={item.key} style={styles.statCell}>
                <Text style={[styles.statNum, { color: item.color }]}>
                  {summary ? summary[item.key as keyof SummaryRow] : '—'}
                </Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
            <View style={styles.statCell}>
              <Text style={[styles.statNum, { color: colors.brand }]}>
                {summary ? `${summary.overtime_hours}h` : '—'}
              </Text>
              <Text style={styles.statLabel}>Overtime</Text>
            </View>
          </View>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, i) => `${item.date}-${i}`}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>No attendance records yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              {/* Left: date + times */}
              <View style={styles.rowLeft}>
                <Text style={styles.rowDate}>{item.date}</Text>
                <View style={styles.timeRow}>
                  <View style={styles.timeItem}>
                    <Text style={styles.timeItemLabel}>IN</Text>
                    <Text style={styles.timeItemValue}>{item.check_in || '—'}</Text>
                  </View>
                  <View style={styles.timeSep} />
                  <View style={styles.timeItem}>
                    <Text style={styles.timeItemLabel}>OUT</Text>
                    <Text style={styles.timeItemValue}>{item.check_out || '—'}</Text>
                  </View>
                </View>
              </View>

              {/* Right: badges */}
              <View style={styles.rowRight}>
                {item.is_holiday && <Badge text="Holiday" color={colors.holidayFg} bg={colors.holidayBg} />}
                {!item.is_holiday && item.check_in && !item.is_late && !item.is_early_departure && (
                  <Badge text="On time" color={colors.presentFg} bg={colors.presentBg} />
                )}
                {item.is_late && <Badge text="Late" color={colors.lateFg} bg={colors.lateBg} />}
                {item.is_early_departure && <Badge text="Early out" color={colors.warnDark} bg={colors.warnSoft} />}
                {item.overtime_minutes > 0 && <Badge text="OT" color={colors.brand} bg={colors.brandSoft} />}
                {!item.check_in && !item.is_holiday && <Badge text="Absent" color={colors.absentFg} bg={colors.absentBg} />}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  tabBar: {
    flexDirection: 'row',
    padding: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: radius.pill,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  tabText: { fontSize: typography.sm, fontFamily: 'Inter_600SemiBold', color: colors.ink2 },
  tabTextActive: { color: '#fff' },

  // ── Summary
  summaryWrap: { flex: 1, padding: spacing.lg, gap: spacing.md },
  scoreCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    
  },
  scoreLabel: {
    fontSize: typography.xs, fontFamily: 'Inter_700Bold',
    color: colors.muted, letterSpacing: 0.6,
  },
  scoreValue: { fontSize: 52, fontFamily: 'Inter_800ExtraBold', lineHeight: 60, marginVertical: spacing.xs },
  scoreSubLabel: { fontSize: typography.sm, color: colors.muted },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
  },
  statCell: {
    width: '30%', flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
    minWidth: '30%',
    
  },
  statNum: { fontSize: typography.xxl, fontFamily: 'Inter_800ExtraBold' },
  statLabel: { fontSize: typography.xs, color: colors.muted, fontFamily: 'Inter_600SemiBold', marginTop: 2, textAlign: 'center' },

  // ── History list
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  empty: { textAlign: 'center', color: colors.muted, marginTop: spacing.xxxl, fontSize: typography.base },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
    
  },
  rowLeft: { gap: spacing.xs },
  rowDate: { fontSize: typography.base, fontFamily: 'Inter_700Bold', color: colors.ink },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  timeItem: { alignItems: 'center', gap: 2 },
  timeItemLabel: { fontSize: typography.xs, fontFamily: 'Inter_700Bold', color: colors.muted, letterSpacing: 0.4 },
  timeItemValue: { fontSize: typography.sm, fontFamily: 'Inter_600SemiBold', color: colors.ink2 },
  timeSep: { width: 1, height: 20, backgroundColor: colors.border },

  rowRight: { gap: spacing.xs, alignItems: 'flex-end' },
});
