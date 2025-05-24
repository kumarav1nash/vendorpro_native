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
import { ImageProvider } from '../src/contexts/ImageContext';
import { NetworkProvider } from '../src/contexts/NetworkContext';
import ErrorBoundary from '../src/components/ErrorBoundary';
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import Constants from 'expo-constants';


// Global layout component that wraps the entire app
export default function RootLayout() {
  const colorScheme = useColorScheme();
 
  const publishableKey =  Constants.expoConfig?.extra?.clerkPublishableKey;
  console.log('publishableKey', publishableKey);

  if(!publishableKey) {
    throw new Error('Clerk publishable key is not set');
  }
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ClerkLoaded>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        
        {/* Global error boundary to prevent app crashes */}
        <ErrorBoundary>
          {/* Context providers for data sharing across the app */}
          <NetworkProvider>
            <AuthProvider>
              <UserProvider>
                <ImageProvider>
                  <UserProfileProvider>
                    <ShopProvider>
                      <InventoryProvider>
                        <SalesProvider>
                          <CommissionProvider>
                            {/* Root stack navigator */}
                            <Stack>
                              {/* Index route must be first */}
                              <Stack.Screen 
                                name="index" 
                                options={{ 
                                  headerShown: false,
                                  animation: 'none'
                                }} 
                              />
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
                            </Stack>
                          </CommissionProvider>
                        </SalesProvider>
                      </InventoryProvider>
                    </ShopProvider>
                  </UserProfileProvider>
                </ImageProvider>
              </UserProvider>
            </AuthProvider>
          </NetworkProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
