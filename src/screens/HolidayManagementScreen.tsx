import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { colors, spacing, radius, shadows, typography } from '../theme/colors';

type Holiday = { pk: number; name: string; date: string; description: string };

export default function HolidayManagementScreen() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [name, setName]         = useState('');
  const [date, setDate]         = useState('');
  const [desc, setDesc]         = useState('');
  const [busy, setBusy]         = useState(false);
  const [modalError, setModalError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try { const { data } = await api.get('/api/holidays/'); setHolidays(data.holidays || []); }
    catch (err: any) { setError(err.message || 'Unable to load.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const openModal = (holiday: Holiday | null = null) => {
    setEditingHoliday(holiday); setName(holiday?.name || '');
    setDate(holiday?.date || ''); setDesc(holiday?.description || '');
    setModalError(''); setModalVisible(true);
  };
  const closeModal = () => { setModalVisible(false); setEditingHoliday(null); setName(''); setDate(''); setDesc(''); setModalError(''); };

  const save = async () => {
    const nameTrimmed = name.trim();
    const dateTrimmed = date.trim();
    console.log('DEBUG HolidayManagementScreen saveHoliday', { nameValue: name, dateValue: date, nameTrimmed, dateTrimmed });
    if (!nameTrimmed || !dateTrimmed) { setModalError('Holiday name and date are required.'); return; }
    const validDateRegex = /^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})$/;
    if (!validDateRegex.test(dateTrimmed)) { setModalError('Date must be in YYYY-MM-DD, MM/DD/YYYY or DD-MM-YYYY format.'); return; }
    setBusy(true); setModalError('');
    try {
      if (editingHoliday) await api.put(`/api/holidays/${editingHoliday.pk}/`, { name: nameTrimmed, date: dateTrimmed, description: desc.trim() });
      else await api.post('/api/holidays/', { name: nameTrimmed, date: dateTrimmed, description: desc.trim() });
      closeModal(); await load();
    } catch (err: any) { setModalError(err.message || 'Unable to save.'); }
    finally { setBusy(false); }
  };

  const confirmDelete = (holiday: Holiday) => {
    Alert.alert('Delete Holiday', `Delete "${holiday.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => doDelete(holiday) },
    ]);
  };
  const doDelete = async (holiday: Holiday) => {
    try { await api.delete(`/api/holidays/${holiday.pk}/`); await load(); }
    catch (err: any) { setError(err.message || 'Unable to delete.'); }
  };

  return (
    <View style={s.screen}>
      <View style={s.toolbar}>
        <Text style={s.heading}>Holidays</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => openModal()}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      {!!error && <View style={s.errorBanner}><Text style={s.errorText}>{error}</Text></View>}

      <FlatList
        data={holidays}
        keyExtractor={(item) => String(item.pk)}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? null : (
            <View style={s.empty}><Text style={s.emptyIcon}>🗓️</Text><Text style={s.emptyTitle}>No holidays defined</Text></View>
          )
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardTop}>
              <View style={s.iconWrap}><Text style={s.icon}>🗓️</Text></View>
              <View style={s.cardMeta}>
                <Text style={s.cardTitle}>{item.name}</Text>
                <View style={s.dateBadge}><Text style={s.dateBadgeText}>{item.date}</Text></View>
              </View>
            </View>
            {!!item.description && <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>}
            <View style={s.actionRow}>
              <TouchableOpacity style={s.editBtn} onPress={() => openModal(item)}>
                <Text style={s.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.delBtn} onPress={() => confirmDelete(item)}>
                <Text style={s.delBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      {loading && <View style={s.loadingOverlay}><ActivityIndicator size="large" color={colors.brand} /></View>}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.handle} />
            <Text style={m.title}>{editingHoliday ? 'Edit Holiday' : 'Add Holiday'}</Text>
            <Text style={m.subtitle}>Holidays are excluded from absence calculations.</Text>
            {!!modalError && <View style={m.err}><Text style={m.errText}>{modalError}</Text></View>}
            <Text style={m.label}>Name</Text>
            <TextInput style={m.input} value={name} onChangeText={setName} placeholder="e.g. Independence Day" placeholderTextColor={colors.mutedLight} />
            <Text style={m.label}>Date (YYYY-MM-DD)</Text>
            <TextInput style={m.input} value={date} onChangeText={setDate} placeholder="2026-08-14" placeholderTextColor={colors.mutedLight} keyboardType="numbers-and-punctuation" />
            <Text style={m.label}>Description (optional)</Text>
            <TextInput style={[m.input, m.textArea]} value={desc} onChangeText={setDesc} placeholder="Optional description" placeholderTextColor={colors.mutedLight} multiline />
            <View style={m.actions}>
              <TouchableOpacity style={m.cancelBtn} onPress={closeModal}><Text style={m.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[m.saveBtn, busy && m.saveBtnDisabled]} onPress={save} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={m.saveText}>Save</Text>}
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
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, padding: spacing.xl, ...shadows.lg },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: spacing.lg },
  title: { fontSize: typography.xl, fontWeight: '700', color: colors.ink, marginBottom: spacing.xs },
  subtitle: { fontSize: typography.sm, color: colors.muted, marginBottom: spacing.md },
  label: { fontSize: typography.sm, fontWeight: '600', color: colors.ink2, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: typography.md, color: colors.ink },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
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
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  empty: { paddingTop: 60, alignItems: 'center', gap: spacing.sm },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: typography.xl, fontWeight: '700', color: colors.ink },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  iconWrap: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  cardMeta: { flex: 1, gap: spacing.xs },
  cardTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.ink },
  dateBadge: { alignSelf: 'flex-start', backgroundColor: colors.brandSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  dateBadgeText: { fontSize: typography.xs, fontWeight: '700', color: colors.brand },
  cardDesc: { fontSize: typography.sm, color: colors.muted, marginBottom: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.md },
  editBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border },
  editBtnText: { color: colors.brand, fontWeight: '700', fontSize: typography.sm },
  delBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger },
  delBtnText: { color: colors.danger, fontWeight: '700', fontSize: typography.sm },
});
