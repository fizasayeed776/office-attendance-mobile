import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { colors, spacing, radius } from '../theme/colors';

type Correction = {
  pk: number; date: string; attendance_type_label: string; requested_time: string;
  reason: string; status: 'pending' | 'approved' | 'rejected'; admin_comment: string;
};

export default function CorrectionsScreen({ route }: any) {
  const [items, setItems] = useState<Correction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(!!route?.params?.openApply);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/corrections/');
      setItems(data.corrections);
    } catch {
      // list stays empty; the apply flow surfaces its own errors
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
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.pk)}
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        ListEmptyComponent={<Text style={styles.empty}>You have no correction requests yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardType}>{item.attendance_type_label} — {item.date}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.cardDates}>Requested time: {item.requested_time}</Text>
            {!!item.reason && <Text style={styles.cardReason}>{item.reason}</Text>}
            {item.status !== 'pending' && !!item.admin_comment && (
              <Text style={styles.comment}>Comment: {item.admin_comment}</Text>
            )}
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalOpen(true)}>
        <Text style={styles.fabText}>+ Request Correction</Text>
      </TouchableOpacity>

      <RequestCorrectionModal visible={modalOpen} onClose={() => setModalOpen(false)} onSubmitted={load} />
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; soft: string; label: string }> = {
    pending: { color: colors.warn, soft: colors.warnSoft, label: 'Pending' },
    approved: { color: colors.success, soft: colors.successSoft, label: 'Approved' },
    rejected: { color: colors.danger, soft: colors.dangerSoft, label: 'Rejected' },
  };
  const s = map[status] || map.pending;
  return (
    <View style={[styles.statusBadge, { backgroundColor: s.soft }]}>
      <Text style={{ color: s.color, fontWeight: '700', fontSize: 11.5 }}>{s.label}</Text>
    </View>
  );
}

function RequestCorrectionModal({ visible, onClose, onSubmitted }: { visible: boolean; onClose: () => void; onSubmitted: () => void }) {
  const [date, setDate] = useState('');
  const [type, setType] = useState<'check_in' | 'check_out'>('check_in');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    if (!date || !time) {
      setError('Please enter a date (YYYY-MM-DD) and correct time (HH:MM).');
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/corrections/', { date, attendance_type: type, requested_time: time, reason });
      setDate(''); setTime(''); setReason('');
      onClose();
      onSubmitted();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Request Attendance Correction</Text>
          <Text style={styles.modalSub}>Use this if face recognition missed your check-in/check-out.</Text>
          {!!error && <Text style={styles.error}>{error}</Text>}

          <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2026-07-20" placeholderTextColor={colors.muted} />

          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity style={[styles.typeChip, type === 'check_in' && styles.typeChipActive]} onPress={() => setType('check_in')}>
              <Text style={[styles.typeChipText, type === 'check_in' && styles.typeChipTextActive]}>Check-in</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeChip, type === 'check_out' && styles.typeChipActive]} onPress={() => setType('check_out')}>
              <Text style={[styles.typeChipText, type === 'check_out' && styles.typeChipTextActive]}>Check-out</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Correct Time (HH:MM)</Text>
          <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="09:05" placeholderTextColor={colors.muted} />

          <Text style={styles.label}>Reason</Text>
          <TextInput style={styles.input} value={reason} onChangeText={setReason} placeholder="e.g. Camera didn't recognize me" placeholderTextColor={colors.muted} />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSubmitButton} onPress={submit} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Submit</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  empty: { textAlign: 'center', color: colors.muted, marginTop: spacing.xxl },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardType: { fontWeight: '700', color: colors.ink, fontSize: 13.5 },
  cardDates: { color: colors.muted, fontSize: 12.5, marginTop: 4 },
  cardReason: { color: colors.ink2, fontSize: 12.5, marginTop: 6 },
  comment: { color: colors.muted, fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  fab: {
    position: 'absolute', bottom: spacing.lg, left: spacing.lg, right: spacing.lg,
    backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center',
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
  modalBg: { flex: 1, backgroundColor: 'rgba(17,19,42,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, maxHeight: '85%' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  modalSub: { fontSize: 12, color: colors.muted, marginTop: 4, marginBottom: spacing.sm },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.ink2, marginBottom: 6, marginTop: spacing.sm },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.ink,
  },
  typeRow: { flexDirection: 'row', gap: 6 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border },
  typeChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  typeChipText: { fontSize: 12.5, color: colors.ink2, fontWeight: '600' },
  typeChipTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  modalCancelButton: { flex: 1, paddingVertical: 13, borderRadius: radius.sm, alignItems: 'center', backgroundColor: colors.bg },
  modalCancelText: { color: colors.ink2, fontWeight: '600' },
  modalSubmitButton: { flex: 1, paddingVertical: 13, borderRadius: radius.sm, alignItems: 'center', backgroundColor: colors.brand },
  modalSubmitText: { color: '#fff', fontWeight: '700' },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: spacing.sm, borderRadius: radius.sm, marginBottom: spacing.sm, fontSize: 12.5 },
});
