import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import axios from 'axios';
import Constants from 'expo-constants';

interface NetworkStatus {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isApiReachable: boolean | null;
  lastChecked: Date | null;
}

// Default API endpoint to check
const API_ENDPOINT = Constants.expoConfig?.extra?.apiUrl;

export default function useNetworkStatus(checkEndpoint = `${API_ENDPOINT}`) {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: null,
    isInternetReachable: null,
    isApiReachable: null,
    lastChecked: null
  });
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Check API reachability
  const checkApiReachability = useCallback(async () => {
    if (!status.isConnected) {
      setIsError(true);
      setErrorMessage('No network connection');
      return false;
    }

    try {
      await axios.get(checkEndpoint, { timeout: 5000 });
      setIsError(false);
      setErrorMessage('');
      return true;
    } catch (error) {
      setIsError(true);
      setErrorMessage('Unable to connect to server');
      return false;
    }
  }, [checkEndpoint, status.isConnected]);

  // Update network connectivity status
  const updateConnectionStatus = useCallback(async (state: NetInfoState) => {
    setStatus({
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      isApiReachable: status.isApiReachable,
      lastChecked: new Date()
    });

    if (state.isConnected && state.isInternetReachable) {
      const apiReachable = await checkApiReachability();
      setStatus(prev => ({
        ...prev,
        isApiReachable: apiReachable,
        lastChecked: new Date()
      }));
    } else if (!state.isConnected) {
      setIsError(true);
      setErrorMessage('No network connection');
      setStatus(prev => ({
        ...prev,
        isApiReachable: false,
        lastChecked: new Date()
      }));
    }
  }, [checkApiReachability, status.isApiReachable]);

  // Handle forced retry
  const retryConnection = useCallback(async () => {
    const netState = await NetInfo.fetch();
    await updateConnectionStatus(netState);
  }, [updateConnectionStatus]);

  // Set up network state monitoring
  useEffect(() => {
    // Initial check
    const initialCheck = async () => {
      const state = await NetInfo.fetch();
      await updateConnectionStatus(state);
    };
    
    initialCheck();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(updateConnectionStatus);

    // Set up periodic checks (every 30 seconds)
    const intervalId = setInterval(() => {
      checkApiReachability();
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [updateConnectionStatus, checkApiReachability]);

  return {
    isConnected: status.isConnected,
    isInternetReachable: status.isInternetReachable,
    isApiReachable: status.isApiReachable,
    isError,
    errorMessage,
    retryConnection,
    lastChecked: status.lastChecked
  };
}