import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';

import { colors, spacing, radius, typography, fonts} from '../theme/colors';

type Correction = {
  pk: number; date: string; attendance_type_label: string;
  requested_time: string; reason: string;
  status: 'pending' | 'approved' | 'rejected'; admin_comment: string;
};

function StatusChip({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; fg: string; label: string }> = {
    pending:  { bg: colors.warnSoft,    fg: colors.warn,    label: 'Pending'  },
    approved: { bg: colors.successSoft, fg: colors.success, label: 'Approved' },
    rejected: { bg: colors.dangerSoft,  fg: colors.danger,  label: 'Rejected' },
  };
  const c = cfg[status] ?? cfg.pending;
  return (
    <View style={[chipS.wrap, { backgroundColor: c.bg }]}>
      <Text style={[chipS.text, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
}
const chipS = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  text: { fontSize: typography.xs, fontFamily: 'Inter_700Bold' },
});

export default function CorrectionsScreen({ route }: any) {
  const [items, setItems]           = useState<Correction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen]   = useState(!!route?.params?.openApply);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/corrections/');
      setItems(data.corrections || []);
    } catch { /* empty state */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.pk)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="construct-outline" size={44} color={colors.muted} />
            <Text style={styles.emptyTitle}>No correction requests</Text>
            <Text style={styles.emptyBody}>Use the button below if attendance wasn't marked correctly.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.cardType}>{item.attendance_type_label}</Text>
                <Text style={styles.cardDate}>{item.date}</Text>
              </View>
              <StatusChip status={item.status} />
            </View>

            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>REQUESTED TIME</Text>
              <Text style={styles.timeValue}>{item.requested_time}</Text>
            </View>

            {!!item.reason && (
              <Text style={styles.reason} numberOfLines={2}>{item.reason}</Text>
            )}
            {item.status !== 'pending' && !!item.admin_comment && (
              <View style={styles.commentWrap}>
                <Text style={styles.commentLabel}>Admin comment</Text>
                <Text style={styles.commentText}>{item.admin_comment}</Text>
              </View>
            )}
          </View>
        )}
      />

      <View style={styles.fabWrap}>
        <TouchableOpacity style={styles.fab} onPress={() => setModalOpen(true)} activeOpacity={0.85}>
          <Text style={styles.fabText}>+ Request Correction</Text>
        </TouchableOpacity>
      </View>

      <RequestCorrectionModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={load}
      />
    </View>
  );
}

function RequestCorrectionModal({ visible, onClose, onSubmitted }: {
  visible: boolean; onClose: () => void; onSubmitted: () => void;
}) {
  const [date, setDate]     = useState('');
  const [type, setType]     = useState<'check_in' | 'check_out'>('check_in');
  const [time, setTime]     = useState('');
  const [reason, setReason] = useState('');
  const [error, setError]   = useState('');
  const [busy, setBusy]     = useState(false);

  const reset = () => { setDate(''); setTime(''); setReason(''); setError(''); };

  const submit = async () => {
    setError('');
    if (!date || !time) {
      setError('Date (YYYY-MM-DD) and correct time (HH:MM) are required.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/corrections/', { date, attendance_type: type, requested_time: time, reason });
      reset(); onClose(); onSubmitted();
    } catch (e: any) {
      setError(e.message || 'Failed to submit request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => { reset(); onClose(); }}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <Text style={modal.title}>Request Attendance Correction</Text>
          <Text style={modal.subtitle}>Use this if face recognition failed to mark your check-in or check-out.</Text>

          {!!error && (
            <View style={modal.errorWrap}>
              <Text style={modal.errorText}>{error}</Text>
            </View>
          )}

          <Text style={modal.label}>Date</Text>
          <TextInput style={modal.input} value={date} onChangeText={setDate}
            placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedLight} />

          <Text style={modal.label}>Type</Text>
          <View style={modal.typeRow}>
            {(['check_in', 'check_out'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[modal.typeBtn, type === t && modal.typeBtnActive]}
                onPress={() => setType(t)}
              >
                <Text style={[modal.typeBtnText, type === t && modal.typeBtnTextActive]}>
                  {t === 'check_in' ? 'Check-in' : 'Check-out'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={modal.label}>Correct time</Text>
          <TextInput style={modal.input} value={time} onChangeText={setTime}
            placeholder="HH:MM" placeholderTextColor={colors.mutedLight} />

          <Text style={modal.label}>Reason (optional)</Text>
          <TextInput style={[modal.input, modal.textArea]} value={reason} onChangeText={setReason}
            placeholder="e.g. Camera didn't recognize me" placeholderTextColor={colors.mutedLight} multiline />

          <View style={modal.actions}>
            <TouchableOpacity style={modal.cancelBtn} onPress={() => { reset(); onClose(); }}>
              <Text style={modal.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modal.submitBtn, busy && modal.submitBtnDisabled]} onPress={submit} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={modal.submitText}>Submit</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    padding: spacing.xl, maxHeight: '85%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: spacing.lg,
  },
  title: { fontSize: typography.xl, fontFamily: 'Inter_700Bold', color: colors.ink, marginBottom: spacing.xs },
  subtitle: { fontSize: typography.sm, color: colors.muted, marginBottom: spacing.lg, lineHeight: 19 },
  label: {
    fontSize: typography.sm, fontFamily: 'Inter_600SemiBold', color: colors.ink2,
    marginBottom: spacing.xs, marginTop: spacing.md, letterSpacing: 0.2,
  },
  input: {
    backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12,
    fontSize: typography.md, color: colors.ink,
  },
  textArea: { minHeight: 72, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeBtn: {
    flex: 1, paddingVertical: 11, borderRadius: radius.md,
    alignItems: 'center', borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  typeBtnActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  typeBtnText: { fontSize: typography.sm, fontFamily: 'Inter_600SemiBold', color: colors.ink2 },
  typeBtnTextActive: { color: '#fff' },
  errorWrap: {
    backgroundColor: colors.dangerSoft, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
    borderLeftWidth: 3, borderLeftColor: colors.danger,
  },
  errorText: { color: colors.danger, fontSize: typography.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radius.md,
    alignItems: 'center', borderWidth: 1.5, borderColor: colors.border,
  },
  cancelText: { color: colors.ink2, fontFamily: 'Inter_700Bold' },
  submitBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radius.md,
    alignItems: 'center', backgroundColor: colors.brand,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontFamily: 'Inter_700Bold' },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, paddingBottom: 100 },

  empty: { paddingTop: 80, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: typography.xl, fontFamily: 'Inter_700Bold', color: colors.ink },
  emptyBody: { fontSize: typography.base, color: colors.muted, textAlign: 'center', paddingHorizontal: spacing.xl },

  card: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: spacing.md,
  },
  cardType: { fontSize: typography.md, fontFamily: 'Inter_700Bold', color: colors.ink },
  cardDate: { fontSize: typography.sm, color: colors.muted, marginTop: 2 },

  timeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bgDeep, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.sm,
  },
  timeLabel: { fontSize: typography.xs, fontFamily: 'Inter_700Bold', color: colors.muted, letterSpacing: 0.4 },
  timeValue: { fontSize: typography.md, fontFamily: 'Inter_700Bold', color: colors.brand },

  reason: { fontSize: typography.sm, color: colors.muted, lineHeight: 18 },
  commentWrap: {
    marginTop: spacing.sm, backgroundColor: colors.bgDeep,
    borderRadius: radius.md, padding: spacing.sm,
  },
  commentLabel: { fontSize: typography.xs, fontFamily: 'Inter_700Bold', color: colors.muted, marginBottom: 2 },
  commentText: { fontSize: typography.sm, color: colors.ink2 },

  fabWrap: {
    position: 'absolute', bottom: spacing.lg, left: spacing.lg, right: spacing.lg,
  },
  fab: {
    backgroundColor: colors.brand, borderRadius: radius.lg,
    paddingVertical: 15, alignItems: 'center',
  },
  fabText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: typography.md },
});
