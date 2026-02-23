import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../types';
import { Colors } from '../constants/colors';

// Screens
import TodoScreen from '../screens/TodoScreen';
import HabitScreen from '../screens/HabitScreen';
import DiaryScreen from '../screens/DiaryScreen';
import InventoryScreen from '../screens/InventoryScreen';
import TimeScreen from '../screens/TimeScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();

// 图标组件
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const icons: Record<string, string> = {
    Todo: '☐',
    Habit: '◷',
    Diary: '✎',
    Inventory: '▦',
    Time: '◴',
  };

  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Text style={[styles.icon, focused && styles.iconActive]}>
        {icons[name] || '•'}
      </Text>
    </View>
  );
};

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen 
        name="Todo" 
        component={TodoScreen}
        options={{ tabBarLabel: '待办' }}
      />
      <Tab.Screen 
        name="Habit" 
        component={HabitScreen}
        options={{ tabBarLabel: '习惯' }}
      />
      <Tab.Screen 
        name="Diary" 
        component={DiaryScreen}
        options={{ tabBarLabel: '日记' }}
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen}
        options={{ tabBarLabel: '收纳' }}
      />
      <Tab.Screen 
        name="Time" 
        component={TimeScreen}
        options={{ tabBarLabel: '时间' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  iconContainerActive: {
    backgroundColor: Colors.primary,
  },
  icon: {
    fontSize: 18,
    color: Colors.gray[400],
  },
  iconActive: {
    color: Colors.background,
  },
});
