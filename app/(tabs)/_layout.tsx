import React from 'react';
import { Tabs } from 'expo-router';
import { Entypo, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { TabBarProvider, useTabBarVisibility } from '../TabBarContext';

// --- WARNA (Anda bisa sesuaikan) ---
const ACTIVE_ICON_COLOR = '#FFFFFF';
const INACTIVE_ICON_COLOR = '#8E8E93';
const ACTIVE_PILL_BACKGROUND = '#5B21B6'; // Warna ungu yang lebih vibrant
const TAB_BAR_BACKGROUND = '#18181B'; // Warna background lebih gelap (modern)

const logoPath = require('../../assets/images/logo-app.png');

const CustomTabBarButton = (props) => {
  const { children, onPress, accessibilityState } = props;
  const isSelected = accessibilityState?.selected;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.tabButtonContainer}
    >
      <View style={[styles.iconContainer, isSelected && styles.activeIconContainer]}>
        {children}
      </View>
    </TouchableOpacity>
  );
};

function AppTabs() {
  const { isTabBarVisible } = useTabBarVisibility();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE_ICON_COLOR,
        tabBarInactiveTintColor: INACTIVE_ICON_COLOR,
        tabBarStyle: {
          display: isTabBarVisible ? 'flex' : 'none',
          backgroundColor: TAB_BAR_BACKGROUND,
          height: 65,
          position: 'absolute', // Membuatnya floating
          bottom: 15,
          left: 20,
          right: 20,
          borderRadius: 20, // Border radius untuk tab bar
          borderTopWidth: 0,
          elevation: 5, // Shadow untuk Android
          shadowColor: '#000', // Shadow untuk iOS
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        tabBarShowLabel: false,
        headerShown: true,
        headerTitleAlign: 'center',
        headerTitle: () => (
          <Image
            source={logoPath}
            style={{ width: 100, height: 50, resizeMode: 'contain' }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid-outline" size={26} color={color} />
          ),
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="bookmark"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="bookmark-outline" size={26} color={color} />
          ),
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="expimp"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="database-sync-outline" size={26} color={color} />
          ),
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="other-menu"
        options={{
          tabBarIcon: ({ color }) => (
            <Entypo name="text" size={26} color={color} />
          ),
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <TabBarProvider>
      <AppTabs />
    </TabBarProvider>
  );
}

const styles = StyleSheet.create({
  tabButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 45, // Lebar container ikon
    height: 45, // Tinggi container ikon
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10, // Setengah dari tinggi untuk membuat bentuk kapsul
    // Transisi untuk efek yang lebih halus (opsional)
    transition: 'background-color 0.3s ease',
  },
  activeIconContainer: {
    backgroundColor: ACTIVE_PILL_BACKGROUND, // Latar belakang hanya untuk ikon aktif
  },
});
