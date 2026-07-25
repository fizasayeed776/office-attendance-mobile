import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api/client';

// Show notifications even while the app is open in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests OS notification permission, gets an Expo push token, and
 * registers it with the Django backend (POST /api/mobile/register-device/)
 * so leave/correction decisions can push a notification even when the app
 * is closed. Returns true if registration succeeded.
 */
export async function registerForPushNotifications(): Promise<boolean> {
  try {
    if (!Device.isDevice) {
      // Push notifications don't work in the iOS/Android simulator, only on
      // a real device -- this isn't an error, just a platform limitation.
      return false;
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();
    await api.post('/api/mobile/register-device/', {
      expo_push_token: expoPushToken,
      platform: Platform.OS,
    });
    return true;
  } catch {
    return false;
  }
}
