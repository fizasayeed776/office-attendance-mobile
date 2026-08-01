import React from 'react';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import api from './src/api/client';

import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';

// ─── Global font default ────────────────────────────────────────────────────
// Sets Inter Regular as the default fontFamily for every <Text> in the app.
// Explicit fontFamily overrides (fonts.bold, etc.) in individual StyleSheets
// will still take precedence — this just replaces the system font baseline.
// Cast needed because RN's TS types don't expose defaultProps on Text.
const TextAny = Text as any;
if (TextAny.defaultProps == null) TextAny.defaultProps = {};
TextAny.defaultProps.style = { fontFamily: 'Inter_400Regular' };
// ────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // Log API configuration at app startup (once fonts resolve)
  React.useEffect(() => {
    if (!fontsLoaded && !fontError) return;

    const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl as string;
    console.log('[APP] ===== APP STARTUP =====');
    console.log('[APP] App Version:', Constants.expoConfig?.version);
    console.log('[APP] Release Channel:', Constants.releaseChannel);
    console.log('[APP] Is Expo Go:', Constants.appOwnership === 'expo');
    console.log('[APP] Is Development Client:', !Constants.appOwnership);
    console.log('[APP] API Base URL:', apiBaseUrl);
    console.log('[APP] Fonts loaded:', fontsLoaded, '| Font error:', fontError ?? 'none');
    console.log('[APP] ===== END STARTUP =====');

    // Test connectivity to backend
    const testBackendConnection = async () => {
      try {
        console.log('[APP] Testing backend connectivity to:', apiBaseUrl);
        const response = await api.get('/api/health/', { timeout: 5000 });
        console.log('[APP] Backend health check SUCCESS:', response.data);
      } catch (error: any) {
        console.error('[APP] Backend health check FAILED:', {
          message: error?.message,
          code: error?.code,
          status: error?.response?.status,
          apiBaseUrl,
        });
      }
    };

    setTimeout(testBackendConnection, 1000);
  }, [fontsLoaded, fontError]);

  // Block render until fonts are ready (or failed) — prevents FOUC.
  // Using a plain View + ActivityIndicator keeps this dependency-free.
  // If fontError occurs we still proceed so the app is usable with the
  // system font fallback rather than hanging on a loading screen.
  if (!fontsLoaded && !fontError) {
    return (
      <View style={splash.container}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.brandLight} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const splash = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
