import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { colors, spacing, radius, typography, fonts} from '../theme/colors';

type Step = 'details' | 'capture';

// ─── shared field component ──────────────────────────────────────────────────

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>
        {label}{required && <Text style={fieldStyles.asterisk}> *</Text>}
      </Text>
      {children}
    </View>
  );
}
const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    fontSize: typography.sm, fontFamily: 'Inter_600SemiBold',
    color: colors.ink2, marginBottom: spacing.xs, letterSpacing: 0.2,
  },
  asterisk: { color: colors.danger },
});

function Input({
  value, onChangeText, placeholder, keyboardType, autoCapitalize,
}: {
  value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; autoCapitalize?: any;
}) {
  return (
    <TextInput
      style={inputStyle}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedLight}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize ?? 'sentences'}
    />
  );
}
const inputStyle = {
  backgroundColor: colors.bg,
  borderWidth: 1.5,
  borderColor: colors.border,
  borderRadius: radius.md,
  paddingHorizontal: spacing.md,
  paddingVertical: 13,
  fontSize: typography.md,
  color: colors.ink,
};

// ─── main screen ─────────────────────────────────────────────────────────────

export default function AddEmployeeScreen({ navigation }: any) {
  const [step, setStep]           = useState<Step>('details');
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName]           = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [employeePk, setEmployeePk] = useState<number | null>(null);
  const [sampleCount, setSampleCount] = useState(0);
  const [loading, setLoading]     = useState(false);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [trainLoading, setTrainLoading] = useState(false);
  const [error, setError]         = useState('');

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (step === 'capture' && !permission?.granted) requestPermission();
  }, [step, permission, requestPermission]);

  const onSubmitDetails = async () => {
    setError('');
    if (!employeeId.trim() || !name.trim()) {
      setError('Employee ID and name are required.');
      return;
    }
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
    if (!cameraRef.current || !employeePk) return;
    if (!permission?.granted) {
      Alert.alert('Permission required', 'Camera access is needed to capture face data.');
      return;
    }
    setCaptureLoading(true);
    setError('');
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.65 });
      const { data } = await api.post(`/api/employees/${employeePk}/capture/`, {
        image: `data:image/jpeg;base64,${photo.base64}`,
      });
      setSampleCount(data.sample_count || sampleCount + 1);
    } catch (err: any) {
      setError(err.message || 'Unable to capture sample.');
    } finally {
      setCaptureLoading(false);
    }
  };

  const onTrain = async () => {
    if (!employeePk) return;
    setTrainLoading(true);
    setError('');
    try {
      await api.post(`/api/employees/${employeePk}/train/`);
      Alert.alert('Face registration complete', 'The employee is now registered for face recognition.');
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Unable to train recognizer.');
    } finally {
      setTrainLoading(false);
    }
  };

  const REQUIRED = 3;
  const canTrain = sampleCount >= REQUIRED;

  // ══ Capture step ══════════════════════════════════════════════════════════
  if (step === 'capture') {
    return (
      <View style={styles.captureScreen}>
        {/* Camera */}
        <View style={styles.cameraWrap}>
          {permission?.granted ? (
            <CameraView ref={cameraRef} style={styles.camera} facing="front" />
          ) : (
            <View style={styles.permissionWrap}>
              <Text style={styles.permissionTitle}>Camera access needed</Text>
              <Text style={styles.permissionBody}>
                Camera permission is required to register an employee's face for attendance.
              </Text>
              <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                <Text style={styles.permissionBtnText}>Grant Access</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Status */}
        <View style={styles.captureInfo}>
          <View style={styles.captureInfoRow}>
            <Text style={styles.captureInfoLabel}>Employee</Text>
            <Text style={styles.captureInfoValue}>{name} · {employeeId}</Text>
          </View>
          <View style={styles.captureInfoRow}>
            <Text style={styles.captureInfoLabel}>Samples captured</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              {Array.from({ length: REQUIRED }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.sampleDot,
                    i < sampleCount ? styles.sampleDotFilled : styles.sampleDotEmpty,
                  ]}
                />
              ))}
              <Text style={styles.captureInfoValue}>{sampleCount} / {REQUIRED} min</Text>
            </View>
          </View>
        </View>

        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.captureActions}>
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={onCaptureSample}
            disabled={captureLoading || !permission?.granted}
            activeOpacity={0.8}
          >
            {captureLoading
              ? <ActivityIndicator color="#fff" />
              : <View style={styles.captureBtnInner}><Ionicons name="camera" size={18} color="#fff" /><Text style={styles.captureBtnText}>  Capture Sample</Text></View>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.trainBtn, !canTrain && styles.trainBtnDisabled]}
            onPress={onTrain}
            disabled={!canTrain || trainLoading}
            activeOpacity={0.8}
          >
            {trainLoading
              ? <ActivityIndicator color={canTrain ? '#fff' : colors.muted} />
              : <View style={styles.trainBtnInner}><Ionicons name="checkmark" size={18} color={canTrain ? '#fff' : colors.muted} /><Text style={[styles.trainBtnText, !canTrain && styles.trainBtnTextDisabled]}>  Register Face</Text></View>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => { setStep('details'); setSampleCount(0); setEmployeePk(null); }}
            disabled={captureLoading || trainLoading}
          >
            <View style={styles.backBtnInner}><Ionicons name="chevron-back" size={16} color={colors.mutedLight} /><Text style={styles.backBtnText}>Edit details</Text></View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ══ Details step ══════════════════════════════════════════════════════════
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Step banner ── */}
      <View style={styles.stepBanner}>
        <View style={styles.stepDot}><Text style={styles.stepDotText}>1</Text></View>
        <Text style={styles.stepLabel}>Employee details</Text>
        <View style={styles.stepLine} />
        <View style={[styles.stepDot, styles.stepDotInactive]}><Text style={[styles.stepDotText, styles.stepDotTextInactive]}>2</Text></View>
        <Text style={[styles.stepLabel, styles.stepLabelInactive]}>Face capture</Text>
      </View>

      {!!error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ── Identity section ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Identity</Text>
        <Field label="Employee ID" required>
          <Input value={employeeId} onChangeText={setEmployeeId} placeholder="e.g. EMP-0005" autoCapitalize="characters" />
        </Field>
        <Field label="Full name" required>
          <Input value={name} onChangeText={setName} placeholder="e.g. Aisha Khan" />
        </Field>
      </View>

      {/* ── Role section ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Role</Text>
        <Field label="Department">
          <Input value={department} onChangeText={setDepartment} placeholder="e.g. Engineering" />
        </Field>
        <Field label="Designation">
          <Input value={designation} onChangeText={setDesignation} placeholder="e.g. Senior Developer" />
        </Field>
      </View>

      {/* ── Contact section ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>
        <Field label="Email">
          <Input value={email} onChangeText={setEmail} placeholder="email@company.com" keyboardType="email-address" autoCapitalize="none" />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChangeText={setPhone} placeholder="+92 300 0000000" keyboardType="phone-pad" autoCapitalize="none" />
        </Field>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={onSubmitDetails}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitBtnText}>Save & Capture Face →</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },

  // ── Step banner
  stepBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotInactive: { backgroundColor: colors.bgDeep },
  stepDotText: { fontSize: typography.sm, fontFamily: 'Inter_700Bold', color: '#fff' },
  stepDotTextInactive: { color: colors.muted },
  stepLabel: { fontSize: typography.sm, fontFamily: 'Inter_600SemiBold', color: colors.brand },
  stepLabelInactive: { color: colors.muted },
  stepLine: { flex: 1, height: 1.5, backgroundColor: colors.border },

  // ── Section
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.sm,
    fontFamily: 'Inter_700Bold',
    color: colors.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },

  // ── Error
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  errorText: { color: colors.danger, fontSize: typography.base },

  // ── Submit
  submitBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: typography.md, letterSpacing: 0.3 },

  // ══ Capture step
  captureScreen: { flex: 1, backgroundColor: colors.sidebar },

  cameraWrap: {
    flex: 1,
    margin: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.brand,
    backgroundColor: colors.sidebarBorder,
  },
  camera: { flex: 1 },

  permissionWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: spacing.xl, gap: spacing.md,
  },
  permissionTitle: { color: '#fff', fontSize: typography.xl, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  permissionBody: { color: colors.mutedLight, fontSize: typography.base, textAlign: 'center', lineHeight: 22 },
  permissionBtn: {
    backgroundColor: colors.brand, borderRadius: radius.md,
    paddingVertical: 12, paddingHorizontal: spacing.xl, marginTop: spacing.sm,
  },
  permissionBtnText: { color: '#fff', fontFamily: 'Inter_700Bold' },

  captureInfo: {
    backgroundColor: colors.sidebarBorder,
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  captureInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  captureInfoLabel: { fontSize: typography.sm, color: colors.mutedLight },
  captureInfoValue: { fontSize: typography.sm, color: '#fff', fontFamily: 'Inter_600SemiBold' },

  sampleDot: { width: 10, height: 10, borderRadius: 5 },
  sampleDotFilled: { backgroundColor: colors.brand },
  sampleDotEmpty: { backgroundColor: colors.sidebarBorder, borderWidth: 1, borderColor: colors.mutedLight },

  captureActions: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: Platform.OS === 'android' ? spacing.xl : spacing.lg,
  },

  captureBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  captureBtnInner: { flexDirection: 'row', alignItems: 'center' },
  captureBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: typography.md },

  trainBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  trainBtnInner: { flexDirection: 'row', alignItems: 'center' },
  trainBtnDisabled: { backgroundColor: colors.bgDeep },
  trainBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: typography.md },
  trainBtnTextDisabled: { color: colors.muted },

  backBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  backBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backBtnText: { color: colors.mutedLight, fontFamily: 'Inter_600SemiBold', fontSize: typography.base },
});
