import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

export default function AdminAttendanceHubScreen({ navigation }: any) {
  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Attendance</Text>
      <Text style={styles.subheading}>Use the existing face recognition flow to mark attendance, or view records for all employees.</Text>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MarkAttendance')}>
        <Text style={styles.cardTitle}>Mark Attendance</Text>
        <Text style={styles.cardBody}>Scan an employee's face to check them in or out exactly like the website kiosk flow.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AttendanceList')}>
        <Text style={styles.cardTitle}>Attendance List</Text>
        <Text style={styles.cardBody}>View historical attendance records with dates, times, and status.</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  heading: { fontSize: 24, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  subheading: { color: colors.muted, fontSize: 13.5, marginBottom: spacing.lg, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.ink, marginBottom: spacing.xs },
  cardBody: { color: colors.muted, fontSize: 13.5, lineHeight: 20 },
});
