import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
export default function RootLayout() {
  const [checkingLogin, setCheckingLogin] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        if (isLoggedIn !== 'true') {
          router.replace('/(auth)/auth');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        router.replace('/(auth)/auth');
      } finally {
        setCheckingLogin(false);
      }
    };

    checkLogin();
  }, []);

  if (checkingLogin) return null; // You can show a loading screen here

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'index') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'explore') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'account') {
            iconName = focused ? 'person' : 'person-outline';
          }
          else if (route.name === 'exMap') {
            iconName = focused ? 'map' : 'map-outline';
          }
          else if (route.name === 'LeaderboardScreen') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="exMap" options={{ title: 'Map View' }} />
      <Tabs.Screen name="LeaderboardScreen" options={{ title: 'Board' }} />
      <Tabs.Screen name="account" options={{ title: 'account' }} />
    </Tabs>
  );
}

