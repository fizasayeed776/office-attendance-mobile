import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import api from '../api/client';
import { colors, spacing, radius } from '../theme/colors';

export default function OrganizationHomeScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [departmentCount, setDepartmentCount] = useState(0);
  const [shiftCount, setShiftCount] = useState(0);

  useEffect(() => {
    async function loadCounts() {
      setError('');
      setLoading(true);
      try {
        const [deptRes, shiftRes] = await Promise.all([api.get('/api/departments/'), api.get('/api/shifts/')]);
        setDepartmentCount((deptRes.data.departments || []).length);
        setShiftCount((shiftRes.data.shifts || []).length);
      } catch (err: any) {
        console.error('OrganizationHomeScreen loadCounts failed', err);
        setError(err.message || 'Unable to load organization data.');
      } finally {
        setLoading(false);
      }
    }
    loadCounts();
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Organization</Text>
      <Text style={styles.description}>Manage departments and shifts for your employees from a central admin console.</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Departments')}>
            <Text style={styles.cardTitle}>Departments</Text>
            <Text style={styles.cardMeta}>{departmentCount} {departmentCount === 1 ? 'department' : 'departments'}</Text>
            <Text style={styles.cardHint}>Create, edit, and delete department records that employees can be assigned to.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Shifts')}>
            <Text style={styles.cardTitle}>Shifts</Text>
            <Text style={styles.cardMeta}>{shiftCount} {shiftCount === 1 ? 'shift' : 'shifts'}</Text>
            <Text style={styles.cardHint}>Create and manage employee shifts with start/end times and grace periods.</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  heading: { fontSize: 24, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  description: { color: colors.muted, lineHeight: 20, marginBottom: spacing.lg },
  error: { color: colors.danger, marginBottom: spacing.md },
  loadingContainer: { flex: 1, minHeight: 240, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: spacing.xs },
  cardMeta: { color: colors.brand, fontSize: 15, fontWeight: '700', marginBottom: spacing.xs },
  cardHint: { color: colors.muted, fontSize: 14, lineHeight: 20 },
});
