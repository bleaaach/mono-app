/*
 * @Author: Bleaach008
 * @Date: 2026-03-01 21:28:39
 * @LastEditTime: 2026-03-05 22:56:47
 * @FilePath: \mono-app\src\utils\events.ts
 * @Description: 
 * 
 * Copyright (c) 2026 by 008, All Rights Reserved. 
 */
type EventCallback = (data?: any) => void;

class EventEmitter {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

export const diaryEvents = new EventEmitter();

export const DIARY_EVENTS = {
  EDIT_ENTRY: 'editEntry',
} as const;

// 全局状态：待编辑的日记 ID
let pendingEditEntryId: string | null = null;

export const setPendingEditEntry = (entryId: string | null) => {
  pendingEditEntryId = entryId;
};

export const getPendingEditEntry = () => {
  const id = pendingEditEntryId;
  pendingEditEntryId = null;
  return id;
};

// 全局状态：目标 Tab 名称
let targetTabName: string | null = null;

export const setTargetTab = (tabName: string | null) => {
  targetTabName = tabName;
};

export const getTargetTab = () => {
  const name = targetTabName;
  targetTabName = null;
  return name;
};
