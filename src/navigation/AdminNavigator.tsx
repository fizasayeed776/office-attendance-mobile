import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, shadows } from '../theme/colors';
import TabIcon from '../components/TabIcon';

import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import EmployeeListScreen from '../screens/EmployeeListScreen';
import AddEmployeeScreen from '../screens/AddEmployeeScreen';
import AdminAttendanceHubScreen from '../screens/AdminAttendanceHubScreen';
import FaceAttendanceScreen from '../screens/FaceAttendanceScreen';
import AttendanceListScreen from '../screens/AttendanceListScreen';
import DepartmentsScreen from '../screens/DepartmentsScreen';
import ShiftsScreen from '../screens/ShiftsScreen';
import OrganizationHomeScreen from '../screens/OrganizationHomeScreen';
import RequestsHomeScreen from '../screens/RequestsHomeScreen';
import LeaveRequestsScreen from '../screens/LeaveRequestsScreen';
import HolidayManagementScreen from '../screens/HolidayManagementScreen';
import CorrectionRequestsScreen from '../screens/CorrectionRequestsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const EmployeesStack = createNativeStackNavigator();
const AttendanceStack = createNativeStackNavigator();
const OrganizationStack = createNativeStackNavigator();
const RequestsStack = createNativeStackNavigator();

const SHARED_HEADER = {
  headerStyle: { backgroundColor: colors.card, ...shadows.sm },
  headerTitleStyle: { color: colors.ink, fontWeight: '700' as const, fontSize: 17 },
  headerShadowVisible: false,
  headerTintColor: colors.brand,
};

const ADMIN_TABS = [
  { name: 'Dashboard',    label: 'Dashboard',  icon: 'home'       },
  { name: 'Employees',    label: 'Employees',  icon: 'people'     },
  { name: 'Attendance',   label: 'Attendance', icon: 'attendance' },
  { name: 'Organization', label: 'Org',        icon: 'building'   },
  { name: 'Requests',     label: 'Requests',   icon: 'inbox'      },
  { name: 'Settings',     label: 'Settings',   icon: 'gear'       },
];

function EmployeesStackScreen() {
  return (
    <EmployeesStack.Navigator screenOptions={SHARED_HEADER}>
      <EmployeesStack.Screen
        name="EmployeeList"
        component={EmployeeListScreen}
        options={{ title: 'Employees' }}
      />
      <EmployeesStack.Screen
        name="AddEmployee"
        component={AddEmployeeScreen}
        options={{ title: 'Add Employee' }}
      />
    </EmployeesStack.Navigator>
  );
}

function AttendanceStackScreen() {
  return (
    <AttendanceStack.Navigator screenOptions={SHARED_HEADER}>
      <AttendanceStack.Screen
        name="AdminAttendanceHub"
        component={AdminAttendanceHubScreen}
        options={{ title: 'Attendance' }}
      />
      <AttendanceStack.Screen
        name="MarkAttendance"
        component={FaceAttendanceScreen}
        options={{ title: 'Mark Attendance' }}
      />
      <AttendanceStack.Screen
        name="AttendanceList"
        component={AttendanceListScreen}
        options={{ title: 'Attendance List' }}
      />
    </AttendanceStack.Navigator>
  );
}

function OrganizationStackScreen() {
  return (
    <OrganizationStack.Navigator screenOptions={SHARED_HEADER}>
      <OrganizationStack.Screen
        name="OrganizationHome"
        component={OrganizationHomeScreen}
        options={{ title: 'Organization' }}
      />
      <OrganizationStack.Screen
        name="Departments"
        component={DepartmentsScreen}
        options={{ title: 'Departments' }}
      />
      <OrganizationStack.Screen
        name="Shifts"
        component={ShiftsScreen}
        options={{ title: 'Shifts' }}
      />
    </OrganizationStack.Navigator>
  );
}

function RequestsStackScreen() {
  return (
    <RequestsStack.Navigator screenOptions={SHARED_HEADER}>
      <RequestsStack.Screen
        name="RequestsHome"
        component={RequestsHomeScreen}
        options={{ title: 'Requests' }}
      />
      <RequestsStack.Screen
        name="LeaveRequests"
        component={LeaveRequestsScreen}
        options={{ title: 'Leave Requests' }}
      />
      <RequestsStack.Screen
        name="HolidayManagement"
        component={HolidayManagementScreen}
        options={{ title: 'Holidays' }}
      />
      <RequestsStack.Screen
        name="CorrectionRequests"
        component={CorrectionRequestsScreen}
        options={{ title: 'Corrections' }}
      />
    </RequestsStack.Navigator>
  );
}

function AdminTabs() {
  const insets = useSafeAreaInsets();
  // 6 tabs: shrink label size and give a taller bar so nothing clips
  const TAB_HEIGHT = 62 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = ADMIN_TABS.find((t) => t.name === route.name);
        return {
          headerShown: false,
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
          // Smaller label for 6-tab layout — prevents truncation
          tabBarLabelStyle: {
            fontSize: 9,
            fontWeight: '600',
            marginBottom: Platform.OS === 'android' ? 4 : 0,
          },
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={tab?.icon ?? 'circle'} focused={focused} color={color} size={20} />
          ),
          tabBarLabel: tab?.label ?? route.name,
        };
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Employees"
        component={EmployeesStackScreen}
        options={{ title: 'Employees' }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceStackScreen}
        options={{ title: 'Attendance' }}
      />
      <Tab.Screen
        name="Organization"
        component={OrganizationStackScreen}
        options={{ title: 'Organization' }}
      />
      <Tab.Screen
        name="Requests"
        component={RequestsStackScreen}
        options={{ title: 'Requests' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
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
