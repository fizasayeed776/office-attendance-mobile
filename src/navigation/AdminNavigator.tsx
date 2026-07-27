import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { colors } from '../theme/colors';

import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import EmployeeListScreen from '../screens/EmployeeListScreen';
import AddEmployeeScreen from '../screens/AddEmployeeScreen';
import AdminAttendanceHubScreen from '../screens/AdminAttendanceHubScreen';
import FaceAttendanceScreen from '../screens/FaceAttendanceScreen';
import AttendanceListScreen from '../screens/AttendanceListScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const EmployeesStack = createNativeStackNavigator();
const AttendanceStack = createNativeStackNavigator();

const TAB_ICONS: Record<string, string> = {
  Dashboard: '🏠', Employees: '👥', Attendance: '🗓️', Reports: '📊', Settings: '⚙️',
};

function TabIcon({ route, focused }: { route: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS[route] || '•'}</Text>
  );
}

function EmployeesStackScreen() {
  return (
    <EmployeesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.ink, fontWeight: '700' },
      }}
    >
      <EmployeesStack.Screen name="EmployeeList" component={EmployeeListScreen} options={{ title: 'Employees' }} />
      <EmployeesStack.Screen name="AddEmployee" component={AddEmployeeScreen} options={{ title: 'Add Employee' }} />
    </EmployeesStack.Navigator>
  );
}

function AttendanceStackScreen() {
  return (
    <AttendanceStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.ink, fontWeight: '700' },
      }}
    >
      <AttendanceStack.Screen name="AdminAttendanceHub" component={AdminAttendanceHubScreen} options={{ title: 'Attendance' }} />
      <AttendanceStack.Screen name="MarkAttendance" component={FaceAttendanceScreen} options={{ title: 'Mark Attendance' }} />
      <AttendanceStack.Screen name="AttendanceList" component={AttendanceListScreen} options={{ title: 'Attendance List' }} />
    </AttendanceStack.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ focused }) => <TabIcon route={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Employees" component={EmployeesStackScreen} options={{ title: 'Employees' }} />
      <Tab.Screen name="Attendance" component={AttendanceStackScreen} options={{ title: 'Attendance' }} />
      <Tab.Screen name="Reports" component={PlaceholderScreen} options={{ title: 'Reports' }} />
      <Tab.Screen name="Settings" component={PlaceholderScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
    </Stack.Navigator>
  );
}
