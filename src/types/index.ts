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

// 习惯打卡记录
export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  count: number;
  note?: string;
  isMakeup: boolean;
  createdAt: string;
}

// 习惯频率类型
export type HabitFrequencyType = 'daily' | 'weekly' | 'monthly' | 'custom';

// 习惯目标类型
export type HabitTargetType = 'streak' | 'count' | 'none';

// 习惯类型
export interface Habit {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  category: string;
  tags: string[];
  frequency: {
    type: HabitFrequencyType;
    days?: number[]; // 每周的哪几天 [1,3,5] 表示周一三五
    interval?: number; // 每隔几天
  };
  target: {
    type: HabitTargetType;
    value?: number;
    deadline?: string;
  };
  reminders: {
    time: string;
    enabled: boolean;
  }[];
  createdAt: string;
  archived: boolean;
  paused: boolean;
  order: number;
}

// 习惯统计数据
export interface HabitStats {
  habitId: string;
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  weeklyStats: number[];
  monthlyStats: number[];
}

// 日记类型
export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  mood?: 'sunny' | 'cloudy' | 'rainy' | 'storm' | 'moon' | 'star';
  tags?: string[];
  images?: string[];
  weather?: {
    type: string;
    temp: number;
    description: string;
  };
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  wordCount: number;
  createdAt: string;
  updatedAt?: string;
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

// 活动类型
export interface Activity {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
}

// 时间记录类型
export interface TimeEntry {
  id: string;
  activityId: string;
  activityName: string;
  activityIcon: string;
  activityColor: string;
  startTime: string;
  endTime: string;
  duration: number;
  date: string;
  linkedTodos?: string[];
  linkedHabits?: string[];
}

// 时间追踪关联配置
export interface TimeLinks {
  todoActivities: Record<string, string>;
  habitActivities: Record<string, string>;
}

// 日志分类（如：观影记录、阅读记录、运动记录）
export interface LifeLogCategory {
  id: string;
  name: string;           // 分类名称，如"观影记录"
  description?: string;   // 描述
  color: string;          // 主题色
  icon: string;           // 图标
  fields: LogField[];     // 该分类的字段定义
  createdAt: string;
  updatedAt: string;
}

// 日志字段定义
export interface LogField {
  id: string;
  name: string;           // 字段名称，如"电影名称"
  type: 'text' | 'number' | 'rating' | 'date' | 'select' | 'multiline' | 'tags';
  required: boolean;      // 是否必填
  options?: string[];     // 选择类型的选项
  placeholder?: string;   // 占位提示
}

// 日志条目（属于某个分类的具体记录）
export interface LifeLogEntry {
  id: string;
  categoryId: string;     // 所属分类ID
  title: string;          // 标题
  data: Record<string, any>; // 根据分类字段填写的数据
  tags: string[];
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

// 导航类型
export type RootTabParamList = {
  Todo: undefined;
  Habit: undefined;
  Diary: undefined;
  Inventory: undefined;
  Time: undefined;
  Log: undefined;
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
