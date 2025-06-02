// filepath: e:\QLDA\FINAL\Github_QLDA_22NH12_G8_PDM\app\app\(tabs)\_layout.js
import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (    
  <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;          switch (route.name) {
            case 'Home/index':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Recognize/index':
              iconName = focused ? 'camera' : 'camera-outline';
              break;
            case 'Learn/index':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'Profile/index':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6c5ce7',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingVertical: 5,
          borderTopLeftRadius: 15,
          borderTopRightRadius: 15,
          backgroundColor: 'white',
          height: 60,
        },        tabBarLabel: ({ focused, color }) => {
          // Extract just the main tab name without "/index"
          const tabName = route.name.split('/')[0];
          return (
            <Text style={{ 
              color: focused ? '#6c5ce7' : 'gray',
              fontSize: 12,
              marginBottom: 3
            }}>
              {tabName}
            </Text>
          );
        },
      })}
    >      
    <Tabs.Screen
        name="Home/index"
        options={{
          title: 'Home',
          headerTitle: 'Home',
          headerShown: false,
        }}
      />      
      <Tabs.Screen
        name="Recognize/index"
        options={{
          title: 'Recognize',
          headerTitle: 'Recognize',
          headerShown: false,
        }}
      />      
      <Tabs.Screen
        name="Learn/index"
        options={{
          title: 'Learn',
          headerTitle: 'Learn',
          headerShown: false,
        }}
      />      
      <Tabs.Screen
        name="Profile/index"
        options={{
          title: 'Profile',
          headerTitle: 'Profile',
          headerShown: false,
        }}
      />
    </Tabs>
  );
}