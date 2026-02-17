import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import AuthProvider, { useAuth } from "@/lib/authcontext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ActivityIndicator, View } from "react-native"; // Add these

function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return; // Don't do anything while loading

    const inAuthGroup = segments[0] === "auth";

    if (!user && !inAuthGroup) {
      // Not logged in -> Go to Login
      router.replace("/auth");
    } else if (user && inAuthGroup) {
      // Logged in but trying to see Login page -> Go to Home
      router.replace("/");
    }
  }, [user, segments, isLoading]); // Added isLoading to dependencies

  // CRITICAL: If loading, show a splash/spinner instead of the app
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />   
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <SafeAreaProvider>
          <AuthProvider>
            <RouteGuard>
              <Stack screenOptions={{ headerShown: false }}>
                {/* Ensure both main paths are recognized by the Stack */}
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="auth" /> 
              </Stack>
            </RouteGuard>
          </AuthProvider>
        </SafeAreaProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}