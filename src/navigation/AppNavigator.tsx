import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';

// 日记功能页面
import ShareScreen from '../screens/diary/ShareScreen';
import RandomWalkScreen from '../screens/diary/RandomWalkScreen';
import BookViewScreen from '../screens/diary/BookViewScreen';

// 定义导航参数类型
export type RootStackParamList = {
  Main: undefined;
  Share: { entryId: string };
  RandomWalk: undefined;
  BookView: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={BottomTabs} />
        <Stack.Screen name="Share" component={ShareScreen} />
        <Stack.Screen name="RandomWalk" component={RandomWalkScreen} />
        <Stack.Screen name="BookView" component={BookViewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
