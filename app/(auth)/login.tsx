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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';

export default function LoginScreen() {
  const { requestOtp, verifyOtp, error: authError, isLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
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
    try {
      await requestOtp({ phoneNumber: mobile });
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
      await requestOtp({ phoneNumber: mobile });
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
      await verifyOtp({ phoneNumber: mobile, otp });
      router.replace('/');
    } catch (err) {
      setError(authError || 'Invalid OTP. Please try again.');
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
          <View style={styles.inputRow}>
            <View style={styles.countryCodeBox}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
          <TextInput
              style={[styles.input, { flex: 1 }]}
            placeholder="10-digit mobile number"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="numeric"
            maxLength={10}
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

      {/* <View style={styles.footer}>
        <Text style={styles.footerText}>New to VendorPro? </Text>
        <Link href="/register" asChild>
          <TouchableOpacity>
            <Text style={styles.registerLink}>Register here</Text>
          </TouchableOpacity>
        </Link>
      </View> */}

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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  countryCodeBox: {
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
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 0,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
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