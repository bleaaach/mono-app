import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo, Habit, HabitLog, DiaryEntry, InventoryItem, TimeEntry, LifeLogCategory, LifeLogEntry, Activity, TimeLinks } from '../types';

// 存储键名
const KEYS = {
  TODOS: '@mono:todos',
  HABITS: '@mono:habits',
  HABIT_LOGS: '@mono:habit_logs',
  DIARIES: '@mono:diaries',
  INVENTORY: '@mono:inventory',
  TIME_ENTRIES: '@mono:time_entries',
  ACTIVITIES: '@mono:activities',
  TIME_LINKS: '@mono:time_links',
  CUSTOM_CATEGORIES: '@mono:custom_categories',
  LIFE_LOG_CATEGORIES: '@mono:life_log_categories',
  LIFE_LOG_ENTRIES: '@mono:life_log_entries',
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

// 习惯打卡记录存储
export const habitLogStorage = {
  get: (): Promise<HabitLog[] | null> => storage.get<HabitLog[]>(KEYS.HABIT_LOGS),
  set: (value: HabitLog[]) => storage.set(KEYS.HABIT_LOGS, value),
  // 获取指定习惯的打卡记录
  getByHabitId: async (habitId: string): Promise<HabitLog[]> => {
    const logs = await storage.get<HabitLog[]>(KEYS.HABIT_LOGS);
    return logs?.filter(log => log.habitId === habitId) || [];
  },
  // 获取指定日期的打卡记录
  getByDate: async (date: string): Promise<HabitLog[]> => {
    const logs = await storage.get<HabitLog[]>(KEYS.HABIT_LOGS);
    return logs?.filter(log => log.date === date) || [];
  },
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

// 活动存储
export const activityStorage = {
  get: (): Promise<Activity[] | null> => storage.get<Activity[]>(KEYS.ACTIVITIES),
  set: (value: Activity[]) => storage.set(KEYS.ACTIVITIES, value),
};

// 时间追踪关联配置存储
export const timeLinksStorage = {
  get: (): Promise<TimeLinks | null> => storage.get<TimeLinks>(KEYS.TIME_LINKS),
  set: (value: TimeLinks) => storage.set(KEYS.TIME_LINKS, value),
  // 获取默认配置
  getDefault: (): TimeLinks => ({
    todoActivities: {},
    habitActivities: {},
  }),
};

// 自定义分类存储
export interface CustomCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export const customCategoryStorage = {
  get: (): Promise<CustomCategory[] | null> => storage.get<CustomCategory[]>(KEYS.CUSTOM_CATEGORIES),
  set: (value: CustomCategory[]) => storage.set(KEYS.CUSTOM_CATEGORIES, value),
};

// 生活日志分类存储
export const lifeLogCategoryStorage = {
  get: (): Promise<LifeLogCategory[] | null> => storage.get<LifeLogCategory[]>(KEYS.LIFE_LOG_CATEGORIES),
  set: (value: LifeLogCategory[]) => storage.set(KEYS.LIFE_LOG_CATEGORIES, value),
};

// 生活日志条目存储
export const lifeLogEntryStorage = {
  get: (): Promise<LifeLogEntry[] | null> => storage.get<LifeLogEntry[]>(KEYS.LIFE_LOG_ENTRIES),
  set: (value: LifeLogEntry[]) => storage.set(KEYS.LIFE_LOG_ENTRIES, value),
  // 获取指定分类的条目
  getByCategory: async (categoryId: string): Promise<LifeLogEntry[]> => {
    const entries = await storage.get<LifeLogEntry[]>(KEYS.LIFE_LOG_ENTRIES);
    return entries?.filter(entry => entry.categoryId === categoryId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
  },
  // 搜索条目
  search: async (keyword: string): Promise<LifeLogEntry[]> => {
    const entries = await storage.get<LifeLogEntry[]>(KEYS.LIFE_LOG_ENTRIES);
    if (!entries) return [];
    const lowerKeyword = keyword.toLowerCase();
    return entries.filter(entry => 
      entry.title.toLowerCase().includes(lowerKeyword) ||
      entry.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)) ||
      Object.values(entry.data).some(val => 
        String(val).toLowerCase().includes(lowerKeyword)
      )
    );
  },
};
