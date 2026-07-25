import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { colors, spacing, radius } from '../theme/colors';

type AttendanceRow = {
  date: string; check_in: string | null; check_out: string | null;
  is_late: boolean; is_early_departure: boolean; overtime_minutes: number; is_holiday: boolean;
};
type SummaryRow = {
  working_days: number; present_days: number; absent_days: number; leave_days: number;
  late_days: number; early_departure_days: number; overtime_hours: number; punctuality_score: number;
};

export default function AttendanceHistoryScreen() {
  const [tab, setTab] = useState<'history' | 'summary'>('history');
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [summary, setSummary] = useState<SummaryRow | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [attRes, sumRes] = await Promise.all([
        api.get('/api/attendance/'),
        api.get('/api/reports/summary/?period=monthly'),
      ]);
      setRows(attRes.data.attendance);
      setSummary(sumRes.data.rows?.[0] || null);
    } catch {
      // errors surface as empty states below -- attendance history isn't critical-path enough to block the screen
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'history' && styles.tabActive]} onPress={() => setTab('history')}>
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'summary' && styles.tabActive]} onPress={() => setTab('summary')}>
          <Text style={[styles.tabText, tab === 'summary' && styles.tabTextActive]}>Monthly Summary</Text>
        </TouchableOpacity>
      </View>

      {tab === 'summary' ? (
        <View style={styles.summaryGrid}>
          <SummaryCard label="Working Days" value={summary?.working_days ?? '—'} />
          <SummaryCard label="Present" value={summary?.present_days ?? '—'} color={colors.success} />
          <SummaryCard label="Absent" value={summary?.absent_days ?? '—'} color={colors.danger} />
          <SummaryCard label="Leave" value={summary?.leave_days ?? '—'} />
          <SummaryCard label="Late" value={summary?.late_days ?? '—'} color={colors.warn} />
          <SummaryCard label="Overtime" value={`${summary?.overtime_hours ?? 0}h`} />
          <SummaryCard label="Punctuality" value={`${summary?.punctuality_score ?? '—'}%`} color={colors.brand} wide />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, idx) => item.date + idx}
          contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
          ListEmptyComponent={<Text style={styles.empty}>No attendance records yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowDate}>{item.date}</Text>
                <Text style={styles.rowTimes}>
                  {item.check_in || '—'} → {item.check_out || '—'}
                </Text>
              </View>
              <View style={styles.badges}>
                {item.is_holiday && <Badge text="Holiday" color={colors.brand} soft={colors.brandSoft} />}
                {item.is_late && <Badge text="Late" color={colors.danger} soft={colors.dangerSoft} />}
                {item.is_early_departure && <Badge text="Early" color={colors.warn} soft={colors.warnSoft} />}
                {item.overtime_minutes > 0 && <Badge text="OT" color={colors.brand} soft={colors.brandSoft} />}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

function SummaryCard({ label, value, color, wide }: { label: string; value: string | number; color?: string; wide?: boolean }) {
  return (
    <View style={[styles.summaryCard, wide && { width: '100%' }]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

function Badge({ text, color, soft }: { text: string; color: string; soft: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: soft }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  tabRow: { flexDirection: 'row', padding: spacing.lg, paddingBottom: 0, gap: spacing.sm },
  tab: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center', backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border },
  tabActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  tabText: { fontWeight: '600', fontSize: 13, color: colors.ink2 },
  tabTextActive: { color: '#fff' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.lg },
  summaryCard: { width: '47%', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  summaryLabel: { fontSize: 11.5, color: colors.muted, fontWeight: '600' },
  summaryValue: { fontSize: 22, fontWeight: '700', color: colors.ink, marginTop: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  rowDate: { fontWeight: '700', color: colors.ink, fontSize: 13.5 },
  rowTimes: { color: colors.muted, fontSize: 12.5, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', maxWidth: 140, justifyContent: 'flex-end' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { fontSize: 10.5, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: spacing.xxl },
});
