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
} from 'react-native';
import { router, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ServiceFactory from '../services/ServiceFactory';

export default function LoginScreen() {
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);

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
    if (!mobile.trim() || mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      // Get user repository
      const userRepository = ServiceFactory.getUserRepository();
      
      // Check if user exists with this mobile number
      const users = await userRepository.getAll();
      const existingUser = users.find(user => user.mobile === mobile);
      
      if (!existingUser) {
        // User doesn't exist, prompt to register
        Alert.alert(
          'Account Not Found',
          'No account found with this mobile number. Would you like to register?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setLoading(false);
                setError('');
              },
            },
            {
              text: 'Register',
              onPress: () => {
                setLoading(false);
                router.push('/register');
              },
            },
          ]
        );
        return;
      }

      // TODO: Implement your OTP sending logic here
      setError('');
      setStep(2);
      setTimer(30); // Start 30-second timer for resend
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      // TODO: Implement your OTP resend logic here
      setTimer(30); // Restart timer
      setError('');
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      // Get user repository
      const userRepository = ServiceFactory.getUserRepository();
      
      // Get existing user data
      const users = await userRepository.getAll();
      const userData = users.find(user => user.mobile === mobile);
      
      if (!userData) {
        setError('User not found. Please try again.');
        return;
      }
      
      // TODO: Implement your OTP verification logic here
      
      // Check if shop details exist
      const shopDetails = await AsyncStorage.getItem('shopDetails');
      const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');
      
      if (shopDetails && onboardingComplete) {
        // If onboarding is complete, go to dashboard
        router.replace('/(tabs)/dashboard');
      } else {
        // If onboarding is not complete, redirect to onboarding
        router.replace('/(onboarding)/shop-details');
      }
    } catch (err) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goToSalesmanLogin = () => {
    router.push('/(auth)/salesman-login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>VendorPro</Text>
        <Text style={styles.tagline}>Manage your business efficiently</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {step === 1 ? (
        <View style={styles.form}>
          <Text style={styles.label}>Enter your mobile number</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="numeric"
            maxLength={10}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.subtitle}>Enter OTP sent to {mobile}</Text>
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
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify & Login</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.resendButton, timer > 0 && styles.resendButtonDisabled]}
            onPress={handleResendOTP}
            disabled={timer > 0 || loading}
          >
            <Text style={[styles.resendText, timer > 0 && styles.resendTextDisabled]}>
              {timer > 0 ? `Resend OTP in ${formatTime(timer)}` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>New to VendorPro? </Text>
        <Link href="/register" asChild>
          <TouchableOpacity>
            <Text style={styles.registerLink}>Register here</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <TouchableOpacity style={styles.salesmanLoginButton} onPress={goToSalesmanLogin}>
        <MaterialCommunityIcons name="account-tie" size={20} color="#fff" style={styles.salesmanIcon} />
        <Text style={styles.salesmanLoginText}>Salesman Login</Text>
      </TouchableOpacity>
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
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
}); 