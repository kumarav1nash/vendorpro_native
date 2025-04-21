import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SalesProvider } from './contexts/SalesContext';
import { ProductsProvider } from './contexts/ProductContext';
import { ShopProvider } from './contexts/ShopContext';
import { SalesmenProvider } from './contexts/SalesmenContext';
import { UserProvider } from './contexts/UserContext';

// Global layout component that wraps the entire app
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      
      {/* Context providers for data sharing across the app */}
      <UserProvider>
        <ShopProvider>
          <ProductsProvider>
            <SalesmenProvider>
              <SalesProvider>
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
              </SalesProvider>
            </SalesmenProvider>
          </ProductsProvider>
        </ShopProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
