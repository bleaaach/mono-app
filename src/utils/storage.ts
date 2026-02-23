import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo, Habit, DiaryEntry, InventoryItem, TimeEntry } from '../types';

// 存储键名
const KEYS = {
  TODOS: '@mono:todos',
  HABITS: '@mono:habits',
  DIARIES: '@mono:diaries',
  INVENTORY: '@mono:inventory',
  TIME_ENTRIES: '@mono:time_entries',
};

// 通用存储方法
export const storage = {
  // 保存数据
  async set<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  // 获取数据
  async get<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  // 删除数据
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },

  // 清空所有数据
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  },
};

// 待办存储
export const todoStorage = {
  get: (): Promise<Todo[] | null> => storage.get<Todo[]>(KEYS.TODOS),
  set: (value: Todo[]) => storage.set(KEYS.TODOS, value),
};

// 习惯存储
export const habitStorage = {
  get: (): Promise<Habit[] | null> => storage.get<Habit[]>(KEYS.HABITS),
  set: (value: Habit[]) => storage.set(KEYS.HABITS, value),
};

// 日记存储
export const diaryStorage = {
  get: (): Promise<DiaryEntry[] | null> => storage.get<DiaryEntry[]>(KEYS.DIARIES),
  set: (value: DiaryEntry[]) => storage.set(KEYS.DIARIES, value),
};

// 收纳存储
export const inventoryStorage = {
  get: (): Promise<InventoryItem[] | null> => storage.get<InventoryItem[]>(KEYS.INVENTORY),
  set: (value: InventoryItem[]) => storage.set(KEYS.INVENTORY, value),
};

// 时间记录存储
export const timeStorage = {
  get: (): Promise<TimeEntry[] | null> => storage.get<TimeEntry[]>(KEYS.TIME_ENTRIES),
  set: (value: TimeEntry[]) => storage.set(KEYS.TIME_ENTRIES, value),
};
