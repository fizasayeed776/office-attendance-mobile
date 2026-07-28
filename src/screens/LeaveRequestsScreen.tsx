import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { colors, spacing, radius, shadows, typography } from '../theme/colors';

const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Annual Leave', 'Emergency Leave'];

type LeaveRequest = {
  pk: number; employee_name: string; employee_code: string;
  department: string; leave_type: string; start_date: string;
  end_date: string; days: number; reason: string;
  status: 'pending' | 'approved' | 'rejected'; rejection_reason: string;
};
type EmployeeOption = { pk: number; employee_id: string; name: string; department: string };

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

export default function LeaveRequestsScreen() {
  const [items, setItems]           = useState<LeaveRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');
  const [employees, setEmployees]   = useState<EmployeeOption[]>([]);

  // reject modal
  const [rejectModal, setRejectModal]     = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason]   = useState('');

  // add modal
  const [addModal, setAddModal]               = useState(false);
  const [selEmpPk, setSelEmpPk]               = useState<number | null>(null);
  const [leaveType, setLeaveType]             = useState(LEAVE_TYPES[0]);
  const [startDate, setStartDate]             = useState('');
  const [endDate, setEndDate]                 = useState('');
  const [addReason, setAddReason]             = useState('');
  const [busy, setBusy]                       = useState(false);
  const [modalError, setModalError]           = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [lRes, eRes] = await Promise.all([api.get('/api/leaves/'), api.get('/api/employees/')]);
      setItems(lRes.data.leaves || []);
      const list = (eRes.data.employees || []).map((e: any) => ({
        pk: e.pk, employee_id: e.employee_id, name: e.name, department: e.department,
      }));
      setEmployees(list);
      setSelEmpPk((cur) => cur ?? list[0]?.pk ?? null);
    } catch (err: any) {
      setError(err.message || 'Unable to load leave requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const approve = async (pk: number) => {
    setBusy(true);
    try { await api.patch(`/api/leaves/${pk}/`, { decision: 'approved' }); await load(); }
    catch (err: any) { setError(err.message || 'Unable to approve.'); }
    finally { setBusy(false); }
  };

  const openReject = (leave: LeaveRequest) => {
    setSelectedLeave(leave); setRejectReason(''); setModalError(''); setRejectModal(true);
  };
  const submitReject = async () => {
    if (!rejectReason.trim()) { setModalError('Please provide a rejection reason.'); return; }
    setBusy(true); setModalError('');
    try {
      await api.patch(`/api/leaves/${selectedLeave!.pk}/`, { decision: 'rejected', rejection_reason: rejectReason.trim() });
      setRejectModal(false); setSelectedLeave(null); await load();
    } catch (err: any) { setModalError(err.message || 'Failed to reject.'); }
    finally { setBusy(false); }
  };

  const submitAdd = async () => {
    setModalError('');
    if (!selEmpPk) { setModalError('Please select an employee.'); return; }
    if (!startDate.trim() || !endDate.trim()) { setModalError('Start and end dates are required.'); return; }
    setBusy(true);
    try {
      await api.post('/api/leaves/', { employee_pk: selEmpPk, leave_type: leaveType, start_date: startDate, end_date: endDate, reason: addReason.trim() });
      setAddModal(false); setStartDate(''); setEndDate(''); setAddReason(''); setLeaveType(LEAVE_TYPES[0]);
      await load();
    } catch (err: any) { setModalError(err.message || 'Failed to add request.'); }
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
          ListHeaderComponent={
            <View style={s.toolbar}>
              <Text style={s.heading}>Leave Requests</Text>
              <TouchableOpacity style={s.addBtn} onPress={() => { setModalError(''); setAddModal(true); }}>
                <Text style={s.addBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyTitle}>No leave requests</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              {/* Header */}
              <View style={s.cardTop}>
                <View style={s.avatarWrap}>
                  <Text style={s.avatarText}>{initials(item.employee_name)}</Text>
                </View>
                <View style={s.cardMeta}>
                  <Text style={s.cardName}>{item.employee_name}</Text>
                  <Text style={s.cardSub}>{item.employee_code} · {item.department || 'No dept'}</Text>
                </View>
                <StatusChip status={item.status} />
              </View>

              {/* Details */}
              <View style={s.detailRow}>
                <View style={s.detailItem}>
                  <Text style={s.detailLabel}>TYPE</Text>
                  <Text style={s.detailValue}>{item.leave_type}</Text>
                </View>
                <View style={s.detailItem}>
                  <Text style={s.detailLabel}>DATES</Text>
                  <Text style={s.detailValue}>{item.start_date} → {item.end_date}</Text>
                </View>
                <View style={s.daysBadge}>
                  <Text style={s.daysNum}>{item.days}</Text>
                  <Text style={s.daysLabel}>day{item.days !== 1 ? 's' : ''}</Text>
                </View>
              </View>

              {!!item.reason && <Text style={s.reason} numberOfLines={2}>{item.reason}</Text>}
              {item.status === 'rejected' && !!item.rejection_reason && (
                <View style={s.rejectionWrap}>
                  <Text style={s.rejectionText}>Rejected: {item.rejection_reason}</Text>
                </View>
              )}

              {item.status === 'pending' && (
                <View style={s.actionRow}>
                  <TouchableOpacity style={s.approveBtn} onPress={() => approve(item.pk)} disabled={busy}>
                    <Text style={s.approveBtnText}>✓ Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.rejectBtn} onPress={() => openReject(item)} disabled={busy}>
                    <Text style={s.rejectBtnText}>✕ Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
      {!!error && <Text style={s.errorBar}>{error}</Text>}

      {/* ── Reject modal ── */}
      <Modal visible={rejectModal} animationType="slide" transparent onRequestClose={() => setRejectModal(false)}>
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.handle} />
            <Text style={m.title}>Reject Leave Request</Text>
            <Text style={m.subtitle}>Provide a reason so the employee understands the decision.</Text>
            {!!modalError && <View style={m.err}><Text style={m.errText}>{modalError}</Text></View>}
            <TextInput style={[m.input, m.textArea]} value={rejectReason} onChangeText={setRejectReason}
              placeholder="Rejection reason" placeholderTextColor={colors.mutedLight} multiline />
            <View style={m.actions}>
              <TouchableOpacity style={m.cancelBtn} onPress={() => setRejectModal(false)}>
                <Text style={m.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[m.submitBtn, busy && m.submitDisabled]} onPress={submitReject} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={m.submitText}>Reject</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add modal ── */}
      <Modal visible={addModal} animationType="slide" transparent onRequestClose={() => setAddModal(false)}>
        <View style={m.overlay}>
          <View style={[m.sheet, { maxHeight: '92%' }]}>
            <View style={m.handle} />
            <Text style={m.title}>Add Leave Request</Text>
            <Text style={m.subtitle}>Submit on behalf of an employee.</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {!!modalError && <View style={m.err}><Text style={m.errText}>{modalError}</Text></View>}

              <Text style={m.label}>Employee</Text>
              <View style={m.pickerList}>
                {employees.map((emp) => (
                  <TouchableOpacity key={emp.pk} style={[m.pickerItem, selEmpPk === emp.pk && m.pickerItemActive]}
                    onPress={() => setSelEmpPk(emp.pk)}>
                    <Text style={[m.pickerText, selEmpPk === emp.pk && m.pickerTextActive]}>
                      {emp.name} ({emp.employee_id})
                    </Text>
                    {selEmpPk === emp.pk && <Text style={m.check}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={m.label}>Leave type</Text>
              <View style={m.typeGrid}>
                {LEAVE_TYPES.map((t) => (
                  <TouchableOpacity key={t} style={[m.typeChip, leaveType === t && m.typeChipActive]}
                    onPress={() => setLeaveType(t)}>
                    <Text style={[m.typeChipText, leaveType === t && m.typeChipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={m.label}>Start date</Text>
              <TextInput style={m.input} value={startDate} onChangeText={setStartDate}
                placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedLight} />
              <Text style={m.label}>End date</Text>
              <TextInput style={m.input} value={endDate} onChangeText={setEndDate}
                placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedLight} />
              <Text style={m.label}>Reason (optional)</Text>
              <TextInput style={[m.input, m.textArea]} value={addReason} onChangeText={setAddReason}
                placeholder="Optional" placeholderTextColor={colors.mutedLight} multiline />

              <View style={m.actions}>
                <TouchableOpacity style={m.cancelBtn} onPress={() => setAddModal(false)}>
                  <Text style={m.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[m.submitBtn, busy && m.submitDisabled]} onPress={submitAdd} disabled={busy}>
                  {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={m.submitText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    padding: spacing.xl, maxHeight: '80%', ...shadows.lg,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: spacing.lg,
  },
  title: { fontSize: typography.xl, fontWeight: '700', color: colors.ink, marginBottom: spacing.xs },
  subtitle: { fontSize: typography.sm, color: colors.muted, marginBottom: spacing.md, lineHeight: 19 },
  label: { fontSize: typography.sm, fontWeight: '600', color: colors.ink2, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12,
    fontSize: typography.md, color: colors.ink,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  err: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.danger },
  errText: { color: colors.danger, fontSize: typography.sm },
  pickerList: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden', maxHeight: 140 },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.divider, backgroundColor: colors.card },
  pickerItemActive: { backgroundColor: colors.brandSofter },
  pickerText: { fontSize: typography.base, color: colors.ink2 },
  pickerTextActive: { color: colors.brand, fontWeight: '700' },
  check: { color: colors.brand, fontWeight: '700' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bg },
  typeChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  typeChipText: { fontSize: typography.sm, color: colors.ink2, fontWeight: '600' },
  typeChipTextActive: { color: '#fff' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border },
  cancelText: { color: colors.ink2, fontWeight: '700' },
  submitBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.brand, ...shadows.sm },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontWeight: '700' },
});

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  heading: { fontSize: typography.xxl, fontWeight: '800', color: colors.ink },
  addBtn: { backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, ...shadows.sm },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: typography.sm },
  errorBar: { color: colors.danger, padding: spacing.lg, fontSize: typography.base },
  empty: { paddingTop: 60, alignItems: 'center', gap: spacing.sm },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: typography.xl, fontWeight: '700', color: colors.ink },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  chipText: { fontSize: typography.xs, fontWeight: '700' },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  avatarWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: colors.brand },
  cardMeta: { flex: 1 },
  cardName: { fontSize: typography.md, fontWeight: '700', color: colors.ink },
  cardSub: { fontSize: typography.sm, color: colors.muted, marginTop: 2 },
  detailRow: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.bgDeep, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, alignItems: 'center' },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: typography.xs, fontWeight: '700', color: colors.muted, letterSpacing: 0.4, marginBottom: 2 },
  detailValue: { fontSize: typography.sm, fontWeight: '600', color: colors.ink },
  daysBadge: { backgroundColor: colors.brandSoft, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, alignItems: 'center' },
  daysNum: { fontSize: typography.xl, fontWeight: '800', color: colors.brand, lineHeight: 24 },
  daysLabel: { fontSize: typography.xs, color: colors.brand, fontWeight: '600' },
  reason: { fontSize: typography.sm, color: colors.muted, marginBottom: spacing.sm },
  rejectionWrap: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.xs },
  rejectionText: { fontSize: typography.sm, color: colors.danger },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.md },
  approveBtn: { flex: 1, paddingVertical: 11, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.successSoft, borderWidth: 1, borderColor: colors.success },
  approveBtnText: { color: colors.success, fontWeight: '700', fontSize: typography.sm },
  rejectBtn: { flex: 1, paddingVertical: 11, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger },
  rejectBtnText: { color: colors.danger, fontWeight: '700', fontSize: typography.sm },
});
