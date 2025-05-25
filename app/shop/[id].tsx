import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Platform,
  VirtualizedList,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useShop } from '../../src/contexts/ShopContext';
import { useInventory } from '../../src/contexts/InventoryContext';
import { useSales } from '../../src/contexts/SalesContext';
import { UserProfileProvider } from '../../src/contexts/UserProfileContext';
import { BlurView } from 'expo-blur';

// Tab components
import InventoryTab from '../components/shop/InventoryTab';
import SalesTab from '../components/shop/SalesTab';
import SalesmenTab from '../components/shop/SalesmenTab';

type TabType = 'inventory' | 'sales' | 'salesmen';

// Dummy data item for VirtualizedList
type TabItem = {
  id: string;
  content: React.ReactNode;
};

export default function ShopDetailScreen() {
  const { id, tab } = useLocalSearchParams();
  const router = useRouter();
  const { shops, fetchMyShops, setShops } = useShop();
  
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Find the shop by ID
  const shop = shops.find(s => s.id === id);
  
  // Set active tab based on URL parameter
  useEffect(() => {
    if (tab === 'sales' || tab === 'inventory' || tab === 'salesmen') {
      setActiveTab(tab);
    }
  }, [tab]);
  
  useEffect(() => {
    if (shop) {
      // Set as current shop
      setIsLoading(false);
    } else {
      // If shop not found, go back to shops list
      router.back();
    }
  }, [shop?.id]);

  // Function to open modal
  const openDetailsModal = () => {
    setShowDetailsModal(true);
  };

  // Function to close modal
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
  };
  
  // Create a data object for VirtualizedList
  const createTabContent = () => {
    if (!shop) return null;
    
    switch (activeTab) {
      case 'inventory':
        return <InventoryTab shopId={shop.id} shop={shop} />;
      case 'sales':
        return <SalesTab shopId={shop.id} shop={shop} />;
      case 'salesmen':
        return <SalesmenTab shopId={shop.id} shop={shop} />;
      default:
        return null;
    }
  };
  
  // Setup for VirtualizedList
  const tabData = [{ id: '1', content: createTabContent() }];
  
  const getItem = (_data: TabItem[], index: number): TabItem => {
    return tabData[index];
  };
  
  const getItemCount = (_data: TabItem[]) => {
    return 1;
  };
  
  const renderTabItem = ({ item }: { item: TabItem }) => {
    return (
      <View style={styles.tabContentWrapper}>
        {item.content}
      </View>
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading shop details...</Text>
      </View>
    );
  }
  
  if (!shop) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Shop not found</Text>
      </View>
    );
  }
  
  return (
    <UserProfileProvider>
      <Stack.Screen 
        options={{ 
          title: shop.shopName,
          headerBackTitle: 'Shops',
          headerRight: () => (
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={openDetailsModal}
            >
              <MaterialCommunityIcons name="information-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          )
        }} 
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'inventory' && styles.activeTab]}
            onPress={() => setActiveTab('inventory')}
          >
            <MaterialCommunityIcons 
              name="package-variant" 
              size={20} 
              color={activeTab === 'inventory' ? '#007AFF' : '#666'} 
            />
            <Text 
              style={[
                styles.tabText, 
                activeTab === 'inventory' && styles.activeTabText
              ]}
            >
              Inventory
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sales' && styles.activeTab]}
            onPress={() => setActiveTab('sales')}
          >
            <MaterialCommunityIcons 
              name="cart" 
              size={20} 
              color={activeTab === 'sales' ? '#007AFF' : '#666'} 
            />
            <Text 
              style={[
                styles.tabText, 
                activeTab === 'sales' && styles.activeTabText
              ]}
            >
              Sales
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'salesmen' && styles.activeTab]}
            onPress={() => setActiveTab('salesmen')}
          >
            <MaterialCommunityIcons 
              name="account-group" 
              size={20} 
              color={activeTab === 'salesmen' ? '#007AFF' : '#666'} 
            />
            <Text 
              style={[
                styles.tabText, 
                activeTab === 'salesmen' && styles.activeTabText
              ]}
            >
              Salesmen
            </Text>
          </TouchableOpacity>
        </View>
        
        <VirtualizedList
          data={tabData}
          renderItem={renderTabItem}
          keyExtractor={item => item.id}
          getItemCount={getItemCount}
          getItem={getItem}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        />
        
        {/* Shop details modal */}
        <Modal
          visible={showDetailsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={closeDetailsModal}
        >
          <View style={styles.modalBackdrop}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={80} tint="dark" style={styles.blurView} />
            ) : (
              <View style={[styles.blurView, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
            )}
            
            <View style={styles.modalContentWrapper}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{shop.shopName}</Text>
                  <TouchableOpacity onPress={closeDetailsModal}>
                    <MaterialCommunityIcons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalBody}>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="store" size={22} color="#666" />
                    <Text style={styles.detailText}>Owner: {shop.ownerName}</Text>
                  </View>
                  
                  {shop.email && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="email" size={22} color="#666" />
                      <Text style={styles.detailText}>{shop.email}</Text>
                    </View>
                  )}
                  
                  {shop.gstinNumber && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="file-document" size={22} color="#666" />
                      <Text style={styles.detailText}>GSTIN: {shop.gstinNumber}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            
            {/* Close modal when clicking outside */}
            <TouchableOpacity 
              style={styles.modalBackdropTouchable} 
              activeOpacity={1}
              onPress={closeDetailsModal}
            />
          </View>
        </Modal>
      </SafeAreaView>
    </UserProfileProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  tabContentWrapper: {
    flex: 1,
  },
  infoButton: {
    padding: 8,  // Add padding to increase tap target
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  
  // Modal styles
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modalBackdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  modalContentWrapper: {
    width: '80%',
    maxWidth: 400,
    zIndex: 1,
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    paddingVertical: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
}); 