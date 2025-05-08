import React, { createContext, useContext, ReactNode } from 'react';
import useNetworkStatus from '../hooks/useNetworkStatus';
import NetworkErrorBanner from '../components/NetworkErrorBanner';

interface NetworkContextType {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isApiReachable: boolean | null;
  isError: boolean;
  errorMessage: string;
  retryConnection: () => Promise<void>;
  lastChecked: Date | null;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: ReactNode;
  healthCheckEndpoint?: string;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ 
  children,
  healthCheckEndpoint
}) => {
  const networkStatus = useNetworkStatus(healthCheckEndpoint);
  
  return (
    <NetworkContext.Provider value={networkStatus}>
      <>
        <NetworkErrorBanner 
          visible={networkStatus.isError} 
          message={networkStatus.errorMessage}
          onRetry={networkStatus.retryConnection}
        />
        {children}
      </>
    </NetworkContext.Provider>
  );
};

export default NetworkProvider; 