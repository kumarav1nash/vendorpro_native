import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
  Modal,
  FlatList,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import countryCodes from '../../src/data/countryCodes.json';

export default function LoginScreen() {
  const { requestOtp, verifyOtp, error: authError, isLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState(countryCodes.find(c => c.isoCode === 'IN') || countryCodes[0]);
  const [isCountryPickerVisible, setCountryPickerVisible] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendOTP = async () => {
    if (!mobile.trim()) {
      setError('Please enter a valid mobile number');
      return;
    }
    try {
      await requestOtp({ 
        phoneNumber: mobile,
        countryCode: selectedCountry.countryCode 
      });
      setError('');
      setStep(2);
      setTimer(30); // Start 30-second timer for resend
    } catch (err) {
      setError(authError || 'Failed to send OTP. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    try {
      await requestOtp({ 
        phoneNumber: mobile,
        countryCode: selectedCountry.countryCode 
      });
      setTimer(30); // Restart timer
      setError('');
    } catch (err) {
      setError(authError || 'Failed to resend OTP. Please try again.');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    try {
      await verifyOtp({ 
        phoneNumber: mobile, 
        otp,
        countryCode: selectedCountry.countryCode
      });
      router.replace('/');
    } catch (err) {
      setError(authError || 'Invalid OTP. Please try again.');
    }
  };

  const goToSalesmanLogin = () => {
    router.push('/(auth)/salesman-login');
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.topSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>KhataFlow</Text>
              <Text style={styles.tagline}>Manage your business efficiently</Text>
            </View>
            <Image
              source={require('../../assets/images/manage-shop-bro.png')}
              style={styles.illustrationImage}
              resizeMode="contain"
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.formContainer}>
            {step === 1 ? (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Login to your account</Text>
                <Text style={styles.label}>Enter your mobile number</Text>
                <View style={styles.inputRow}>
                  <TouchableOpacity 
                    style={styles.countryCodeBox}
                    onPress={toggleCountryPicker}
                  >
                    <Text style={styles.countryCodeText}>+{selectedCountry.countryCode}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={16} color="#333" />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, { 
                      flex: 1,
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      borderLeftWidth: 0,
                      marginBottom: 0
                    }]}
                    placeholder="Mobile number"
                    value={mobile}
                    onChangeText={setMobile}
                    keyboardType="numeric"
                    maxLength={15}
                  />
                </View>
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleSendOTP}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Verify OTP</Text>
                <Text style={styles.subtitle}>Enter OTP sent to +{selectedCountry.countryCode} {mobile}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleVerifyOTP}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify & Login</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.resendButton, timer > 0 && styles.resendButtonDisabled]}
                  onPress={handleResendOTP}
                  disabled={timer > 0 || isLoading}
                >
                  <Text style={[styles.resendText, timer > 0 && styles.resendTextDisabled]}>
                    {timer > 0 ? `Resend OTP in ${formatTime(timer)}` : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.salesmanLoginButton} onPress={goToSalesmanLogin}>
            <MaterialCommunityIcons name="account-tie" size={20} color="#fff" style={styles.salesmanIcon} />
            <Text style={styles.salesmanLoginText}>Salesman Login</Text>
          </TouchableOpacity>

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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
  },
  illustrationImage: {
    width: '100%',
    height: 200,
    marginVertical: 20,
  },
  formContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRightWidth: 0,
    height: 54,
    minWidth: 80,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginRight: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
    height: 54,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 15,
    padding: 10,
    alignItems: 'center',
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendText: {
    color: '#007AFF',
    fontSize: 14,
  },
  resendTextDisabled: {
    color: '#999',
  },
  error: {
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 10,
    borderRadius: 8,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: '#666',
  },
  registerLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
  salesmanLoginButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  salesmanIcon: {
    marginRight: 8,
  },
  salesmanLoginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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