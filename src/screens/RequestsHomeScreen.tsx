import { ComponentProps, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import api from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme/colors';

export default function RequestsHomeScreen({ navigation }: any) {
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [leaveCount, setLeaveCount]   = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [holidayCount, setHolidayCount] = useState(0);
  const [corrCount, setCorrCount]     = useState(0);
  const [pendingCorr, setPendingCorr] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true); setError('');
      try {
        const [lR, hR, cR] = await Promise.all([
          api.get('/api/leaves/'), api.get('/api/holidays/'), api.get('/api/corrections/'),
        ]);
        const leaves = lR.data.leaves || [];
        const corr   = cR.data.corrections || [];
        setLeaveCount(leaves.length);
        setPendingLeaves(leaves.filter((l: any) => l.status === 'pending').length);
        setHolidayCount((hR.data.holidays || []).length);
        setCorrCount(corr.length);
        setPendingCorr(corr.filter((c: any) => c.status === 'pending').length);
      } catch (err: any) {
        setError(err.message || 'Unable to load.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const CARDS: { title: string; count: number; pending: number; icon: ComponentProps<typeof Ionicons>['name']; hint: string; screen: string }[] = [
    { title: 'Leave Requests',      count: leaveCount,   pending: pendingLeaves, icon: 'document-text-outline', hint: 'Review and approve or reject employee leave applications.', screen: 'LeaveRequests' },
    { title: 'Holiday Management',  count: holidayCount, pending: 0,             icon: 'calendar-outline',      hint: 'Create, edit, and remove company holidays.',                 screen: 'HolidayManagement' },
    { title: 'Correction Requests', count: corrCount,    pending: pendingCorr,   icon: 'construct-outline',     hint: 'Approve or reject employee attendance correction requests.', screen: 'CorrectionRequests' },
  ];

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.heading}>Requests</Text>
      <Text style={s.sub}>Manage leave requests, holidays, and attendance corrections.</Text>

      {!!error && <View style={s.errorBanner}><Text style={s.errorText}>{error}</Text></View>}

      {loading ? (
        <View style={s.loadingWrap}><ActivityIndicator size="large" color={colors.brand} /></View>
      ) : (
        CARDS.map((card) => (
          <TouchableOpacity key={card.screen} style={s.card} onPress={() => navigation.navigate(card.screen)} activeOpacity={0.75}>
            <View style={s.cardLeft}>
              <View style={[s.iconWrap, card.pending > 0 && s.iconWrapAlert]}>
                <Ionicons name={card.icon} size={22} color={card.pending > 0 ? colors.warn : colors.brand} />
              </View>
              <View style={s.cardText}>
                <View style={s.cardTitleRow}>
                  <Text style={s.cardTitle}>{card.title}</Text>
                  {card.pending > 0 && (
                    <View style={s.pendingBadge}>
                      <Text style={s.pendingBadgeText}>{card.pending} pending</Text>
                    </View>
                  )}
                </View>
                <Text style={s.cardHint}>{card.hint}</Text>
              </View>
            </View>
            <View style={s.cardRight}>
              <Text style={s.cardCount}>{card.count}</Text>
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
  heading: { fontSize: typography.xxl, fontWeight: '800', color: colors.ink, marginBottom: spacing.xs },
  sub: { color: colors.muted, fontSize: typography.base, lineHeight: 20, marginBottom: spacing.xl },
  errorBanner: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.danger },
  errorText: { color: colors.danger, fontSize: typography.sm },
  loadingWrap: { paddingTop: 60, alignItems: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconWrap: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  iconWrapAlert: { backgroundColor: colors.warnSoft },
  cardText: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs, flexWrap: 'wrap' },
  cardTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.ink },
  pendingBadge: { backgroundColor: colors.warnSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  pendingBadgeText: { fontSize: typography.xs, fontWeight: '700', color: colors.warn },
  cardHint: { fontSize: typography.sm, color: colors.muted, lineHeight: 19 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginLeft: spacing.md },
  cardCount: { fontSize: typography.xxl, fontWeight: '800', color: colors.brand },
  chevron: { fontSize: 22, color: colors.muted },
});
