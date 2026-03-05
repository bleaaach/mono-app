import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS,
} from 'react-native-reanimated';
import { RootTabParamList } from '../types';
import { Colors } from '../constants/colors';

// Screens
import TodoScreen from '../screens/TodoScreen';
import HabitScreen from '../screens/HabitScreen';
import DiaryScreen from '../screens/DiaryScreen';
import InventoryScreen from '../screens/InventoryScreen';
import TimeScreen from '../screens/TimeScreen';
import LogNavigator from './LogNavigator';
import SettingsScreen from '../screens/SettingsScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_SCREENS = ['Todo', 'Habit', 'Diary', 'Inventory', 'Time', 'Log', 'Settings'] as const;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;

const Tab = createBottomTabNavigator<RootTabParamList>();

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
      case 'Settings':
        return (
          <View style={[styles.iconShape, styles.settingsShape, focused && styles.iconShapeActive]}>
            <View style={[styles.settingsDot, styles.settingsDotTop, focused && styles.settingsDotActive]} />
            <View style={[styles.settingsDot, styles.settingsDotLeft, focused && styles.settingsDotActive]} />
            <View style={[styles.settingsDot, styles.settingsDotRight, focused && styles.settingsDotActive]} />
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

interface SwipeGestureWrapperProps {
  children: React.ReactNode;
}

function SwipeGestureWrapper({ children }: SwipeGestureWrapperProps) {
  const navigation = useNavigation();
  const route = useRoute();
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const currentTabIndex = useRef(0);

  useEffect(() => {
    currentTabIndex.current = TAB_SCREENS.indexOf(route.name as any);
  }, [route.name]);

  const navigateToTab = useCallback((index: number) => {
    if (index >= 0 && index < TAB_SCREENS.length) {
      navigation.dispatch(
        CommonActions.navigate({
          name: TAB_SCREENS[index],
        })
      );
    }
  }, [navigation]);

  const onGestureEvent = useCallback((event: PanGestureHandlerGestureEvent) => {
    'worklet';
    translateX.value = startX.value + event.nativeEvent.translationX;
  }, []);

  const onHandlerStateChange = useCallback((event: PanGestureHandlerGestureEvent) => {
    'worklet';
    if (event.nativeEvent.state === 5) { // END state
      const velocity = event.nativeEvent.velocityX;
      const translation = event.nativeEvent.translationX;
      const currentIdx = currentTabIndex.current;
      
      let newPage = currentIdx;
      
      if (Math.abs(velocity) > 500) {
        if (velocity > 0 && currentIdx > 0) {
          newPage = currentIdx - 1;
        } else if (velocity < 0 && currentIdx < TAB_SCREENS.length - 1) {
          newPage = currentIdx + 1;
        }
      } else if (translation < -SWIPE_THRESHOLD && currentIdx < TAB_SCREENS.length - 1) {
        newPage = currentIdx + 1;
      } else if (translation > SWIPE_THRESHOLD && currentIdx > 0) {
        newPage = currentIdx - 1;
      }
      
      translateX.value = withSpring(0, { damping: 20, stiffness: 100 });
      
      if (newPage !== currentIdx) {
        runOnJS(navigateToTab)(newPage);
      }
    } else if (event.nativeEvent.state === 2) { // BEGAN state
      startX.value = translateX.value;
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <PanGestureHandler 
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      activeOffsetX={[-50, 50]}
      failOffsetY={[-30, 30]}
    >
      <Animated.View style={[styles.gestureWrapper, animatedStyle]}>
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
}

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
        animation: 'shift',
      })}
    >
      <Tab.Screen 
        name="Todo" 
        options={{ tabBarLabel: '待办' }}
      >
        {() => (
          <SwipeGestureWrapper>
            <TodoScreen />
          </SwipeGestureWrapper>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Habit" 
        options={{ tabBarLabel: '习惯' }}
      >
        {() => (
          <SwipeGestureWrapper>
            <HabitScreen />
          </SwipeGestureWrapper>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Diary" 
        options={{ tabBarLabel: '日记' }}
      >
        {() => (
          <SwipeGestureWrapper>
            <DiaryScreen />
          </SwipeGestureWrapper>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Inventory" 
        options={{ tabBarLabel: '收纳' }}
      >
        {() => (
          <SwipeGestureWrapper>
            <InventoryScreen />
          </SwipeGestureWrapper>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Time" 
        options={{ tabBarLabel: '时间' }}
      >
        {() => (
          <SwipeGestureWrapper>
            <TimeScreen />
          </SwipeGestureWrapper>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Log" 
        options={{ tabBarLabel: '日志' }}
      >
        {() => (
          <SwipeGestureWrapper>
            <LogNavigator />
          </SwipeGestureWrapper>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Settings" 
        options={{ tabBarLabel: '设置' }}
      >
        {() => (
          <SwipeGestureWrapper>
            <SettingsScreen />
          </SwipeGestureWrapper>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  gestureWrapper: {
    flex: 1,
  },
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
  iconShape: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconShapeActive: {},
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
  },
  clockHandActive: {
    backgroundColor: Colors.background,
  },
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
  settingsShape: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[400],
    position: 'absolute',
  },
  settingsDotTop: {
    top: 2,
  },
  settingsDotLeft: {
    bottom: 2,
    left: 2,
  },
  settingsDotRight: {
    bottom: 2,
    right: 2,
  },
  settingsDotActive: {
    backgroundColor: Colors.background,
  },
});
