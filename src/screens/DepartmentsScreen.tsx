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

export default function DepartmentsScreen() {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const loadDepartments = async () => {
    setError('');
    try {
      const res = await api.get('/api/departments/');
      setDepartments(res.data.departments || []);
    } catch (err: any) {
      console.error('DepartmentsScreen loadDepartments failed', err);
      setError(err.message || 'Unable to load departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const openModal = (department: any = null) => {
    setEditingDepartment(department);
    setName(department?.name || '');
    setDescription(department?.description || '');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingDepartment(null);
    setName('');
    setDescription('');
    setError('');
  };

  const saveDepartment = async () => {
    if (!name.trim()) {
      setError('Department name is required.');
      return;
    }
    setModalLoading(true);
    setError('');
    try {
      if (editingDepartment) {
        await api.put(`/api/departments/${editingDepartment.pk}/`, {
          name: name.trim(),
          description: description.trim(),
        });
      } else {
        await api.post('/api/departments/', {
          name: name.trim(),
          description: description.trim(),
        });
      }
      closeModal();
      loadDepartments();
    } catch (err: any) {
      setError(err.message || 'Unable to save department.');
    } finally {
      setModalLoading(false);
    }
  };

  const confirmDelete = (department: any) => {
    Alert.alert(
      'Delete Department',
      `Delete ${department.name}? Employees assigned to it retain their department text, but the managed entry will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteDepartment(department) },
      ]
    );
  };

  const deleteDepartment = async (department: any) => {
    setError('');
    try {
      await api.delete(`/api/departments/${department.pk}/`);
      setDepartments((prev) => prev.filter((item) => item.pk !== department.pk));
    } catch (err: any) {
      setError(err.message || 'Unable to delete department.');
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Departments</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => openModal()}>
          <Text style={styles.ctaText}>Add Department</Text>
        </TouchableOpacity>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : departments.length ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          {departments.map((department) => (
            <View key={department.pk} style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>{department.name}</Text>
                <Text style={styles.cardBadge}>{department.employee_count} employees</Text>
              </View>
              <Text style={styles.cardDescription}>{department.description || 'No description provided.'}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionButton} onPress={() => openModal(department)}>
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => confirmDelete(department)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No departments yet. Tap Add Department to create one.</Text>
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingDepartment ? 'Edit Department' : 'Add Department'}</Text>
            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Department name"
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.textArea]}
              placeholder="Optional description"
              placeholderTextColor={colors.muted}
              multiline
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={closeModal} disabled={modalLoading}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitButton} onPress={saveDepartment} disabled={modalLoading}>
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
  cardDescription: { color: colors.muted, lineHeight: 20, marginBottom: spacing.md },
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
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  modalCancelButton: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  modalCancelText: { color: colors.ink2, fontWeight: '700' },
  modalSubmitButton: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.brand },
  modalSubmitText: { color: '#fff', fontWeight: '700' },
});
