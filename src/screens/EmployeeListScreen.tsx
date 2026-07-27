import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { colors, spacing, radius } from '../theme/colors';

function EmployeeActions({
  employee,
  onEdit,
  onDelete,
  onAssignShift,
  onViewHistory,
}: {
  employee: any;
  onEdit: (employee: any) => void;
  onDelete: (employee: any) => void;
  onAssignShift: (employee: any) => void;
  onViewHistory: (employee: any) => void;
}) {
  return (
    <View style={styles.actionRow}>
      <TouchableOpacity style={styles.actionButton} onPress={() => onViewHistory(employee)}>
        <Text style={styles.actionText}>History</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(employee)}>
        <Text style={styles.actionText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={() => onAssignShift(employee)}>
        <Text style={styles.actionText}>Assign Shift</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => onDelete(employee)}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function EmployeeListScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isAssignModalVisible, setAssignModalVisible] = useState(false);
  const [activeEmployee, setActiveEmployee] = useState<any>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedShiftPk, setSelectedShiftPk] = useState<number | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editDesignation, setEditDesignation] = useState('');

  const loadEmployees = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/api/employees/');
      setEmployees(res.data.employees || []);
    } catch (err: any) {
      console.error('EmployeeListScreen loadEmployees failed', err);
      setError(err.message || 'Unable to load employees.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAssignments = useCallback(async () => {
    try {
      const [deptRes, shiftRes] = await Promise.all([api.get('/api/departments/'), api.get('/api/shifts/')]);
      setDepartments((deptRes.data.departments || []).map((d: any) => d.name));
      setShifts(shiftRes.data.shifts || []);
    } catch (err: any) {
      console.warn('Unable to load departments or shifts', err);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadEmployees();
    }, [loadEmployees])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEmployees();
    setRefreshing(false);
  };

  const confirmDelete = (employee: any) => {
    Alert.alert(
      'Delete employee',
      `Delete ${employee.name}? This will permanently remove their attendance history and face data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteEmployee(employee) },
      ]
    );
  };

  const deleteEmployee = async (employee: any) => {
    setError('');
    try {
      await api.delete(`/api/employees/${employee.pk}/`);
      setEmployees((prev) => prev.filter((item) => item.pk !== employee.pk));
    } catch (err: any) {
      setError(err.message || 'Unable to delete employee.');
    }
  };

  const openAssignModal = (employee: any) => {
    setActiveEmployee(employee);
    setSelectedDepartment(employee.department || '');
    setSelectedShiftPk(employee.shift_pk ?? null);
    setAssignModalVisible(true);
  };

  const openEditModal = (employee: any) => {
    setActiveEmployee(employee);
    setEditName(employee.name || '');
    setEditEmail(employee.email || '');
    setEditPhone(employee.phone || '');
    setEditDepartment(employee.department || '');
    setEditDesignation(employee.designation || '');
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!activeEmployee) return;
    setEditLoading(true);
    setError('');
    try {
      await api.put(`/api/employees/${activeEmployee.pk}/`, {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        department: editDepartment.trim(),
        designation: editDesignation.trim(),
      });
      setEditModalVisible(false);
      loadEmployees();
    } catch (err: any) {
      setError(err.message || 'Unable to update employee details.');
    } finally {
      setEditLoading(false);
    }
  };

  const saveAssignment = async () => {
    if (!activeEmployee) return;
    setAssignLoading(true);
    setError('');
    try {
      await api.put(`/api/employees/${activeEmployee.pk}/`, {
        department: selectedDepartment.trim(),
        shift_pk: selectedShiftPk,
      });
      setAssignModalVisible(false);
      loadEmployees();
    } catch (err: any) {
      setError(err.message || 'Unable to update assignment.');
    } finally {
      setAssignLoading(false);
    }
  };

  const viewHistory = (employee: any) => {
    const q = employee.name || employee.employee_id;
    navigation.navigate('Attendance', { screen: 'AttendanceList', params: { q } });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Employees</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.navigate('AddEmployee')}>
          <Text style={styles.ctaText}>Add Employee</Text>
        </TouchableOpacity>
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : employees.length ? (
        employees.map((employee) => (
          <View key={employee.pk} style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Name</Text>
              <Text style={styles.cardValue}>{employee.name}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Employee ID</Text>
              <Text style={styles.cardValue}>{employee.employee_id}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Department</Text>
              <Text style={styles.cardValue}>{employee.department || '—'}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Designation</Text>
              <Text style={styles.cardValue}>{employee.designation || '—'}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Email</Text>
              <Text style={styles.cardValue}>{employee.email || '—'}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Phone</Text>
              <Text style={styles.cardValue}>{employee.phone || '—'}</Text>
            </View>
            <EmployeeActions
              employee={employee}
              onEdit={openEditModal}
              onDelete={confirmDelete}
              onAssignShift={openAssignModal}
              onViewHistory={viewHistory}
            />
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No employees found. Tap Add Employee to create one.</Text>
        </View>
      )}

      <Modal visible={isEditModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit Employee</Text>
              <Text style={styles.modalSub}>Update the employee's details without changing their face data.</Text>

              <View style={styles.field}>
                <Text style={styles.modalLabel}>Name</Text>
                <TextInput value={editName} onChangeText={setEditName} style={styles.input} />
              </View>
              <View style={styles.field}>
                <Text style={styles.modalLabel}>Email</Text>
                <TextInput value={editEmail} onChangeText={setEditEmail} style={styles.input} autoCapitalize="none" keyboardType="email-address" />
              </View>
              <View style={styles.field}>
                <Text style={styles.modalLabel}>Phone</Text>
                <TextInput value={editPhone} onChangeText={setEditPhone} style={styles.input} keyboardType="phone-pad" />
              </View>
              <View style={styles.field}>
                <Text style={styles.modalLabel}>Department</Text>
                <TextInput value={editDepartment} onChangeText={setEditDepartment} style={styles.input} />
              </View>
              <View style={styles.field}>
                <Text style={styles.modalLabel}>Designation</Text>
                <TextInput value={editDesignation} onChangeText={setEditDesignation} style={styles.input} />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmitButton} onPress={saveEdit} disabled={editLoading}>
                  {editLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={isAssignModalVisible} animationType="slide" transparent onRequestClose={() => setAssignModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Assign Department & Shift</Text>
            <Text style={styles.modalSub}>Update the employee's department and shift assignment.</Text>

            <Text style={styles.modalLabel}>Department</Text>
            <ScrollView style={styles.pickerBox} nestedScrollEnabled>
              <TouchableOpacity onPress={() => setSelectedDepartment('')} style={[styles.pickerItem, selectedDepartment === '' && styles.pickerItemSelected]}>
                <Text style={[styles.pickerText, selectedDepartment === '' && styles.pickerTextSelected]}>No department</Text>
              </TouchableOpacity>
              {departments.map((department) => (
                <TouchableOpacity
                  key={department}
                  onPress={() => setSelectedDepartment(department)}
                  style={[styles.pickerItem, selectedDepartment === department && styles.pickerItemSelected]}
                >
                  <Text style={[styles.pickerText, selectedDepartment === department && styles.pickerTextSelected]}>{department}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Shift</Text>
            <ScrollView style={styles.pickerBox} nestedScrollEnabled>
              <TouchableOpacity onPress={() => setSelectedShiftPk(null)} style={[styles.pickerItem, selectedShiftPk === null && styles.pickerItemSelected]}>
                <Text style={[styles.pickerText, selectedShiftPk === null && styles.pickerTextSelected]}>No shift assigned</Text>
              </TouchableOpacity>
              {shifts.map((shift) => (
                <TouchableOpacity
                  key={shift.pk}
                  onPress={() => setSelectedShiftPk(shift.pk)}
                  style={[styles.pickerItem, selectedShiftPk === shift.pk && styles.pickerItemSelected]}
                >
                  <Text style={[styles.pickerText, selectedShiftPk === shift.pk && styles.pickerTextSelected]}>
                    {shift.name} ({shift.start_time}–{shift.end_time})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setAssignModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitButton} onPress={saveAssignment} disabled={assignLoading}>
                {assignLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  heading: { fontSize: 22, fontWeight: '700', color: colors.ink },
  ctaButton: { backgroundColor: colors.brand, paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.md },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 13.5 },
  errorText: { color: colors.danger, marginBottom: spacing.md },
  loadingContainer: { flex: 1, minHeight: 240, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  cardLabel: { color: colors.muted, fontSize: 12, width: '35%' },
  cardValue: { color: colors.ink2, fontSize: 13.5, width: '60%', textAlign: 'right' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, gap: spacing.sm },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  actionText: { color: colors.ink, fontWeight: '700' },
  deleteButton: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  deleteText: { color: colors.danger, fontWeight: '700' },
  emptyState: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { color: colors.muted, textAlign: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(17,19,42,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  modalSub: { color: colors.muted, marginBottom: spacing.md, lineHeight: 20 },
  modalLabel: { color: colors.muted, marginBottom: spacing.xs, fontSize: 13, marginTop: spacing.sm },
  pickerBox: { backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, maxHeight: 140 },
  pickerItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerItemSelected: { backgroundColor: colors.brandSoft },
  pickerText: { color: colors.ink2 },
  pickerTextSelected: { color: colors.brand, fontWeight: '700' },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  field: { marginBottom: spacing.md },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.ink2,
    fontSize: 14,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalCancelButton: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  modalCancelText: { color: colors.ink2, fontWeight: '700' },
  modalSubmitButton: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.brand },
  modalSubmitText: { color: '#fff', fontWeight: '700' },
});
