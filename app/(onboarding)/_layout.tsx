import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen
        name="profile-setup"
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="shop-details"
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="setup-options"
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="index"
        options={{
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
} 