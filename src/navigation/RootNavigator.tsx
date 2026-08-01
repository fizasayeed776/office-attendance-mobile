import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { colors, radius, fonts} from '../theme/colors';

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
  { name: 'Home',        label: 'Home',       icon: 'home'     },
  { name: 'History',     label: 'Attendance', icon: 'calendar' },
  { name: 'Leaves',      label: 'My Leaves',  icon: 'leaf'     },
  { name: 'Corrections', label: 'Corrections',icon: 'wrench'   },
  { name: 'Settings',    label: 'Profile',    icon: 'gear'     },
];

function MainTabs() {
  const insets = useSafeAreaInsets();
  // Safe-area bottom padding is added to the bar height and passed to
  // paddingBottom so gesture-nav phones never clip the bar against system UI.
  // We keep a minimal fixed paddingTop (4 px) so the icon isn't jammed against
  // the top edge of the bar on phones with no gesture bar (insets.bottom = 0).
  const TAB_HEIGHT = 56 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = EMPLOYEE_TABS.find((t) => t.name === route.name);
        return {
          headerShown: true,
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: {
            color: colors.ink,
            fontFamily: 'Inter_700Bold',
            fontSize: 17,
          },
          headerShadowVisible: false,
          tabBarStyle: {
            backgroundColor: colors.tabBarBg,
            borderTopWidth: 0,
            height: TAB_HEIGHT,
            paddingBottom: insets.bottom,
            paddingTop: 4,
          },
          tabBarActiveTintColor: colors.tabBarActive,
          tabBarInactiveTintColor: colors.tabBarInactive,
          tabBarLabelStyle: {
            fontSize: 10,
            fontFamily: 'Inter_600SemiBold',
            // Android adds its own bottom offset; zero it so label isn't
            // pushed out of the visible bar area on short screens.
            marginBottom: Platform.OS === 'android' ? 2 : 0,
            marginTop: 0,
          },
          // Remove per-item horizontal/vertical padding — React Navigation
          // adds ~8 px each side by default which eats 80 px across 5 tabs
          // on a 360 px screen, causing labels to truncate.
          tabBarItemStyle: {
            paddingHorizontal: 0,
            paddingVertical: 0,
          },
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={tab?.icon ?? 'circle'} focused={focused} color={color} />
          ),
        };
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="History"
        component={AttendanceHistoryScreen}
        options={{ title: 'My Attendance' }}
      />
      <Tab.Screen
        name="Leaves"
        component={LeavesScreen}
        options={{ title: 'My Leaves' }}
      />
      <Tab.Screen
        name="Corrections"
        component={CorrectionsScreen}
        options={{ title: 'My Corrections' }}
      />
      <Tab.Screen
        name="Settings"
        component={require('../screens/EmployeeSettingsScreen').default}
        options={{ title: 'Profile' }}
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
                headerTitleStyle: { color: colors.ink, fontFamily: 'Inter_700Bold' },
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
                headerTitleStyle: { color: colors.ink, fontFamily: 'Inter_700Bold' },
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
                headerTitleStyle: { color: colors.ink, fontFamily: 'Inter_700Bold' },
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
