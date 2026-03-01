/*
 * @Author: Bleaach008
 * @Date: 2026-02-23 08:47:59
 * @LastEditTime: 2026-03-01 22:06:32
 * @FilePath: \mono-app\src\navigation\AppNavigator.tsx
 * @Description: 
 * 
 * Copyright (c) 2026 by 008, All Rights Reserved. 
 */
import React, { useRef, useEffect } from 'react';
import { NavigationContainer, NavigationContainerRef, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';

// 日记功能页面
import ShareScreen from '../screens/diary/ShareScreen';
import RandomWalkScreen from '../screens/diary/RandomWalkScreen';
import BookViewScreen from '../screens/diary/BookViewScreen';
import { getTargetTab } from '../utils/events';

// 定义导航参数类型
export type RootStackParamList = {
  Main: { screen?: string } | undefined;
  Share: { entryId: string };
  RandomWalk: undefined;
  BookView: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const targetTab = getTargetTab();
      if (targetTab && navigationRef.current) {
        // 使用 CommonActions 进行嵌套导航
        navigationRef.current.dispatch(
          CommonActions.navigate({
            name: 'Main',
            params: {
              screen: targetTab,
            },
          })
        );
      }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 250,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen name="Main" component={BottomTabs} />
        <Stack.Screen 
          name="Share" 
          component={ShareScreen} 
          options={{
            animation: 'slide_from_bottom',
            gestureEnabled: true,
            gestureDirection: 'vertical',
          }}
        />
        <Stack.Screen name="RandomWalk" component={RandomWalkScreen} />
        <Stack.Screen name="BookView" component={BookViewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
