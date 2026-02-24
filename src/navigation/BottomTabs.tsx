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
import LogNavigator from './LogNavigator';

const Tab = createBottomTabNavigator<RootTabParamList>();

// 图标组件 - 使用简单的几何形状代替特殊 Unicode 字符
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const renderIcon = () => {
    switch (name) {
      case 'Todo':
        return (
          <View style={[styles.iconShape, styles.squareShape, focused && styles.iconShapeActive]}>
            <View style={[styles.innerSquare, focused && styles.innerSquareActive]} />
          </View>
        );
      case 'Habit':
        return (
          <View style={[styles.iconShape, styles.circleShape, focused && styles.iconShapeActive]}>
            <View style={[styles.innerCircle, focused && styles.innerCircleActive]} />
          </View>
        );
      case 'Diary':
        return (
          <View style={[styles.iconShape, styles.penShape, focused && styles.iconShapeActive]}>
            <View style={[styles.penLine, focused && styles.penLineActive]} />
          </View>
        );
      case 'Inventory':
        return (
          <View style={[styles.iconShape, styles.gridShape, focused && styles.iconShapeActive]}>
            <View style={styles.gridRow}>
              <View style={[styles.gridCell, focused && styles.gridCellActive]} />
              <View style={[styles.gridCell, focused && styles.gridCellActive]} />
            </View>
            <View style={styles.gridRow}>
              <View style={[styles.gridCell, focused && styles.gridCellActive]} />
              <View style={[styles.gridCell, focused && styles.gridCellActive]} />
            </View>
          </View>
        );
      case 'Time':
        return (
          <View style={[styles.iconShape, styles.clockShape, focused && styles.iconShapeActive]}>
            <View style={[styles.clockHand, styles.clockHandHour, focused && styles.clockHandActive]} />
            <View style={[styles.clockHand, styles.clockHandMinute, focused && styles.clockHandActive]} />
          </View>
        );
      case 'Log':
        return (
          <View style={[styles.iconShape, styles.logShape, focused && styles.iconShapeActive]}>
            <View style={[styles.logLine, focused && styles.logLineActive]} />
            <View style={[styles.logLine, styles.logLineShort, focused && styles.logLineActive]} />
            <View style={[styles.logLine, styles.logLineShorter, focused && styles.logLineActive]} />
          </View>
        );
      default:
        return <View style={styles.iconShape} />;
    }
  };

  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      {renderIcon()}
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
      <Tab.Screen 
        name="Log" 
        component={LogNavigator}
        options={{ tabBarLabel: '日志' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    height: 90,
    paddingBottom: 24,
    paddingTop: 10,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 16,
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
  // 图标形状样式
  iconShape: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconShapeActive: {
    // 激活状态的通用样式
  },
  // Todo - 方形图标
  squareShape: {
    borderWidth: 2,
    borderColor: Colors.gray[400],
    borderRadius: 4,
  },
  innerSquare: {
    width: 10,
    height: 10,
    backgroundColor: 'transparent',
  },
  innerSquareActive: {
    backgroundColor: Colors.background,
  },
  // Habit - 圆形图标
  circleShape: {
    borderWidth: 2,
    borderColor: Colors.gray[400],
    borderRadius: 10,
  },
  innerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  innerCircleActive: {
    backgroundColor: Colors.background,
  },
  // Diary - 笔形图标
  penShape: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  penLine: {
    width: 16,
    height: 3,
    backgroundColor: Colors.gray[400],
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }],
  },
  penLineActive: {
    backgroundColor: Colors.background,
  },
  // Inventory - 网格图标
  gridShape: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 16,
  },
  gridCell: {
    width: 6,
    height: 6,
    backgroundColor: Colors.gray[400],
    borderRadius: 1,
  },
  gridCellActive: {
    backgroundColor: Colors.background,
  },
  // Time - 时钟图标
  clockShape: {
    borderWidth: 2,
    borderColor: Colors.gray[400],
    borderRadius: 10,
  },
  clockHand: {
    position: 'absolute',
    backgroundColor: Colors.gray[400],
    borderRadius: 1,
  },
  clockHandHour: {
    width: 2,
    height: 6,
    top: 4,
    left: '50%',
    marginLeft: -1,
  },
  clockHandMinute: {
    width: 2,
    height: 8,
    top: 4,
    left: '50%',
    marginLeft: -1,
    transform: [{ rotate: '90deg' }],
    transformOrigin: 'bottom',
  },
  clockHandActive: {
    backgroundColor: Colors.background,
  },
  // Log - 日志图标（三条横线）
  logShape: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  logLine: {
    width: 16,
    height: 2,
    backgroundColor: Colors.gray[400],
    borderRadius: 1,
  },
  logLineShort: {
    width: 12,
  },
  logLineShorter: {
    width: 8,
  },
  logLineActive: {
    backgroundColor: Colors.background,
  },
});
