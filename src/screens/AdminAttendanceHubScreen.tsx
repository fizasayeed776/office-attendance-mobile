import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadows, typography } from '../theme/colors';

const CARDS = [
  {
    title: 'Mark Attendance',
    body: 'Scan an employee\'s face to check them in or out using the same recognition model as the web kiosk.',
    icon: '📷',
    screen: 'MarkAttendance',
  },
  {
    title: 'Attendance List',
    body: 'View and search historical attendance records with dates, times, and punctuality status.',
    icon: '📋',
    screen: 'AttendanceList',
  },
];

export default function AdminAttendanceHubScreen({ navigation }: any) {
  return (
    <View style={s.screen}>
      <Text style={s.heading}>Attendance</Text>
      <Text style={s.sub}>Mark attendance via face recognition or browse historical records.</Text>

      {CARDS.map((card) => (
        <TouchableOpacity
          key={card.screen}
          style={s.card}
          onPress={() => navigation.navigate(card.screen)}
          activeOpacity={0.75}
        >
          <View style={s.iconWrap}>
            <Text style={s.icon}>{card.icon}</Text>
          </View>
          <View style={s.cardBody}>
            <Text style={s.cardTitle}>{card.title}</Text>
            <Text style={s.cardHint}>{card.body}</Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  heading: { fontSize: typography.xxl, fontWeight: '800', color: colors.ink, marginBottom: spacing.xs },
  sub: { color: colors.muted, fontSize: typography.base, lineHeight: 20, marginBottom: spacing.xl },
  card: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    ...shadows.sm,
  },
  iconWrap: { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 26 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.ink, marginBottom: spacing.xs },
  cardHint: { fontSize: typography.sm, color: colors.muted, lineHeight: 19 },
  chevron: { fontSize: 24, color: colors.muted },
});
