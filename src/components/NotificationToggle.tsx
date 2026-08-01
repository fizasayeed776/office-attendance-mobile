import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { registerForPushNotifications } from '../notifications';
import { colors, spacing, radius, typography, fonts} from '../theme/colors';

export default function NotificationToggle() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy]       = useState(false);

  const onToggle = async (value: boolean) => {
    if (!value) { setEnabled(false); return; }
    setBusy(true);
    try {
      const ok = await registerForPushNotifications();
      setEnabled(ok);
      if (!ok) {
        Alert.alert(
          'Notifications disabled',
          'Please enable notification permissions for this app in your phone settings.',
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.card}>
      <View style={s.row}>
        <View style={s.iconWrap}>
          <Ionicons name="notifications-outline" size={20} color={colors.brand} />
        </View>
        <View style={s.meta}>
          <Text style={s.title}>Push notifications</Text>
          <Text style={s.hint}>
            Receive updates when leave or correction requests are approved or rejected.
          </Text>
        </View>
        {busy
          ? <ActivityIndicator color={colors.brand} style={s.toggle} />
          : <Switch
              value={enabled}
              onValueChange={onToggle}
              trackColor={{ false: colors.borderStrong, true: colors.brand }}
              thumbColor="#fff"
              style={s.toggle}
            />
        }
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: {
    width: 40, height: 40, borderRadius: radius.lg,
    backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  meta: { flex: 1 },
  title: { fontSize: typography.md, fontFamily: 'Inter_700Bold', color: colors.ink },
  hint: { fontSize: typography.sm, color: colors.muted, marginTop: spacing.xxs, lineHeight: 18 },
  toggle: { marginLeft: spacing.sm },
});
