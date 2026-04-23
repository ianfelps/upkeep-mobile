import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { View, ActivityIndicator, Text } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import * as Notifications from 'expo-notifications';
import { ToastHost } from '@/components';
import { useBootstrapSession } from '@/features/auth/hooks';
import { useDatabaseMigrations } from '@/db/migrator';
import { registerSyncTriggers } from '@/sync/triggers';
import { requestNotificationPermissions } from '@/notifications/permissions';
import { rescheduleEventNotifications } from '@/notifications/scheduler';
import { syncEngine } from '@/sync/syncEngine';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const { success: migrationsReady, error: migrationsError } = useDatabaseMigrations();

  const ready = (fontsLoaded || fontError) && (migrationsReady || migrationsError);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (migrationsError) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.lg,
          }}
        >
          <Text style={[typography.h2, { color: colors.error, marginBottom: spacing.sm }]}>
            Falha ao preparar o banco local
          </Text>
          <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
            {migrationsError.message}
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <StatusBar style="dark" />
            <AppBootstrap />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
            <ToastHost />
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppBootstrap() {
  useBootstrapSession();
  useEffect(() => {
    const cleanupSync = registerSyncTriggers();
    void requestNotificationPermissions();
    const cleanupNotif = syncEngine.onResult(() => {
      void rescheduleEventNotifications();
    });
    return () => {
      cleanupSync();
      cleanupNotif();
    };
  }, []);
  return null;
}
