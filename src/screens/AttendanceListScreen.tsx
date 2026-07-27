import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import apiClient from '../api/client';
import { colors, spacing, radius } from '../theme/colors';

function AttendanceItem({ item }: { item: any }) {
  return (
    <View style={styles.attendanceCard}>
      <Text style={styles.employeeName}>{item.employee_name}</Text>
      <Text style={styles.detail}>{item.employee_id} · {item.department || 'No department'}</Text>
      <Text style={styles.detail}>Date: {item.date}</Text>
      <Text style={styles.detail}>Check-in: {item.check_in || '–'}  Check-out: {item.check_out || '–'}</Text>
      {item.check_in_lat && item.check_in_lng ? (
        <Text style={styles.detail}>In geo: {item.check_in_lat.toFixed(4)}, {item.check_in_lng.toFixed(4)}</Text>
      ) : null}
      {item.check_out_lat && item.check_out_lng ? (
        <Text style={styles.detail}>Out geo: {item.check_out_lat.toFixed(4)}, {item.check_out_lng.toFixed(4)}</Text>
      ) : null}
    </View>
  );
}

export default function AttendanceListScreen({ route }: any) {
  const initialQuery = route?.params?.q || '';
  const [attendance, setAttendance] = useState<any[]>([]);
  const [search, setSearch] = useState(initialQuery);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadAttendance() {
    setLoading(true);
    try {
      const params = { q: search.trim(), date: date.trim() };
      const response = await apiClient.get('/api/attendance/', { params });
      setAttendance(response.data.attendance || []);
    } catch (error) {
      console.warn('Failed to load attendance', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, [search]);

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Attendance Records</Text>
      <View style={styles.filterRow}>
        <TextInput
          style={styles.input}
          placeholder="Search name or ID"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={loadAttendance}
          returnKeyType="search"
        />
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
          onSubmitEditing={loadAttendance}
          returnKeyType="search"
        />
      </View>
      <TouchableOpacity style={styles.loadButton} onPress={loadAttendance} disabled={loading}>
        <Text style={styles.loadButtonText}>{loading ? 'Loading…' : 'Refresh'}</Text>
      </TouchableOpacity>
      <FlatList
        data={attendance}
        keyExtractor={(item) => `${item.employee_id}-${item.date}-${item.check_in}-${item.check_out}`}
        renderItem={({ item }) => <AttendanceItem item={item} />}
        contentContainerStyle={attendance.length === 0 ? styles.emptyState : undefined}
        ListEmptyComponent={<Text style={styles.emptyText}>{loading ? 'Loading attendance...' : 'No attendance records found.'}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  heading: { fontSize: 24, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.ink,
  },
  loadButton: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  loadButtonText: { color: '#FFFFFF', fontWeight: '700' },
  attendanceCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  employeeName: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: spacing.xs },
  detail: { color: colors.muted, fontSize: 13.5, lineHeight: 20 },
  emptyState: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.muted, textAlign: 'center' },
});
