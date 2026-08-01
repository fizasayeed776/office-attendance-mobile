import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, RefreshControl, ActivityIndicator, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { colors, spacing, radius, typography } from '../theme/colors';

const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Annual Leave', 'Emergency Leave'];

type Leave = {
  pk: number; leave_type: string; start_date: string; end_date: string;
  days: number; reason: string;
  status: 'pending' | 'approved' | 'rejected'; rejection_reason: string;
};

function StatusChip({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; fg: string; label: string }> = {
    pending:  { bg: colors.warnSoft,    fg: colors.warn,    label: 'Pending'  },
    approved: { bg: colors.successSoft, fg: colors.success, label: 'Approved' },
    rejected: { bg: colors.dangerSoft,  fg: colors.danger,  label: 'Rejected' },
  };
  const c = cfg[status] ?? cfg.pending;
  return (
    <View style={[chip.wrap, { backgroundColor: c.bg }]}>
      <Text style={[chip.text, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
}
const chip = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  text: { fontSize: typography.xs, fontWeight: '700' },
});

export default function LeavesScreen({ route }: any) {
  const [leaves, setLeaves]         = useState<Leave[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen]   = useState(!!route?.params?.openApply);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/leaves/');
      setLeaves(data.leaves || []);
    } catch { /* empty state */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={styles.screen}>
      <FlatList
        data={leaves}
        keyExtractor={(item) => String(item.pk)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={44} color={colors.muted} />
            <Text style={styles.emptyTitle}>No leave requests yet</Text>
            <Text style={styles.emptyBody}>Tap the button below to apply for leave.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.leaveTypeWrap}>
                <View style={styles.leaveTypeIconWrap}>
                  <Ionicons
                    name={
                      item.leave_type.startsWith('Sick') ? 'medkit-outline'
                      : item.leave_type.startsWith('Annual') ? 'sunny-outline'
                      : item.leave_type.startsWith('Emergency') ? 'alert-circle-outline'
                      : 'calendar-outline'
                    }
                    size={16}
                    color={colors.brand}
                  />
                </View>
                <Text style={styles.leaveType}>{item.leave_type}</Text>
              </View>
              <StatusChip status={item.status} />
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>FROM</Text>
                <Text style={styles.dateValue}>{item.start_date}</Text>
              </View>
              <View style={styles.dateArrow}><Ionicons name="arrow-forward" size={14} color={colors.muted} /></View>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>TO</Text>
                <Text style={styles.dateValue}>{item.end_date}</Text>
              </View>
              <View style={styles.daysBadge}>
                <Text style={styles.daysNum}>{item.days}</Text>
                <Text style={styles.daysLabel}>day{item.days !== 1 ? 's' : ''}</Text>
              </View>
            </View>

            {!!item.reason && (
              <Text style={styles.reason} numberOfLines={2}>{item.reason}</Text>
            )}
            {item.status === 'rejected' && !!item.rejection_reason && (
              <View style={styles.rejectionWrap}>
                <Text style={styles.rejectionText}>Reason: {item.rejection_reason}</Text>
              </View>
            )}
          </View>
        )}
      />

      <View style={styles.fabWrap}>
        <TouchableOpacity style={styles.fab} onPress={() => setModalOpen(true)} activeOpacity={0.85}>
          <Text style={styles.fabText}>+ Apply for Leave</Text>
        </TouchableOpacity>
      </View>

      <ApplyLeaveModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={load}
      />
    </View>
  );
}

function ApplyLeaveModal({ visible, onClose, onSubmitted }: {
  visible: boolean; onClose: () => void; onSubmitted: () => void;
}) {
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [reason, setReason]       = useState('');
  const [error, setError]         = useState('');
  const [busy, setBusy]           = useState(false);

  const reset = () => {
    setLeaveType(LEAVE_TYPES[0]);
    setStartDate(''); setEndDate(''); setReason(''); setError('');
  };

  const submit = async () => {
    setError('');
    if (!startDate || !endDate) {
      setError('Please enter both start and end dates (YYYY-MM-DD).');
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/leaves/', { leave_type: leaveType, start_date: startDate, end_date: endDate, reason });
      reset(); onClose(); onSubmitted();
    } catch (e: any) {
      setError(e.message || 'Failed to submit leave request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => { reset(); onClose(); }}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <Text style={modal.title}>Apply for Leave</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {!!error && (
              <View style={modal.errorWrap}>
                <Text style={modal.errorText}>{error}</Text>
              </View>
            )}

            <Text style={modal.label}>Leave type</Text>
            <View style={modal.typeGrid}>
              {LEAVE_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[modal.typeChip, leaveType === t && modal.typeChipActive]}
                  onPress={() => setLeaveType(t)}
                >
                  <Text style={[modal.typeChipText, leaveType === t && modal.typeChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={modal.label}>Start date</Text>
            <TextInput style={modal.input} value={startDate} onChangeText={setStartDate}
              placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedLight} />

            <Text style={modal.label}>End date</Text>
            <TextInput style={modal.input} value={endDate} onChangeText={setEndDate}
              placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedLight} />

            <Text style={modal.label}>Reason (optional)</Text>
            <TextInput style={[modal.input, modal.textArea]} value={reason} onChangeText={setReason}
              placeholder="Briefly describe the reason"
              placeholderTextColor={colors.mutedLight} multiline />

            <View style={modal.actions}>
              <TouchableOpacity style={modal.cancelBtn} onPress={() => { reset(); onClose(); }}>
                <Text style={modal.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modal.submitBtn, busy && modal.submitBtnDisabled]} onPress={submit} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={modal.submitText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    padding: spacing.xl, maxHeight: '88%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: spacing.lg,
  },
  title: { fontSize: typography.xl, fontWeight: '700', color: colors.ink, marginBottom: spacing.lg },
  label: {
    fontSize: typography.sm, fontWeight: '600', color: colors.ink2,
    marginBottom: spacing.xs, marginTop: spacing.md, letterSpacing: 0.2,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  typeChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  typeChipText: { fontSize: typography.sm, color: colors.ink2, fontWeight: '600' },
  typeChipTextActive: { color: '#fff' },
  input: {
    backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12,
    fontSize: typography.md, color: colors.ink,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  errorWrap: {
    backgroundColor: colors.dangerSoft, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md,
    borderLeftWidth: 3, borderLeftColor: colors.danger,
  },
  errorText: { color: colors.danger, fontSize: typography.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radius.md,
    alignItems: 'center', borderWidth: 1.5, borderColor: colors.border,
  },
  cancelText: { color: colors.ink2, fontWeight: '700' },
  submitBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radius.md,
    alignItems: 'center', backgroundColor: colors.brand,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontWeight: '700' },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, paddingBottom: 100 },

  empty: { paddingTop: 80, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: typography.xl, fontWeight: '700', color: colors.ink },
  emptyBody: { fontSize: typography.base, color: colors.muted, textAlign: 'center' },

  card: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.md,
  },
  leaveTypeWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  leaveTypeIconWrap: { width: 26, height: 26, borderRadius: radius.sm, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  leaveType: { fontSize: typography.md, fontWeight: '700', color: colors.ink },

  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bgDeep, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  dateItem: { flex: 1, gap: 2 },
  dateLabel: { fontSize: typography.xs, fontWeight: '700', color: colors.muted, letterSpacing: 0.4 },
  dateValue: { fontSize: typography.sm, fontWeight: '700', color: colors.ink },
  dateArrow: { paddingHorizontal: spacing.xs },
  daysBadge: {
    backgroundColor: colors.brandSoft, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, alignItems: 'center',
  },
  daysNum: { fontSize: typography.xl, fontWeight: '800', color: colors.brand, lineHeight: 24 },
  daysLabel: { fontSize: typography.xs, color: colors.brand, fontWeight: '600' },

  reason: { fontSize: typography.sm, color: colors.muted, lineHeight: 18 },
  rejectionWrap: {
    marginTop: spacing.sm, backgroundColor: colors.dangerSoft,
    borderRadius: radius.md, padding: spacing.sm,
  },
  rejectionText: { fontSize: typography.sm, color: colors.danger },

  fabWrap: {
    position: 'absolute', bottom: spacing.lg, left: spacing.lg, right: spacing.lg,
  },
  fab: {
    backgroundColor: colors.brand, borderRadius: radius.lg,
    paddingVertical: 15, alignItems: 'center',
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: typography.md },
});
