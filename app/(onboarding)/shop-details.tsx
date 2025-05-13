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
import { useShop } from '../../src/contexts/ShopContext';
import { useUserProfile } from '../../src/contexts/UserProfileContext';
import { CreateShopDto } from '../../src/types/shop';
import { CreateUserProfileDto } from '../../src/types/user';

export default function ShopDetailsScreen() {
  const { createShop, isLoading } = useShop();
  const { createProfile } = useUserProfile();
  const [shopDetails, setShopDetails] = useState<CreateShopDto>({
    shopName: '',
    ownerName: '',
    email: '',
    gstinNumber: '',
  });

  const handleChange = (key: keyof CreateShopDto, value: string) => {
    setShopDetails(prev => ({ ...prev, [key]: value }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateGSTIN = (gstin: string) => {
    if (!gstin) return true; // GSTIN is optional
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

  const validateForm = () => {
    if (!shopDetails.shopName.trim()) {
      Alert.alert('Error', 'Shop name is required');
      return false;
    }
    if (!shopDetails.ownerName.trim()) {
      Alert.alert('Error', 'Owner name is required');
      return false;
    }
    if (!validateEmail(shopDetails.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!validateGSTIN(shopDetails.gstinNumber || '')) {
      Alert.alert('Error', 'Please enter a valid GSTIN number or leave it empty');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Create shop using the API
      const newShop = await createShop(shopDetails);
      
      // Create profile from the owner name
      if (shopDetails.ownerName) {
        try {
          // Split owner name into first and last name
          const nameParts = shopDetails.ownerName.trim().split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
          
          // Create profile with the extracted first and last name
          await createProfile({
            firstName,
            lastName
          } as CreateUserProfileDto);
          
          console.log('Created user profile from shop owner name');
        } catch (profileError) {
          // Don't block the flow if profile creation fails
          console.error('Failed to create profile:', profileError);
        }
      }
      
      // Navigate to setup options
      router.push('/(onboarding)/setup-options');
    } catch (error) {
      console.error('Error creating shop:', error);
      Alert.alert('Error', 'Failed to create shop. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="store" size={60} color="#007AFF" />
        <Text style={styles.title}>Register Your Shop</Text>
        <Text style={styles.subtitle}>Enter your shop details to get started</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Shop Name *</Text>
          <TextInput
            style={styles.input}
            value={shopDetails.shopName}
            onChangeText={(value) => handleChange('shopName', value)}
            placeholder="Enter shop name"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Owner Name *</Text>
          <TextInput
            style={styles.input}
            value={shopDetails.ownerName}
            onChangeText={(value) => handleChange('ownerName', value)}
            placeholder="Enter owner name"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={shopDetails.email}
            onChangeText={(value) => handleChange('email', value)}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>GSTIN (Optional)</Text>
          <TextInput
            style={styles.input}
            value={shopDetails.gstinNumber}
            onChangeText={(value) => handleChange('gstinNumber', value.toUpperCase())}
            placeholder="Enter GSTIN number"
            autoCapitalize="characters"
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register Shop</Text>
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
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 