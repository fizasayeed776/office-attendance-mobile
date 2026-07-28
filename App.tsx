import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import api from './src/api/client';

import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  // Log API configuration at app startup
  React.useEffect(() => {
    const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl as string;
    console.log('🚀 ===== APP STARTUP =====');
    console.log('🚀 App Version:', Constants.expoConfig?.version);
    console.log('🚀 Release Channel:', Constants.releaseChannel);
    console.log('🚀 Is Expo Go:', Constants.appOwnership === 'expo');
    console.log('🚀 Is Development Client:', !Constants.appOwnership);
    console.log('🚀 API Base URL:', apiBaseUrl);
    console.log('🚀 Manifest Extra:', JSON.stringify(Constants.expoConfig?.extra, null, 2));
    console.log('🚀 ===== END STARTUP =====');

    // Test connectivity to backend
    const testBackendConnection = async () => {
      try {
        console.log('🚀 Testing backend connectivity to:', apiBaseUrl);
        const response = await api.get('/api/health/', { timeout: 5000 });
        console.log('🚀 Backend health check SUCCESS:', response.data);
      } catch (error: any) {
        console.error('🚀 Backend health check FAILED:', {
          message: error?.message,
          code: error?.code,
          status: error?.response?.status,
          apiBaseUrl: apiBaseUrl,
        });
      }
    };

    // Run health check after a short delay to allow app to fully initialize
    setTimeout(testBackendConnection, 1000);
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
