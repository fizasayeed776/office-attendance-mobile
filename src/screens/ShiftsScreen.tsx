import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import api from '../api/client';
import { colors, spacing, radius } from '../theme/colors';

export default function ShiftsScreen() {
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [gracePeriod, setGracePeriod] = useState('10');

  const loadShifts = async () => {
    setError('');
    try {
      const res = await api.get('/api/shifts/');
      setShifts(res.data.shifts || []);
    } catch (err: any) {
      console.error('ShiftsScreen loadShifts failed', err);
      setError(err.message || 'Unable to load shifts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  const openModal = (shift: any = null) => {
    setEditingShift(shift);
    setName(shift?.name || '');
    setStartTime(shift?.start_time || '');
    setEndTime(shift?.end_time || '');
    setGracePeriod(String(shift?.grace_period_minutes ?? 10));
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingShift(null);
    setName('');
    setStartTime('');
    setEndTime('');
    setGracePeriod('10');
    setError('');
  };

  const saveShift = async () => {
    if (!name.trim() || !startTime.trim() || !endTime.trim()) {
      setError('Shift name, start time, and end time are required.');
      return;
    }
    const grace = parseInt(gracePeriod, 10);
    if (Number.isNaN(grace) || grace < 0) {
      setError('Grace period must be a valid non-negative number.');
      return;
    }

    setModalLoading(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        start_time: startTime.trim(),
        end_time: endTime.trim(),
        grace_period_minutes: grace,
      };
      if (editingShift) {
        await api.put(`/api/shifts/${editingShift.pk}/`, payload);
      } else {
        await api.post('/api/shifts/', payload);
      }
      closeModal();
      loadShifts();
    } catch (err: any) {
      setError(err.message || 'Unable to save shift.');
    } finally {
      setModalLoading(false);
    }
  };

  const confirmDelete = (shift: any) => {
    Alert.alert(
      'Delete Shift',
      `Delete ${shift.name}? Existing employee assignments will be cleared if this shift is removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteShift(shift) },
      ]
    );
  };

  const deleteShift = async (shift: any) => {
    setError('');
    try {
      await api.delete(`/api/shifts/${shift.pk}/`);
      setShifts((prev) => prev.filter((item) => item.pk !== shift.pk));
    } catch (err: any) {
      setError(err.message || 'Unable to delete shift.');
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Shifts</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => openModal()}>
          <Text style={styles.ctaText}>Add Shift</Text>
        </TouchableOpacity>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : shifts.length ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          {shifts.map((shift) => (
            <View key={shift.pk} style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>{shift.name}</Text>
                <Text style={styles.cardBadge}>{shift.employee_count} employees</Text>
              </View>
              <Text style={styles.cardDescription}>{shift.start_time} – {shift.end_time}</Text>
              <Text style={styles.cardDescription}>Grace period: {shift.grace_period_minutes} min</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionButton} onPress={() => openModal(shift)}>
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => confirmDelete(shift)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No shifts yet. Tap Add Shift to create one.</Text>
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingShift ? 'Edit Shift' : 'Add Shift'}</Text>
            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Shift name"
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.modalLabel}>Start time</Text>
            <TextInput
              value={startTime}
              onChangeText={setStartTime}
              style={styles.input}
              placeholder="HH:MM"
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.modalLabel}>End time</Text>
            <TextInput
              value={endTime}
              onChangeText={setEndTime}
              style={styles.input}
              placeholder="HH:MM"
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.modalLabel}>Grace period (minutes)</Text>
            <TextInput
              value={gracePeriod}
              onChangeText={setGracePeriod}
              style={styles.input}
              keyboardType="numeric"
              placeholder="10"
              placeholderTextColor={colors.muted}
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={closeModal} disabled={modalLoading}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitButton} onPress={saveShift} disabled={modalLoading}>
                {modalLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  heading: { fontSize: 22, fontWeight: '700', color: colors.ink },
  ctaButton: { backgroundColor: colors.brand, paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.md },
  ctaText: { color: '#fff', fontWeight: '700' },
  error: { color: colors.danger, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  cardBadge: { color: colors.muted, fontSize: 12 },
  cardDescription: { color: colors.muted, lineHeight: 20, marginBottom: spacing.sm },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  actionButton: { backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: 10, paddingHorizontal: 14 },
  actionText: { color: colors.ink, fontWeight: '700' },
  deleteButton: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  deleteText: { color: colors.danger, fontWeight: '700' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  emptyText: { color: colors.muted, textAlign: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(17,19,42,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  modalLabel: { color: colors.muted, marginBottom: spacing.xs, fontSize: 13 },
  input: { backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.ink2, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.md },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  modalCancelButton: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  modalCancelText: { color: colors.ink2, fontWeight: '700' },
  modalSubmitButton: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.brand },
  modalSubmitText: { color: '#fff', fontWeight: '700' },
});
