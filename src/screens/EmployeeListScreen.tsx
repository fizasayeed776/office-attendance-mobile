import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Modal, Alert, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { colors, spacing, radius, typography, fonts} from '../theme/colors';

// ─── helpers ────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(' ').filter(Boolean).slice(0, 2)
    .map((w) => w[0]?.toUpperCase()).join('') || '?';
}

function avatarColor(name: string): string {
  const PALETTE = [
    '#0E7C86', '#16A34A', '#D97706', '#2563EB',
    '#9333EA', '#DB2777', '#0891B2', '#65A30D',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

// ─── sub-components ─────────────────────────────────────────────────────────

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const bg = avatarColor(name);
  return (
    <View style={[avatarStyles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[avatarStyles.text, { fontSize: size * 0.36 }]}>{initials(name)}</Text>
    </View>
  );
}
const avatarStyles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontFamily: 'Inter_700Bold' },
});

function StatusDot({ active }: { active: boolean }) {
  return (
    <View style={[dotStyles.dot, { backgroundColor: active ? colors.success : colors.muted }]} />
  );
}
const dotStyles = StyleSheet.create({ dot: { width: 8, height: 8, borderRadius: 4 } });

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}
const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.divider },
  label: { fontSize: typography.sm, color: colors.muted, fontFamily: 'Inter_500Medium' },
  value: { fontSize: typography.sm, color: colors.ink2, fontFamily: 'Inter_600SemiBold', maxWidth: '60%', textAlign: 'right' },
});

// ─── modal helpers ──────────────────────────────────────────────────────────

function ModalShell({
  visible, onClose, title, subtitle, children,
}: {
  visible: boolean; onClose: () => void;
  title: string; subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          {/* drag handle */}
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>{title}</Text>
          {subtitle && <Text style={modalStyles.subtitle}>{subtitle}</Text>}
          {children}
        </View>
      </View>
    </Modal>
  );
}

function ModalField({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <View style={modalStyles.fieldWrap}>
      <Text style={modalStyles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ModalInput({
  value, onChangeText, placeholder, keyboardType, autoCapitalize, multiline,
}: {
  value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any;
  autoCapitalize?: any; multiline?: boolean;
}) {
  return (
    <TextInput
      style={[modalStyles.input, multiline && modalStyles.inputMultiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedLight}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize ?? 'sentences'}
      multiline={multiline}
    />
  );
}

function ModalActions({
  onCancel, onSave, saving, saveLabel = 'Save',
}: {
  onCancel: () => void; onSave: () => void;
  saving: boolean; saveLabel?: string;
}) {
  return (
    <View style={modalStyles.actions}>
      <TouchableOpacity style={modalStyles.cancelBtn} onPress={onCancel} disabled={saving}>
        <Text style={modalStyles.cancelText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[modalStyles.saveBtn, saving && modalStyles.saveBtnDisabled]} onPress={onSave} disabled={saving}>
        {saving
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={modalStyles.saveText}>{saveLabel}</Text>}
      </TouchableOpacity>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    maxHeight: '90%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: typography.xl, fontFamily: 'Inter_700Bold', color: colors.ink, marginBottom: spacing.xs },
  subtitle: { fontSize: typography.sm, color: colors.muted, marginBottom: spacing.lg },
  fieldWrap: { marginBottom: spacing.md },
  fieldLabel: { fontSize: typography.sm, fontFamily: 'Inter_600SemiBold', color: colors.ink2, marginBottom: spacing.xs, letterSpacing: 0.2 },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: typography.md,
    color: colors.ink,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radius.md,
    alignItems: 'center', borderWidth: 1.5, borderColor: colors.border,
  },
  cancelText: { color: colors.ink2, fontFamily: 'Inter_700Bold', fontSize: typography.md },
  saveBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radius.md,
    alignItems: 'center', backgroundColor: colors.brand,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: typography.md },
});

// ─── main screen ────────────────────────────────────────────────────────────

export default function EmployeeListScreen({ navigation }: any) {
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employees, setEmployees]   = useState<any[]>([]);
  const [error, setError]           = useState('');

  // lookup data for modals
  const [departments, setDepartments] = useState<string[]>([]);
  const [shifts, setShifts]           = useState<any[]>([]);

  // edit modal
  const [editOpen, setEditOpen]       = useState(false);
  const [editEmp, setEditEmp]         = useState<any>(null);
  const [editName, setEditName]       = useState('');
  const [editEmail, setEditEmail]     = useState('');
  const [editPhone, setEditPhone]     = useState('');
  const [editDept, setEditDept]       = useState('');
  const [editDesig, setEditDesig]     = useState('');
  const [editSaving, setEditSaving]   = useState(false);

  // assign modal
  const [assignOpen, setAssignOpen]         = useState(false);
  const [assignEmp, setAssignEmp]           = useState<any>(null);
  const [assignDept, setAssignDept]         = useState('');
  const [assignShiftPk, setAssignShiftPk]   = useState<number | null>(null);
  const [assignSaving, setAssignSaving]     = useState(false);

  // modal-level error
  const [modalError, setModalError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/api/employees/');
      setEmployees(res.data.employees || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load employees.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLookups = useCallback(async () => {
    try {
      const [dR, sR] = await Promise.all([api.get('/api/departments/'), api.get('/api/shifts/')]);
      setDepartments((dR.data.departments || []).map((d: any) => d.name));
      setShifts(sR.data.shifts || []);
    } catch {}
  }, []);

  useEffect(() => { loadLookups(); }, [loadLookups]);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // ── Edit
  const openEdit = (emp: any) => {
    setEditEmp(emp);
    setEditName(emp.name || '');
    setEditEmail(emp.email || '');
    setEditPhone(emp.phone || '');
    setEditDept(emp.department || '');
    setEditDesig(emp.designation || '');
    setModalError('');
    setEditOpen(true);
  };
  const saveEdit = async () => {
    if (!editName.trim()) { setModalError('Name is required.'); return; }
    setEditSaving(true); setModalError('');
    try {
      await api.put(`/api/employees/${editEmp.pk}/`, {
        name: editName.trim(), email: editEmail.trim(),
        phone: editPhone.trim(), department: editDept.trim(), designation: editDesig.trim(),
      });
      setEditOpen(false);
      load();
    } catch (err: any) {
      setModalError(err.message || 'Unable to save.');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Assign
  const openAssign = (emp: any) => {
    setAssignEmp(emp);
    setAssignDept(emp.department || '');
    setAssignShiftPk(emp.shift_pk ?? null);
    setModalError('');
    setAssignOpen(true);
  };
  const saveAssign = async () => {
    setAssignSaving(true); setModalError('');
    try {
      await api.put(`/api/employees/${assignEmp.pk}/`, {
        department: assignDept.trim(),
        shift_pk: assignShiftPk,
      });
      setAssignOpen(false);
      load();
    } catch (err: any) {
      setModalError(err.message || 'Unable to save.');
    } finally {
      setAssignSaving(false);
    }
  };

  // ── Delete
  const confirmDelete = (emp: any) => {
    Alert.alert(
      'Delete employee',
      `Delete ${emp.name}? This permanently removes their attendance history and face data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => doDelete(emp) },
      ],
    );
  };
  const doDelete = async (emp: any) => {
    try {
      await api.delete(`/api/employees/${emp.pk}/`);
      setEmployees((prev) => prev.filter((e) => e.pk !== emp.pk));
    } catch (err: any) {
      setError(err.message || 'Unable to delete.');
    }
  };

  const viewHistory = (emp: any) => {
    navigation.navigate('Attendance', { screen: 'AttendanceList', params: { q: emp.name } });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Toolbar ── */}
        <View style={styles.toolbar}>
          <View>
            <Text style={styles.heading}>Employees</Text>
            {!loading && (
              <Text style={styles.subheading}>{employees.length} total</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddEmployee')}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ Add Employee</Text>
          </TouchableOpacity>
        </View>

        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : employees.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyTitle}>No employees yet</Text>
            <Text style={styles.emptyBody}>Tap "Add Employee" to create the first record.</Text>
          </View>
        ) : (
          employees.map((emp) => (
            <View key={emp.pk} style={styles.card}>
              {/* ── Card header ── */}
              <View style={styles.cardHeader}>
                <Avatar name={emp.name} size={48} />
                <View style={styles.cardHeaderMeta}>
                  <View style={styles.cardNameRow}>
                    <Text style={styles.cardName}>{emp.name}</Text>
                    <StatusDot active={emp.account_setup} />
                  </View>
                  <Text style={styles.cardId}>{emp.employee_id}</Text>
                  {!!emp.designation && (
                    <Text style={styles.cardDesig}>{emp.designation}</Text>
                  )}
                </View>
              </View>

              {/* ── Detail rows ── */}
              <View style={styles.cardBody}>
                <InfoRow label="Department" value={emp.department || '—'} />
                <InfoRow label="Email"      value={emp.email || '—'} />
                <InfoRow label="Phone"      value={emp.phone || '—'} />
                <InfoRow label="Shift"      value={emp.shift_name || '—'} />
              </View>

              {/* ── Chips ── */}
              <View style={styles.chipRow}>
                <View style={[styles.chip, emp.face_trained ? styles.chipSuccess : styles.chipMuted]}>
                  <Text style={[styles.chipText, emp.face_trained ? styles.chipTextSuccess : styles.chipTextMuted]}>
                    {emp.face_trained ? 'Face registered' : 'No face data'}
                  </Text>
                </View>
                <View style={[styles.chip, emp.account_setup ? styles.chipSuccess : styles.chipMuted]}>
                  <Text style={[styles.chipText, emp.account_setup ? styles.chipTextSuccess : styles.chipTextMuted]}>
                    {emp.account_setup ? 'Account active' : 'Pending setup'}
                  </Text>
                </View>
              </View>

              {/* ── Actions ── */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => viewHistory(emp)}>
                  <Text style={styles.actionBtnText}>History</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(emp)}>
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openAssign(emp)}>
                  <Text style={styles.actionBtnText}>Assign</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => confirmDelete(emp)}>
                  <Text style={styles.actionBtnDangerText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ══ Edit modal ══ */}
      <ModalShell
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Employee"
        subtitle="Update details without changing face data."
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {!!modalError && <View style={styles.modalError}><Text style={styles.modalErrorText}>{modalError}</Text></View>}
          <ModalField label="Name">
            <ModalInput value={editName} onChangeText={setEditName} placeholder="Full name" />
          </ModalField>
          <ModalField label="Email">
            <ModalInput value={editEmail} onChangeText={setEditEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" />
          </ModalField>
          <ModalField label="Phone">
            <ModalInput value={editPhone} onChangeText={setEditPhone} placeholder="+92 300 0000000" keyboardType="phone-pad" />
          </ModalField>
          <ModalField label="Department">
            <ModalInput value={editDept} onChangeText={setEditDept} placeholder="e.g. Engineering" />
          </ModalField>
          <ModalField label="Designation">
            <ModalInput value={editDesig} onChangeText={setEditDesig} placeholder="e.g. Senior Developer" />
          </ModalField>
          <ModalActions onCancel={() => setEditOpen(false)} onSave={saveEdit} saving={editSaving} />
        </ScrollView>
      </ModalShell>

      {/* ══ Assign modal ══ */}
      <ModalShell
        visible={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign Department & Shift"
        subtitle={assignEmp?.name}
      >
        <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
          {!!modalError && <View style={styles.modalError}><Text style={styles.modalErrorText}>{modalError}</Text></View>}

          <Text style={modalStyles.fieldLabel}>Department</Text>
          <View style={styles.pickerList}>
            {[{ label: 'No department', value: '' }, ...departments.map((d) => ({ label: d, value: d }))].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.pickerItem, assignDept === opt.value && styles.pickerItemActive]}
                onPress={() => setAssignDept(opt.value)}
              >
                <Text style={[styles.pickerItemText, assignDept === opt.value && styles.pickerItemTextActive]}>
                  {opt.label}
                </Text>
                {assignDept === opt.value && <Ionicons name="checkmark" size={14} color={colors.brand} />}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[modalStyles.fieldLabel, { marginTop: spacing.md }]}>Shift</Text>
          <View style={styles.pickerList}>
            {[{ label: 'No shift assigned', pk: null }, ...shifts.map((s) => ({ label: `${s.name} (${s.start_time}–${s.end_time})`, pk: s.pk }))].map((opt) => (
              <TouchableOpacity
                key={String(opt.pk)}
                style={[styles.pickerItem, assignShiftPk === opt.pk && styles.pickerItemActive]}
                onPress={() => setAssignShiftPk(opt.pk)}
              >
                <Text style={[styles.pickerItemText, assignShiftPk === opt.pk && styles.pickerItemTextActive]}>
                  {opt.label}
                </Text>
                {assignShiftPk === opt.pk && <Ionicons name="checkmark" size={14} color={colors.brand} />}
              </TouchableOpacity>
            ))}
          </View>

          <ModalActions onCancel={() => setAssignOpen(false)} onSave={saveAssign} saving={assignSaving} saveLabel="Save Assignment" />
        </ScrollView>
      </ModalShell>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },

  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  heading: { fontSize: typography.xxl, fontFamily: 'Inter_800ExtraBold', color: colors.ink },
  subheading: { fontSize: typography.sm, color: colors.muted, marginTop: 2 },
  addBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  addBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: typography.sm },

  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  errorText: { color: colors.danger, fontSize: typography.base },

  loadingWrap: { paddingVertical: 80, alignItems: 'center' },

  empty: { paddingVertical: 80, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: typography.xl, fontFamily: 'Inter_700Bold', color: colors.ink },
  emptyBody: { fontSize: typography.base, color: colors.muted, textAlign: 'center', paddingHorizontal: spacing.xl },

  // ── Employee card
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  cardHeaderMeta: { flex: 1 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xxs },
  cardName: { fontSize: typography.lg, fontFamily: 'Inter_700Bold', color: colors.ink },
  cardId: { fontSize: typography.sm, color: colors.muted, fontFamily: 'Inter_600SemiBold' },
  cardDesig: { fontSize: typography.sm, color: colors.brand, fontFamily: 'Inter_500Medium', marginTop: 2 },

  cardBody: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.pill },
  chipSuccess: { backgroundColor: colors.successSoft },
  chipMuted: { backgroundColor: colors.bgDeep },
  chipText: { fontSize: typography.xs, fontFamily: 'Inter_600SemiBold' },
  chipTextSuccess: { color: colors.success },
  chipTextMuted: { color: colors.muted },

  // ── Action row
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.divider,
  },
  actionBtnText: { fontSize: typography.sm, fontFamily: 'Inter_700Bold', color: colors.brand },
  actionBtnDanger: { borderRightWidth: 0 },
  actionBtnDangerText: { fontSize: typography.sm, fontFamily: 'Inter_700Bold', color: colors.danger },

  // ── Modal error
  modalError: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  modalErrorText: { color: colors.danger, fontSize: typography.sm },

  // ── Picker lists
  pickerList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.card,
  },
  pickerItemActive: { backgroundColor: colors.brandSofter },
  pickerItemText: { fontSize: typography.base, color: colors.ink2 },
  pickerItemTextActive: { color: colors.brand, fontFamily: 'Inter_700Bold' },
});
