import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LogTemplateHomeScreen from '../screens/LogTemplateHomeScreen';
import LogTemplateDesignerScreen from '../screens/LogTemplateDesignerScreen';
import LogEntryListScreen from '../screens/LogEntryListScreen';
import LogEntryFormScreen from '../screens/LogEntryFormScreen';
import LogStatsScreen from '../screens/LogStatsScreen';
import LogCalendarScreen from '../screens/LogCalendarScreen';
import LogTagsScreen from '../screens/LogTagsScreen';

export type LogStackParamList = {
  LogTemplateHome: undefined;
  LogTemplateDesigner: { categoryId?: string };
  LogEntryList: { categoryId: string };
  LogEntryForm: { categoryId: string; entryId?: string };
  LogStats: undefined;
  LogCalendar: undefined;
  LogTags: undefined;
};

const Stack = createNativeStackNavigator<LogStackParamList>();

export default function LogNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LogTemplateHome" component={LogTemplateHomeScreen} />
      <Stack.Screen name="LogTemplateDesigner" component={LogTemplateDesignerScreen} />
      <Stack.Screen name="LogEntryList" component={LogEntryListScreen} />
      <Stack.Screen name="LogEntryForm" component={LogEntryFormScreen} />
      <Stack.Screen name="LogStats" component={LogStatsScreen} />
      <Stack.Screen name="LogCalendar" component={LogCalendarScreen} />
      <Stack.Screen name="LogTags" component={LogTagsScreen} />
    </Stack.Navigator>
  );
}
