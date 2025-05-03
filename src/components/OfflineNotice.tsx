import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNetwork } from '../contexts/NetworkContext';

interface OfflineNoticeProps {
  onRetry?: () => void;
  message?: string;
}

/**
 * Displays a full-screen offline notice when content cannot be loaded due to network issues
 */
const OfflineNotice: React.FC<OfflineNoticeProps> = ({
  onRetry,
  message
}) => {
  const { retryConnection, errorMessage } = useNetwork();
  
  const handleRetry = () => {
    retryConnection();
    if (onRetry) onRetry();
  };
  
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="wifi-off" size={80} color="#999" />
      <Text style={styles.title}>You're offline</Text>
      <Text style={styles.message}>
        {message || errorMessage || "Unable to connect to the server. Please check your connection."}
      </Text>
      <TouchableOpacity 
        style={styles.button}
        onPress={handleRetry}
      >
        <MaterialCommunityIcons name="refresh" size={16} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
    minHeight: 300,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OfflineNotice; 