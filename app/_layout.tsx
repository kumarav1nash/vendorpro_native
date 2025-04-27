import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SalesProvider } from '../src/contexts/SalesContext';
import { InventoryProvider } from '../src/contexts/InventoryContext';
import { ShopProvider } from '../src/contexts/ShopContext';
import { UserProvider } from '../src/contexts/UserContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { CommissionProvider } from '../src/contexts/CommissionContext';
import { UserProfileProvider } from '../src/contexts/UserProfileContext';

// Global layout component that wraps the entire app
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      
      {/* Context providers for data sharing across the app */}
      <AuthProvider>
      <UserProvider>
        <UserProfileProvider>
          <ShopProvider>
            <InventoryProvider>
              <SalesProvider>
                <CommissionProvider>
                {/* Root stack navigator */}
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                  <Stack.Screen name="(redirects)" options={{ headerShown: false }} />
                  <Stack.Screen name="(salesman)" options={{ headerShown: false }} />
                  <Stack.Screen 
                    name="shop/[id]" 
                    options={{ 
                      headerShown: true,
                      headerTitle: 'Shop Details',
                      headerBackTitle: 'Back'
                    }} 
                  />
                  <Stack.Screen 
                    name="index" 
                    options={{ 
                      // Auth check & redirect screen, no header needed
                      headerShown: false 
                    }} 
                  />
                </Stack>
                </CommissionProvider>
              </SalesProvider>
            </InventoryProvider>
          </ShopProvider>
        </UserProfileProvider>
      </UserProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
