import "@/src/i18n";

import { ScreenTransitions } from "@/constants/transitions";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UnreadCountProvider } from "@/contexts/UnreadCountContext";
import { toastConfig } from "@/lib/toastConfig";
import { CartProvider } from "@/src/cart";
import { EnvProvider } from "@/src/env";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          ...ScreenTransitions.slideAndFade,
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
            ...ScreenTransitions.fade,
          }}
        />
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
            ...ScreenTransitions.slideFromRight,
          }}
        />
        <Stack.Screen
          name="(onboarding)"
          options={{
            headerShown: false,
            ...ScreenTransitions.fade,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            ...ScreenTransitions.fade,
          }}
        />
        <Stack.Screen
          name="pro-portal"
          options={{
            headerShown: false,
            ...ScreenTransitions.fade,
          }}
        />

        {/* <Stack.Screen 
          name="modal" 
          options={{ 
            presentation: 'modal',
            title: 'Filter & Sort',
            headerShown: true,
            ...ScreenTransitions.bottomSheet,
          }} 
        /> */}

        {/* Add missing screens with transitions */}
        {/* <Stack.Screen 
          name="chat/[id]" 
          options={{ 
            headerShown: false,
            ...ScreenTransitions.slideFromRight,
          }} 
        />
        <Stack.Screen 
          name="product/[id]" 
          options={{ 
            headerShown: false,
            ...ScreenTransitions.zoomIn,
          }} 
        /> */}
        {/* <Stack.Screen 
          name="user/[id]" 
          options={{ 
            headerShown: false,
            ...ScreenTransitions.slideAndFade,
          }} 
        /> */}
        <Stack.Screen
          name="search"
          options={{
            headerShown: false,
            ...ScreenTransitions.slideAndFade,
          }}
        />
        <Stack.Screen
          name="favorites"
          options={{
            headerShown: false,
            ...ScreenTransitions.slideFromRight,
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: false,
            ...ScreenTransitions.slideFromRight,
          }}
        />
        <Stack.Screen
          name="help"
          options={{
            headerShown: false,
            ...ScreenTransitions.slideFromRight,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: false,
            ...ScreenTransitions.slideFromRight,
          }}
        />
        <Stack.Screen
          name="contact-us"
          options={{
            headerShown: false,
            ...ScreenTransitions.slideFromRight,
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (fontsLoaded) {
    SplashScreen.hideAsync().catch(() => {});
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <EnvProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <CartProvider>
            <UnreadCountProvider>
              <AppContent />
              <Toast config={toastConfig} />
            </UnreadCountProvider>
          </CartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </EnvProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
});
