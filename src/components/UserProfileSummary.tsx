import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius, typography } from '../theme/colors';

type UserProfileSummaryProps = {};

export default function UserProfileSummary(_: UserProfileSummaryProps) {
  const { employee, adminUser } = useAuth();
  const user = adminUser ?? employee;
  const roleLabel = adminUser ? 'Role' : 'Designation';
  const roleValue = adminUser
    ? (adminUser.staff_role.charAt(0).toUpperCase() + adminUser.staff_role.slice(1))
    : (employee?.designation || '—');

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.meta}>
          <Text style={s.name}>{user?.name ?? 'Unknown user'}</Text>
          <Text style={s.username}>@{user?.username ?? 'unknown'}</Text>
          {adminUser && (
            <View style={s.roleBadge}>
              <Text style={s.roleBadgeText}>{(adminUser.staff_role ?? 'admin').toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={s.infoSection}>
        <InfoRow label={roleLabel} value={roleValue} />
        {adminUser && adminUser.staff_department ? (
          <InfoRow label="Department" value={adminUser.staff_department} last />
        ) : employee?.department ? (
          <InfoRow label="Department" value={employee.department} last />
        ) : null}
      </View>
    </View>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[i.row, last && i.rowLast]}>
      <Text style={i.label}>{label}</Text>
      <Text style={i.value}>{value}</Text>
    </View>
  );
}
const i = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowLast: { borderBottomWidth: 0 },
  label: { fontSize: typography.sm, color: colors.muted, fontFamily: 'Inter_500Medium' },
  value: { fontSize: typography.sm, color: colors.ink, fontFamily: 'Inter_600SemiBold' },
});

const s = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.divider,
    backgroundColor: colors.brandSofter,
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: typography.xxl, fontFamily: 'Inter_700Bold' },
  meta: { flex: 1, gap: spacing.xs },
  name: { fontSize: typography.xl, fontFamily: 'Inter_700Bold', color: colors.ink },
  username: { fontSize: typography.sm, color: colors.muted },
  roleBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.brandSoft,
    borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  roleBadgeText: { fontSize: typography.xs, fontFamily: 'Inter_700Bold', color: colors.brand, letterSpacing: 0.4 },
  infoSection: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
});
