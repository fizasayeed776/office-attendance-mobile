import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, ScrollView } from 'react-native';
import api from '../api/client';
import { colors, spacing, radius, shadows, typography } from '../theme/colors';

export default function DepartmentsScreen() {
  const [loading, setLoading]   = useState(true);
  const [departments, setDepts] = useState<any[]>([]);
  const [error, setError]       = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDept, setEditingDept]   = useState<any>(null);
  const [name, setName]         = useState('');
  const [desc, setDesc]         = useState('');
  const [saving, setSaving]     = useState(false);
  const [modalError, setModalError] = useState('');

  const load = async () => {
    setError('');
    try { const r = await api.get('/api/departments/'); setDepts(r.data.departments || []); }
    catch (err: any) { setError(err.message || 'Unable to load.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openModal = (dept: any = null) => {
    setEditingDept(dept); setName(dept?.name || ''); setDesc(dept?.description || '');
    setModalError(''); setModalVisible(true);
  };

  const save = async () => {
    if (!name.trim()) { setModalError('Department name is required.'); return; }
    setSaving(true); setModalError('');
    try {
      if (editingDept) await api.put(`/api/departments/${editingDept.pk}/`, { name: name.trim(), description: desc.trim() });
      else await api.post('/api/departments/', { name: name.trim(), description: desc.trim() });
      setModalVisible(false); load();
    } catch (err: any) { setModalError(err.message || 'Unable to save.'); }
    finally { setSaving(false); }
  };

  const confirmDelete = (dept: any) => {
    Alert.alert('Delete Department', `Delete "${dept.name}"? Employees retain their department text.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => doDelete(dept) },
    ]);
  };
  const doDelete = async (dept: any) => {
    try { await api.delete(`/api/departments/${dept.pk}/`); setDepts((p) => p.filter((d) => d.pk !== dept.pk)); }
    catch (err: any) { setError(err.message || 'Unable to delete.'); }
  };

  return (
    <View style={s.screen}>
      <View style={s.toolbar}>
        <Text style={s.heading}>Departments</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => openModal()}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      {!!error && <View style={s.errorBanner}><Text style={s.errorText}>{error}</Text></View>}

      {loading ? (
        <View style={s.loadingWrap}><ActivityIndicator size="large" color={colors.brand} /></View>
      ) : departments.length === 0 ? (
        <View style={s.empty}><Text style={s.emptyIcon}>🏢</Text><Text style={s.emptyTitle}>No departments yet</Text></View>
      ) : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {departments.map((dept) => (
            <View key={dept.pk} style={s.card}>
              <View style={s.cardTop}>
                <View style={s.iconWrap}><Text style={s.icon}>🏢</Text></View>
                <View style={s.cardMeta}>
                  <Text style={s.cardTitle}>{dept.name}</Text>
                  <View style={s.countBadge}><Text style={s.countText}>{dept.employee_count} {dept.employee_count === 1 ? 'employee' : 'employees'}</Text></View>
                </View>
              </View>
              {!!dept.description && <Text style={s.cardDesc} numberOfLines={2}>{dept.description}</Text>}
              <View style={s.actionRow}>
                <TouchableOpacity style={s.editBtn} onPress={() => openModal(dept)}>
                  <Text style={s.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.delBtn} onPress={() => confirmDelete(dept)}>
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
            <Text style={m.title}>{editingDept ? 'Edit Department' : 'Add Department'}</Text>
            {!!modalError && <View style={m.err}><Text style={m.errText}>{modalError}</Text></View>}
            <Text style={m.label}>Name</Text>
            <TextInput style={m.input} value={name} onChangeText={setName} placeholder="Department name" placeholderTextColor={colors.mutedLight} />
            <Text style={m.label}>Description (optional)</Text>
            <TextInput style={[m.input, m.textArea]} value={desc} onChangeText={setDesc} placeholder="Brief description" placeholderTextColor={colors.mutedLight} multiline />
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
  sheet: { backgroundColor: colors.card, borderRadius: radius.xxl, padding: spacing.xl, ...shadows.lg },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: spacing.lg },
  title: { fontSize: typography.xl, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  label: { fontSize: typography.sm, fontWeight: '600', color: colors.ink2, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: typography.md, color: colors.ink },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  err: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.danger },
  errText: { color: colors.danger, fontSize: typography.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border },
  cancelText: { color: colors.ink2, fontWeight: '700' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.brand, ...shadows.sm },
  saveBtnDisabled: { opacity: 0.7 },
  saveText: { color: '#fff', fontWeight: '700' },
});

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  heading: { fontSize: typography.xxl, fontWeight: '800', color: colors.ink },
  addBtn: { backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, ...shadows.sm },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: typography.sm },
  errorBanner: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md, marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.danger },
  errorText: { color: colors.danger, fontSize: typography.sm },
  loadingWrap: { paddingTop: 60, alignItems: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  empty: { paddingTop: 60, alignItems: 'center', gap: spacing.sm },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: typography.xl, fontWeight: '700', color: colors.ink },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  iconWrap: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  cardMeta: { flex: 1, gap: spacing.xs },
  cardTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.ink },
  countBadge: { alignSelf: 'flex-start', backgroundColor: colors.bgDeep, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  countText: { fontSize: typography.xs, color: colors.muted, fontWeight: '600' },
  cardDesc: { fontSize: typography.sm, color: colors.muted, lineHeight: 18, marginBottom: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.md },
  editBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border },
  editBtnText: { color: colors.brand, fontWeight: '700', fontSize: typography.sm },
  delBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger },
  delBtnText: { color: colors.danger, fontWeight: '700', fontSize: typography.sm },
});
