import { ComponentProps, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import api from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, fonts} from '../theme/colors';

export default function OrganizationHomeScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [deptCount, setDeptCount] = useState(0);
  const [shiftCount, setShiftCount] = useState(0);

  useEffect(() => {
    (async () => {
      setError(''); setLoading(true);
      try {
        const [dR, sR] = await Promise.all([api.get('/api/departments/'), api.get('/api/shifts/')]);
        setDeptCount((dR.data.departments || []).length);
        setShiftCount((sR.data.shifts || []).length);
      } catch (err: any) {
        setError(err.message || 'Unable to load.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const CARDS: { title: string; count: number; noun: string; icon: ComponentProps<typeof Ionicons>['name']; hint: string; screen: string }[] = [
    { title: 'Departments', count: deptCount,  noun: 'department', icon: 'business-outline',  hint: 'Create, edit, and delete department records that employees can be assigned to.', screen: 'Departments' },
    { title: 'Shifts',      count: shiftCount, noun: 'shift',      icon: 'time-outline',       hint: 'Create and manage employee shifts with start/end times and grace periods.',      screen: 'Shifts' },
  ];

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.heading}>Organization</Text>
      <Text style={s.sub}>Manage departments and shifts for your employees.</Text>

      {!!error && <View style={s.errorBanner}><Text style={s.errorText}>{error}</Text></View>}

      {loading ? (
        <View style={s.loadingWrap}><ActivityIndicator size="large" color={colors.brand} /></View>
      ) : (
        CARDS.map((card) => (
          <TouchableOpacity key={card.screen} style={s.card} onPress={() => navigation.navigate(card.screen)} activeOpacity={0.75}>
            <View style={s.cardLeft}>
              <View style={s.iconWrap}><Ionicons name={card.icon} size={22} color={colors.brand} /></View>
              <View style={s.cardText}>
                <Text style={s.cardTitle}>{card.title}</Text>
                <Text style={s.cardHint}>{card.hint}</Text>
              </View>
            </View>
            <View style={s.cardRight}>
              <Text style={s.cardCount}>{card.count}</Text>
              <Text style={s.cardCountLabel}>{card.count === 1 ? card.noun : card.noun + 's'}</Text>
              <Text style={s.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  heading: { fontSize: typography.xxl, fontFamily: 'Inter_800ExtraBold', color: colors.ink, marginBottom: spacing.xs },
  sub: { color: colors.muted, fontSize: typography.base, lineHeight: 20, marginBottom: spacing.xl },
  errorBanner: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.danger },
  errorText: { color: colors.danger, fontSize: typography.sm },
  loadingWrap: { paddingTop: 60, alignItems: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconWrap: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1 },
  cardTitle: { fontSize: typography.lg, fontFamily: 'Inter_700Bold', color: colors.ink, marginBottom: spacing.xs },
  cardHint: { fontSize: typography.sm, color: colors.muted, lineHeight: 19 },
  cardRight: { alignItems: 'flex-end', gap: 2, marginLeft: spacing.md },
  cardCount: { fontSize: typography.xxl, fontFamily: 'Inter_800ExtraBold', color: colors.brand },
  cardCountLabel: { fontSize: typography.xs, color: colors.muted, fontFamily: 'Inter_600SemiBold' },
  chevron: { fontSize: 22, color: colors.muted, marginTop: 2 },
});
