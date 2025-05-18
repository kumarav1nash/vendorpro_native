import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';
import countryCodes from '../../src/data/countryCodes.json';

export default function SalesmanLoginScreen() {
  const { login, isLoading } = useAuth();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countryCodes.find(c => c.isoCode === 'IN') || countryCodes[0]);
  const [isCountryPickerVisible, setCountryPickerVisible] = useState(false);

  const handleLogin = async () => {
    if (!mobile.trim() || !password.trim()) {
      setError('Please enter both mobile number and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login({ 
        phoneNumber: mobile, 
        password,
        countryCode: selectedCountry.countryCode
      });
      await SecureStore.setItemAsync('salesmanAuthenticated', 'true');
      router.replace('/');
    } catch (err) {
      setError('Invalid credentials or login failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCountryPicker = () => {
    setCountryPickerVisible(!isCountryPickerVisible);
  };

  const handleSelectCountry = (country: typeof countryCodes[0]) => {
    setSelectedCountry(country);
    setCountryPickerVisible(false);
  };

  const renderCountryItem = ({ item }: { item: typeof countryCodes[0] }) => (
    <TouchableOpacity 
      style={styles.countryItem} 
      onPress={() => handleSelectCountry(item)}
    >
      <Text style={styles.countryName}>{item.country}</Text>
      <Text style={styles.countryCode}>+{item.countryCode}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.logoContainer}>
        <MaterialCommunityIcons name="account-tie" size={80} color="#007AFF" />
        <Text style={styles.title}>Salesman Login</Text>
        <Text style={styles.subtitle}>Login with your salesman credentials</Text>
      </View>
      
      <View style={styles.formContainer}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <View style={styles.inputRow}>
          <TouchableOpacity 
            style={styles.countryCodeBox}
            onPress={toggleCountryPicker}
          >
            <Text style={styles.countryCodeText}>+{selectedCountry.countryCode}</Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color="#333" />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="10-digit mobile number"
            value={mobile}
            onChangeText={setMobile}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="lock" size={24} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color="#999"
            />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading || isLoading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.backButtonText}>Back to Owner Login</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isCountryPickerVisible}
        animationType="slide"
        transparent={true}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={toggleCountryPicker}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countryCodes}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.isoCode}
              initialNumToRender={15}
              maxToRenderPerBatch={20}
              windowSize={10}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    padding: 24,
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 0,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderRightWidth: 0,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  countryCodeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginRight: 4,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    borderWidth: 0,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    padding: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputIcon: {
    marginRight: 12,
  },
  eyeIcon: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  countryName: {
    fontSize: 16,
  },
  countryCode: {
    fontSize: 16,
    color: '#666',
  },
});