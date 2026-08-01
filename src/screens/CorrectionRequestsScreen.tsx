import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';

import { colors, spacing, radius, typography } from '../theme/colors';

type CorrectionRequest = {
  pk: number; employee_name: string; department: string;
  attendance_type_label: string; date: string; requested_time: string;
  reason: string; status: 'pending' | 'approved' | 'rejected'; admin_comment: string;
};

function StatusChip({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; fg: string }> = {
    pending:  { bg: colors.warnSoft,    fg: colors.warn    },
    approved: { bg: colors.successSoft, fg: colors.success },
    rejected: { bg: colors.dangerSoft,  fg: colors.danger  },
  };
  const c = cfg[status] ?? cfg.pending;
  return (
    <View style={[s.chip, { backgroundColor: c.bg }]}>
      <Text style={[s.chipText, { color: c.fg }]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
    </View>
  );
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

export default function CorrectionRequestsScreen() {
  const [items, setItems]           = useState<CorrectionRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');
  const [modalVisible, setModalVisible]           = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState<CorrectionRequest | null>(null);
  const [comment, setComment]       = useState('');
  const [busy, setBusy]             = useState(false);
  const [modalError, setModalError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/api/corrections/');
      setItems(data.corrections || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load corrections.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const approve = async (pk: number) => {
    setBusy(true);
    try { await api.patch(`/api/corrections/${pk}/`, { decision: 'approved' }); await load(); }
    catch (err: any) { setError(err.message || 'Unable to approve.'); }
    finally { setBusy(false); }
  };

  const openReject = (item: CorrectionRequest) => {
    setSelectedCorrection(item); setComment(''); setModalError(''); setModalVisible(true);
  };

  const submitReject = async () => {
    if (!comment.trim()) { setModalError('Please provide a comment when rejecting.'); return; }
    setBusy(true); setModalError('');
    try {
      await api.patch(`/api/corrections/${selectedCorrection!.pk}/`, { decision: 'rejected', admin_comment: comment.trim() });
      setModalVisible(false); setSelectedCorrection(null); await load();
    } catch (err: any) { setModalError(err.message || 'Failed to reject.'); }
    finally { setBusy(false); }
  };

  return (
    <View style={s.screen}>
      {loading && !refreshing ? (
        <View style={s.loadingWrap}><ActivityIndicator size="large" color={colors.brand} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.pk)}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<Text style={s.heading}>Correction Requests</Text>}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="create-outline" size={40} color={colors.muted} />
              <Text style={s.emptyTitle}>No correction requests</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardTop}>
                <View style={s.avatarWrap}>
                  <Text style={s.avatarText}>{initials(item.employee_name)}</Text>
                </View>
                <View style={s.cardMeta}>
                  <Text style={s.cardName}>{item.employee_name}</Text>
                  <Text style={s.cardSub}>{item.department || 'No department'}</Text>
                </View>
                <StatusChip status={item.status} />
              </View>

              <View style={s.detailGrid}>
                <View style={s.detailCell}>
                  <Text style={s.detailLabel}>TYPE</Text>
                  <Text style={s.detailValue}>{item.attendance_type_label}</Text>
                </View>
                <View style={s.detailCell}>
                  <Text style={s.detailLabel}>DATE</Text>
                  <Text style={s.detailValue}>{item.date}</Text>
                </View>
                <View style={s.detailCell}>
                  <Text style={s.detailLabel}>REQUESTED</Text>
                  <Text style={[s.detailValue, { color: colors.brand }]}>{item.requested_time}</Text>
                </View>
              </View>

              {!!item.reason && <Text style={s.reason} numberOfLines={2}>{item.reason}</Text>}
              {item.status !== 'pending' && !!item.admin_comment && (
                <View style={s.commentWrap}>
                  <Text style={s.commentLabel}>Admin comment</Text>
                  <Text style={s.commentText}>{item.admin_comment}</Text>
                </View>
              )}

              {item.status === 'pending' && (
                <View style={s.actionRow}>
                  <TouchableOpacity style={s.approveBtn} onPress={() => approve(item.pk)} disabled={busy}>
                    <Text style={s.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.rejectBtn} onPress={() => openReject(item)} disabled={busy}>
                    <Text style={s.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
      {!!error && <Text style={s.errorBar}>{error}</Text>}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.handle} />
            <Text style={m.title}>Reject Correction Request</Text>
            <Text style={m.subtitle}>A comment helps the employee understand the decision.</Text>
            {!!modalError && <View style={m.err}><Text style={m.errText}>{modalError}</Text></View>}
            <TextInput
              style={[m.input, m.textArea]} value={comment} onChangeText={setComment}
              placeholder="Admin comment" placeholderTextColor={colors.mutedLight} multiline
            />
            <View style={m.actions}>
              <TouchableOpacity style={m.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={m.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[m.submitBtn, (busy || !comment.trim()) && m.submitDisabled]}
                onPress={submitReject} disabled={busy || !comment.trim()}>
                {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={m.submitText}>Reject</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, padding: spacing.xl },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: spacing.lg },
  title: { fontSize: typography.xl, fontWeight: '700', color: colors.ink, marginBottom: spacing.xs },
  subtitle: { fontSize: typography.sm, color: colors.muted, marginBottom: spacing.md },
  input: { backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: typography.md, color: colors.ink },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  err: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.danger },
  errText: { color: colors.danger, fontSize: typography.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border },
  cancelText: { color: colors.ink2, fontWeight: '700' },
  submitBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.danger },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontWeight: '700' },
});

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: typography.xxl, fontWeight: '800', color: colors.ink, marginBottom: spacing.lg },
  errorBar: { color: colors.danger, padding: spacing.lg },
  empty: { paddingTop: 60, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: typography.xl, fontWeight: '700', color: colors.ink },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  chipText: { fontSize: typography.xs, fontWeight: '700' },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  avatarWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: colors.brand },
  cardMeta: { flex: 1 },
  cardName: { fontSize: typography.md, fontWeight: '700', color: colors.ink },
  cardSub: { fontSize: typography.sm, color: colors.muted, marginTop: 2 },
  detailGrid: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.bgDeep, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  detailCell: { flex: 1 },
  detailLabel: { fontSize: typography.xs, fontWeight: '700', color: colors.muted, letterSpacing: 0.4, marginBottom: 2 },
  detailValue: { fontSize: typography.sm, fontWeight: '700', color: colors.ink },
  reason: { fontSize: typography.sm, color: colors.muted, marginBottom: spacing.sm },
  commentWrap: { backgroundColor: colors.bgDeep, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.xs },
  commentLabel: { fontSize: typography.xs, fontWeight: '700', color: colors.muted, marginBottom: 2 },
  commentText: { fontSize: typography.sm, color: colors.ink2 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.md },
  approveBtn: { flex: 1, paddingVertical: 11, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.successSoft, borderWidth: 1, borderColor: colors.success },
  approveBtnText: { color: colors.success, fontWeight: '700', fontSize: typography.sm },
  rejectBtn: { flex: 1, paddingVertical: 11, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger },
  rejectBtnText: { color: colors.danger, fontWeight: '700', fontSize: typography.sm },
});
