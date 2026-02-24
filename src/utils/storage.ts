import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo, Habit, HabitLog, DiaryEntry, InventoryItem, TimeEntry, LifeLogCategory, LifeLogEntry, Activity, ActivityGroup, TimeGoal, TimeLinks, StorageSpace, StorageItem, StorageCategory, StorageTag, ItemFilters, StorageStatistics } from '../types';

// 存储键名
export const KEYS = {
  TODOS: '@mono:todos',
  HABITS: '@mono:habits',
  HABIT_LOGS: '@mono:habit_logs',
  DIARIES: '@mono:diaries',
  DIARY_BOOKMARKS: '@mono:diary_bookmarks',
  INVENTORY: '@mono:inventory',
  TIME_ENTRIES: '@mono:time_entries',
  ACTIVITIES: '@mono:activities',
  ACTIVITY_GROUPS: '@mono:activity_groups',
  TIME_GOALS: '@mono:time_goals',
  TIME_LINKS: '@mono:time_links',
  CUSTOM_CATEGORIES: '@mono:custom_categories',
  LIFE_LOG_CATEGORIES: '@mono:life_log_categories',
  LIFE_LOG_ENTRIES: '@mono:life_log_entries',
  // 收纳模块
  STORAGE_SPACES: '@mono:storage_spaces',
  STORAGE_ITEMS: '@mono:storage_items',
  STORAGE_CATEGORIES: '@mono:storage_categories',
  STORAGE_TAGS: '@mono:storage_tags',
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
      // 逐个删除所有已知键，确保数据被完全清空
      const allKeys = [
        KEYS.TODOS,
        KEYS.HABITS,
        KEYS.HABIT_LOGS,
        KEYS.DIARIES,
        KEYS.DIARY_BOOKMARKS,
        KEYS.INVENTORY,
        KEYS.TIME_ENTRIES,
        KEYS.ACTIVITIES,
        KEYS.ACTIVITY_GROUPS,
        KEYS.TIME_GOALS,
        KEYS.TIME_LINKS,
        KEYS.CUSTOM_CATEGORIES,
        KEYS.LIFE_LOG_CATEGORIES,
        KEYS.LIFE_LOG_ENTRIES,
        KEYS.STORAGE_SPACES,
        KEYS.STORAGE_ITEMS,
        KEYS.STORAGE_CATEGORIES,
        KEYS.STORAGE_TAGS,
      ];
      await AsyncStorage.multiRemove(allKeys);
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
  // 书签功能
  getBookmarks: (): Promise<Array<{ entryId: string; pageNumber: number; note?: string }> | null> => 
    storage.get<Array<{ entryId: string; pageNumber: number; note?: string }>>(KEYS.DIARY_BOOKMARKS),
  setBookmarks: (value: Array<{ entryId: string; pageNumber: number; note?: string }>) => 
    storage.set(KEYS.DIARY_BOOKMARKS, value),
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

// 活动分组存储
export const activityGroupStorage = {
  get: (): Promise<ActivityGroup[] | null> => storage.get<ActivityGroup[]>(KEYS.ACTIVITY_GROUPS),
  set: (value: ActivityGroup[]) => storage.set(KEYS.ACTIVITY_GROUPS, value),
};

// 时间目标存储
export const timeGoalStorage = {
  get: (): Promise<TimeGoal[] | null> => storage.get<TimeGoal[]>(KEYS.TIME_GOALS),
  set: (value: TimeGoal[]) => storage.set(KEYS.TIME_GOALS, value),
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

// ==================== 收纳模块存储 ====================

// 默认分类
export const DEFAULT_CATEGORIES: StorageCategory[] = [
  { id: 'clothing', name: '衣物', icon: 'clothing', color: '#FF6B6B', sortOrder: 0 },
  { id: 'food', name: '食品', icon: 'food', color: '#F38181', sortOrder: 1 },
  { id: 'beauty', name: '美妆', icon: 'beauty', color: '#FCBAD3', sortOrder: 2 },
  { id: 'medicine', name: '药品', icon: 'medicine', color: '#AA96DA', sortOrder: 3 },
  { id: 'electronics', name: '电子数码', icon: 'electronics', color: '#4ECDC4', sortOrder: 4 },
  { id: 'books', name: '书籍', icon: 'books', color: '#95E1D3', sortOrder: 5 },
  { id: 'home', name: '家居', icon: 'homeGoods', color: '#FFE66D', sortOrder: 6 },
  { id: 'sports', name: '运动', icon: 'sports', color: '#FF8B94', sortOrder: 7 },
  { id: 'toys', name: '玩具', icon: 'toys', color: '#C7CEEA', sortOrder: 8 },
  { id: 'collections', name: '收藏', icon: 'collections', color: '#B4A7D6', sortOrder: 9 },
  { id: 'tools', name: '工具', icon: 'tools', color: '#A8D8EA', sortOrder: 10 },
  { id: 'others', name: '其他', icon: 'package', color: '#CCCCCC', sortOrder: 11 },
];

// 默认标签
export const DEFAULT_TAGS: StorageTag[] = [
  { id: 'important', name: '重要', color: '#DC2626', usageCount: 0 },
  { id: 'common', name: '常用', color: '#2563EB', usageCount: 0 },
  { id: 'spare', name: '备用', color: '#059669', usageCount: 0 },
  { id: 'unused', name: '闲置', color: '#737373', usageCount: 0 },
  { id: 'new', name: '全新', color: '#000000', usageCount: 0 },
  { id: 'secondhand', name: '二手', color: '#D97706', usageCount: 0 },
];

// 空间存储
export const storageSpaceStorage = {
  get: async (): Promise<StorageSpace[]> => {
    const spaces = await storage.get<StorageSpace[]>(KEYS.STORAGE_SPACES);
    if (!spaces || spaces.length === 0) {
      // 初始化默认空间
      const defaultSpace: StorageSpace = {
        id: 'root',
        name: '家',
        parentId: null,
        level: 0,
        path: '家',
        icon: 'homeSpace',
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await storage.set(KEYS.STORAGE_SPACES, [defaultSpace]);
      return [defaultSpace];
    }
    return spaces;
  },
  set: (value: StorageSpace[]) => storage.set(KEYS.STORAGE_SPACES, value),
  
  // 创建空间
  create: async (space: Omit<StorageSpace, 'id' | 'createdAt' | 'updatedAt'>): Promise<StorageSpace> => {
    const spaces = await storageSpaceStorage.get();
    const newSpace: StorageSpace = {
      ...space,
      id: `space_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    spaces.push(newSpace);
    await storageSpaceStorage.set(spaces);
    return newSpace;
  },
  
  // 更新空间
  update: async (id: string, data: Partial<StorageSpace>): Promise<void> => {
    const spaces = await storageSpaceStorage.get();
    const index = spaces.findIndex(s => s.id === id);
    if (index !== -1) {
      spaces[index] = { ...spaces[index], ...data, updatedAt: new Date().toISOString() };
      await storageSpaceStorage.set(spaces);
    }
  },
  
  // 删除空间
  delete: async (id: string, migrateToId?: string): Promise<void> => {
    const spaces = await storageSpaceStorage.get();
    const items = await storageItemStorage.get();
    
    // 如果有迁移目标，将物品迁移
    if (migrateToId) {
      const updatedItems = items.map(item => 
        item.spaceId === id ? { ...item, spaceId: migrateToId } : item
      );
      await storageItemStorage.set(updatedItems);
    } else {
      // 删除该空间下的所有物品
      const updatedItems = items.filter(item => item.spaceId !== id);
      await storageItemStorage.set(updatedItems);
    }
    
    // 删除空间及其子空间
    const deleteSpaceAndChildren = (spaceId: string) => {
      const children = spaces.filter(s => s.parentId === spaceId);
      children.forEach(child => deleteSpaceAndChildren(child.id));
      const index = spaces.findIndex(s => s.id === spaceId);
      if (index !== -1) spaces.splice(index, 1);
    };
    deleteSpaceAndChildren(id);
    
    await storageSpaceStorage.set(spaces);
  },
  
  // 获取空间路径
  getPath: async (spaceId: string): Promise<string> => {
    const spaces = await storageSpaceStorage.get();
    const space = spaces.find(s => s.id === spaceId);
    return space?.path || '';
  },
  
  // 获取子空间
  getChildren: async (parentId: string | null): Promise<StorageSpace[]> => {
    const spaces = await storageSpaceStorage.get();
    return spaces
      .filter(s => s.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
};

// 物品存储
export const storageItemStorage = {
  get: async (): Promise<StorageItem[]> => {
    const items = await storage.get<StorageItem[]>(KEYS.STORAGE_ITEMS);
    return items || [];
  },
  set: (value: StorageItem[]) => storage.set(KEYS.STORAGE_ITEMS, value),
  
  // 创建物品
  create: async (item: Omit<StorageItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<StorageItem> => {
    const items = await storageItemStorage.get();
    const newItem: StorageItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.push(newItem);
    await storageItemStorage.set(items);
    return newItem;
  },
  
  // 更新物品
  update: async (id: string, data: Partial<StorageItem>): Promise<void> => {
    const items = await storageItemStorage.get();
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
      await storageItemStorage.set(items);
    }
  },
  
  // 删除物品
  delete: async (id: string): Promise<void> => {
    const items = await storageItemStorage.get();
    const newItems = items.filter(i => i.id !== id);
    await storageItemStorage.set(newItems);
  },
  
  // 根据ID获取物品
  getById: async (id: string): Promise<StorageItem | null> => {
    const items = await storageItemStorage.get();
    return items.find(i => i.id === id) || null;
  },
  
  // 根据空间获取物品
  getBySpace: async (spaceId: string, includeSubSpaces: boolean = false): Promise<StorageItem[]> => {
    const items = await storageItemStorage.get();
    if (includeSubSpaces) {
      const spaces = await storageSpaceStorage.get();
      const getAllSubSpaceIds = (parentId: string): string[] => {
        const children = spaces.filter(s => s.parentId === parentId);
        let ids = [parentId];
        children.forEach(child => {
          ids = ids.concat(getAllSubSpaceIds(child.id));
        });
        return ids;
      };
      const spaceIds = getAllSubSpaceIds(spaceId);
      return items.filter(i => spaceIds.includes(i.spaceId));
    }
    return items.filter(i => i.spaceId === spaceId);
  },
  
  // 根据分类获取物品
  getByCategory: async (categoryId: string): Promise<StorageItem[]> => {
    const items = await storageItemStorage.get();
    return items.filter(i => i.categoryId === categoryId);
  },
  
  // 筛选物品
  filter: async (filters: ItemFilters): Promise<StorageItem[]> => {
    let items = await storageItemStorage.get();
    
    if (filters.spaceId) {
      items = items.filter(i => i.spaceId === filters.spaceId);
    }
    if (filters.categoryId) {
      items = items.filter(i => i.categoryId === filters.categoryId);
    }
    if (filters.tags && filters.tags.length > 0) {
      items = items.filter(i => filters.tags!.some(tag => i.tags.includes(tag)));
    }
    if (filters.status) {
      items = items.filter(i => i.status === filters.status);
    }
    if (filters.expiryBefore) {
      items = items.filter(i => i.expiryDate && i.expiryDate <= filters.expiryBefore!);
    }
    if (filters.expiryAfter) {
      items = items.filter(i => i.expiryDate && i.expiryDate >= filters.expiryAfter!);
    }
    if (filters.minPrice !== undefined) {
      items = items.filter(i => i.price !== undefined && i.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      items = items.filter(i => i.price !== undefined && i.price <= filters.maxPrice!);
    }
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      items = items.filter(i => 
        i.name.toLowerCase().includes(keyword) ||
        (i.brand && i.brand.toLowerCase().includes(keyword)) ||
        (i.model && i.model.toLowerCase().includes(keyword)) ||
        (i.note && i.note.toLowerCase().includes(keyword))
      );
    }
    
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  // 搜索物品
  search: async (keyword: string): Promise<StorageItem[]> => {
    return storageItemStorage.filter({ keyword });
  },
  
  // 获取即将过期的物品
  getExpiringSoon: async (days: number = 7): Promise<StorageItem[]> => {
    const items = await storageItemStorage.get();
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);
    
    return items.filter(i => {
      if (!i.expiryDate) return false;
      const expiry = new Date(i.expiryDate);
      return expiry <= future && expiry >= now;
    });
  },
  
  // 获取已过期物品
  getExpired: async (): Promise<StorageItem[]> => {
    const items = await storageItemStorage.get();
    const now = new Date();
    return items.filter(i => {
      if (!i.expiryDate) return false;
      return new Date(i.expiryDate) < now;
    });
  },
};

// 分类存储
export const storageCategoryStorage = {
  get: async (): Promise<StorageCategory[]> => {
    const categories = await storage.get<StorageCategory[]>(KEYS.STORAGE_CATEGORIES);
    if (!categories || categories.length === 0) {
      await storage.set(KEYS.STORAGE_CATEGORIES, DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    return categories;
  },
  set: (value: StorageCategory[]) => storage.set(KEYS.STORAGE_CATEGORIES, value),
  
  // 创建分类
  create: async (category: Omit<StorageCategory, 'id'>): Promise<StorageCategory> => {
    const categories = await storageCategoryStorage.get();
    const newCategory: StorageCategory = {
      ...category,
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    categories.push(newCategory);
    await storageCategoryStorage.set(categories);
    return newCategory;
  },
  
  // 更新分类
  update: async (id: string, data: Partial<StorageCategory>): Promise<void> => {
    const categories = await storageCategoryStorage.get();
    const index = categories.findIndex(c => c.id === id);
    if (index !== -1) {
      categories[index] = { ...categories[index], ...data };
      await storageCategoryStorage.set(categories);
    }
  },
  
  // 删除分类
  delete: async (id: string): Promise<void> => {
    const categories = await storageCategoryStorage.get();
    const newCategories = categories.filter(c => c.id !== id);
    await storageCategoryStorage.set(newCategories);
  },
  
  // 根据ID获取分类
  getById: async (id: string): Promise<StorageCategory | undefined> => {
    const categories = await storageCategoryStorage.get();
    return categories.find(c => c.id === id);
  },
};

// 标签存储
export const storageTagStorage = {
  get: async (): Promise<StorageTag[]> => {
    const tags = await storage.get<StorageTag[]>(KEYS.STORAGE_TAGS);
    if (!tags || tags.length === 0) {
      await storage.set(KEYS.STORAGE_TAGS, DEFAULT_TAGS);
      return DEFAULT_TAGS;
    }
    return tags;
  },
  set: (value: StorageTag[]) => storage.set(KEYS.STORAGE_TAGS, value),
  
  // 创建标签
  create: async (tag: Omit<StorageTag, 'id' | 'usageCount'>): Promise<StorageTag> => {
    const tags = await storageTagStorage.get();
    const newTag: StorageTag = {
      ...tag,
      id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      usageCount: 0,
    };
    tags.push(newTag);
    await storageTagStorage.set(tags);
    return newTag;
  },
  
  // 更新标签使用次数
  updateUsage: async (tagName: string, delta: number): Promise<void> => {
    const tags = await storageTagStorage.get();
    const tag = tags.find(t => t.name === tagName);
    if (tag) {
      tag.usageCount = Math.max(0, tag.usageCount + delta);
      await storageTagStorage.set(tags);
    }
  },
  
  // 删除标签
  delete: async (id: string): Promise<void> => {
    const tags = await storageTagStorage.get();
    const newTags = tags.filter(t => t.id !== id);
    await storageTagStorage.set(newTags);
  },
};

// 统计数据
export const storageStatistics = {
  get: async (): Promise<StorageStatistics> => {
    const items = await storageItemStorage.get();
    const spaces = await storageSpaceStorage.get();
    const categories = await storageCategoryStorage.get();
    
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    // 计算分类分布
    const categoryDistribution = categories.map(cat => {
      const catItems = items.filter(i => i.categoryId === cat.id);
      return {
        categoryId: cat.id,
        count: catItems.length,
        value: catItems.reduce((sum, i) => sum + (i.price || 0), 0),
      };
    }).filter(c => c.count > 0);
    
    // 计算空间分布
    const spaceDistribution = spaces.map(space => {
      const spaceItems = items.filter(i => i.spaceId === space.id);
      return {
        spaceId: space.id,
        count: spaceItems.length,
      };
    }).filter(s => s.count > 0);
    
    // 计算即将过期（7天内）
    const expiringSoon = items.filter(i => {
      if (!i.expiryDate) return false;
      const expiry = new Date(i.expiryDate);
      const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length;
    
    return {
      totalItems: items.length,
      totalSpaces: spaces.length,
      totalCategories: categories.length,
      totalValue: items.reduce((sum, i) => sum + (i.price || 0), 0),
      newThisMonth: items.filter(i => {
        const created = new Date(i.createdAt);
        return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
      }).length,
      expiringSoon,
      borrowedItems: items.filter(i => i.status === 'borrowed').length,
      categoryDistribution,
      spaceDistribution,
    };
  },
};
