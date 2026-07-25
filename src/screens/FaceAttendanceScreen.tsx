import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import api from '../api/client';
import { colors, spacing, radius } from '../theme/colors';

type Mode = 'auto' | 'checkin' | 'checkout';

export default function FaceAttendanceScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [mode, setMode] = useState<Mode>('auto');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission, requestPermission]);

  const getLocation = async (): Promise<{ latitude: number | null; longitude: number | null }> => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      let granted = status === 'granted';
      if (!granted) {
        const req = await Location.requestForegroundPermissionsAsync();
        granted = req.status === 'granted';
      }
      // Geofencing is entirely optional server-side -- if the admin hasn't
      // configured an OfficeLocation, sending coordinates or not makes no
      // difference at all. If the employee declines location permission,
      // attendance still works exactly like the website's camera-only flow.
      if (!granted) return { latitude: null, longitude: null };
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    } catch {
      return { latitude: null, longitude: null };
    }
  };

  const capture = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      const { latitude, longitude } = await getLocation();

      const { data } = await api.post('/api/recognize/', {
        image: `data:image/jpeg;base64,${photo.base64}`,
        mode,
        latitude,
        longitude,
      });

      if (!data.matched) {
        setResult({ ok: false, text: "Couldn't recognize your face. Please try again with better lighting." });
      } else if (data.action === 'none') {
        setResult({ ok: false, text: data.detail });
      } else {
        setResult({ ok: true, text: `${data.employee_name} — ${data.detail}` });
      }
    } catch (e: any) {
      setResult({ ok: false, text: e.message || 'Something went wrong.' });
    } finally {
      setBusy(false);
    }
  };

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>;
  }
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Camera access is needed for face recognition attendance.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.cameraWrap}>
        <CameraView ref={cameraRef} style={styles.camera} facing="front" />
      </View>

      <View style={styles.modeRow}>
        {(['auto', 'checkin', 'checkout'] as Mode[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.modeButton, mode === m && styles.modeButtonActive]}
            onPress={() => setMode(m)}
          >
            <Text style={[styles.modeButtonText, mode === m && styles.modeButtonTextActive]}>
              {m === 'auto' ? 'Auto' : m === 'checkin' ? 'Check-in' : 'Check-out'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {result && (
        <View style={[styles.resultBox, { backgroundColor: result.ok ? colors.successSoft : colors.dangerSoft }]}>
          <Text style={{ color: result.ok ? colors.success : colors.danger, fontWeight: '600' }}>{result.text}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.captureButton} onPress={capture} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.captureButtonText}>Scan Face</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  permissionText: { textAlign: 'center', color: colors.ink2, marginBottom: spacing.lg, fontSize: 14 },
  permissionButton: { backgroundColor: colors.brand, paddingVertical: 12, paddingHorizontal: 24, borderRadius: radius.sm },
  permissionButtonText: { color: '#fff', fontWeight: '700' },
  cameraWrap: {
    aspectRatio: 3 / 4, borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 2, borderColor: colors.brand, marginBottom: spacing.md,
  },
  camera: { flex: 1 },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  modeButton: {
    flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center',
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
  },
  modeButtonActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  modeButtonText: { fontSize: 12.5, fontWeight: '600', color: colors.ink2 },
  modeButtonTextActive: { color: '#fff' },
  resultBox: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  captureButton: {
    backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: 16,
    alignItems: 'center', marginTop: 'auto',
  },
  captureButtonText: { color: '#fff', fontWeight: '700', fontSize: 15.5 },
});
