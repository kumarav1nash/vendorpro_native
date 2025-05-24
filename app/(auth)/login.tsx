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
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { makeRedirectUri } from 'expo-auth-session';
import countryCodes from '../../src/data/countryCodes.json';
import { authService } from '../../src/services/auth.service';

export default function LoginScreen() {
  const { getToken } = useAuth();
  const signInObj = useSignIn();
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState(countryCodes.find(c => c.isoCode === 'IN') || countryCodes[0]);
  const [isCountryPickerVisible, setCountryPickerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


console.log('OAuth Redirect URI:', makeRedirectUri());
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

  // Clerk OTP: Send OTP
  const handleSendOTP = async () => {
    if (!mobile.trim()) {
      setError('Please enter a valid mobile number');
      return;
    }
    if (!signInObj.isLoaded) return;
    setIsLoading(true);
    setError('');
    try {
      // Always use E.164 format for Clerk
      const fullPhone = `+${selectedCountry.countryCode}${mobile}`;
      await signInObj.signIn.create({ identifier: fullPhone, strategy: 'phone_code' });
      await signInObj.signIn.prepareFirstFactor({ strategy: 'phone_code', phoneNumberId: fullPhone });
      setError('');
      setStep(2);
      setTimer(30);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clerk OTP: Resend OTP
  const handleResendOTP = async () => {
    if (timer > 0 || !signInObj.isLoaded) return;
    setIsLoading(true);
    setError('');
    try {
      const fullPhone = `+${selectedCountry.countryCode}${mobile}`;
      await signInObj.signIn.prepareFirstFactor({ strategy: 'phone_code', phoneNumberId: fullPhone });
      setTimer(30);
      setError('');
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clerk OTP: Verify OTP
  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    if (!signInObj.isLoaded) return;
    setIsLoading(true);
    setError('');
    try {
      const attempt = await signInObj.signIn.attemptFirstFactor({ strategy: 'phone_code', code: otp });
      if (attempt.status === 'complete') {
        await signInObj.setActive({ session: attempt.createdSessionId });
        await handleGenerateToken();
      } else {
        setError('OTP verification failed.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clerk OAuth: Google/Facebook
  const handleOAuthSignIn = async (provider: 'oauth_google' | 'oauth_facebook') => {
    setIsLoading(true);
    setError('');
    try {
      if (!signInObj.isLoaded) {
        setError('Sign-in is not ready. Please try again in a moment.');
        return;
      }
      const { signIn } = signInObj;
      if (!signIn) throw new Error('SignIn not loaded');
      const redirectUrl = makeRedirectUri();
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl,
        redirectUrlComplete: redirectUrl,
      });
    } catch (err) {
      console.log('OAuth sign-in failed:', err);
      setError('OAuth sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // After Clerk session, call backend to generate tokens
  const handleGenerateToken = async () => {
    try {
      const clerkToken = await getToken();
      const fullPhone = `+${selectedCountry.countryCode}${mobile}`;
      await authService.generateToken({ phoneNumber: fullPhone, clerkToken: clerkToken || '' });
      router.replace('/');
    } catch (err) {
      setError('Failed to authenticate with backend.');
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
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>KhataFlow</Text>
        <Text style={styles.tagline}>Manage your business efficiently</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {step === 1 ? (
        <View style={styles.form}>
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
              style={[styles.input, { flex: 1 }]}
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

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#DB4437' }]}
        onPress={() => handleOAuthSignIn('oauth_google')}
        disabled={!signInObj.isLoaded || isLoading}
      >
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#4267B2' }]}
        onPress={() => handleOAuthSignIn('oauth_facebook')}
        disabled={!signInObj.isLoaded || isLoading}
      >
        <Text style={styles.buttonText}>Sign in with Facebook</Text>
      </TouchableOpacity>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
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
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRightWidth: 0,
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
    marginBottom: 0,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
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
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
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
    padding: 12,
    borderRadius: 8,
    marginTop: 30,
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