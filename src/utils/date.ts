import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 获取今天日期字符串 (YYYY-MM-DD)
export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// 格式化日期显示
export const formatDate = (date: string | Date, formatStr: string = 'yyyy年MM月dd日'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: zhCN });
};

// 获取相对时间描述
export const getRelativeTime = (date: string): string => {
  const today = getTodayString();
  if (date === today) return '今天';
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date === tomorrow.toISOString().split('T')[0]) return '明天';
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date === yesterday.toISOString().split('T')[0]) return '昨天';
  
  return formatDate(date, 'MM月dd日');
};

// 获取本周日期范围
export const getWeekRange = () => {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const end = endOfWeek(today, { weekStartsOn: 1 });
  return { start, end, days: eachDayOfInterval({ start, end }) };
};

// 获取年度日期范围（用于热力图）
export const getYearRange = () => {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 1);
  const end = new Date(today.getFullYear(), 11, 31);
  return { start, end, days: eachDayOfInterval({ start, end }) };
};

// 检查日期是否相同
export const isToday = (date: string): boolean => {
  return date === getTodayString();
};

// 获取星期几名称
export const getDayName = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[d.getDay()];
};

// 获取当前时间字符串
export const getCurrentTime = (): string => {
  return format(new Date(), 'HH:mm');
};

// 生成唯一ID
export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
