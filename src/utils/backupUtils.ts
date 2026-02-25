import { Platform } from 'react-native';
import { Paths, File } from 'expo-file-system';
import { storage, KEYS } from './storage';

// 备份数据结构
export interface BackupData {
  version: string;
  exportDate: string;
  appVersion: string;
  data: {
    todos: any[];
    habits: any[];
    habitLogs: any[];
    diaries: any[];
    diariesBookmarks: any[];
    inventory: any[];
    timeEntries: any[];
    activities: any[];
    activityGroups: any[];
    timeGoals: any[];
    timeLinks: any;
    customCategories: any[];
    lifeLogCategories: any[];
    lifeLogEntries: any[];
    storageSpaces: any[];
    storageItems: any[];
    storageCategories: any[];
    storageTags: any[];
  };
}

// 备份元数据
export interface BackupMetadata {
  version: string;
  exportDate: string;
  appVersion: string;
  dataSize: number;
  itemCounts: {
    todos: number;
    habits: number;
    habitLogs: number;
    diaries: number;
    inventory: number;
    timeEntries: number;
    activities: number;
    lifeLogs: number;
    storageItems: number;
    storageSpaces: number;
  };
}

const BACKUP_VERSION = '1.0.0';
const APP_VERSION = '1.0.0';

/**
 * 导出所有数据为备份对象
 */
export async function exportAllData(): Promise<BackupData> {
  const [
    todos,
    habits,
    habitLogs,
    diaries,
    diariesBookmarks,
    inventory,
    timeEntries,
    activities,
    activityGroups,
    timeGoals,
    timeLinks,
    customCategories,
    lifeLogCategories,
    lifeLogEntries,
    storageSpaces,
    storageItems,
    storageCategories,
    storageTags,
  ] = await Promise.all([
    storage.get(KEYS.TODOS),
    storage.get(KEYS.HABITS),
    storage.get(KEYS.HABIT_LOGS),
    storage.get(KEYS.DIARIES),
    storage.get(KEYS.DIARY_BOOKMARKS),
    storage.get(KEYS.INVENTORY),
    storage.get(KEYS.TIME_ENTRIES),
    storage.get(KEYS.ACTIVITIES),
    storage.get(KEYS.ACTIVITY_GROUPS),
    storage.get(KEYS.TIME_GOALS),
    storage.get(KEYS.TIME_LINKS),
    storage.get(KEYS.CUSTOM_CATEGORIES),
    storage.get(KEYS.LIFE_LOG_CATEGORIES),
    storage.get(KEYS.LIFE_LOG_ENTRIES),
    storage.get(KEYS.STORAGE_SPACES),
    storage.get(KEYS.STORAGE_ITEMS),
    storage.get(KEYS.STORAGE_CATEGORIES),
    storage.get(KEYS.STORAGE_TAGS),
  ]);

  return {
    version: BACKUP_VERSION,
    exportDate: new Date().toISOString(),
    appVersion: APP_VERSION,
    data: {
      todos: Array.isArray(todos) ? todos : [],
      habits: Array.isArray(habits) ? habits : [],
      habitLogs: Array.isArray(habitLogs) ? habitLogs : [],
      diaries: Array.isArray(diaries) ? diaries : [],
      diariesBookmarks: Array.isArray(diariesBookmarks) ? diariesBookmarks : [],
      inventory: Array.isArray(inventory) ? inventory : [],
      timeEntries: Array.isArray(timeEntries) ? timeEntries : [],
      activities: Array.isArray(activities) ? activities : [],
      activityGroups: Array.isArray(activityGroups) ? activityGroups : [],
      timeGoals: Array.isArray(timeGoals) ? timeGoals : [],
      timeLinks: timeLinks || { todoActivities: {}, habitActivities: {} },
      customCategories: Array.isArray(customCategories) ? customCategories : [],
      lifeLogCategories: Array.isArray(lifeLogCategories) ? lifeLogCategories : [],
      lifeLogEntries: Array.isArray(lifeLogEntries) ? lifeLogEntries : [],
      storageSpaces: Array.isArray(storageSpaces) ? storageSpaces : [],
      storageItems: Array.isArray(storageItems) ? storageItems : [],
      storageCategories: Array.isArray(storageCategories) ? storageCategories : [],
      storageTags: Array.isArray(storageTags) ? storageTags : [],
    },
  };
}

/**
 * 获取备份元数据（不包含完整数据）
 */
export async function getBackupMetadata(data?: BackupData): Promise<BackupMetadata> {
  const backupData = data || await exportAllData();
  const jsonString = JSON.stringify(backupData);

  return {
    version: backupData.version,
    exportDate: backupData.exportDate,
    appVersion: backupData.appVersion,
    dataSize: new Blob([jsonString]).size,
    itemCounts: {
      todos: backupData.data.todos.length,
      habits: backupData.data.habits.length,
      habitLogs: backupData.data.habitLogs.length,
      diaries: backupData.data.diaries.length,
      inventory: backupData.data.inventory.length,
      timeEntries: backupData.data.timeEntries.length,
      activities: backupData.data.activities.length,
      lifeLogs: backupData.data.lifeLogEntries.length,
      storageItems: backupData.data.storageItems.length,
      storageSpaces: backupData.data.storageSpaces.length,
    },
  };
}

/**
 * 将备份数据保存为 JSON 文件
 * 在 Web 平台会触发下载，在移动端保存到文档目录
 */
export async function saveBackupToFile(backupData: BackupData): Promise<string | null> {
  const jsonString = JSON.stringify(backupData, null, 2);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `mono-backup-${timestamp}.json`;

  if (Platform.OS === 'web') {
    // Web 平台：触发浏览器下载
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return filename;
  } else {
    // 移动端：保存到缓存目录
    const file = new File(Paths.cache, filename);
    await file.write(jsonString);
    return file.uri;
  }
}

/**
 * 从文件导入备份数据
 */
export async function importFromFile(fileUri: string): Promise<BackupData> {
  let jsonString: string;

  if (Platform.OS === 'web') {
    // Web 平台：通过 fetch 读取文件
    const response = await fetch(fileUri);
    jsonString = await response.text();
  } else {
    // 移动端：使用 File 读取
    const file = new File(fileUri);
    jsonString = await file.text();
  }

  const backupData: BackupData = JSON.parse(jsonString);

  // 验证备份数据格式
  if (!backupData.version || !backupData.data) {
    throw new Error('无效的备份文件格式');
  }

  return backupData;
}

/**
 * 从 JSON 字符串导入备份数据
 */
export function importFromJSON(jsonString: string): BackupData {
  const backupData: BackupData = JSON.parse(jsonString);

  // 验证备份数据格式
  if (!backupData.version || !backupData.data) {
    throw new Error('无效的备份文件格式');
  }

  return backupData;
}

/**
 * 恢复数据到存储
 * @param backupData 备份数据
 * @param options 恢复选项
 */
export async function restoreData(
  backupData: BackupData,
  options: {
    merge?: boolean; // 是否合并数据而不是覆盖
    skipExisting?: boolean; // 是否跳过已存在的数据（仅合并模式有效）
  } = {}
): Promise<void> {
  const { merge = false, skipExisting = false } = options;

  if (merge) {
    // 合并模式：获取现有数据并合并
    const existingData = await exportAllData();

    const mergeArrays = <T extends { id?: string }>(
      existing: T[],
      incoming: T[],
      skipExisting: boolean
    ): T[] => {
      if (skipExisting) {
        // 跳过已存在的项目
        const existingIds = new Set(existing.map(item => item.id));
        const newItems = incoming.filter(item => !existingIds.has(item.id));
        return [...existing, ...newItems];
      } else {
        // 覆盖已存在的项目
        const merged = [...existing];
        incoming.forEach(item => {
          const index = merged.findIndex(e => e.id === item.id);
          if (index !== -1) {
            merged[index] = item;
          } else {
            merged.push(item);
          }
        });
        return merged;
      }
    };

    await Promise.all([
      storage.set(KEYS.TODOS, mergeArrays(existingData.data.todos, backupData.data.todos, skipExisting)),
      storage.set(KEYS.HABITS, mergeArrays(existingData.data.habits, backupData.data.habits, skipExisting)),
      storage.set(KEYS.HABIT_LOGS, mergeArrays(existingData.data.habitLogs, backupData.data.habitLogs, skipExisting)),
      storage.set(KEYS.DIARIES, mergeArrays(existingData.data.diaries, backupData.data.diaries, skipExisting)),
      storage.set(KEYS.DIARY_BOOKMARKS, mergeArrays(existingData.data.diariesBookmarks, backupData.data.diariesBookmarks, skipExisting)),
      storage.set(KEYS.INVENTORY, mergeArrays(existingData.data.inventory, backupData.data.inventory, skipExisting)),
      storage.set(KEYS.TIME_ENTRIES, mergeArrays(existingData.data.timeEntries, backupData.data.timeEntries, skipExisting)),
      storage.set(KEYS.ACTIVITIES, mergeArrays(existingData.data.activities, backupData.data.activities, skipExisting)),
      storage.set(KEYS.ACTIVITY_GROUPS, mergeArrays(existingData.data.activityGroups, backupData.data.activityGroups, skipExisting)),
      storage.set(KEYS.TIME_GOALS, mergeArrays(existingData.data.timeGoals, backupData.data.timeGoals, skipExisting)),
      storage.set(KEYS.TIME_LINKS, { ...existingData.data.timeLinks, ...backupData.data.timeLinks }),
      storage.set(KEYS.CUSTOM_CATEGORIES, mergeArrays(existingData.data.customCategories, backupData.data.customCategories, skipExisting)),
      storage.set(KEYS.LIFE_LOG_CATEGORIES, mergeArrays(existingData.data.lifeLogCategories, backupData.data.lifeLogCategories, skipExisting)),
      storage.set(KEYS.LIFE_LOG_ENTRIES, mergeArrays(existingData.data.lifeLogEntries, backupData.data.lifeLogEntries, skipExisting)),
      storage.set(KEYS.STORAGE_SPACES, mergeArrays(existingData.data.storageSpaces, backupData.data.storageSpaces, skipExisting)),
      storage.set(KEYS.STORAGE_ITEMS, mergeArrays(existingData.data.storageItems, backupData.data.storageItems, skipExisting)),
      storage.set(KEYS.STORAGE_CATEGORIES, mergeArrays(existingData.data.storageCategories, backupData.data.storageCategories, skipExisting)),
      storage.set(KEYS.STORAGE_TAGS, mergeArrays(existingData.data.storageTags, backupData.data.storageTags, skipExisting)),
    ]);
  } else {
    // 覆盖模式：直接替换所有数据
    await Promise.all([
      storage.set(KEYS.TODOS, backupData.data.todos),
      storage.set(KEYS.HABITS, backupData.data.habits),
      storage.set(KEYS.HABIT_LOGS, backupData.data.habitLogs),
      storage.set(KEYS.DIARIES, backupData.data.diaries),
      storage.set(KEYS.DIARY_BOOKMARKS, backupData.data.diariesBookmarks),
      storage.set(KEYS.INVENTORY, backupData.data.inventory),
      storage.set(KEYS.TIME_ENTRIES, backupData.data.timeEntries),
      storage.set(KEYS.ACTIVITIES, backupData.data.activities),
      storage.set(KEYS.ACTIVITY_GROUPS, backupData.data.activityGroups),
      storage.set(KEYS.TIME_GOALS, backupData.data.timeGoals),
      storage.set(KEYS.TIME_LINKS, backupData.data.timeLinks),
      storage.set(KEYS.CUSTOM_CATEGORIES, backupData.data.customCategories),
      storage.set(KEYS.LIFE_LOG_CATEGORIES, backupData.data.lifeLogCategories),
      storage.set(KEYS.LIFE_LOG_ENTRIES, backupData.data.lifeLogEntries),
      storage.set(KEYS.STORAGE_SPACES, backupData.data.storageSpaces),
      storage.set(KEYS.STORAGE_ITEMS, backupData.data.storageItems),
      storage.set(KEYS.STORAGE_CATEGORIES, backupData.data.storageCategories),
      storage.set(KEYS.STORAGE_TAGS, backupData.data.storageTags),
    ]);
  }
}

/**
 * 清空所有数据
 */
export async function clearAllData(): Promise<void> {
  await storage.clear();
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化日期
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ==================== CSV 导出功能 ====================

import { LifeLogCategory, LifeLogEntry } from '../types';

/**
 * 将 Life Log 数据导出为 CSV 格式
 */
export function exportLifeLogToCSV(
  categories: LifeLogCategory[],
  entries: LifeLogEntry[]
): string {
  if (categories.length === 0 || entries.length === 0) {
    return '';
  }

  // 收集所有可能的字段
  const allFields = new Map<string, { name: string; type: string }>();
  categories.forEach(cat => {
    cat.fields.forEach(field => {
      if (!allFields.has(field.id)) {
        allFields.set(field.id, { name: field.name, type: field.type });
      }
    });
  });

  // CSV 头部
  const headers = [
    'ID',
    '分类',
    '分类ID',
    '标题',
    '创建时间',
    '更新时间',
    '标签',
    ...Array.from(allFields.entries()).map(([id, info]) => info.name),
  ];

  // CSV 行
  const rows = entries.map(entry => {
    const category = categories.find(c => c.id === entry.categoryId);
    const titleField = category?.fields[0];
    const title = titleField ? entry.data[titleField.id] : entry.title;

    const row = [
      entry.id,
      category?.name || '未知分类',
      entry.categoryId,
      title || '',
      entry.createdAt,
      entry.updatedAt,
      entry.tags.join(', '),
    ];

    // 添加动态字段值
    Array.from(allFields.keys()).forEach(fieldId => {
      const value = entry.data[fieldId];
      if (value === undefined || value === null) {
        row.push('');
      } else if (typeof value === 'string') {
        // 处理包含逗号或换行符的字符串
        const escaped = value.includes(',') || value.includes('\n') || value.includes('"')
          ? `"${value.replace(/"/g, '""')}"`
          : value;
        row.push(escaped);
      } else {
        row.push(String(value));
      }
    });

    return row;
  });

  // 组合 CSV 内容
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * 下载 CSV 文件
 */
export async function downloadCSV(
  csvContent: string,
  filename?: string
): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFilename = `lifelog-export-${timestamp}.csv`;
  const finalFilename = filename || defaultFilename;

  if (Platform.OS === 'web') {
    // Web 平台：触发浏览器下载
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // 移动端：保存到缓存目录
    const file = new File(Paths.cache, finalFilename);
    await file.write('\ufeff' + csvContent);
    console.log('CSV saved to:', file.uri);
  }
}

/**
 * 导出单个分类的 Life Log 数据为 CSV
 */
export async function exportCategoryToCSV(
  category: LifeLogCategory,
  entries: LifeLogEntry[]
): Promise<void> {
  const categoryEntries = entries.filter(e => e.categoryId === category.id);
  const csvContent = exportLifeLogToCSV([category], categoryEntries);

  if (csvContent) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${category.name}-export-${timestamp}.csv`;
    await downloadCSV(csvContent, filename);
  }
}

/**
 * 导出所有 Life Log 数据为 CSV
 */
export async function exportAllLifeLogsToCSV(): Promise<void> {
  const backupData = await exportAllData();
  const csvContent = exportLifeLogToCSV(
    backupData.data.lifeLogCategories,
    backupData.data.lifeLogEntries
  );

  if (csvContent) {
    await downloadCSV(csvContent);
  }
}
