import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { colors, spacing, radius, shadows, typography } from '../theme/colors';

type Mode = 'auto' | 'checkin' | 'checkout';

const MODE_CONFIG: { key: Mode; label: string; icon: string }[] = [
  { key: 'auto',     label: 'Auto',       icon: '⚡' },
  { key: 'checkin',  label: 'Check-in',   icon: '⬆' },
  { key: 'checkout', label: 'Check-out',  icon: '⬇' },
];

export default function FaceAttendanceScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const insets    = useSafeAreaInsets();
  const [mode, setMode]     = useState<Mode>('auto');
  const [busy, setBusy]     = useState(false);
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
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.65 });
      const { latitude, longitude } = await getLocation();
      const { data } = await api.post('/api/recognize/', {
        image: `data:image/jpeg;base64,${photo.base64}`,
        mode, latitude, longitude,
      });
      if (!data.matched) {
        setResult({ ok: false, text: "Couldn't recognize your face. Try again with better lighting or a clearer angle." });
      } else if (data.action === 'none') {
        setResult({ ok: false, text: data.detail });
      } else {
        setResult({ ok: true, text: `${data.employee_name} — ${data.detail}` });
      }
    } catch (e: any) {
      setResult({ ok: false, text: e.message || 'Something went wrong. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  if (!permission) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={s.center}>
        <Text style={s.permTitle}>Camera access needed</Text>
        <Text style={s.permBody}>
          Camera permission is required to scan faces for attendance.
        </Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.screen, { paddingBottom: insets.bottom + spacing.lg }]}>
      {/* ── Camera viewfinder ── */}
      <View style={s.cameraWrap}>
        <CameraView ref={cameraRef} style={s.camera} facing="front" />

        {/* Scan overlay corners */}
        <View style={[s.corner, s.cornerTL]} />
        <View style={[s.corner, s.cornerTR]} />
        <View style={[s.corner, s.cornerBL]} />
        <View style={[s.corner, s.cornerBR]} />

        {busy && (
          <View style={s.scanningOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={s.scanningText}>Scanning…</Text>
          </View>
        )}
      </View>

      {/* ── Mode selector ── */}
      <View style={s.modeRow}>
        {MODE_CONFIG.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[s.modeBtn, mode === m.key && s.modeBtnActive]}
            onPress={() => { setMode(m.key); setResult(null); }}
            activeOpacity={0.8}
          >
            <Text style={s.modeIcon}>{m.icon}</Text>
            <Text style={[s.modeBtnText, mode === m.key && s.modeBtnTextActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Result feedback ── */}
      {result && (
        <View style={[
          s.resultBox,
          result.ok ? s.resultBoxOk : s.resultBoxFail,
        ]}>
          <Text style={s.resultIcon}>{result.ok ? '✓' : '✕'}</Text>
          <Text style={[s.resultText, { color: result.ok ? colors.success : colors.danger }]}>
            {result.text}
          </Text>
        </View>
      )}

      {/* ── Capture button ── */}
      <TouchableOpacity
        style={[s.captureBtn, busy && s.captureBtnBusy]}
        onPress={capture}
        disabled={busy}
        activeOpacity={0.85}
      >
        {busy
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={s.captureBtnText}>📷  Scan Face</Text>}
      </TouchableOpacity>
    </View>
  );
}

const CORNER_SIZE  = 22;
const CORNER_WIDTH = 3;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sidebar, padding: spacing.lg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  permTitle: { fontSize: typography.xl, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  permBody:  { fontSize: typography.base, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  permBtn:   { backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: spacing.xl, ...shadows.sm },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: typography.md },

  // ── Camera
  cameraWrap: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.brand,
    backgroundColor: colors.sidebarBorder,
    marginBottom: spacing.md,
    position: 'relative',
    ...shadows.lg,
  },
  camera: { flex: 1 },

  // Corner brackets
  corner: {
    position: 'absolute',
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: colors.brand,
  },
  cornerTL: { top: spacing.md,  left: spacing.md,  borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  cornerTR: { top: spacing.md,  right: spacing.md, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
  cornerBL: { bottom: spacing.md, left: spacing.md,  borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  cornerBR: { bottom: spacing.md, right: spacing.md, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },

  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,19,42,0.55)',
    alignItems: 'center', justifyContent: 'center', gap: spacing.md,
  },
  scanningText: { color: '#fff', fontWeight: '700', fontSize: typography.lg },

  // ── Mode selector
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: 11, borderRadius: radius.md,
    backgroundColor: colors.sidebarBorder,
    borderWidth: 1.5, borderColor: colors.sidebarBorder,
  },
  modeBtnActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  modeIcon: { fontSize: 14, color: '#fff' },
  modeBtnText: { fontSize: typography.sm, fontWeight: '600', color: colors.tabBarInactive },
  modeBtnTextActive: { color: '#fff' },

  // ── Result box
  resultBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md,
  },
  resultBoxOk: { backgroundColor: colors.successSoft },
  resultBoxFail: { backgroundColor: colors.dangerSoft },
  resultIcon: { fontSize: typography.lg, fontWeight: '700', marginTop: 1 },
  resultText: { flex: 1, fontSize: typography.base, fontWeight: '600', lineHeight: 20 },

  // ── Capture button
  captureBtn: {
    backgroundColor: colors.brand, borderRadius: radius.lg,
    paddingVertical: 16, alignItems: 'center', ...shadows.md,
  },
  captureBtnBusy: { opacity: 0.75 },
  captureBtnText: { color: '#fff', fontWeight: '700', fontSize: typography.lg, letterSpacing: 0.3 },
});
