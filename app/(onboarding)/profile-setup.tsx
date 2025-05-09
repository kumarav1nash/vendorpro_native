import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../../src/contexts/UserContext';
import { useUserProfile } from '../../src/contexts/UserProfileContext';
import { CreateUserProfileDto } from '../../src/types/user';

export default function ProfileSetupScreen() {
  const { user } = useUser();
  const { createProfile, loading } = useUserProfile();
  
  const [profileData, setProfileData] = useState<Partial<CreateUserProfileDto>>({
    firstName: '',
    lastName: '',
    gender: 'male',
    city: '',
    state: '',
    country: '',
    bio: '',
    preferences: {
      language: 'en',
      notifications: true,
      theme: 'light',
    }
  });

  const handleChange = (key: string, value: string) => {
    if (key.includes('.')) {
      // Handle nested objects like preferences.language
      const [parent, child] = key.split('.');
      setProfileData(prev => {
        // Type-safe way to handle nested objects
        if (parent === 'preferences' && prev.preferences) {
          return {
            ...prev,
            preferences: {
              ...prev.preferences,
              [child]: value
            }
          };
        }
        // Fall back for other nested objects
        return prev;
      });
    } else {
      // Use a type assertion to safely update the property
      setProfileData(prev => ({ 
        ...prev, 
        [key]: value 
      }));
    }
  };

  const validateForm = () => {
    if (!profileData.firstName?.trim()) {
      Alert.alert('Error', 'First name is required');
      return false;
    }
    if (!profileData.lastName?.trim()) {
      Alert.alert('Error', 'Last name is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user?.id) return;

    try {
      // Create the profile with userId from the authenticated user
      const createProfileData: CreateUserProfileDto = {
        ...profileData as CreateUserProfileDto,
      };
      
      await createProfile(createProfileData);
      
      // Navigate to shop details screen
      router.push('/(onboarding)/shop-details');
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="account-circle" size={60} color="#007AFF" />
        <Text style={styles.title}>Create Your Profile</Text>
        <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={profileData.firstName}
            onChangeText={(value) => handleChange('firstName', value)}
            placeholder="Enter your first name"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={profileData.lastName}
            onChangeText={(value) => handleChange('lastName', value)}
            placeholder="Enter your last name"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                profileData.gender === 'male' && styles.radioButtonSelected
              ]}
              onPress={() => handleChange('gender', 'male')}
            >
              <Text
                style={[
                  styles.radioButtonText,
                  profileData.gender === 'male' && styles.radioButtonTextSelected
                ]}
              >
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioButton,
                profileData.gender === 'female' && styles.radioButtonSelected
              ]}
              onPress={() => handleChange('gender', 'female')}
            >
              <Text
                style={[
                  styles.radioButtonText,
                  profileData.gender === 'female' && styles.radioButtonTextSelected
                ]}
              >
                Female
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioButton,
                profileData.gender === 'other' && styles.radioButtonSelected
              ]}
              onPress={() => handleChange('gender', 'other')}
            >
              <Text
                style={[
                  styles.radioButtonText,
                  profileData.gender === 'other' && styles.radioButtonTextSelected
                ]}
              >
                Other
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={profileData.city}
            onChangeText={(value) => handleChange('city', value)}
            placeholder="Enter your city"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>State</Text>
          <TextInput
            style={styles.input}
            value={profileData.state}
            onChangeText={(value) => handleChange('state', value)}
            placeholder="Enter your state"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={profileData.country}
            onChangeText={(value) => handleChange('country', value)}
            placeholder="Enter your country"
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
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
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#fff',
  },
  radioButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e6f2ff',
  },
  radioButtonText: {
    color: '#333',
    fontSize: 14,
  },
  radioButtonTextSelected: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 