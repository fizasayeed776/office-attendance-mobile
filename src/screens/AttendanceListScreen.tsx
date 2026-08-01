import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';

import { colors, spacing, radius, typography, fonts} from '../theme/colors';

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2)
    .map((w) => w[0]?.toUpperCase()).join('') || '?';
}

function StatusChip({ checkIn, isLate }: { checkIn: string | null; isLate?: boolean }) {
  if (!checkIn) return (
    <View style={[chipS.chip, { backgroundColor: colors.absentBg }]}>
      <Text style={[chipS.text, { color: colors.absentFg }]}>Absent</Text>
    </View>
  );
  if (isLate) return (
    <View style={[chipS.chip, { backgroundColor: colors.lateBg }]}>
      <Text style={[chipS.text, { color: colors.lateFg }]}>Late</Text>
    </View>
  );
  return (
    <View style={[chipS.chip, { backgroundColor: colors.presentBg }]}>
      <Text style={[chipS.text, { color: colors.presentFg }]}>Present</Text>
    </View>
  );
}
const chipS = StyleSheet.create({
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  text: { fontSize: typography.xs, fontFamily: 'Inter_700Bold' },
});

export default function AttendanceListScreen({ route }: any) {
  const initialQ = route?.params?.q || '';
  const [attendance, setAttendance] = useState<any[]>([]);
  const [search, setSearch]         = useState(initialQ);
  const [date, setDate]             = useState('');
  const [loading, setLoading]       = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/attendance/', {
        params: { q: search.trim(), date: date.trim() },
      });
      setAttendance(res.data.attendance || []);
    } catch {
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [search]);

  return (
    <View style={styles.screen}>
      {/* ── Filter bar ── */}
      <View style={styles.filterBar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={14} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or ID"
            placeholderTextColor={colors.mutedLight}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={load}
          />
        </View>
        <View style={styles.dateWrap}>
          <TextInput
            style={styles.dateInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedLight}
            value={date}
            onChangeText={setDate}
            returnKeyType="search"
            onSubmitEditing={load}
          />
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={load} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="refresh-outline" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>

      {/* ── Table header ── */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, { flex: 2 }]}>EMPLOYEE</Text>
        <Text style={[styles.headerCell, { flex: 1.2 }]}>DATE</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>IN</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>OUT</Text>
        <Text style={[styles.headerCell, { flex: 1, textAlign: 'right' }]}>STATUS</Text>
      </View>

      <FlatList
        data={attendance}
        keyExtractor={(item, i) => `${item.employee_id}-${item.date}-${i}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={attendance.length === 0 ? styles.emptyWrap : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyCenter}>
            <Ionicons name="calendar-outline" size={36} color={colors.muted} />
            <Text style={styles.emptyTitle}>
              {loading ? 'Loading attendance…' : 'No records found'}
            </Text>
            <Text style={styles.emptyBody}>
              {!loading && 'Try a different search term or date filter.'}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={[styles.row, index % 2 === 1 && styles.rowAlt]}>
            {/* Avatar + name */}
            <View style={[styles.cell, { flex: 2 }]}>
              <View style={styles.miniAvatar}>
                <Text style={styles.miniAvatarText}>{initials(item.employee_name || '')}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.cellPrimary} numberOfLines={1}>{item.employee_name}</Text>
                <Text style={styles.cellSecondary} numberOfLines={1}>{item.employee_id}</Text>
              </View>
            </View>
            <Text style={[styles.cellText, { flex: 1.2 }]}>{item.date}</Text>
            <Text style={[styles.cellText, { flex: 1 }]}>{item.check_in || '—'}</Text>
            <Text style={[styles.cellText, { flex: 1 }]}>{item.check_out || '—'}</Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <StatusChip checkIn={item.check_in} isLate={item.is_late} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  // ── Filter bar
  filterBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchWrap: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  searchIcon: { width: 14 },
  searchInput: {
    flex: 1, paddingVertical: 10,
    fontSize: typography.sm, color: colors.ink,
  },
  dateWrap: {
    flex: 1.4,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  dateInput: {
    paddingVertical: 10,
    fontSize: typography.sm, color: colors.ink,
  },
  refreshBtn: {
    width: 44,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Table
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgDeep,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCell: {
    fontSize: typography.xs, fontFamily: 'Inter_700Bold',
    color: colors.muted, letterSpacing: 0.5,
  },

  list: { paddingBottom: spacing.xxxl },
  emptyWrap: { flex: 1 },
  emptyCenter: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, gap: spacing.sm,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: typography.xl, fontFamily: 'Inter_700Bold', color: colors.ink },
  emptyBody: { fontSize: typography.base, color: colors.muted, textAlign: 'center', paddingHorizontal: spacing.xl },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowAlt: { backgroundColor: colors.bgDeep },

  cell: { flexDirection: 'row', alignItems: 'center' },
  cellPrimary: { fontSize: typography.sm, fontFamily: 'Inter_600SemiBold', color: colors.ink },
  cellSecondary: { fontSize: typography.xs, color: colors.muted },
  cellText: { fontSize: typography.sm, color: colors.ink2 },

  miniAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  miniAvatarText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.brand },
});
