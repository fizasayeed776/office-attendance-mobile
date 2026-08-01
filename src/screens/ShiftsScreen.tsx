import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { colors, spacing, radius, typography } from '../theme/colors';

export default function ShiftsScreen() {
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts]   = useState<any[]>([]);
  const [error, setError]     = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [name, setName]         = useState('');
  const [start, setStart]       = useState('');
  const [end, setEnd]           = useState('');
  const [grace, setGrace]       = useState('10');
  const [saving, setSaving]     = useState(false);
  const [modalError, setModalError] = useState('');

  const load = async () => {
    setError('');
    try { const r = await api.get('/api/shifts/'); setShifts(r.data.shifts || []); }
    catch (err: any) { setError(err.message || 'Unable to load.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openModal = (shift: any = null) => {
    setEditingShift(shift); setName(shift?.name || '');
    setStart(shift?.start_time || ''); setEnd(shift?.end_time || '');
    setGrace(String(shift?.grace_period_minutes ?? 10));
    setModalError(''); setModalVisible(true);
  };

  const normaliseTime = (t: string): string => {
    // Ensure HH:MM format — pad a single-digit hour so the backend's
    // _parse_time('%H:%M') parser doesn't reject values like "9:00".
    const trimmed = t.trim();
    if (/^\d:\d{2}$/.test(trimmed)) return `0${trimmed}`;
    return trimmed;
  };

  const save = async () => {
    const normName  = name.trim();
    const normStart = normaliseTime(start);
    const normEnd   = normaliseTime(end);

    if (!normName || !normStart || !normEnd) { setModalError('Name, start time, and end time are required.'); return; }

    // Validate format client-side — catches obvious typos before the round-trip.
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
    if (!timeRegex.test(normStart) || !timeRegex.test(normEnd)) {
      setModalError('Times must be in HH:MM format, e.g. 09:00 or 17:30.');
      return;
    }

    const graceParsed = parseInt(grace, 10);
    if (isNaN(graceParsed) || graceParsed < 0) { setModalError('Grace period must be a non-negative number.'); return; }
    setSaving(true); setModalError('');
    try {
      const payload = { name: normName, start_time: normStart, end_time: normEnd, grace_period_minutes: graceParsed };
      if (editingShift) await api.put(`/api/shifts/${editingShift.pk}/`, payload);
      else await api.post('/api/shifts/', payload);
      setModalVisible(false); load();
    } catch (err: any) { setModalError(err.message || 'Unable to save.'); }
    finally { setSaving(false); }
  };

  const confirmDelete = (shift: any) => {
    Alert.alert('Delete Shift', `Delete "${shift.name}"? Employee assignments will be cleared.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => doDelete(shift) },
    ]);
  };
  const doDelete = async (shift: any) => {
    try { await api.delete(`/api/shifts/${shift.pk}/`); setShifts((p) => p.filter((s) => s.pk !== shift.pk)); }
    catch (err: any) { setError(err.message || 'Unable to delete.'); }
  };

  return (
    <View style={s.screen}>
      <View style={s.toolbar}>
        <Text style={s.heading}>Shifts</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => openModal()}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      {!!error && <View style={s.errorBanner}><Text style={s.errorText}>{error}</Text></View>}

      {loading ? (
        <View style={s.loadingWrap}><ActivityIndicator size="large" color={colors.brand} /></View>
      ) : shifts.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIconWrap}><Ionicons name="time-outline" size={40} color={colors.muted} /></View>
          <Text style={s.emptyTitle}>No shifts yet</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {shifts.map((shift) => (
            <View key={shift.pk} style={s.card}>
              <View style={s.cardTop}>
                <View style={s.iconWrap}><Ionicons name="time-outline" size={22} color={colors.brand} /></View>
                <View style={s.cardMeta}>
                  <Text style={s.cardTitle}>{shift.name}</Text>
                  <View style={s.countBadge}><Text style={s.countText}>{shift.employee_count} {shift.employee_count === 1 ? 'employee' : 'employees'}</Text></View>
                </View>
              </View>

              <View style={s.timesRow}>
                <View style={s.timeItem}>
                  <Text style={s.timeLabel}>START</Text>
                  <Text style={s.timeValue}>{shift.start_time}</Text>
                </View>
                <View style={s.timeSep} />
                <View style={s.timeItem}>
                  <Text style={s.timeLabel}>END</Text>
                  <Text style={s.timeValue}>{shift.end_time}</Text>
                </View>
                <View style={s.timeSep} />
                <View style={s.timeItem}>
                  <Text style={s.timeLabel}>GRACE</Text>
                  <Text style={s.timeValue}>{shift.grace_period_minutes}m</Text>
                </View>
              </View>

              <View style={s.actionRow}>
                <TouchableOpacity style={s.editBtn} onPress={() => openModal(shift)}>
                  <Text style={s.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.delBtn} onPress={() => confirmDelete(shift)}>
                  <Text style={s.delBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.handle} />
            <Text style={m.title}>{editingShift ? 'Edit Shift' : 'Add Shift'}</Text>
            {!!modalError && <View style={m.err}><Text style={m.errText}>{modalError}</Text></View>}
            <Text style={m.label}>Name</Text>
            <TextInput style={m.input} value={name} onChangeText={setName} placeholder="e.g. Morning" placeholderTextColor={colors.mutedLight} />
            <View style={m.timeRow}>
              <View style={m.timeField}>
                <Text style={m.label}>Start time</Text>
                <TextInput style={m.input} value={start} onChangeText={setStart} placeholder="09:00" placeholderTextColor={colors.mutedLight} keyboardType="numbers-and-punctuation" />
              </View>
              <View style={m.timeField}>
                <Text style={m.label}>End time</Text>
                <TextInput style={m.input} value={end} onChangeText={setEnd} placeholder="17:30" placeholderTextColor={colors.mutedLight} keyboardType="numbers-and-punctuation" />
              </View>
            </View>
            <Text style={m.label}>Grace period (minutes)</Text>
            <TextInput style={m.input} value={grace} onChangeText={setGrace} keyboardType="numeric" placeholder="10" placeholderTextColor={colors.mutedLight} />
            <View style={m.actions}>
              <TouchableOpacity style={m.cancelBtn} onPress={() => setModalVisible(false)}><Text style={m.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[m.saveBtn, saving && m.saveBtnDisabled]} onPress={save} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={m.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg },
  sheet: { backgroundColor: colors.card, borderRadius: radius.xxl, padding: spacing.xl },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: spacing.lg },
  title: { fontSize: typography.xl, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  label: { fontSize: typography.sm, fontWeight: '600', color: colors.ink2, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: typography.md, color: colors.ink },
  timeRow: { flexDirection: 'row', gap: spacing.md },
  timeField: { flex: 1 },
  err: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.danger },
  errText: { color: colors.danger, fontSize: typography.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border },
  cancelText: { color: colors.ink2, fontWeight: '700' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.brand },
  saveBtnDisabled: { opacity: 0.7 },
  saveText: { color: '#fff', fontWeight: '700' },
});

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  heading: { fontSize: typography.xxl, fontWeight: '800', color: colors.ink },
  addBtn: { backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: typography.sm },
  errorBanner: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md, marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.danger },
  errorText: { color: colors.danger, fontSize: typography.sm },
  loadingWrap: { paddingTop: 60, alignItems: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  empty: { paddingTop: 60, alignItems: 'center', gap: spacing.sm },
  emptyIconWrap: { width: 72, height: 72, borderRadius: radius.xxl, backgroundColor: colors.bgDeep, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: typography.xl, fontWeight: '700', color: colors.ink },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  iconWrap: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { flex: 1, gap: spacing.xs },
  cardTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.ink },
  countBadge: { alignSelf: 'flex-start', backgroundColor: colors.bgDeep, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  countText: { fontSize: typography.xs, color: colors.muted, fontWeight: '600' },
  timesRow: { flexDirection: 'row', backgroundColor: colors.bgDeep, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, alignItems: 'center' },
  timeItem: { flex: 1, alignItems: 'center' },
  timeLabel: { fontSize: typography.xs, fontWeight: '700', color: colors.muted, letterSpacing: 0.4 },
  timeValue: { fontSize: typography.md, fontWeight: '700', color: colors.brand, marginTop: 2 },
  timeSep: { width: 1, height: 30, backgroundColor: colors.border },
  actionRow: { flexDirection: 'row', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.md },
  editBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border },
  editBtnText: { color: colors.brand, fontWeight: '700', fontSize: typography.sm },
  delBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger },
  delBtnText: { color: colors.danger, fontWeight: '700', fontSize: typography.sm },
});
