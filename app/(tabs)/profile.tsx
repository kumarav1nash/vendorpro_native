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
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '../../src/contexts/UserContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useUserProfile } from '../../src/contexts/UserProfileContext';
import { useShop } from '../../src/contexts/ShopContext';
import { useImages } from '../../src/contexts/ImageContext';
import { UserProfile, UserProfilePreferences, UpdateUserProfileDto } from '@/src/types/user';
import { shopService } from '../../src/services/shop.service';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ProfileImage } from '../components/ui/ProfileImage';

// Define an interface for creating a user profile
interface CreateUserProfileDto {
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  bio: string;
  profilePicture: string;
  preferences: {
    language: string;
    notifications: boolean;
    theme: string;
};
}

export default function ProfileScreen() {
  const { user, loading: userLoading } = useUser();
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { profile, updateProfile, fetchProfileByUserId, createProfile } = useUserProfile();
  const { shop, shops, setShops, fetchMyShops } = useShop();
  const { uploadImageWithPicker } = useImages();
  const [isEditing, setIsEditing] = useState(false);
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Add a separate editing state object that's not connected to localProfile
  const [editValues, setEditValues] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    bio: '',
  });
  
  // Add the genderOptions array that was missing
  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];
  
  // Add state for locally stored preferences
  const [localPreferences, setLocalPreferences] = useState({
    language: 'en',
    notifications: true,
    theme: 'light',
  });

  // Initialize local preferences from profile when it loads
  useEffect(() => {
    if (profile && profile.preferences) {
      console.log("Initializing local preferences from profile");
      setLocalPreferences({
        language: profile.preferences.language || 'en',
        notifications: profile.preferences.notifications !== false, // default to true if undefined
        theme: profile.preferences.theme || 'light',
      });
    }
  }, [profile]);
  
  // Add debug logs for both profile and localProfile state changes
  useEffect(() => {
    console.log("Profile context updated:", profile ? "profile exists" : "profile is null");
  }, [profile]);

  useEffect(() => {
    console.log("localProfile state updated:", localProfile ? "exists" : "is null");
  }, [localProfile]);

  // Update local profile when profile changes
  useEffect(() => {
    if (profile) {
      console.log("Setting localProfile from profile:", profile.id);
      setLocalProfile(profile);
      setIsNewProfile(false);
    } else {
      console.log("Profile is null in the update effect");
    }
  }, [profile]);

  // Add a direct debugging function to log all state
  const debugState = () => {
    console.log("Debug State:");
    console.log("- isAuthenticated:", isAuthenticated);
    console.log("- user:", user ? `ID: ${user.id}` : "null");
    console.log("- profile:", profile ? `ID: ${profile.id}` : "null");
    console.log("- localProfile:", localProfile ? `ID: ${localProfile.id}` : "null");
    console.log("- isNewProfile:", isNewProfile);
    console.log("- shops count:", shops ? shops.length : "null");
    
    // If no profile exists, create a fallback profile
    if (user && !localProfile) {
      createFallbackProfile();
    }
  };

  // Create a fallback profile when needed
  const createFallbackProfile = () => {
    if (!user) {
      console.log("Cannot create fallback profile: user is null");
      return;
    }
    
    console.log("Creating fallback profile for user:", user.id);
    const fallbackProfile: UserProfile = {
      id: 'temp-' + user.id,
      userId: user.id,
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      bio: '',
      profilePicture: '',
      preferences: {
        language: 'en',
        notifications: true,
        theme: 'light',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setLocalProfile(fallbackProfile);
    setIsNewProfile(true);
    console.log("Fallback profile created");
  };

  // Update the startEditing function to include preferences
  const startEditing = () => {
    console.log("startEditing called, localProfile:", localProfile ? "exists" : "null");
    
    // Check if localProfile exists, create fallback if needed
    if (!localProfile) {
      console.warn("No localProfile found, attempting to create fallback");
      
      if (user) {
        createFallbackProfile();
        return; // Don't start editing yet
      } else {
        console.error("Cannot edit: No user data available");
        Alert.alert("Error", "User data not available. Please log out and log in again.");
        return;
      }
    }
    
    // Copy current values to the edit state
    const newEditValues = {
      firstName: localProfile.firstName || '',
      lastName: localProfile.lastName || '',
      dateOfBirth: localProfile.dateOfBirth || '',
      gender: localProfile.gender || 'male',
      address: localProfile.address || '',
      city: localProfile.city || '',
      state: localProfile.state || '',
      country: localProfile.country || '',
      postalCode: localProfile.postalCode || '',
      bio: localProfile.bio || '',
    };
    
    console.log("Setting edit values:", JSON.stringify(newEditValues, null, 2));
    setEditValues(newEditValues);
    
    // Set editing mode after setting the values
    console.log("Setting isEditing to true");
    setIsEditing(true);
  };
  
  // Update a single field in the edit values
  const updateEditField = (field: string, value: string) => {
    console.log(`Updating ${field} to ${value}`);
    setEditValues(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Update the saveChanges function to include preferences
  const saveChanges = async () => {
    if (!localProfile) return;
    
    try {
      setIsLoading(true);
      
      // Create an updated profile with our edited values and local preferences
      const updatedProfile = {
        ...localProfile,
        firstName: editValues.firstName,
        lastName: editValues.lastName,
        dateOfBirth: editValues.dateOfBirth,
        gender: editValues.gender as 'male' | 'female' | 'other',
        address: editValues.address,
        city: editValues.city,
        state: editValues.state,
        country: editValues.country,
        postalCode: editValues.postalCode,
        bio: editValues.bio,
        preferences: {
          ...localProfile.preferences,
          language: localPreferences.language,
          notifications: localPreferences.notifications,
          theme: localPreferences.theme,
        }
      };
      
      console.log("Saving profile with updated values:", JSON.stringify(updatedProfile, null, 2));
      
      if (isNewProfile) {
        // Create a new profile since this is the first time saving
        if (!createProfile) {
          throw new Error('Create profile function not available');
        }
        
        // Extract only the fields needed for creation
        const createProfileData: CreateUserProfileDto = {
          userId: updatedProfile.userId,
          firstName: updatedProfile.firstName || '',
          lastName: updatedProfile.lastName || '',
          dateOfBirth: updatedProfile.dateOfBirth || '',
          gender: updatedProfile.gender,
          address: updatedProfile.address || '',
          city: updatedProfile.city || '',
          state: updatedProfile.state || '',
          country: updatedProfile.country || '',
          postalCode: updatedProfile.postalCode || '',
          bio: updatedProfile.bio || '',
          profilePicture: updatedProfile.profilePicture || '',
          preferences: {
            language: localPreferences.language,
            notifications: localPreferences.notifications,
            theme: localPreferences.theme,
          },
        };
        
        await createProfile(createProfileData);
        setIsNewProfile(false);
        Alert.alert('Success', 'Profile created successfully');
      } else {
        // Update existing profile
        await updateProfile(updatedProfile.id, updatedProfile as UpdateUserProfileDto); 
        
        // Also update the local profile state
        setLocalProfile(updatedProfile as UserProfile);
        
        Alert.alert('Success', 'Profile updated successfully');
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    // Clear the edit values
    setEditValues({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      bio: '',
    });
  };

  // Load data when user is available
  useEffect(() => {
    async function loadProfileData() {
      // Wait for auth and user context to finish loading
      if (authLoading || userLoading) {
        return;
      }

      // Make sure we have a user
      if (!user?.id) {
        console.log("Profile screen: User ID not available");
        setError("User data not available. Please log out and log in again.");
        setIsLoading(false);
        return;
      }

      console.log("Profile screen: Loading data for user ID:", user.id);
      try {
        setIsLoading(true);
        
        // First try to load existing profile
        try {
          await fetchProfileByUserId(user.id);
          setIsNewProfile(false);
        } catch (profileErr: any) {
          // If 404 error (profile doesn't exist), just mark as new profile
          // We'll create it only when the user saves for the first time
          if (profileErr?.response?.status === 404) {
            console.log("Profile not found, using empty profile for user:", user.id);
            setIsNewProfile(true);
            
            // Create empty local profile
            const emptyProfile: UserProfile = {
              id: 'temp-' + user.id,
              userId: user.id,
              firstName: '',
              lastName: '',
              dateOfBirth: '',
              gender: 'male',
              address: '',
              city: '',
              state: '',
              country: '',
              postalCode: '',
              bio: '',
              profilePicture: '',
              preferences: {
                language: 'en',
                notifications: true,
                theme: 'light',
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            setLocalProfile(emptyProfile);
          } else {
            // Rethrow other errors
            throw profileErr;
          }
        }
        
        // Load shops regardless of profile status
        try {
          console.log("Fetching shops for user:", user.id);
          await fetchMyShops();
          console.log("Shops fetched successfully");
        } catch (shopErr) {
          console.error("Error fetching shops:", shopErr);
        }
        
        console.log("Profile data loaded successfully");
        setError(null);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadProfileData();
  }, [user, userLoading, authLoading]);

  // Updated handlePreferencesChange to update local preferences state
  const handlePreferencesChange = (key: keyof typeof localPreferences, value: string | boolean) => {
    console.log(`Updating preference ${key} to ${value}`);
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Fix the handleGenderSelect function to use updateEditField instead of handleFieldChange
  const handleGenderSelect = (gender: string) => {
    if (!localProfile) return;
    
    updateEditField('gender', gender);
    setShowGenderPicker(false);
  };

  // Completely revised field renderer for edit mode
  const renderEditableField = (label: string, field: string) => {
    // Skip gender since it has its own renderer
    if (field === 'gender') return null;
    
    return (
      <View style={styles.fieldContainer} key={`field-${field}`}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={styles.input}
          value={editValues[field as keyof typeof editValues]}
          onChangeText={(text) => updateEditField(field, text)}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    );
  };
  
  // View-only field renderer
  const renderViewField = (label: string, value: string) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || 'Not set'}</Text>
    </View>
  );
  
  // Gender field renderer - use the separate editValues for gender
  const renderGenderField = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Gender</Text>
      
      {isEditing ? (
        <TouchableOpacity
          style={styles.genderSelector}
          onPress={() => setShowGenderPicker(true)}
        >
          <Text style={styles.genderSelectorText}>
            {editValues.gender ? 
              editValues.gender.charAt(0).toUpperCase() + editValues.gender.slice(1) : 
              'Select Gender'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#007AFF" />
        </TouchableOpacity>
      ) : (
        <Text style={styles.fieldValue}>
          {localProfile?.gender ? 
            localProfile.gender.charAt(0).toUpperCase() + localProfile.gender.slice(1) : 
            'Not set'}
        </Text>
      )}
      
      <Modal
        visible={showGenderPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            
            <FlatList
              data={genderOptions}
              keyExtractor={(item) => item.value}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    editValues.gender === item.value && styles.genderOptionSelected
                  ]}
                  onPress={() => {
                    updateEditField('gender', item.value);
                    setShowGenderPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.genderOptionText,
                      editValues.gender === item.value && styles.genderOptionTextSelected
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowGenderPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );

  // Add function to handle date selection
  const handleDateChange = (event: any, selectedDate?: Date) => {
    // On Android, dismiss the picker on cancel
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      // Format date as YYYY-MM-DD
      const formattedDate = selectedDate.toISOString().split('T')[0];
      console.log(`Selected date: ${formattedDate}`);
      
      // Update the edit values with the new date
      updateEditField('dateOfBirth', formattedDate);
      
      // Always close the picker after selection on iOS
      setShowDatePicker(false);
    }
  };
  
  // Format the date string for display (from YYYY-MM-DD to more readable format)
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Create a date of birth field with calendar picker
  const renderDateOfBirthField = () => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Date of Birth</Text>
        
        {isEditing ? (
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.datePickerButtonText}>
              {editValues.dateOfBirth 
                ? formatDateForDisplay(editValues.dateOfBirth) 
                : 'Select Date'}
            </Text>
            <MaterialCommunityIcons name="calendar" size={20} color="#007AFF" />
          </TouchableOpacity>
        ) : (
          <Text style={styles.fieldValue}>
            {localProfile?.dateOfBirth 
              ? formatDateForDisplay(localProfile.dateOfBirth) 
              : 'Not set'}
          </Text>
        )}
        
        {/* Show the date picker when active */}
        {showDatePicker && (
          <DateTimePicker
            value={editValues.dateOfBirth 
              ? new Date(editValues.dateOfBirth) 
              : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()} // Can't select future dates
          />
        )}
      </View>
    );
  };

  // Check if edit button should be disabled - add this as a separate variable
  const isEditButtonDisabled = isLoading || !localProfile || userLoading || authLoading;

  // Replace the pickImage function with this implementation
  const pickProfileImage = async () => {
    try {
      // Use the context function to pick and upload an image
      const response = await uploadImageWithPicker('Profile picture');
      
      if (response && response.filename) {
        // Update the profile with the new image filename
        const updatedProfile: Partial<UserProfile> = {
          ...localProfile,
          profilePicture: response.filename
        };
        
        // Call the API to update profile
        if (user?.id) {
          await updateProfile(user.id, updatedProfile);
        } else {
          console.error('User ID not available');
        }
        
        // Update local state
        setLocalProfile(prev => ({
          ...prev!,
          profilePicture: response.filename
        }));
      }
    } catch (error) {
      console.error('Error picking profile image:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    }
  };

  // Fix the Edit button styling conditionals
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <ProfileImage
            filename={localProfile?.profilePicture}
            fallbackUrl={localProfile?.profilePicture} // Backward compatibility with direct URLs
            size={120}
            editable={isEditing}
            onPress={isEditing ? pickProfileImage : undefined}
            showEditIcon={isEditing}
          />
        </View>
        <Text style={styles.headerUsername}>
          {profile?.firstName || 'User'}
        </Text>
        {isNewProfile && !isEditing && (
          <Text style={styles.newProfileBadge}>
            Please edit your profile to complete setup
          </Text>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
          {isEditing ? (
            <View style={styles.editButtonsRow}>
              <TouchableOpacity 
                style={[styles.editActionButton, styles.cancelButton]}
                onPress={cancelEditing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.editActionButton, styles.saveButton]}
                onPress={saveChanges}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[
                styles.saveEditButton,
                isEditButtonDisabled ? styles.disabledButton : null
              ]}
              onPress={() => {
                console.log("Edit button pressed");
                startEditing();
              }}
              disabled={isEditButtonDisabled}
              accessibilityLabel="Edit profile"
              accessibilityHint="Activates edit mode for your profile information"
            >
              <Text style={[
                styles.saveEditButtonText,
                isEditButtonDisabled ? styles.disabledButtonText : null
              ]}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {isEditing ? (
          // Edit mode - use the editValues state
          <>
            {renderEditableField('First Name', 'firstName')}
            {renderEditableField('Last Name', 'lastName')}
            {renderDateOfBirthField()}
            {renderGenderField()}
            {renderEditableField('Address', 'address')}
            {renderEditableField('City', 'city')}
            {renderEditableField('State', 'state')}
            {renderEditableField('Country', 'country')}
            {renderEditableField('Postal Code', 'postalCode')}
            {renderEditableField('Bio', 'bio')}
          </>
        ) : (
          // View mode - use the localProfile state
          <>
            {renderViewField('First Name', localProfile?.firstName || '')}
            {renderViewField('Last Name', localProfile?.lastName || '')}
            {renderDateOfBirthField()}
            {renderGenderField()}
            {renderViewField('Address', localProfile?.address || '')}
            {renderViewField('City', localProfile?.city || '')}
            {renderViewField('State', localProfile?.state || '')}
            {renderViewField('Country', localProfile?.country || '')}
            {renderViewField('Postal Code', localProfile?.postalCode || '')}
            {renderViewField('Bio', localProfile?.bio || '')}
          </>
        )}
        
        <Text style={styles.sectionTitle}>Contact</Text>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.fieldValue}>{user?.email || 'Not set'}</Text>
        </View>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Phone Number</Text>
          <Text style={styles.fieldValue}>{user?.phoneNumber || 'Not set'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.preferenceContainer}>
          <Text style={styles.preferenceLabel}>Language</Text>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                localPreferences.language === 'en' && styles.languageButtonActive,
              ]}
              onPress={() => handlePreferencesChange('language', 'en')}
            >
              <Text style={[
                styles.languageButtonText,
                localPreferences.language === 'en' && styles.languageButtonTextActive,
              ]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                localPreferences.language === 'hi' && styles.languageButtonActive,
              ]}
              onPress={() => handlePreferencesChange('language', 'hi')}
            >
              <Text style={[
                styles.languageButtonText,
                localPreferences.language === 'hi' && styles.languageButtonTextActive,
              ]}>हिंदी</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.preferenceContainer}>
          <Text style={styles.preferenceLabel}>Notifications</Text>
          <Switch
            value={localPreferences.notifications}
            onValueChange={(value) => handlePreferencesChange('notifications', value)}
            trackColor={{ false: '#767577', true: '#007AFF' }}
          />
        </View>

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
    marginBottom: 10,
  },
  headerUsername: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  newProfileBadge: {
    color: '#0066cc',
    fontSize: 14,
    marginTop: 5,
    fontStyle: 'italic',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 15,
    color: '#000',
  },
  saveEditButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  saveEditButtonText: {
    color: '#fff',
    fontWeight: '500',
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
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
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
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noShopContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginVertical: 20,
  },
  noShopTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
  },
  noShopText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  createShopButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  createShopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  viewAllShopsButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  viewAllShopsButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 5,
  },
  genderSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
  },
  genderSelectorText: {
    fontSize: 16,
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  genderOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  genderOptionSelected: {
    backgroundColor: '#f0f8ff',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#333',
  },
  genderOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  modalCloseButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#000',
  },
  editButtonsRow: {
    flexDirection: 'row',
  },
  editActionButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  debugButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  disabledButtonText: {
    color: '#999999',
  },
}); 