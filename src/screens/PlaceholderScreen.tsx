import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme/colors';

export default function PlaceholderScreen({ route }: { route: any }) {
  return (
    <View style={s.screen}>
      <View style={s.iconWrap}>
        <Ionicons name="construct-outline" size={36} color={colors.muted} />
      </View>
      <Text style={s.title}>{route.name}</Text>
      <Text style={s.body}>This section is coming in a future update.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1, backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center',
    padding: spacing.xl, gap: spacing.md,
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: radius.xxl,
    backgroundColor: colors.bgDeep,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontSize: typography.xxl, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  body:  { fontSize: typography.base, color: colors.muted, textAlign: 'center', lineHeight: 21 },
});
