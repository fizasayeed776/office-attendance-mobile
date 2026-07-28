import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius, shadows } from '../theme/colors';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import FaceAttendanceScreen from '../screens/FaceAttendanceScreen';
import AttendanceHistoryScreen from '../screens/AttendanceHistoryScreen';
import LeavesScreen from '../screens/LeavesScreen';
import CorrectionsScreen from '../screens/CorrectionsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SetupAccountScreen from '../screens/SetupAccountScreen';
import AdminNavigator from './AdminNavigator';
import TabIcon from '../components/TabIcon';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const EMPLOYEE_TABS = [
  { name: 'Home',        label: 'Dashboard',  icon: 'home'        },
  { name: 'History',     label: 'Attendance', icon: 'calendar'    },
  { name: 'Leaves',      label: 'Leaves',     icon: 'leaf'        },
  { name: 'Corrections', label: 'Corrections',icon: 'wrench'      },
  { name: 'Settings',    label: 'Settings',   icon: 'gear'        },
];

function MainTabs() {
  const insets = useSafeAreaInsets();
  const TAB_HEIGHT = 60 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = EMPLOYEE_TABS.find((t) => t.name === route.name);
        return {
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.card,
            ...shadows.sm,
          },
          headerTitleStyle: {
            color: colors.ink,
            fontWeight: '700',
            fontSize: 17,
          },
          headerShadowVisible: false,
          tabBarStyle: {
            backgroundColor: colors.tabBarBg,
            borderTopWidth: 0,
            height: TAB_HEIGHT,
            paddingBottom: insets.bottom,
            paddingTop: spacing.sm,
            ...shadows.lg,
          },
          tabBarActiveTintColor: colors.tabBarActive,
          tabBarInactiveTintColor: colors.tabBarInactive,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginBottom: Platform.OS === 'android' ? 4 : 0,
          },
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name={tab?.icon ?? 'circle'} focused={focused} color={color} />
          ),
        };
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="History"
        component={AttendanceHistoryScreen}
        options={{ title: 'Attendance' }}
      />
      <Tab.Screen
        name="Leaves"
        component={LeavesScreen}
        options={{ title: 'My Leaves' }}
      />
      <Tab.Screen
        name="Corrections"
        component={CorrectionsScreen}
        options={{ title: 'Corrections' }}
      />
      <Tab.Screen
        name="Settings"
        component={require('../screens/EmployeeSettingsScreen').default}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { loading, employee, adminUser, mustChangePassword } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <View style={styles.splashLogo}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!employee && !adminUser ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="SetupAccount"
              component={SetupAccountScreen}
              options={{
                headerShown: true,
                title: 'Set up account',
                headerStyle: { backgroundColor: colors.card },
                headerTitleStyle: { color: colors.ink, fontWeight: '700' },
                headerTintColor: colors.brand,
              }}
            />
          </>
        ) : adminUser ? (
          mustChangePassword ? (
            <Stack.Screen
              name="ForcePassword"
              component={SettingsScreen}
              options={{
                headerShown: true,
                title: 'Change Password',
                headerStyle: { backgroundColor: colors.card },
                headerTitleStyle: { color: colors.ink, fontWeight: '700' },
                headerTintColor: colors.brand,
              }}
              initialParams={{ forceOnly: true }}
            />
          ) : (
            <Stack.Screen name="Admin" component={AdminNavigator} />
          )
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="FaceAttendance"
              component={FaceAttendanceScreen}
              options={{
                headerShown: true,
                title: 'Mark Attendance',
                presentation: 'modal',
                headerStyle: { backgroundColor: colors.card },
                headerTitleStyle: { color: colors.ink, fontWeight: '700' },
                headerTintColor: colors.brand,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.sidebar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
