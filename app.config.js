// app.config.js replaces app.json so that `extra` values are reliably
// bundled into EAS standalone builds. With a plain app.json, there are
// edge cases where Constants.expoConfig?.extra is undefined inside the
// APK and the API client silently falls back to http://localhost:8000.
//
// To point at a different backend, set the EXPO_PUBLIC_API_BASE_URL
// environment variable in your eas.json build profile, OR just edit
// the fallback string below directly.

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'https://web-production-7be31.up.railway.app';

module.exports = {
  expo: {
    name: 'Office Attendance',
    slug: 'attendance-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    splash: {
      backgroundColor: '#0E7C86',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.yourcompany.attendance',
      infoPlist: {
        NSCameraUsageDescription:
          'Your camera is used to recognize your face for check-in and check-out.',
        NSLocationWhenInUseUsageDescription:
          'Your location is used to confirm you are at the office when marking attendance.',
      },
    },
    android: {
      package: 'com.yourcompany.attendance',
      permissions: [
        'CAMERA',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
      ],
    },
    plugins: [
      [
        'expo-camera',
        {
          cameraPermission:
            'Allow $(PRODUCT_NAME) to access your camera for face recognition attendance.',
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Allow $(PRODUCT_NAME) to use your location to confirm you are on-site.',
        },
      ],
    ],
    extra: {
      // This value is read by mobile/src/api/client.ts via
      // Constants.expoConfig.extra.apiBaseUrl
      apiBaseUrl: API_BASE_URL,
      eas: {
        projectId: '08503622-73a4-4657-b588-678e29cec0ba',
      },
    },
  },
};
