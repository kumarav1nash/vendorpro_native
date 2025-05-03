import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SetupOption = {
  title: string;
  description: string;
  icon: string;
  route: string;
};

export default function SetupOptionsScreen() {
  const setupOptions: SetupOption[] = [
    {
      title: 'Add Products',
      description: 'Start adding your products to manage inventory',
      icon: 'package-variant',
      route: '/(tabs)/inventory',
    },
    {
      title: 'Add Salesmen',
      description: 'Add salesmen to manage your sales team',
      icon: 'account-group',
      route: '/(tabs)/salesmen',
    },
    {
      title: 'Skip Setup',
      description: 'Go directly to dashboard',
      icon: 'arrow-right',
      route: '/(tabs)/dashboard',
    },
  ];

  const handleOptionSelect = async (route: string) => {
    try {
      // Mark onboarding as complete
      await AsyncStorage.setItem('onboardingComplete', 'true');
      
      // Navigate to the selected route
      router.replace(route as any);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      // If error, still try to navigate
      router.replace(route as any);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="cog" size={60} color="#007AFF" />
        <Text style={styles.title}>Setup Your Shop</Text>
        <Text style={styles.subtitle}>Choose what you'd like to set up next</Text>
      </View>

      <View style={styles.optionsContainer}>
        {setupOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionCard}
            onPress={() => handleOptionSelect(option.route)}
          >
            <MaterialCommunityIcons
              name={option.icon as any}
              size={40}
              color="#007AFF"
            />
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  optionsContainer: {
    padding: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 15,
    marginRight: 10,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
}); 