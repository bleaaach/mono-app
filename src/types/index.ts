/*
 * @Author: Bleaach008
 * @Date: 2026-02-23 08:46:30
 * @LastEditTime: 2026-02-23 08:46:40
 * @FilePath: \Desktop\mono-app\src\types\index.ts
 * @Description: 
 * 
 * Copyright (c) 2026 by 008, All Rights Reserved. 
 */
// 待办事项类型
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  category: 'today' | 'upcoming' | 'anytime' | 'someday';
  dueDate?: string;
  createdAt: string;
  notes?: string;
  tags?: string[];
}

// 习惯类型
export interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  frequency: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  completedDates: string[];
  createdAt: string;
  reminder?: string;
}

// 日记类型
export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  mood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'tired';
  tags?: string[];
}

// 收纳物品类型
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  location: string;
  quantity: number;
  image?: string;
  notes?: string;
  createdAt: string;
}

// 时间记录类型
export interface TimeEntry {
  id: string;
  activity: string;
  category: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  date: string;
}

// 导航类型
export type RootTabParamList = {
  Todo: undefined;
  Habit: undefined;
  Diary: undefined;
  Inventory: undefined;
  Time: undefined;
};

export type TodoTabParamList = {
  Today: undefined;
  Upcoming: undefined;
  Anytime: undefined;
  Someday: undefined;
};

export type HabitTabParamList = {
  Overview: undefined;
  Habits: undefined;
  Insights: undefined;
};
