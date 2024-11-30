import { Tabs } from 'expo-router';
import React from 'react';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useCustomColorScheme } from '@/hooks/useColorScheme';


export default function TabLayout() {
  const colorScheme = useCustomColorScheme();

  return (
    <Tabs
       screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint, // Corrigido para usar `colorScheme`
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calculo"
        options={{
          title: 'Cálculo',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'calculator' : 'calculator-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="impressora"
        options={{
          title: 'Impressora',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'print' : 'print-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="estoque"
        options={{
          title: 'Estoque',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'cube' : 'cube-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
