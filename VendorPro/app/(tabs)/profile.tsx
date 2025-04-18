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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

type UserProfile = {
  name: string;
  mobile: string;
  email: string;
  shopName: string;
  gstin?: string;
  language: 'en' | 'hi';
  notificationsEnabled: boolean;
};

export default function ProfileScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    mobile: '',
    email: '',
    shopName: '',
    gstin: '',
    language: 'en',
    notificationsEnabled: true,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setProfile(prev => ({
          ...prev,
          ...user,
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(profile));
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('user');
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
        },
      ],
    );
  };

  const renderField = (label: string, value: string, key: keyof UserProfile) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => setProfile(prev => ({ ...prev, [key]: text }))}
          editable={key !== 'mobile'} // Mobile number cannot be edited
        />
      ) : (
        <Text style={styles.fieldValue}>{value || 'Not set'}</Text>
      )}
    </View>
  );

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
        {renderField('Name', profile.name, 'name')}
        {renderField('Mobile', profile.mobile, 'mobile')}
        {renderField('Email', profile.email, 'email')}
        
        <Text style={styles.sectionTitle}>Shop Information</Text>
        {renderField('Shop Name', profile.shopName, 'shopName')}
        {renderField('GSTIN (Optional)', profile.gstin || '', 'gstin')}

        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.preferenceContainer}>
          <Text style={styles.preferenceLabel}>Language</Text>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                profile.language === 'en' && styles.languageButtonActive,
              ]}
              onPress={() => setProfile(prev => ({ ...prev, language: 'en' }))}
            >
              <Text style={[
                styles.languageButtonText,
                profile.language === 'en' && styles.languageButtonTextActive,
              ]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                profile.language === 'hi' && styles.languageButtonActive,
              ]}
              onPress={() => setProfile(prev => ({ ...prev, language: 'hi' }))}
            >
              <Text style={[
                styles.languageButtonText,
                profile.language === 'hi' && styles.languageButtonTextActive,
              ]}>हिंदी</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.preferenceContainer}>
          <Text style={styles.preferenceLabel}>Notifications</Text>
          <Switch
            value={profile.notificationsEnabled}
            onValueChange={(value) =>
              setProfile(prev => ({ ...prev, notificationsEnabled: value }))
            }
            trackColor={{ false: '#767577', true: '#007AFF' }}
          />
        </View>

        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setIsEditing(false)}
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
          style={styles.logoutButton}
          onPress={handleLogout}
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
}); 