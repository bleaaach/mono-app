import { Platform } from 'react-native';
import { Habit } from '../types';

// 动态导入通知模块（仅在原生平台）
let Notifications: any = null;
let Device: any = null;

if (Platform.OS !== 'web') {
  try {
    const notificationsModule = require('expo-notifications');
    const deviceModule = require('expo-device');

    Notifications = notificationsModule;
    Device = deviceModule;

    // 配置通知行为
    if (Notifications) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (error) {
    console.log('通知模块加载失败:', error);
  }
}

// 请求通知权限
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.log('Web 端不支持本地通知');
    return false;
  }

  if (!Notifications || !Device) {
    console.log('通知模块未加载');
    return false;
  }

  if (!Device.isDevice) {
    console.log('通知功能需要在真实设备上运行');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('未获得通知权限');
    return false;
  }

  return true;
}

// 为习惯设置提醒
export async function scheduleHabitReminder(habit: Habit): Promise<string | null> {
  if (Platform.OS === 'web' || !Notifications) {
    console.log('Web 端不支持设置提醒');
    return null;
  }

  if (!habit.reminders || habit.reminders.length === 0) {
    return null;
  }

  // 取消现有的提醒
  await cancelHabitReminders(habit.id);

  const reminderIds: string[] = [];

  for (const reminder of habit.reminders) {
    if (!reminder.enabled) continue;

    const [hours, minutes] = reminder.time.split(':').map(Number);

    // 创建每日重复的提醒
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '习惯提醒',
        body: `该打卡「${habit.name}」了！坚持就是胜利 💪`,
        sound: 'default',
        badge: 1,
        data: { habitId: habit.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });

    reminderIds.push(identifier);
  }

  return reminderIds.join(',');
}

// 取消习惯的提醒
export async function cancelHabitReminders(habitId: string): Promise<void> {
  if (Platform.OS === 'web' || !Notifications) {
    return;
  }

  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

  for (const notification of scheduledNotifications) {
    const data = notification.content.data as { habitId?: string };
    if (data?.habitId === habitId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

// 取消所有提醒
export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web' || !Notifications) {
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
}

// 获取所有已安排的提醒
export async function getAllScheduledReminders(): Promise<any[]> {
  if (Platform.OS === 'web' || !Notifications) {
    return [];
  }

  return await Notifications.getAllScheduledNotificationsAsync();
}

// 立即发送测试通知
export async function sendTestNotification(): Promise<void> {
  if (Platform.OS === 'web' || !Notifications) {
    console.log('Web 端不支持发送通知');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '测试通知',
      body: '这是一条测试通知，提醒功能正常工作！',
      sound: 'default',
    },
    trigger: null, // 立即发送
  });
}

// 设置每日总结提醒
export async function scheduleDailySummary(hour: number = 21, minute: number = 0): Promise<string | null> {
  if (Platform.OS === 'web' || !Notifications) {
    console.log('Web 端不支持设置提醒');
    return null;
  }

  // 取消现有的总结提醒
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduledNotifications) {
    const data = notification.content.data as { type?: string };
    if (data?.type === 'daily_summary') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '每日习惯总结',
      body: '查看今天的习惯完成情况，为明天做好准备！',
      sound: 'default',
      data: { type: 'daily_summary' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return identifier;
}

// 解析时间字符串为小时和分钟
export function parseTimeString(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
}

// 格式化时间为字符串
export function formatTimeString(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// 获取默认提醒时间选项
export function getDefaultReminderTimes(): string[] {
  return [
    '07:00', // 早晨
    '08:00',
    '09:00',
    '12:00', // 中午
    '13:00',
    '18:00', // 晚上
    '19:00',
    '20:00',
    '21:00',
    '22:00',
  ];
}
