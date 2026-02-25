import { Habit, HabitLog, HabitStats } from '../types';
import { getTodayString, generateId } from './date';

// 习惯分类预设
export const HABIT_CATEGORIES = [
  { id: 'health', name: '健康', color: '#22c55e', icon: 'heart' },
  { id: 'study', name: '学习', color: '#3b82f6', icon: 'book' },
  { id: 'work', name: '工作', color: '#f59e0b', icon: 'briefcase' },
  { id: 'life', name: '生活', color: '#8b5cf6', icon: 'home' },
  { id: 'sport', name: '运动', color: '#ef4444', icon: 'activity' },
  { id: 'read', name: '阅读', color: '#14b8a6', icon: 'book-open' },
  { id: 'meditation', name: '冥想', color: '#ec4899', icon: 'moon' },
  { id: 'other', name: '其他', color: '#6b7280', icon: 'more' },
];

// 习惯颜色预设
export const HABIT_COLORS = [
  '#000000', // 黑色
  '#ef4444', // 红色
  '#f97316', // 橙色
  '#f59e0b', // 琥珀色
  '#84cc16', // 柠檬绿
  '#22c55e', // 绿色
  '#14b8a6', // 青色
  '#06b6d4', // 天蓝色
  '#3b82f6', // 蓝色
  '#6366f1', // 靛蓝色
  '#8b5cf6', // 紫色
  '#a855f7', // 紫罗兰
  '#d946ef', // 品红色
  '#ec4899', // 粉色
  '#f43f5e', // 玫瑰色
];

// 习惯图标预设
export const HABIT_ICONS = [
  'square', 'circle', 'check', 'star', 'heart',
  'moon', 'sun', 'cloud', 'rain', 'snow',
  'fire', 'flash', 'bolt', 'zap', 'lightning',
  'book', 'book-open', 'pen', 'pencil', 'edit',
  'coffee', 'cup', 'glass', 'bottle', 'drop',
  'music', 'mic', 'video', 'camera', 'image',
  'phone', 'mail', 'message', 'chat', 'bell',
  'calendar', 'clock', 'time', 'timer', 'alarm',
  'home', 'building', 'office', 'store', 'shop',
  'car', 'bike', 'bus', 'train', 'plane',
  'walk', 'run', 'activity', 'fitness', 'gym',
  'apple', 'fruit', 'food', 'pizza', 'cake',
  'smile', 'happy', 'laugh', 'meh', 'sad',
];

// 创建新习惯
export const createHabit = (
  name: string,
  category: string = 'other',
  color: string = '#000000',
  icon: string = 'square'
): Habit => {
  return {
    id: generateId(),
    name,
    description: '',
    color,
    icon,
    category,
    tags: [],
    frequency: {
      type: 'daily',
      days: [1, 2, 3, 4, 5, 6, 7], // 每天
    },
    target: {
      type: 'none',
    },
    reminders: [],
    createdAt: getTodayString(),
    archived: false,
    paused: false,
    order: Date.now(),
  };
};

// 创建打卡记录
export const createHabitLog = (
  habitId: string,
  date: string = getTodayString(),
  count: number = 1,
  isMakeup: boolean = false,
  note?: string
): HabitLog => {
  return {
    id: generateId(),
    habitId,
    date,
    completed: true,
    count,
    note,
    isMakeup,
    createdAt: getTodayString(),
  };
};

// 获取习惯的打卡记录统计
export const getHabitStats = (habit: Habit, logs: HabitLog[]): HabitStats => {
  // 只筛选当前习惯的打卡记录
  const habitLogs = logs.filter(log => log.habitId === habit.id);
  const completedLogs = habitLogs.filter(log => log.completed);
  const totalCompletions = completedLogs.reduce((sum, log) => sum + log.count, 0);

  // 计算连续打卡天数
  const sortedDates = completedLogs
    .map(log => log.date)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // 计算当前连续天数
  const today = getTodayString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (sortedDates.includes(today) || sortedDates.includes(yesterdayStr)) {
    currentStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // 计算最长连续天数
  if (sortedDates.length > 0) {
    tempStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
  }

  // 计算完成率
  const daysSinceCreated = Math.max(1, Math.floor((new Date().getTime() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
  const completionRate = Math.round((totalCompletions / daysSinceCreated) * 100);

  // 计算本周统计
  const today2 = new Date();
  const currentDay = today2.getDay();
  const weekStart = new Date(today2);
  weekStart.setDate(today2.getDate() - currentDay);
  const weeklyStats: number[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayLogs = habitLogs.filter(log => log.date === dateStr && log.completed);
    weeklyStats.push(dayLogs.reduce((sum, log) => sum + log.count, 0));
  }

  // 计算本月统计
  const currentYear = today2.getFullYear();
  const currentMonth = today2.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthlyStats: number[] = new Array(daysInMonth).fill(0);

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const dayLogs = habitLogs.filter(log => log.date === dateStr && log.completed);
    monthlyStats[i - 1] = dayLogs.reduce((sum, log) => sum + log.count, 0);
  }

  return {
    habitId: habit.id,
    totalCompletions,
    currentStreak,
    longestStreak,
    completionRate,
    weeklyStats,
    monthlyStats,
  };
};

// 获取年度热力图数据（单个习惯）
export const getYearlyHeatmapData = (
  habit: Habit,
  logs: HabitLog[],
  year: number = new Date().getFullYear()
): { date: string; count: number; level: number }[] => {
  const data: { date: string; count: number; level: number }[] = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayLogs = logs.filter(log => log.habitId === habit.id && log.date === dateStr && log.completed);
    const count = dayLogs.reduce((sum, log) => sum + log.count, 0);

    // 计算热力等级 (0-4)
    let level = 0;
    if (count > 0) {
      if (count === 1) level = 1;
      else if (count === 2) level = 2;
      else if (count === 3) level = 3;
      else level = 4;
    }

    data.push({ date: dateStr, count, level });
  }

  return data;
};

// 获取年度热力图数据（所有习惯汇总）
export const getYearlyHeatmapSummaryData = (
  logs: HabitLog[],
  year: number = new Date().getFullYear()
): { date: string; count: number; level: number }[] => {
  const data: { date: string; count: number; level: number }[] = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayLogs = logs.filter(log => log.date === dateStr && log.completed);
    const count = dayLogs.length;

    // 计算热力等级 (0-4)
    let level = 0;
    if (count > 0) {
      if (count === 1) level = 1;
      else if (count === 2) level = 2;
      else if (count === 3) level = 3;
      else level = 4;
    }

    data.push({ date: dateStr, count, level });
  }

  return data;
};

// 检查今天是否已完成
export const isCompletedToday = (logs: HabitLog[]): boolean => {
  const today = getTodayString();
  return logs.some(log => log.date === today && log.completed);
};

// 获取今日完成次数
export const getTodayCount = (logs: HabitLog[]): number => {
  const today = getTodayString();
  const todayLogs = logs.filter(log => log.date === today && log.completed);
  return todayLogs.reduce((sum, log) => sum + log.count, 0);
};

// 格式化连续天数显示
export const formatStreak = (streak: number): string => {
  if (streak === 0) return '尚未开始';
  if (streak === 1) return '1天';
  return `${streak}天`;
};

// 格式化频率显示
export const formatFrequency = (habit: Habit): string => {
  const { type, days, interval } = habit.frequency;
  
  switch (type) {
    case 'daily':
      return '每天';
    case 'weekly':
      if (days && days.length > 0) {
        const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
        const selectedDays = days.map(d => dayNames[d - 1]).join('、');
        return `每周 ${selectedDays}`;
      }
      return '每周';
    case 'monthly':
      if (days && days.length > 0) {
        return `每月 ${days.join('、')} 日`;
      }
      return '每月';
    case 'custom':
      return `每 ${interval || 1} 天`;
    default:
      return '每天';
  }
};

// 检查习惯在指定日期是否应该打卡
export const isHabitDueOnDate = (habit: Habit, date: Date): boolean => {
  const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
  const dayOfMonth = date.getDate();
  const { type, days, interval } = habit.frequency;

  switch (type) {
    case 'daily':
      return true;
    case 'weekly':
      return days?.includes(dayOfWeek) ?? false;
    case 'monthly':
      return days?.includes(dayOfMonth) ?? false;
    case 'custom':
      if (!interval) return false;
      const daysSinceCreated = Math.floor((date.getTime() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceCreated % interval === 0;
    default:
      return true;
  }
};

// 成就类型
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

// 获取成就列表
export const getAchievements = (stats: HabitStats): Achievement[] => {
  const achievements: Achievement[] = [
    {
      id: 'first_step',
      name: '第一步',
      description: '完成第一次打卡',
      icon: 'star',
      unlocked: stats.totalCompletions >= 1,
    },
    {
      id: 'week_warrior',
      name: '周战士',
      description: '连续打卡7天',
      icon: 'fire',
      unlocked: stats.currentStreak >= 7 || stats.longestStreak >= 7,
    },
    {
      id: 'month_master',
      name: '月度大师',
      description: '连续打卡30天',
      icon: 'check',
      unlocked: stats.currentStreak >= 30 || stats.longestStreak >= 30,
    },
    {
      id: 'quarter_champion',
      name: '季度冠军',
      description: '连续打卡90天',
      icon: 'star',
      unlocked: stats.currentStreak >= 90 || stats.longestStreak >= 90,
    },
    {
      id: 'half_year_hero',
      name: '半年英雄',
      description: '连续打卡180天',
      icon: 'muscle',
      unlocked: stats.currentStreak >= 180 || stats.longestStreak >= 180,
    },
    {
      id: 'year_legend',
      name: '年度传奇',
      description: '连续打卡365天',
      icon: 'crown',
      unlocked: stats.currentStreak >= 365 || stats.longestStreak >= 365,
    },
    {
      id: 'hundred_club',
      name: '百次俱乐部',
      description: '累计打卡100次',
      icon: 'check',
      unlocked: stats.totalCompletions >= 100,
    },
    {
      id: 'five_hundred_club',
      name: '五百次俱乐部',
      description: '累计打卡500次',
      icon: 'star',
      unlocked: stats.totalCompletions >= 500,
    },
    {
      id: 'thousand_club',
      name: '千次俱乐部',
      description: '累计打卡1000次',
      icon: 'sparkle',
      unlocked: stats.totalCompletions >= 1000,
    },
    {
      id: 'perfect_week',
      name: '完美周',
      description: '一周全部完成',
      icon: 'check',
      unlocked: stats.weeklyStats.every(count => count > 0),
    },
    {
      id: 'perfect_month',
      name: '完美月',
      description: '一月全部完成',
      icon: 'moon',
      unlocked: stats.monthlyStats.every(count => count > 0),
    },
    {
      id: 'eighty_percent',
      name: '优秀表现',
      description: '完成率达到80%',
      icon: 'star',
      unlocked: stats.completionRate >= 80,
    },
  ];

  return achievements;
};

// 获取习惯大师成就（全局成就）
export interface MasterAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

export const getMasterAchievements = (
  habits: Habit[],
  logs: HabitLog[]
): MasterAchievement[] => {
  const activeHabits = habits.filter(h => !h.archived && !h.paused);
  const allStats = activeHabits.map(h => getHabitStats(h, logs));
  
  // 计算同时维持多个习惯的数量（连续7天以上）
  const maintainedHabits = allStats.filter(s => s.currentStreak >= 7).length;
  const masterHabits = allStats.filter(s => s.currentStreak >= 30).length;
  const grandMasterHabits = allStats.filter(s => s.currentStreak >= 90).length;
  
  return [
    {
      id: 'habit_master',
      name: '习惯大师',
      description: '同时维持3个习惯连续7天',
      icon: 'check',
      unlocked: maintainedHabits >= 3,
      progress: Math.min(maintainedHabits, 3),
      target: 3,
    },
    {
      id: 'habit_expert',
      name: '习惯专家',
      description: '同时维持3个习惯连续30天',
      icon: 'star',
      unlocked: masterHabits >= 3,
      progress: Math.min(masterHabits, 3),
      target: 3,
    },
    {
      id: 'habit_grandmaster',
      name: '习惯宗师',
      description: '同时维持3个习惯连续90天',
      icon: 'sparkle',
      unlocked: grandMasterHabits >= 3,
      progress: Math.min(grandMasterHabits, 3),
      target: 3,
    },
    {
      id: 'multi_habit_master',
      name: '多面手',
      description: '同时维持5个习惯连续7天',
      icon: 'crown',
      unlocked: maintainedHabits >= 5,
      progress: Math.min(maintainedHabits, 5),
      target: 5,
    },
  ];
};

// ==================== 全局统计数据 ====================

// 总体概览统计
export interface OverviewStats {
  todayCompleted: number;
  todayPending: number;
  todayRate: number;
  weekCompleted: number;
  weekTarget: number;
  weekRate: number;
  monthCompleted: number;
  monthTarget: number;
  monthRate: number;
  totalCompletions: number;
  avgStreak: number;
}

export const getOverviewStats = (
  habits: Habit[],
  logs: HabitLog[]
): OverviewStats => {
  const today = new Date();
  const todayStr = getTodayString();

  // 今日统计
  const todayCompleted = habits.filter(h => {
    const habitLogs = logs.filter(l => l.habitId === h.id && l.date === todayStr && l.completed);
    return habitLogs.length > 0;
  }).length;
  const todayPending = habits.filter(h => isHabitDueOnDate(h, today)).length;
  const todayRate = todayPending > 0 ? Math.round((todayCompleted / todayPending) * 100) : 0;

  // 本周统计
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  let weekCompleted = 0;
  let weekTarget = 0;
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayLogs = logs.filter(l => l.date === dateStr && l.completed);
    weekCompleted += dayLogs.length;
    weekTarget += habits.filter(h => isHabitDueOnDate(h, date)).length;
  }
  const weekRate = weekTarget > 0 ? Math.round((weekCompleted / weekTarget) * 100) : 0;

  // 本月统计
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  let monthCompleted = 0;
  let monthTarget = 0;
  for (let d = new Date(monthStart); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayLogs = logs.filter(l => l.date === dateStr && l.completed);
    monthCompleted += dayLogs.length;
    monthTarget += habits.filter(h => isHabitDueOnDate(h, d)).length;
  }
  const monthRate = monthTarget > 0 ? Math.round((monthCompleted / monthTarget) * 100) : 0;

  // 总打卡次数
  const totalCompletions = logs.filter(l => l.completed).length;

  // 平均连续天数
  const allStreaks = habits.map(h => getHabitStats(h, logs).currentStreak);
  const avgStreak = allStreaks.length > 0 
    ? Math.round(allStreaks.reduce((a, b) => a + b, 0) / allStreaks.length)
    : 0;

  return {
    todayCompleted,
    todayPending,
    todayRate,
    weekCompleted,
    weekTarget,
    weekRate,
    monthCompleted,
    monthTarget,
    monthRate,
    totalCompletions,
    avgStreak,
  };
};

// 趋势分析 - 最近30天每日完成率
export const getTrendData = (
  habits: Habit[],
  logs: HabitLog[],
  days: number = 30
): { date: string; rate: number; count: number }[] => {
  const data: { date: string; rate: number; count: number }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const completions = logs.filter(l => l.date === dateStr && l.completed).length;
    const target = habits.filter(h => isHabitDueOnDate(h, date)).length;
    const rate = target > 0 ? Math.round((completions / target) * 100) : 0;
    
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      rate,
      count: completions,
    });
  }

  return data;
};

// 周趋势分析 - 最近12周
export const getWeeklyTrend = (
  habits: Habit[],
  logs: HabitLog[]
): { week: string; rate: number }[] => {
  const data: { week: string; rate: number }[] = [];
  const today = new Date();

  for (let i = 11; i >= 0; i--) {
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);

    let completed = 0;
    let target = 0;

    for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      completed += logs.filter(l => l.date === dateStr && l.completed).length;
      target += habits.filter(h => isHabitDueOnDate(h, d)).length;
    }

    const rate = target > 0 ? Math.round((completed / target) * 100) : 0;
    data.push({
      week: i === 0 ? '本周' : `${i}周前`,
      rate,
    });
  }

  return data;
};

// 时段分析
export interface PeriodAnalysis {
  weekdayRate: number;
  weekendRate: number;
  earlyMonthRate: number;
  midMonthRate: number;
  lateMonthRate: number;
}

export const getPeriodAnalysis = (
  habits: Habit[],
  logs: HabitLog[]
): PeriodAnalysis => {
  // 工作日 vs 周末
  let weekdayCompleted = 0;
  let weekdayTarget = 0;
  let weekendCompleted = 0;
  let weekendTarget = 0;

  // 上中下旬
  let earlyCompleted = 0;
  let earlyTarget = 0;
  let midCompleted = 0;
  let midTarget = 0;
  let lateCompleted = 0;
  let lateTarget = 0;

  const allDates = new Set(logs.map(l => l.date));
  logs.forEach(l => allDates.add(l.date));

  allDates.forEach(dateStr => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    
    const completions = logs.filter(l => l.date === dateStr && l.completed).length;
    const target = habits.filter(h => isHabitDueOnDate(h, date)).length;

    // 工作日/周末
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      weekdayCompleted += completions;
      weekdayTarget += target;
    } else {
      weekendCompleted += completions;
      weekendTarget += target;
    }

    // 上中下旬
    if (dayOfMonth <= 10) {
      earlyCompleted += completions;
      earlyTarget += target;
    } else if (dayOfMonth <= 20) {
      midCompleted += completions;
      midTarget += target;
    } else {
      lateCompleted += completions;
      lateTarget += target;
    }
  });

  return {
    weekdayRate: weekdayTarget > 0 ? Math.round((weekdayCompleted / weekdayTarget) * 100) : 0,
    weekendRate: weekendTarget > 0 ? Math.round((weekendCompleted / weekendTarget) * 100) : 0,
    earlyMonthRate: earlyTarget > 0 ? Math.round((earlyCompleted / earlyTarget) * 100) : 0,
    midMonthRate: midTarget > 0 ? Math.round((midCompleted / midTarget) * 100) : 0,
    lateMonthRate: lateTarget > 0 ? Math.round((lateCompleted / lateTarget) * 100) : 0,
  };
};

// 习惯健康度分析
export interface HabitHealth {
  habitId: string;
  habitName: string;
  stability: number; // 稳定性 0-100
  trend: 'up' | 'down' | 'stable'; // 趋势
  danger: boolean; // 是否危险（连续3天未打卡）
  daysSinceLastCheckin: number;
}

export const getHabitsHealth = (
  habits: Habit[],
  logs: HabitLog[]
): HabitHealth[] => {
  const today = new Date();

  return habits.map(habit => {
    const habitLogs = logs.filter(l => l.habitId === habit.id && l.completed);
    const stats = getHabitStats(habit, logs);

    // 计算稳定性（最近14天完成率的标准差倒数）
    const last14Days: number[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const completed = habitLogs.some(l => l.date === dateStr) ? 1 : 0;
      const shouldDo = isHabitDueOnDate(habit, date) ? 1 : 0;
      if (shouldDo) {
        last14Days.push(completed);
      }
    }

    const avg = last14Days.reduce((a, b) => a + b, 0) / last14Days.length || 0;
    const variance = last14Days.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / last14Days.length || 0;
    const stability = Math.round((1 - Math.sqrt(variance)) * 100);

    // 计算趋势（最近7天 vs 前7天）
    const recent7 = last14Days.slice(-7).reduce((a, b) => a + b, 0);
    const previous7 = last14Days.slice(0, 7).reduce((a, b) => a + b, 0);
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recent7 > previous7) trend = 'up';
    else if (recent7 < previous7) trend = 'down';

    // 计算距离上次打卡天数
    const lastLog = habitLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const daysSinceLastCheckin = lastLog
      ? Math.floor((today.getTime() - new Date(lastLog.date).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // 危险判断：连续3天未打卡且应该打卡
    const danger = daysSinceLastCheckin >= 3 && isHabitDueOnDate(habit, today);

    return {
      habitId: habit.id,
      habitName: habit.name,
      stability: Math.max(0, stability),
      trend,
      danger,
      daysSinceLastCheckin,
    };
  });
};

// 即将达成的成就
export interface UpcomingAchievement {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  remaining: number;
}

export const getUpcomingAchievements = (
  habits: Habit[],
  logs: HabitLog[]
): UpcomingAchievement[] => {
  const allStats = habits.map(h => getHabitStats(h, logs));
  const maxStreak = Math.max(...allStats.map(s => s.currentStreak), 0);
  const totalCompletions = logs.filter(l => l.completed).length;

  const upcoming: UpcomingAchievement[] = [];

  // 连续天数成就
  const streakTargets = [7, 30, 90, 180, 365];
  const streakNames: Record<number, string> = {
    7: '周战士',
    30: '月度大师',
    90: '季度冠军',
    180: '半年英雄',
    365: '年度传奇',
  };

  streakTargets.forEach(target => {
    if (maxStreak < target) {
      upcoming.push({
        id: `streak_${target}`,
        name: streakNames[target],
        description: `连续打卡${target}天`,
        progress: maxStreak,
        target,
        remaining: target - maxStreak,
      });
    }
  });

  // 累计次数成就
  const countTargets = [100, 500, 1000];
  const countNames: Record<number, string> = {
    100: '百次俱乐部',
    500: '五百次俱乐部',
    1000: '千次俱乐部',
  };

  countTargets.forEach(target => {
    if (totalCompletions < target) {
      upcoming.push({
        id: `count_${target}`,
        name: countNames[target],
        description: `累计打卡${target}次`,
        progress: totalCompletions,
        target,
        remaining: target - totalCompletions,
      });
    }
  });

  // 按剩余数量排序，取前3个
  return upcoming
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, 3);
};

// ==================== 习惯关联分析 ====================

export interface HabitCorrelation {
  habitId1: string;
  habitName1: string;
  habitId2: string;
  habitName2: string;
  correlationScore: number; // 关联度 0-100
  correlationType: 'positive' | 'negative' | 'neutral';
  description: string;
}

// 计算两个习惯的关联度
export const calculateHabitCorrelation = (
  habit1: Habit,
  habit2: Habit,
  logs: HabitLog[]
): number => {
  const logs1 = logs.filter(l => l.habitId === habit1.id && l.completed);
  const logs2 = logs.filter(l => l.habitId === habit2.id && l.completed);
  
  if (logs1.length < 5 || logs2.length < 5) return 0;
  
  const dates1 = new Set(logs1.map(l => l.date));
  const dates2 = new Set(logs2.map(l => l.date));
  
  // 计算共同完成的日期
  let sameDayCount = 0;
  let totalDays = 0;
  
  const allDates = new Set([...dates1, ...dates2]);
  allDates.forEach(date => {
    const has1 = dates1.has(date);
    const has2 = dates2.has(date);
    if (has1 && has2) sameDayCount++;
    if (has1 || has2) totalDays++;
  });
  
  if (totalDays === 0) return 0;
  
  // 关联度 = 共同完成天数 / 总天数 * 100
  return Math.round((sameDayCount / totalDays) * 100);
};

// 获取所有习惯关联分析
export const getHabitCorrelations = (
  habits: Habit[],
  logs: HabitLog[]
): HabitCorrelation[] => {
  const correlations: HabitCorrelation[] = [];
  
  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      const score = calculateHabitCorrelation(habits[i], habits[j], logs);
      
      if (score >= 30) { // 只显示关联度30%以上的
        let type: 'positive' | 'negative' | 'neutral' = 'neutral';
        let description = '';
        
        if (score >= 70) {
          type = 'positive';
          description = `「${habits[i].name}」和「${habits[j].name}」经常一起完成，是很好的习惯组合！`;
        } else if (score >= 50) {
          type = 'positive';
          description = `「${habits[i].name}」和「${habits[j].name}」有一定关联性。`;
        } else {
          type = 'neutral';
          description = `「${habits[i].name}」和「${habits[j].name}」偶尔一起完成。`;
        }
        
        correlations.push({
          habitId1: habits[i].id,
          habitName1: habits[i].name,
          habitId2: habits[j].id,
          habitName2: habits[j].name,
          correlationScore: score,
          correlationType: type,
          description,
        });
      }
    }
  }
  
  return correlations.sort((a, b) => b.correlationScore - a.correlationScore);
};

// ==================== 预测完成概率 ====================

export interface CompletionPrediction {
  habitId: string;
  habitName: string;
  todayProbability: number; // 今日完成概率 0-100
  weekProbability: number; // 本周完成概率 0-100
  trend: 'improving' | 'declining' | 'stable';
  suggestion: string;
}

// 预测习惯完成概率
export const predictCompletionProbability = (
  habit: Habit,
  logs: HabitLog[]
): CompletionPrediction => {
  const habitLogs = logs.filter(l => l.habitId === habit.id && l.completed);
  const stats = getHabitStats(habit, logs);
  
  // 基于历史完成率计算基础概率
  let baseProbability = stats.completionRate;
  
  // 基于最近7天趋势调整
  const last7Days: number[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const completed = habitLogs.some(l => l.date === dateStr) ? 1 : 0;
    last7Days.push(completed);
  }
  
  const recent7Sum = last7Days.slice(-7).reduce((a, b) => a + b, 0);
  const trend = recent7Sum >= 5 ? 'improving' : recent7Sum >= 3 ? 'stable' : 'declining';
  
  // 调整概率
  let todayProbability = baseProbability;
  if (trend === 'improving') todayProbability = Math.min(100, todayProbability + 15);
  else if (trend === 'declining') todayProbability = Math.max(0, todayProbability - 15);
  
  // 本周概率（基于当前是周几）
  const dayOfWeek = today.getDay();
  const daysLeft = 7 - dayOfWeek;
  const weekProbability = Math.min(100, todayProbability + (daysLeft * 5));
  
  // 生成建议
  let suggestion = '';
  if (todayProbability >= 80) {
    suggestion = '保持这个节奏，你做得很好！';
  } else if (todayProbability >= 50) {
    suggestion = '今天记得打卡，保持连续性！';
  } else if (stats.currentStreak > 0) {
    suggestion = `已连续${stats.currentStreak}天，今天不要中断！`;
  } else {
    suggestion = '从今天开始，建立新的连续记录！';
  }
  
  return {
    habitId: habit.id,
    habitName: habit.name,
    todayProbability: Math.round(todayProbability),
    weekProbability: Math.round(weekProbability),
    trend,
    suggestion,
  };
};

// 获取所有习惯的完成预测
export const getAllCompletionPredictions = (
  habits: Habit[],
  logs: HabitLog[]
): CompletionPrediction[] => {
  return habits
    .filter(h => !h.archived && !h.paused)
    .map(h => predictCompletionProbability(h, logs))
    .sort((a, b) => b.todayProbability - a.todayProbability);
};
