import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '../../src/contexts/UserContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useUserProfile } from '../../src/contexts/UserProfileContext';
import { useShop } from '../../src/contexts/ShopContext';
import { UserProfile, UserProfilePreferences } from '@/src/types/user';

export default function ProfileScreen() {
  const { user } = useUser();
  const { logout } = useAuth();
  const { profile, updateProfile, fetchMyProfile } = useUserProfile();
  const { shop } = useShop();
  const [isEditing, setIsEditing] = useState(false);
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!profile && user) {
      fetchMyProfile();
    } else if (profile) {
      setLocalProfile(profile);
    }
  }, [profile, user]);

  const handleSave = async () => {
    if (!localProfile) return;
    try {
      await updateProfile(localProfile.id, localProfile);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleFieldChange = (key: keyof UserProfile, value: string) => {
    if (!localProfile) return;
    setLocalProfile({ ...localProfile, [key]: value });
  };

  const handlePreferencesChange = (key: keyof UserProfilePreferences, value: string | boolean) => {
    if (!localProfile) return;
    setLocalProfile({
      ...localProfile,
      preferences: {
        ...localProfile.preferences,
        [key]: value,
        },
    });
  };

  const renderField = (label: string, value: string, key: keyof UserProfile, editable = true) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing && editable ? (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => handleFieldChange(key, text)}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || 'Not set'}</Text>
      )}
    </View>
  );

  if (!localProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <MaterialCommunityIcons name="account-circle" size={80} color="#007AFF" />
          {!isEditing && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        {renderField('First Name', localProfile.firstName, 'firstName')}
        {renderField('Last Name', localProfile.lastName, 'lastName')}
        {renderField('Date of Birth', localProfile.dateOfBirth, 'dateOfBirth')}
        {renderField('Gender', localProfile.gender, 'gender')}
        {renderField('Address', localProfile.address, 'address')}
        {renderField('City', localProfile.city, 'city')}
        {renderField('State', localProfile.state, 'state')}
        {renderField('Country', localProfile.country, 'country')}
        {renderField('Postal Code', localProfile.postalCode, 'postalCode')}
        {renderField('Bio', localProfile.bio, 'bio')}
        <Text style={styles.sectionTitle}>Contact</Text>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.fieldValue}>{user?.email || 'Not set'}</Text>
        </View>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Phone Number</Text>
          <Text style={styles.fieldValue}>{user?.phoneNumber || 'Not set'}</Text>
        </View>
        <Text style={styles.sectionTitle}>Shop Information</Text>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Shop Name</Text>
          <Text style={styles.fieldValue}>{shop?.shopName || 'Not set'}</Text>
        </View>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>GSTIN</Text>
          <Text style={styles.fieldValue}>{shop?.gstinNumber || 'Not set'}</Text>
        </View>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.preferenceContainer}>
          <Text style={styles.preferenceLabel}>Language</Text>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                localProfile.preferences.language === 'en' && styles.languageButtonActive,
              ]}
              disabled={!isEditing}
              onPress={() => handlePreferencesChange('language', 'en')}
            >
              <Text style={[
                styles.languageButtonText,
                localProfile.preferences.language === 'en' && styles.languageButtonTextActive,
              ]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                localProfile.preferences.language === 'hi' && styles.languageButtonActive,
              ]}
              disabled={!isEditing}
              onPress={() => handlePreferencesChange('language', 'hi')}
            >
              <Text style={[
                styles.languageButtonText,
                localProfile.preferences.language === 'hi' && styles.languageButtonTextActive,
              ]}>हिंदी</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.preferenceContainer}>
          <Text style={styles.preferenceLabel}>Notifications</Text>
          <Switch
            value={!!localProfile.preferences.notifications}
            onValueChange={(value) => handlePreferencesChange('notifications', value)}
            trackColor={{ false: '#767577', true: '#007AFF' }}
            disabled={!isEditing}
          />
        </View>
        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setIsEditing(false);
                setLocalProfile(profile);
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.setupButton]}
          onPress={() => {
            Alert.alert(
              'Shop Setup',
              'Do you want to go through the shop setup process again?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Continue',
                  onPress: async () => {
                    try {
                      router.replace('/(onboarding)/shop-details');
                    } catch (error) {
                      console.error('Error initiating setup:', error);
                      Alert.alert('Error', 'Failed to start setup process');
                    }
                  },
                },
              ]
            );
          }}
        >
          <MaterialCommunityIcons name="store-settings" size={20} color="#007AFF" />
          <Text style={styles.setupButtonText}>Shop Setup</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert(
              'Logout',
              'Are you sure you want to logout?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Logout',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await logout();
                      router.replace('/(auth)/login');
                    } catch (error) {
                      console.error('Error during logout:', error);
                    }
                  },
                },
              ]
            );
          }}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
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
    backgroundColor: '#fff',
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    position: 'relative',
  },
  editButton: {
    position: 'absolute',
    right: -10,
    bottom: 0,
    backgroundColor: '#007AFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 15,
    color: '#000',
  },
  fieldContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 16,
    color: '#000',
  },
  input: {
    fontSize: 16,
    color: '#000',
    padding: 0,
  },
  preferenceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#000',
  },
  languageButtons: {
    flexDirection: 'row',
  },
  languageButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginLeft: 10,
  },
  languageButtonActive: {
    backgroundColor: '#007AFF',
  },
  languageButtonText: {
    color: '#666',
  },
  languageButtonTextActive: {
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButtonText: {
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  setupButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  setupButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 