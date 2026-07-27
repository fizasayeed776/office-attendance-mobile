import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../api/client';
import { colors, spacing, radius } from '../theme/colors';

type Step = 'details' | 'capture';

export default function AddEmployeeScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('details');
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [employeePk, setEmployeePk] = useState<number | null>(null);
  const [sampleCount, setSampleCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [trainLoading, setTrainLoading] = useState(false);
  const [error, setError] = useState('');

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (step === 'capture' && permission?.granted !== true) {
      requestPermission();
    }
  }, [step, permission, requestPermission]);

  const onSubmitDetails = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/employees/', {
        employee_id: employeeId.trim(),
        name: name.trim(),
        department: department.trim(),
        designation: designation.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      setEmployeePk(data.employee.pk);
      setStep('capture');
    } catch (err: any) {
      setError(err.message || 'Unable to add employee.');
    } finally {
      setLoading(false);
    }
  };

  const onCaptureSample = async () => {
    if (!cameraRef.current || !employeePk) {
      return;
    }
    if (!permission?.granted) {
      Alert.alert('Camera permission required', 'Please allow camera access to capture employee face data.');
      return;
    }

    setCaptureLoading(true);
    setError('');
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      const payload = { image: `data:image/jpeg;base64,${photo.base64}` };
      const { data } = await api.post(`/api/employees/${employeePk}/capture/`, payload);
      setSampleCount(data.sample_count || sampleCount + 1);
    } catch (err: any) {
      setError(err.message || 'Unable to capture face sample.');
    } finally {
      setCaptureLoading(false);
    }
  };

  const onTrainRecognizer = async () => {
    if (!employeePk) {
      return;
    }
    setTrainLoading(true);
    setError('');
    try {
      await api.post(`/api/employees/${employeePk}/train/`);
      Alert.alert('Face registration complete', 'The employee face data has been trained and is ready for recognition.');
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Unable to train face recognizer.');
    } finally {
      setTrainLoading(false);
    }
  };

  const onBackToDetails = () => {
    setStep('details');
    setSampleCount(0);
    setEmployeePk(null);
    setError('');
  };

  if (step === 'capture') {
    return (
      <View style={styles.screen}>
        <Text style={styles.heading}>Capture Face Samples</Text>
        <Text style={styles.helpText}>
          Take at least 3 clear face samples so the recognition model can register this employee.
        </Text>
        <View style={styles.cameraWrap}>
          {permission?.granted ? (
            <CameraView ref={cameraRef} style={styles.camera} facing="front" />
          ) : (
            <View style={styles.permissionCard}>
              <Text style={styles.permissionText}>Camera access is required to register an employee's face.</Text>
              <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Employee ID:</Text>
          <Text style={styles.statusValue}>{employeeId}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Captured samples:</Text>
          <Text style={styles.statusValue}>{sampleCount}</Text>
        </View>
        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.captureButton} onPress={onCaptureSample} disabled={captureLoading || !permission?.granted}>
          {captureLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.captureButtonText}>Capture Face Sample</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.trainButton, sampleCount < 3 && styles.disabledButton]}
          onPress={onTrainRecognizer}
          disabled={trainLoading || sampleCount < 3}
        >
          {trainLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.trainButtonText}>Train Recognizer</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={onBackToDetails} disabled={captureLoading || trainLoading}>
          <Text style={styles.cancelButtonText}>Edit Details</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Add Employee</Text>
      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.field}>
        <Text style={styles.label}>Employee ID</Text>
        <TextInput value={employeeId} onChangeText={setEmployeeId} style={styles.input} autoCapitalize="none" />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Name</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Department</Text>
        <TextInput value={department} onChangeText={setDepartment} style={styles.input} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Designation</Text>
        <TextInput value={designation} onChangeText={setDesignation} style={styles.input} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" keyboardType="email-address" />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Phone</Text>
        <TextInput value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={onSubmitDetails} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Save and Capture Face</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  heading: { fontSize: 22, fontWeight: '700', color: colors.ink, marginBottom: spacing.lg },
  helpText: { color: colors.muted, marginBottom: spacing.lg, lineHeight: 20 },
  errorText: { color: colors.danger, marginBottom: spacing.md },
  field: { marginBottom: spacing.md },
  label: { color: colors.muted, marginBottom: spacing.xs, fontSize: 13 },
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
  submitButton: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cameraWrap: {
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.brand,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: { flex: 1, width: '100%' },
  permissionCard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  permissionText: { color: colors.ink2, textAlign: 'center', marginBottom: spacing.md },
  permissionButton: { backgroundColor: colors.brand, paddingVertical: 12, paddingHorizontal: 20, borderRadius: radius.sm },
  permissionButtonText: { color: '#fff', fontWeight: '700' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  statusLabel: { color: colors.muted },
  statusValue: { color: colors.ink, fontWeight: '700' },
  captureButton: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  captureButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  trainButton: {
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  trainButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: { color: colors.ink2, fontWeight: '700' },
  disabledButton: { backgroundColor: colors.muted },
});
