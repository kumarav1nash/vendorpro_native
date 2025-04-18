import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  name?: string;
  mobile: string;
};

type KPICard = {
  title: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
};

export default function DashboardScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [shopName, setShopName] = useState('My Shop'); // TODO: Get from actual shop data

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Implement refresh logic here
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const kpiData: KPICard[] = [
    {
      title: 'Today\'s Sales',
      value: '₹12,500',
      icon: 'currency-inr',
      color: '#4CAF50',
    },
    {
      title: 'Weekly Sales',
      value: '₹85,000',
      icon: 'chart-line',
      color: '#2196F3',
    },
    {
      title: 'Active Salesmen',
      value: '5',
      icon: 'account-group',
      color: '#9C27B0',
    },
    {
      title: 'Low Stock Items',
      value: '3',
      icon: 'alert-circle',
      color: '#F44336',
    },
  ];

  const quickActions = [
    {
      title: 'Add Product',
      icon: 'package-variant-plus',
      color: '#4CAF50',
      onPress: () => {/* TODO: Implement navigation */},
    },
    {
      title: 'Add Salesman',
      icon: 'account-plus',
      color: '#2196F3',
      onPress: () => {/* TODO: Implement navigation */},
    },
    {
      title: 'Approve Sales',
      icon: 'check-circle',
      color: '#FF9800',
      onPress: () => {/* TODO: Implement navigation */},
    },
    {
      title: 'View Reports',
      icon: 'chart-box',
      color: '#9C27B0',
      onPress: () => {/* TODO: Implement navigation */},
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.shopName}>{shopName}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <MaterialCommunityIcons name="bell" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.kpiContainer}>
        {kpiData.map((kpi, index) => (
          <View key={index} style={styles.kpiCard}>
            <MaterialCommunityIcons name={kpi.icon} size={24} color={kpi.color} />
            <Text style={styles.kpiValue}>{kpi.value}</Text>
            <Text style={styles.kpiTitle}>{kpi.title}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionButton}
              onPress={action.onPress}
            >
              <MaterialCommunityIcons
                name={action.icon}
                size={24}
                color={action.color}
              />
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        <View style={styles.activityCard}>
          <Text style={styles.activityText}>No recent activities</Text>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  shopName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  notificationButton: {
    padding: 8,
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 15,
    margin: '1%',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#000',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#000',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 15,
    margin: '1%',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityText: {
    color: '#666',
    textAlign: 'center',
  },
}); 