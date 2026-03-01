import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Dimensions,
  Alert,
  Animated,
  RefreshControl,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { Habit, HabitLog, HabitStats } from '../types';
import { Colors } from '../constants/colors';
import { habitStorage, habitLogStorage, customCategoryStorage, CustomCategory, defaultCategoryOverrideStorage, DefaultCategoryOverride } from '../utils/storage';
import { getTodayString, formatDate } from '../utils/date';
import { generateId } from '../utils/id';
import {
  HealthIcon,
  StudyIcon,
  WorkIcon,
  HomeIcon,
  SportIcon,
  ReadIcon,
  MeditationIcon,
  OtherIcon,
  CheckIcon,
  StarIcon,
  SunIcon,
  MoonIcon,
  FireIcon,
  MuscleIcon,
  YogaIcon,
  MusicIcon,
  ArtIcon,
  BulbIcon,
  CoffeeIcon,
  AppleIcon,
  RunIcon,
  CloseIcon,
  SparkleIcon,
  CrownIcon,
  TrendUpIcon,
  TrendDownIcon,
  TrendStableIcon,
} from '../components/Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==================== 常量定义 ====================

// 习惯分类预设
const HABIT_CATEGORIES = [
  { id: 'health', name: '健康', color: '#22c55e', iconComponent: HealthIcon },
  { id: 'study', name: '学习', color: '#3b82f6', iconComponent: StudyIcon },
  { id: 'work', name: '工作', color: '#f59e0b', iconComponent: WorkIcon },
  { id: 'life', name: '生活', color: '#8b5cf6', iconComponent: HomeIcon },
  { id: 'sport', name: '运动', color: '#ef4444', iconComponent: SportIcon },
  { id: 'read', name: '阅读', color: '#14b8a6', iconComponent: ReadIcon },
  { id: 'meditation', name: '冥想', color: '#ec4899', iconComponent: MeditationIcon },
  { id: 'other', name: '其他', color: '#6b7280', iconComponent: OtherIcon },
];

// 习惯颜色预设
const HABIT_COLORS = [
  '#000000', '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

// 习惯图标预设（使用组件名称）
const HABIT_ICONS = [
  { name: 'check', component: CheckIcon },
  { name: 'star', component: StarIcon },
  { name: 'heart', component: HealthIcon },
  { name: 'sun', component: SunIcon },
  { name: 'moon', component: MoonIcon },
  { name: 'fire', component: FireIcon },
  { name: 'muscle', component: MuscleIcon },
  { name: 'yoga', component: YogaIcon },
  { name: 'music', component: MusicIcon },
  { name: 'art', component: ArtIcon },
  { name: 'bulb', component: BulbIcon },
  { name: 'coffee', component: CoffeeIcon },
  { name: 'apple', component: AppleIcon },
  { name: 'run', component: RunIcon },
  { name: 'book', component: ReadIcon },
];

// 图标名称到组件的映射
const ICON_COMPONENT_MAP: { [key: string]: React.FC<{ size?: number; color?: string }> } = {
  'check': CheckIcon,
  'star': StarIcon,
  'heart': HealthIcon,
  'sun': SunIcon,
  'moon': MoonIcon,
  'fire': FireIcon,
  'muscle': MuscleIcon,
  'yoga': YogaIcon,
  'music': MusicIcon,
  'art': ArtIcon,
  'bulb': BulbIcon,
  'coffee': CoffeeIcon,
  'apple': AppleIcon,
  'run': RunIcon,
  'book': ReadIcon,
  'health': HealthIcon,
  'study': StudyIcon,
  'work': WorkIcon,
  'life': HomeIcon,
  'sport': SportIcon,
  'read': ReadIcon,
  'meditation': MeditationIcon,
  'other': OtherIcon,
  'sparkle': SparkleIcon,
  'crown': CrownIcon,
};

// 兼容旧数据的 emoji 映射 - 映射到 SVG 图标名称
const LEGACY_EMOJI_MAP: { [key: string]: string } = {
  '✓': 'check', '★': 'star', '♥': 'heart', '☀': 'sun', '☽': 'moon',
  '⚡': 'fire', '💪': 'muscle', '🧘': 'yoga', '🎵': 'music', '🎨': 'art',
  '💡': 'bulb', '☕': 'coffee', '🍎': 'apple', '🏃': 'run', '📚': 'read',
  '❤️': 'heart', '🏠': 'life', '📖': 'read', '🌙': 'moon', '💼': 'work',
};

// 获取图标组件
const getIconComponent = (icon: string): React.FC<{ size?: number; color?: string }> => {
  if (ICON_COMPONENT_MAP[icon]) return ICON_COMPONENT_MAP[icon];
  if (LEGACY_EMOJI_MAP[icon]) return ICON_COMPONENT_MAP[LEGACY_EMOJI_MAP[icon]] || CheckIcon;
  return CheckIcon;
};

// 获取图标符号（已废弃，使用 SVG 图标替代）
const getIconSymbol = (icon: string): string => {
  // 返回空字符串，因为现在使用 SVG 图标
  return '';
};

// 热力图颜色
const HEATMAP_COLORS = {
  0: '#F3F4F6',
  1: '#D1D5DB',
  2: '#9CA3AF',
  3: '#6B7280',
  4: '#000000',
};

type TabType = 'overview' | 'habits' | 'insights' | 'archived';
type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'custom';

// ==================== 日历网格组件 ====================
interface CalendarGridProps {
  habit: Habit;
  habitLogs: HabitLog[];
  onDatePress: (habit: Habit, dateStr: string) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ habit, habitLogs, onDatePress }) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const todayDate = now.getDate();
  
  console.log('CalendarGrid render', { year, month: month + 1, daysInMonth, todayDate, now: now.toISOString() });

  const days = [];

  // 空白填充
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(<View key={`empty-${i}`} style={styles.calendarEmptyCell} />);
  }

  // 日期
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const log = habitLogs.find(l => l.habitId === habit.id && l.date === dateStr);
    const isToday = day === todayDate;

    const today3 = new Date();
    today3.setHours(0, 0, 0, 0);
    const cellDate = new Date(year, month, day);
    cellDate.setHours(0, 0, 0, 0);
    const diffTime = today3.getTime() - cellDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const canCheckin = diffDays >= 0 && diffDays <= 30;
    const isFuture = diffDays < 0;
    
    if (day <= 3) {
      console.log('CalendarGrid day debug', { day, dateStr, today3: today3.toISOString(), cellDate: cellDate.toISOString(), diffDays, canCheckin, isFuture });
    }

    days.push(
      <TouchableOpacity
        key={day}
        style={[
          styles.calendarCell,
          log?.completed && { backgroundColor: '#000000' },
          isToday && styles.calendarCellToday,
          !log?.completed && canCheckin && styles.calendarCellClickable,
        ]}
        onPress={() => {
          console.log('CalendarGrid cell pressed', { day, dateStr, habitId: habit?.id });
          onDatePress(habit, dateStr);
        }}
        disabled={isFuture || (!canCheckin && !log?.completed)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.calendarCellText,
          log?.completed && styles.calendarCellTextCompleted,
        ]}>
          {day}
        </Text>
      </TouchableOpacity>
    );
  }

  return <View style={styles.calendarGrid}>{days}</View>;
};

// ==================== 主组件 ====================

export default function HabitScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // 热力图年份切换
  const [heatmapYear, setHeatmapYear] = useState<number>(new Date().getFullYear());
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState<string | null>(null);
  
  // 动画值
  const [checkAnimations] = useState<{ [key: string]: Animated.Value }>({});
  
  // 添加/编辑习惯弹窗状态
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitName, setHabitName] = useState('');
  const [habitColor, setHabitColor] = useState(HABIT_COLORS[0]);
  const [habitIcon, setHabitIcon] = useState(HABIT_ICONS[0].name);
  const [habitCategory, setHabitCategory] = useState('other');
  const [habitFrequency, setHabitFrequency] = useState<FrequencyType>('daily');
  const [habitFrequencyInterval, setHabitFrequencyInterval] = useState<number>(2);
  const [habitTarget, setHabitTarget] = useState<'streak' | 'count' | 'none'>('none');
  const [habitTargetValue, setHabitTargetValue] = useState<number>(21);
  const [habitDeadline, setHabitDeadline] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 习惯详情弹窗状态
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  // 补卡弹窗状态
  const [showMakeupModal, setShowMakeupModal] = useState(false);
  const [makeupDate, setMakeupDate] = useState<string>('');
  const [makeupNote, setMakeupNote] = useState<string>('');

  // 打卡备注弹窗状态
  const [showCheckinNoteModal, setShowCheckinNoteModal] = useState(false);
  const [checkinNoteHabit, setCheckinNoteHabit] = useState<Habit | null>(null);
  const [checkinNoteText, setCheckinNoteText] = useState('');
  const [checkinNoteDate, setCheckinNoteDate] = useState<string>('');

  // 自定义分类
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(HABIT_COLORS[0]);

  // 默认分类覆盖（用户修改后的默认分类）
  const [defaultCategoryOverrides, setDefaultCategoryOverrides] = useState<DefaultCategoryOverride[]>([]);
  
  // 编辑分类状态
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; color: string; isCustom: boolean } | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryColor, setEditCategoryColor] = useState(HABIT_COLORS[0]);

  // 下拉刷新状态
  const [refreshing, setRefreshing] = useState(false);

  // 拖拽排序状态
  const [draggingHabitId, setDraggingHabitId] = useState<string | null>(null);
  const [dragY, setDragY] = useState<number>(0);
  const dragAnimatedValue = useRef(new Animated.Value(0)).current;

  const loadData = async () => {
    const [habitsData, logsData, categoriesData, overridesData] = await Promise.all([
      habitStorage.get(),
      habitLogStorage.get(),
      customCategoryStorage.get(),
      defaultCategoryOverrideStorage.get(),
    ]);
    if (habitsData) setHabits(habitsData);
    if (logsData) setHabitLogs(logsData);
    if (categoriesData) setCustomCategories(categoriesData);
    if (overridesData) setDefaultCategoryOverrides(overridesData);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  // 合并预设分类和自定义分类（应用用户对默认分类的修改）
  const getAllCategories = () => {
    const presetCategories = HABIT_CATEGORIES.map(cat => {
      const override = defaultCategoryOverrides.find(o => o.id === cat.id);
      return {
        id: cat.id,
        name: override?.name ?? cat.name,
        color: override?.color ?? cat.color,
        icon: cat.iconComponent.name || cat.id,
        isCustom: false,
      };
    });
    const customCats = customCategories.map(cat => ({
      ...cat,
      isCustom: true,
    }));
    return [...presetCategories, ...customCats];
  };

  // 获取默认分类的原始数据
  const getDefaultCategoryBase = (id: string) => {
    return HABIT_CATEGORIES.find(cat => cat.id === id);
  };

  // 获取完成率提示文本
  const getCompletionRateLabel = (habit: Habit): string => {
    const targetType = habit.target?.type || 'none';
    switch (targetType) {
      case 'streak':
        return '连续';
      case 'count':
        return '累计';
      default:
        return '今日';
    }
  };

  // 获取分类的显示信息（应用覆盖）
  const getCategoryDisplayInfo = (id: string) => {
    // 先检查是否是默认分类
    const defaultCat = HABIT_CATEGORIES.find(cat => cat.id === id);
    if (defaultCat) {
      const override = defaultCategoryOverrides.find(o => o.id === id);
      return {
        id: defaultCat.id,
        name: override?.name ?? defaultCat.name,
        color: override?.color ?? defaultCat.color,
        iconComponent: defaultCat.iconComponent,
        isCustom: false,
      };
    }
    // 检查是否是自定义分类
    const customCat = customCategories.find(cat => cat.id === id);
    if (customCat) {
      return {
        id: customCat.id,
        name: customCat.name,
        color: customCat.color,
        iconComponent: OtherIcon,
        isCustom: true,
      };
    }
    return null;
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const saveHabits = async (newHabits: Habit[]) => {
    setHabits(newHabits);
    await habitStorage.set(newHabits);
  };

  const saveHabitLogs = async (newLogs: HabitLog[]) => {
    setHabitLogs(newLogs);
    await habitLogStorage.set(newLogs);
  };

  // ==================== 工具函数 ====================

  const getHabitStats = (habit: Habit): HabitStats => {
    const logs = habitLogs.filter(log => log.habitId === habit.id);
    const completedLogs = logs.filter(log => log.completed);
    const totalCompletions = completedLogs.reduce((sum, log) => sum + log.count, 0);

    // 计算连续打卡天数
    const sortedDates = completedLogs
      .map(log => log.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

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

    // 计算完成率：基于目标值
    const targetValue = habit.target?.value || 1;
    const targetType = habit.target?.type || 'none';
    const todayLog = logs.find(log => log.date === getTodayString());
    const todayCount = todayLog?.count || 0;
    let completionRate = 0;
    
    if (targetType === 'streak') {
      // 连续打卡目标：当前连续天数 / 目标天数
      completionRate = Math.min(100, Math.round((currentStreak / targetValue) * 100));
    } else if (targetType === 'count') {
      // 累计打卡目标：总打卡次数 / 目标次数
      completionRate = Math.min(100, Math.round((totalCompletions / targetValue) * 100));
    } else {
      // 无目标：基于今日完成情况
      completionRate = Math.min(100, Math.round((todayCount / targetValue) * 100));
    }

    const today2 = new Date();
    const currentDay = today2.getDay();
    const weekStart = new Date(today2);
    weekStart.setDate(today2.getDate() - currentDay);
    const weeklyStats: number[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLogs = logs.filter(log => log.date === dateStr && log.completed);
      weeklyStats.push(dayLogs.reduce((sum, log) => sum + log.count, 0));
    }

    const currentYear = today2.getFullYear();
    const currentMonth = today2.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthlyStats: number[] = new Array(daysInMonth).fill(0);

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayLogs = logs.filter(log => log.date === dateStr && log.completed);
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

  const isCompletedToday = (habitId: string): boolean => {
    const today = getTodayString();
    return habitLogs.some(log => log.habitId === habitId && log.date === today && log.completed);
  };

  const isHabitDueOnDate = (habit: Habit, date: Date): boolean => {
    if (!habit || !habit.frequency) return true;
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

  const formatFrequency = (habit: Habit): string => {
    if (!habit || !habit.frequency) return '每天';
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

  // ==================== 统计数据 ====================

  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = getTodayString();

    // 只统计活跃习惯（未归档、未暂停）
    const activeHabits = habits.filter(h => !h.archived && !h.paused);

    // 今日统计
    const todayCompleted = activeHabits.filter(h => isCompletedToday(h.id)).length;
    const todayPending = activeHabits.filter(h => isHabitDueOnDate(h, today)).length;
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
      const dayLogs = habitLogs.filter(l => l.date === dateStr && l.completed);
      weekCompleted += dayLogs.length;
      weekTarget += activeHabits.filter(h => isHabitDueOnDate(h, date)).length;
    }
    const weekRate = weekTarget > 0 ? Math.round((weekCompleted / weekTarget) * 100) : 0;

    // 本月统计
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    let monthCompleted = 0;
    let monthTarget = 0;
    for (let d = new Date(monthStart); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayLogs = habitLogs.filter(l => l.date === dateStr && l.completed);
      monthCompleted += dayLogs.length;
      monthTarget += activeHabits.filter(h => isHabitDueOnDate(h, d)).length;
    }
    const monthRate = monthTarget > 0 ? Math.round((monthCompleted / monthTarget) * 100) : 0;

    // 总打卡次数
    const totalCompletions = habitLogs.filter(l => l.completed).length;

    // 平均连续天数
    const allStreaks = activeHabits.map(h => getHabitStats(h).currentStreak);
    const avgStreak = allStreaks.length > 0
      ? Math.round(allStreaks.reduce((a, b) => a + b, 0) / allStreaks.length)
      : 0;

    // 最长连续
    const maxStreak = Math.max(0, ...activeHabits.map(h => getHabitStats(h).longestStreak));

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
      maxStreak,
    };
  }, [habits, habitLogs]);

  // ==================== 热力图数据 ====================

  const heatmapData = useMemo(() => {
    const data: { date: string; intensity: number }[] = [];
    const startDate = new Date(heatmapYear, 0, 1);
    const endDate = new Date(heatmapYear, 11, 31);

    // 调整到周一开始
    const firstDay = startDate.getDay();
    const daysFromPrevYear = firstDay === 0 ? 6 : firstDay - 1;
    startDate.setDate(startDate.getDate() - daysFromPrevYear);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      let completedCount = 0;
      habits.forEach(habit => {
        const record = habitLogs.find(l => l.habitId === habit.id && l.date === dateStr);
        if (record?.completed) completedCount++;
      });

      const intensity = habits.length > 0 
        ? Math.min(4, Math.floor((completedCount / habits.length) * 5))
        : 0;

      data.push({ date: dateStr, intensity });
    }

    return data;
  }, [habits, habitLogs, heatmapYear]);

  // 获取选中日期的打卡详情
  const getDateDetails = (dateStr: string) => {
    const dayLogs = habitLogs.filter(l => l.date === dateStr && l.completed);
    const habitsCompleted = dayLogs.map(log => {
      const habit = habits.find(h => h.id === log.habitId);
      return {
        habitName: habit?.name || '未知习惯',
        count: log.count,
        isMakeup: log.isMakeup,
        note: log.note,
      };
    });
    return { date: dateStr, habitsCompleted };
  };

  // ==================== 操作函数 ====================

  // 根据打卡次数和目标获取颜色深浅
  const getCheckinColor = (count: number, target: number): string => {
    if (count === 0) return '#F3F4F6'; // 未打卡 - 浅灰背景
    const ratio = count / target;
    if (ratio <= 0.25) return '#D1D5DB'; // 1-25% - 浅灰
    if (ratio <= 0.5) return '#9CA3AF';  // 26-50% - 中浅灰
    if (ratio <= 0.75) return '#6B7280'; // 51-75% - 中灰
    return '#000000'; // 76-100%+ - 黑色
  };

  // 点击打卡 - 累加次数
  const handleCheckin = async (habit: Habit) => {
    // 触发动画
    if (!checkAnimations[habit.id]) {
      checkAnimations[habit.id] = new Animated.Value(1);
    }
    
    Animated.sequence([
      Animated.timing(checkAnimations[habit.id], {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(checkAnimations[habit.id], {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    const today = getTodayString();
    const existingLog = habitLogs.find(l => l.habitId === habit.id && l.date === today);

    if (existingLog) {
      // 累加打卡次数
      const newLogs = habitLogs.map(l =>
        l.id === existingLog.id
          ? { ...l, count: l.count + 1, completed: true }
          : l
      );
      await saveHabitLogs(newLogs);
    } else {
      // 第一次打卡，弹出备注输入
      setCheckinNoteHabit(habit);
      setCheckinNoteDate(today);
      setCheckinNoteText('');
      setShowCheckinNoteModal(true);
    }
  };

  // 保存带备注的打卡记录
  const saveCheckinWithNote = async () => {
    if (!checkinNoteHabit) return;

    const newLog: HabitLog = {
      id: generateId(),
      habitId: checkinNoteHabit.id,
      date: checkinNoteDate,
      completed: true,
      count: 1,
      note: checkinNoteText.trim() || undefined,
      isMakeup: false,
      createdAt: new Date().toISOString(),
    };
    await saveHabitLogs([...habitLogs, newLog]);
    setShowCheckinNoteModal(false);
    setCheckinNoteHabit(null);
    setCheckinNoteText('');
  };

  // 长按菜单
  const showCheckinMenu = (habit: Habit) => {
    const today = getTodayString();
    const existingLog = habitLogs.find(l => l.habitId === habit.id && l.date === today);
    const currentCount = existingLog?.count || 0;

    const options: Array<{ text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void }> = [
      { text: '取消', style: 'cancel' },
    ];

    if (currentCount > 0) {
      options.unshift({
        text: '减1次',
        onPress: async () => {
          if (existingLog) {
            if (existingLog.count <= 1) {
              // 如果只剩1次，删除记录
              const newLogs = habitLogs.filter(l => l.id !== existingLog.id);
              await saveHabitLogs(newLogs);
            } else {
              // 否则减1
              const newLogs = habitLogs.map(l =>
                l.id === existingLog.id
                  ? { ...l, count: l.count - 1 }
                  : l
              );
              await saveHabitLogs(newLogs);
            }
          }
        },
      });
      options.unshift({
        text: '归零',
        style: 'destructive',
        onPress: async () => {
          if (existingLog) {
            const newLogs = habitLogs.filter(l => l.id !== existingLog.id);
            await saveHabitLogs(newLogs);
          }
        },
      });
    }

    options.unshift({
      text: '补卡',
      onPress: () => openMakeupModal(habit),
    });

    Alert.alert(
      habit.name,
      currentCount > 0 ? `今日已打卡 ${currentCount} 次` : '今日未打卡',
      options
    );
  };

  // 获取今日打卡次数
  const getTodayCheckinCount = (habitId: string): number => {
    const today = getTodayString();
    const log = habitLogs.find(l => l.habitId === habitId && l.date === today);
    return log?.count || 0;
  };

  const openAddModal = () => {
    setEditingHabit(null);
    setHabitName('');
    setHabitColor(HABIT_COLORS[0]);
    setHabitIcon(HABIT_ICONS[0].name);
    setHabitCategory('other');
    setHabitFrequency('daily');
    setHabitFrequencyInterval(2);
    setHabitTarget('streak');
    setHabitTargetValue(21);
    setHabitDeadline('');
    setShowModal(true);
  };

  // 添加自定义分类
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory = await customCategoryStorage.add({
      name: newCategoryName.trim(),
      color: newCategoryColor,
      icon: 'square',
    });
    
    setCustomCategories([...customCategories, newCategory]);
    setNewCategoryName('');
    setShowCategoryModal(false);
  };

  // 删除自定义分类
  const handleDeleteCategory = async (categoryId: string) => {
    await customCategoryStorage.remove(categoryId);
    setCustomCategories(customCategories.filter(c => c.id !== categoryId));
  };

  // 开始编辑分类
  const startEditCategory = (category: { id: string; name: string; color: string; isCustom: boolean }) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryColor(category.color);
  };

  // 保存分类编辑
  const handleSaveCategoryEdit = async () => {
    if (!editingCategory || !editCategoryName.trim()) return;

    if (editingCategory.isCustom) {
      // 更新自定义分类
      await customCategoryStorage.update(editingCategory.id, {
        name: editCategoryName.trim(),
        color: editCategoryColor,
      });
      setCustomCategories(customCategories.map(c =>
        c.id === editingCategory.id
          ? { ...c, name: editCategoryName.trim(), color: editCategoryColor }
          : c
      ));
    } else {
      // 更新默认分类覆盖
      await defaultCategoryOverrideStorage.update({
        id: editingCategory.id,
        name: editCategoryName.trim(),
        color: editCategoryColor,
      });
      setDefaultCategoryOverrides(prev => {
        const existing = prev.find(o => o.id === editingCategory.id);
        if (existing) {
          return prev.map(o =>
            o.id === editingCategory.id
              ? { ...o, name: editCategoryName.trim(), color: editCategoryColor }
              : o
          );
        }
        return [...prev, { id: editingCategory.id, name: editCategoryName.trim(), color: editCategoryColor }];
      });
    }

    setEditingCategory(null);
    setEditCategoryName('');
  };

  // 取消编辑分类
  const cancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryName('');
  };

  // 重置默认分类为初始值
  const handleResetDefaultCategory = async (categoryId: string) => {
    await defaultCategoryOverrideStorage.remove(categoryId);
    setDefaultCategoryOverrides(prev => prev.filter(o => o.id !== categoryId));
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitName(habit.name);
    setHabitColor(habit.color);
    setHabitIcon(habit.icon);
    setHabitCategory(habit.category);
    setHabitFrequency(habit.frequency?.type || 'daily');
    setHabitFrequencyInterval(habit.frequency?.interval || 2);
    setHabitTarget(habit.target?.type || 'streak');
    setHabitTargetValue(habit.target?.value || 21);
    setHabitDeadline(habit.target?.deadline || '');
    setShowModal(true);
  };

  const saveHabit = async () => {
    if (!habitName.trim()) {
      Alert.alert('提示', '请输入习惯名称');
      return;
    }

    const frequencyConfig = {
      type: habitFrequency,
      days: habitFrequency === 'daily' ? [1, 2, 3, 4, 5, 6, 7] :
            habitFrequency === 'weekly' ? [1, 2, 3, 4, 5] :
            habitFrequency === 'monthly' ? [1, 15] : undefined,
      interval: habitFrequency === 'custom' ? habitFrequencyInterval : undefined,
    };

    const targetConfig = {
      type: habitTarget,
      value: habitTarget !== 'none' ? habitTargetValue : undefined,
      deadline: habitDeadline || undefined,
    };

    if (editingHabit) {
      // 编辑现有习惯
      const updatedHabits = habits.map(h =>
        h.id === editingHabit.id
          ? {
              ...h,
              name: habitName.trim(),
              color: habitColor,
              icon: habitIcon,
              category: habitCategory,
              frequency: frequencyConfig,
              target: targetConfig,
            }
          : h
      );
      await saveHabits(updatedHabits);
    } else {
      // 创建新习惯
      const newHabit: Habit = {
        id: generateId(),
        name: habitName.trim(),
        description: '',
        color: habitColor,
        icon: habitIcon,
        category: habitCategory,
        tags: [],
        frequency: frequencyConfig,
        target: targetConfig,
        reminders: [],
        createdAt: new Date().toISOString(),
        archived: false,
        paused: false,
        order: habits.length,
      };
      await saveHabits([...habits, newHabit]);
    }

    setShowModal(false);
  };

  const confirmDeleteHabit = (habit: Habit) => {
    Alert.alert(
      '删除习惯',
      `确定要删除「${habit.name}」吗？所有相关记录也将被删除。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const newHabits = habits.filter(h => h.id !== habit.id);
            const newLogs = habitLogs.filter(l => l.habitId !== habit.id);
            await saveHabits(newHabits);
            await saveHabitLogs(newLogs);
          }
        },
      ]
    );
  };

  const togglePauseHabit = async (habit: Habit) => {
    const updatedHabits = habits.map(h =>
      h.id === habit.id
        ? { ...h, paused: !h.paused }
        : h
    );
    await saveHabits(updatedHabits);
    // 更新选中的习惯状态
    setSelectedHabit({ ...habit, paused: !habit.paused });
  };

  const toggleArchiveHabit = async (habit: Habit) => {
    const updatedHabits = habits.map(h =>
      h.id === habit.id
        ? { ...h, archived: !h.archived }
        : h
    );
    await saveHabits(updatedHabits);
    // 更新选中的习惯状态
    setSelectedHabit({ ...habit, archived: !habit.archived });
  };

  const openHabitDetail = (habit: Habit) => {
    setSelectedHabit(habit);
    setShowDetailModal(true);
  };

  // ==================== 补卡功能 ====================

  const openMakeupModal = (habit: Habit) => {
    setSelectedHabit(habit);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    setMakeupDate(yesterday.toISOString().split('T')[0]);
    setMakeupNote('');
    setShowMakeupModal(true);
  };

  const saveMakeup = async () => {
    if (!selectedHabit || !makeupDate) {
      Alert.alert('提示', '请选择补卡日期');
      return;
    }

    // 检查日期是否在30天内
    const selectedDate = new Date(makeupDate);
    const today = new Date();
    const diffTime = today.getTime() - selectedDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
      Alert.alert('提示', '只能补打30天内的记录');
      return;
    }

    if (diffDays < 0) {
      Alert.alert('提示', '不能补打未来日期的记录');
      return;
    }

    // 检查是否已打卡
    const existingLog = habitLogs.find(l => l.habitId === selectedHabit.id && l.date === makeupDate);
    if (existingLog?.completed) {
      Alert.alert('提示', '该日期已打卡');
      return;
    }

    const newLog: HabitLog = {
      id: generateId(),
      habitId: selectedHabit.id,
      date: makeupDate,
      completed: true,
      count: 1,
      note: makeupNote || undefined,
      isMakeup: true,
      createdAt: new Date().toISOString(),
    };

    const newLogs = existingLog
      ? habitLogs.map(l => l.id === existingLog.id ? newLog : l)
      : [...habitLogs, newLog];

    await saveHabitLogs(newLogs);
    setShowMakeupModal(false);
    Alert.alert('成功', '补卡成功！');
  };

  // 点击日期格子补打卡/取消打卡
  const handleDateCellPress = async (habit: Habit, dateStr: string) => {
    console.log('handleDateCellPress called', { habitId: habit?.id, habitName: habit?.name, dateStr });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [year, month, day] = dateStr.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    selectedDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - selectedDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    console.log('date calculation', { today: today.toISOString(), selectedDate: selectedDate.toISOString(), diffDays });

    // 不能打卡未来日期
    if (diffDays < 0) {
      console.log('future date, returning');
      return;
    }

    const existingLog = habitLogs.find(l => l.habitId === habit.id && l.date === dateStr);
    console.log('existingLog', existingLog);

    if (existingLog?.completed) {
      // 已打卡 - 取消打卡
      Alert.alert(
        '取消打卡',
        `确定要取消 ${formatDate(dateStr)} 的打卡记录吗？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '确定',
            style: 'destructive',
            onPress: async () => {
              const newLogs = habitLogs.filter(l => l.id !== existingLog.id);
              await saveHabitLogs(newLogs);
            },
          },
        ]
      );
    } else {
      // 未打卡 - 补打卡
      // 检查是否超过30天
      if (diffDays > 30) {
        Alert.alert('提示', '只能补打30天内的记录');
        return;
      }

      const newLog: HabitLog = {
        id: generateId(),
        habitId: habit.id,
        date: dateStr,
        completed: true,
        count: 1,
        isMakeup: true,
        createdAt: new Date().toISOString(),
      };

      const newLogs = existingLog
        ? habitLogs.map(l => l.id === existingLog.id ? newLog : l)
        : [...habitLogs, newLog];

      await saveHabitLogs(newLogs);
    }
  };

  // ==================== 拖拽排序功能 ====================

  const moveHabit = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newHabits = [...habits];
    const [movedHabit] = newHabits.splice(fromIndex, 1);
    newHabits.splice(toIndex, 0, movedHabit);

    // 更新order字段
    const updatedHabits = newHabits.map((h, index) => ({
      ...h,
      order: index,
    }));

    await saveHabits(updatedHabits);
  };

  // ==================== 筛选后的习惯列表 ====================

  const filteredHabits = useMemo(() => {
    // 排除已归档的习惯
    const activeHabits = habits.filter(h => !h.archived);
    if (selectedCategory === 'all') return activeHabits;
    return activeHabits.filter(h => h.category === selectedCategory);
  }, [habits, selectedCategory]);

  // ==================== 渲染组件 ====================

  const renderOverview = () => {
    const today = getTodayString();

    return (
      <ScrollView 
        style={styles.tabContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 核心数据卡片 */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>今日完成</Text>
            <Text style={styles.statValue}>{stats.todayCompleted}/{stats.todayPending}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${stats.todayRate}%` }]} />
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>最长连续</Text>
            <View style={styles.streakContainer}>
              <Text style={styles.statValue}>{stats.maxStreak}</Text>
              <FireIcon size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statUnit}>天</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>本周完成率</Text>
            <Text style={styles.statValue}>{stats.weekRate}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${stats.weekRate}%` }]} />
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>总打卡次数</Text>
            <Text style={styles.statValue}>{stats.totalCompletions}</Text>
            <Text style={styles.statUnit}>次</Text>
          </View>
        </View>

        {/* 年度热力图 */}
        <View style={styles.heatmapContainer}>
          <View style={styles.heatmapHeader}>
            <View style={styles.heatmapTitleRow}>
              <TouchableOpacity 
                onPress={() => setHeatmapYear(y => y - 1)}
                style={styles.yearButton}
              >
                <Text style={styles.yearButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.heatmapYearText}>{heatmapYear}年</Text>
              <TouchableOpacity 
                onPress={() => setHeatmapYear(y => y + 1)}
                style={styles.yearButton}
                disabled={heatmapYear >= new Date().getFullYear()}
              >
                <Text style={[styles.yearButtonText, heatmapYear >= new Date().getFullYear() && styles.yearButtonDisabled]}>→</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.heatmapLegend}>
              <Text style={styles.legendText}>少</Text>
              {[0, 1, 2, 3, 4].map(level => (
                <View 
                  key={level} 
                  style={[styles.legendCell, { backgroundColor: HEATMAP_COLORS[level as keyof typeof HEATMAP_COLORS] }]} 
                />
              ))}
              <Text style={styles.legendText}>多</Text>
            </View>
          </View>
          <View style={styles.heatmapGrid}>
            {heatmapData.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.heatmapCell,
                  { backgroundColor: HEATMAP_COLORS[item.intensity as keyof typeof HEATMAP_COLORS] },
                ]}
                onPress={() => setSelectedHeatmapDate(item.date)}
              />
            ))}
          </View>
        </View>

        {/* 今日待完成 */}
        <View style={styles.todayHabitsContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>今日待完成</Text>
            <TouchableOpacity onPress={() => setActiveTab('habits')}>
              <Text style={styles.sectionLink}>查看全部 →</Text>
            </TouchableOpacity>
          </View>
          {habits
            .filter(h => !h.archived && !h.paused && isHabitDueOnDate(h, new Date()))
            .map(habit => {
              const todayCount = getTodayCheckinCount(habit.id);
              const targetValue = habit.target?.value || 1;
              const checkinColor = getCheckinColor(todayCount, targetValue);
              const stats = getHabitStats(habit);
              const isCompleted = todayCount >= targetValue;

              return (
                <Animated.View
                  key={habit.id}
                  style={[
                    styles.todayHabitItem,
                    isCompleted && styles.todayHabitItemCompleted,
                    { transform: [{ scale: checkAnimations[habit.id] || 1 }] }
                  ]}
                >
                  <View style={styles.todayHabitContent}>
                    {/* 打卡按钮 - 新设计 */}
                    <TouchableOpacity
                      style={[
                        styles.checkButtonV2,
                        { backgroundColor: checkinColor },
                        todayCount === 0 && styles.checkButtonV2Empty
                      ]}
                      onPress={() => handleCheckin(habit)}
                      onLongPress={() => showCheckinMenu(habit)}
                      activeOpacity={0.7}
                      delayLongPress={500}
                    >
                      {todayCount > 0 ? (
                        <Text style={[
                          styles.checkButtonV2Text,
                          todayCount >= targetValue * 0.75 && styles.checkButtonV2TextLight
                        ]}>
                          {todayCount}
                        </Text>
                      ) : null}
                    </TouchableOpacity>

                    {/* 习惯信息 - 点击进入详情 */}
                    <TouchableOpacity
                      style={styles.todayHabitInfo}
                      onPress={() => openHabitDetail(habit)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.todayHabitName, isCompleted && styles.todayHabitNameCompleted]}>
                        {habit.name}
                      </Text>
                      <View style={styles.todayHabitMeta}>
                        <Text style={styles.streakText}>连续 {stats.currentStreak} 天</Text>
                        <Text style={styles.frequencyText}>• {formatFrequency(habit)}</Text>
                        {targetValue > 1 && (
                          <Text style={styles.targetBadge}>目标 {targetValue} 次</Text>
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* 习惯图标 */}
                    <TouchableOpacity onPress={() => openHabitDetail(habit)}>
                      <View style={[styles.habitIconContainer, { backgroundColor: '#F5F5F5' }]}>
                        <Text style={{ fontSize: 20 }}>{getIconSymbol(habit.icon)}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              );
            })}
        </View>
      </ScrollView>
    );
  };

  const renderHabitsList = () => {
    // 按order排序
    const sortedHabits = [...filteredHabits].sort((a, b) => (a.order || 0) - (b.order || 0));

    return (
      <ScrollView 
        style={styles.tabContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 分类筛选 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
          contentContainerStyle={styles.categoryFilterContent}
        >
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>
              全部
            </Text>
          </TouchableOpacity>
          {getAllCategories().map(cat => {
            const IconComp = cat.isCustom
              ? OtherIcon
              : (HABIT_CATEGORIES.find(c => c.id === cat.id)?.iconComponent || OtherIcon);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <View style={styles.categoryChipIcon}>
                  {cat.isCustom ? (
                    <View style={[styles.customCategoryDot, { backgroundColor: cat.color }]} />
                  ) : (
                    <IconComp size={14} color={selectedCategory === cat.id ? '#FFFFFF' : cat.color} />
                  )}
                </View>
                <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 习惯列表 */}
        {sortedHabits.map((habit, index) => {
          const stats = getHabitStats(habit);
          const recentLogs = habitLogs
            .filter(l => l.habitId === habit.id)
            .slice(-30);
          const todayCount = getTodayCheckinCount(habit.id);
          const targetValue = habit.target?.value || 1;
          const checkinColor = getCheckinColor(todayCount, targetValue);

          return (
            <View
              key={habit.id}
              style={[styles.habitListCard, habit.paused && styles.habitListCardPaused]}
            >
              <TouchableOpacity
                onPress={() => openHabitDetail(habit)}
                onLongPress={() => showCheckinMenu(habit)}
                activeOpacity={0.8}
                delayLongPress={500}
              >
                <View style={styles.habitListHeader}>
                  {/* 打卡方块 - 新设计 */}
                  <TouchableOpacity
                    style={[
                      styles.habitListCheckButton,
                      { backgroundColor: checkinColor },
                      todayCount === 0 && styles.habitListCheckButtonEmpty
                    ]}
                    onPress={() => handleCheckin(habit)}
                    activeOpacity={0.7}
                  >
                    {todayCount > 0 ? (
                      <Text style={[
                        styles.habitListCheckButtonText,
                        todayCount >= targetValue * 0.75 && styles.habitListCheckButtonTextLight
                      ]}>
                        {todayCount}
                      </Text>
                    ) : (
                      <Text style={styles.habitListCheckButtonPlus}>+</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.habitListInfo}>
                    <View style={styles.habitListNameRow}>
                      <Text style={[styles.habitListName, habit.paused && styles.habitListNamePaused]}>
                        {habit.name}
                      </Text>
                      {habit.paused && (
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusBadgeText}>已暂停</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.habitListMeta}>
                      {formatFrequency(habit)} • 目标 {targetValue} 次
                    </Text>
                  </View>
                  <View style={styles.habitListStreak}>
                    <Text style={[styles.habitListStreakNumber, habit.paused && styles.habitListStreakNumberPaused]}>
                      {stats.currentStreak}
                    </Text>
                    <Text style={styles.habitListStreakLabel}>连续天数</Text>
                  </View>
                </View>

                {/* 30天打卡网格 */}
                <View style={styles.miniGrid}>
                  {Array.from({ length: 30 }).map((_, idx) => {
                    const today4 = new Date();
                    today4.setHours(0, 0, 0, 0);
                    const date = new Date(today4);
                    date.setDate(today4.getDate() - (29 - idx));
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    const log = habitLogs.find(l => l.habitId === habit.id && l.date === dateStr);
                    const isToday = idx === 29;
                    const diffDays = 29 - idx;
                    const canCheckin = diffDays >= 0 && diffDays <= 30;
                    const isFuture = diffDays < 0;

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.miniGridCell,
                          log?.completed && { backgroundColor: habit.paused ? '#9CA3AF' : '#000000' },
                          !log?.completed && { backgroundColor: '#F5F5F5' },
                          isToday && styles.miniGridCellToday,
                          !log?.completed && canCheckin && styles.miniGridCellClickable,
                        ]}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleDateCellPress(habit, dateStr);
                        }}
                        disabled={isFuture || (!canCheckin && !log?.completed) || habit.paused}
                        activeOpacity={0.7}
                      />
                    );
                  })}
                </View>

                <View style={styles.habitListFooter}>
                  <Text style={styles.habitListFooterText}>{getCompletionRateLabel(habit)}完成率 {stats.completionRate}%</Text>
                  <Text style={styles.habitListFooterText}>总打卡 {stats.totalCompletions} 次</Text>
                  <Text style={styles.habitListFooterText}>最长 {stats.longestStreak} 天</Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}</ScrollView>
    );
  };

  const renderArchivedHabits = () => {
    const archivedHabits = habits.filter(h => h.archived);

    if (archivedHabits.length === 0) {
      return (
        <View style={styles.emptyArchivedContainer}>
          <Text style={styles.emptyArchivedText}>暂无归档习惯</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.archivedSectionTitle}>已归档习惯</Text>
        <Text style={styles.archivedSectionSubtitle}>以下习惯已归档，数据保留但不再显示在列表中</Text>
        {archivedHabits.map(habit => {
          const stats = getHabitStats(habit);

          return (
            <TouchableOpacity
              key={habit.id}
              style={styles.habitListCard}
              onPress={() => openHabitDetail(habit)}
              activeOpacity={0.8}
            >
              <View style={styles.habitListHeader}>
                <View style={[styles.habitListIcon, { backgroundColor: '#9CA3AF' }]}>
                  <Text style={styles.habitListIconText}>{getIconSymbol(habit.icon)}</Text>
                </View>
                <View style={styles.habitListInfo}>
                  <View style={styles.habitListNameRow}>
                    <Text style={styles.habitListName}>{habit.name}</Text>
                    <View style={[styles.statusBadge, styles.statusBadgeArchived]}>
                      <Text style={styles.statusBadgeText}>已归档</Text>
                    </View>
                  </View>
                  <Text style={styles.habitListMeta}>
                    {formatFrequency(habit)} • 创建于 {formatDate(habit.createdAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.habitListFooter}>
                <Text style={styles.habitListFooterText}>{getCompletionRateLabel(habit)}完成率 {stats.completionRate}%</Text>
                <Text style={styles.habitListFooterText}>总打卡 {stats.totalCompletions} 次</Text>
                <Text style={styles.habitListFooterText}>最长 {stats.longestStreak} 天</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderInsights = () => {
    // 最佳习惯
    const bestHabit = habits.reduce((best, habit) => {
      if (!best) return habit;
      const bestStats = getHabitStats(best);
      const currentStats = getHabitStats(habit);
      return currentStats.longestStreak > bestStats.longestStreak ? habit : best;
    }, habits[0]);

    // 计算上周数据用于对比
    const today = new Date();
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
    let lastWeekCompleted = 0;
    let lastWeekTarget = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date(lastWeekStart);
      date.setDate(lastWeekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLogs = habitLogs.filter(l => l.date === dateStr && l.completed);
      lastWeekCompleted += dayLogs.length;
      lastWeekTarget += habits.filter(h => isHabitDueOnDate(h, date)).length;
    }
    const lastWeekRate = lastWeekTarget > 0 ? Math.round((lastWeekCompleted / lastWeekTarget) * 100) : 0;
    const weekChange = lastWeekRate > 0 ? stats.weekRate - lastWeekRate : 0;

    // 打卡时间分布
    const hourDistribution = new Array(24).fill(0);
    habitLogs.filter(l => l.completed).forEach(log => {
      const hour = new Date(log.createdAt || log.date).getHours();
      hourDistribution[hour]++;
    });
    const peakHour = hourDistribution.indexOf(Math.max(...hourDistribution));

    // 近7天趋势数据
    const last7Days: { date: string; completed: number; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLogs = habitLogs.filter(l => l.date === dateStr);
      last7Days.push({
        date: dateStr,
        completed: dayLogs.filter(l => l.completed).length,
        total: habits.filter(h => isHabitDueOnDate(h, date)).length || 1,
      });
    }

    // 每周完成次数对比数据（近4周）
    const weeklyComparison: { week: string; completed: number; target: number }[] = [];
    for (let week = 3; week >= 0; week--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() - week * 7);
      let weekCompleted = 0;
      let weekTarget = 0;
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLogs = habitLogs.filter(l => l.date === dateStr && l.completed);
        weekCompleted += dayLogs.length;
        weekTarget += habits.filter(h => isHabitDueOnDate(h, date)).length;
      }
      weeklyComparison.push({
        week: week === 0 ? '本周' : `${week}周前`,
        completed: weekCompleted,
        target: weekTarget,
      });
    }

    // 习惯完成占比数据（饼图）
    const habitCompletionData = habits
      .map(habit => {
        const habitStats = getHabitStats(habit);
        return {
          habit,
          completions: habitStats.totalCompletions,
          rate: habitStats.completionRate,
        };
      })
      .filter(item => item.completions > 0)
      .sort((a, b) => b.completions - a.completions)
      .slice(0, 5); // 取前5个

    const totalCompletions = habitCompletionData.reduce((sum, item) => sum + item.completions, 0);

    // 活跃习惯数（最近7天有打卡）
    const activeHabits = habits.filter(h => {
      const recentLogs = habitLogs.filter(l => 
        l.habitId === h.id && 
        l.completed &&
        new Date(l.date) >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      );
      return recentLogs.length > 0;
    }).length;

    // 成就数据 - 黑白极简风格
    const achievements = [
      { id: 'first', name: '第一步', desc: '完成第一次打卡', icon: '○', unlocked: stats.totalCompletions >= 1, progress: Math.min(stats.totalCompletions, 1), total: 1 },
      { id: 'week', name: '周战士', desc: '连续7天', icon: '◇', unlocked: stats.maxStreak >= 7, progress: Math.min(stats.maxStreak, 7), total: 7 },
      { id: 'month', name: '月度大师', desc: '连续30天', icon: '□', unlocked: stats.maxStreak >= 30, progress: Math.min(stats.maxStreak, 30), total: 30 },
      { id: 'hundred', name: '百次俱乐部', desc: '累计100次', icon: '●', unlocked: stats.totalCompletions >= 100, progress: Math.min(stats.totalCompletions, 100), total: 100 },
    ];

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* 核心数据圆环 - 黑白极简风格 */}
        <View style={styles.ringsContainer}>
          <View style={styles.ringWrapper}>
            <View style={styles.ringGroup}>
              {/* 今日圆环 */}
              <View style={styles.ringItem}>
                <View style={[styles.ringOuter, { borderColor: '#000000' }]}>
                  <View style={[styles.ringMiddle, { borderColor: '#00000033' }]}>
                    <View style={[styles.ringInner, { borderColor: '#00000022' }]}>
                      <Text style={styles.ringValue}>{stats.todayCompleted}</Text>
                      <Text style={styles.ringLabel}>今日</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.ringTitle}>今日完成</Text>
                <Text style={styles.ringSubtitle}>{stats.todayRate}%</Text>
              </View>
              
              {/* 本周圆环 */}
              <View style={styles.ringItem}>
                <View style={[styles.ringOuter, { borderColor: '#333333' }]}>
                  <View style={[styles.ringMiddle, { borderColor: '#33333333' }]}>
                    <View style={[styles.ringInner, { borderColor: '#33333322' }]}>
                      <Text style={styles.ringValue}>{stats.weekCompleted}</Text>
                      <Text style={styles.ringLabel}>本周</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.ringTitle}>本周完成</Text>
                <Text style={styles.ringSubtitle}>
                  {weekChange > 0 ? `↑${weekChange}%` : weekChange < 0 ? `↓${Math.abs(weekChange)}%` : '—'}
                </Text>
              </View>
              
              {/* 连续天数圆环 */}
              <View style={styles.ringItem}>
                <View style={[styles.ringOuter, { borderColor: '#666666' }]}>
                  <View style={[styles.ringMiddle, { borderColor: '#66666633' }]}>
                    <View style={[styles.ringInner, { borderColor: '#66666622' }]}>
                      <Text style={styles.ringValue}>{stats.avgStreak}</Text>
                      <Text style={styles.ringLabel}>平均</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.ringTitle}>平均连续</Text>
                <Text style={styles.ringSubtitle}>最长 {stats.maxStreak}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 快速统计卡片 */}
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatValue}>{habits.length}</Text>
            <Text style={styles.quickStatLabel}>总习惯</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatValue}>{activeHabits}</Text>
            <Text style={styles.quickStatLabel}>活跃</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatValue}>{stats.monthRate}%</Text>
            <Text style={styles.quickStatLabel}>本月</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatValue}>{peakHour}:00</Text>
            <Text style={styles.quickStatLabel}>高峰</Text>
          </View>
        </View>

        {/* 近7天趋势 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>近7天趋势</Text>
          <Text style={styles.sectionSubtitle}>打卡完成情况</Text>
        </View>
        <View style={styles.trendCard}>
          <View style={styles.trendChart}>
            {last7Days.map((day, index) => {
              const rate = day.total > 0 ? (day.completed / day.total) * 100 : 0;
              const dayName = ['日', '一', '二', '三', '四', '五', '六'][new Date(day.date).getDay()];
              const isToday = index === 6;
              
              return (
                <View key={day.date} style={styles.trendColumn}>
                  <Text style={styles.trendDayLabel}>{dayName}</Text>
                  <View style={styles.trendBarContainer}>
                    <View 
                      style={[
                        styles.trendBar, 
                        { 
                          height: `${Math.max(8, rate)}%`,
                          backgroundColor: isToday ? '#000000' : rate > 50 ? '#333333' : '#999999'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.trendValue}>{day.completed}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 每周完成次数对比 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>每周完成对比</Text>
          <Text style={styles.sectionSubtitle}>近4周打卡趋势</Text>
        </View>
        <View style={styles.trendCard}>
          <View style={styles.weeklyComparisonChart}>
            {weeklyComparison.map((week, index) => {
              const rate = week.target > 0 ? (week.completed / week.target) * 100 : 0;
              const isCurrentWeek = index === 3;
              
              return (
                <View key={week.week} style={styles.weeklyComparisonColumn}>
                  <Text style={styles.weeklyComparisonLabel}>{week.week}</Text>
                  <View style={styles.weeklyComparisonBarContainer}>
                    <View 
                      style={[
                        styles.weeklyComparisonBar, 
                        { 
                          height: `${Math.max(10, rate)}%`,
                          backgroundColor: isCurrentWeek ? '#000000' : '#666666'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.weeklyComparisonValue}>{week.completed}</Text>
                  <Text style={styles.weeklyComparisonTarget}>/{week.target}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 习惯完成占比 - 饼图 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>习惯完成占比</Text>
          <Text style={styles.sectionSubtitle}>各习惯打卡次数分布</Text>
        </View>
        <View style={styles.pieChartCard}>
          {/* 饼图 */}
          <View style={styles.pieChartContainer}>
            <View style={styles.pieChart}>
              {habitCompletionData.length > 0 ? (
                habitCompletionData.map((item, index) => {
                  const percentage = totalCompletions > 0 ? (item.completions / totalCompletions) * 100 : 0;
                  const colors = ['#000000', '#333333', '#666666', '#999999', '#CCCCCC'];
                  const startAngle = habitCompletionData
                    .slice(0, index)
                    .reduce((sum, prev) => sum + (prev.completions / totalCompletions) * 360, 0);
                  const endAngle = startAngle + (percentage / 100) * 360;
                  
                  return (
                    <View
                      key={item.habit.id}
                      style={[
                        styles.pieSlice,
                        {
                          backgroundColor: colors[index % colors.length],
                          transform: [
                            { rotate: `${startAngle}deg` },
                          ],
                        }
                      ]}
                    />
                  );
                })
              ) : (
                <View style={[styles.pieSlice, { backgroundColor: '#E5E7EB' }]} />
              )}
              <View style={styles.pieCenter}>
                <Text style={styles.pieCenterText}>{totalCompletions}</Text>
                <Text style={styles.pieCenterLabel}>总次数</Text>
              </View>
            </View>
          </View>
          
          {/* 图例 */}
          <View style={styles.pieLegend}>
            {habitCompletionData.map((item, index) => {
              const percentage = totalCompletions > 0 ? Math.round((item.completions / totalCompletions) * 100) : 0;
              const colors = ['#000000', '#333333', '#666666', '#999999', '#CCCCCC'];
              
              return (
                <View key={item.habit.id} style={styles.pieLegendItem}>
                  <View style={[styles.pieLegendColor, { backgroundColor: colors[index % colors.length] }]} />
                  <View style={styles.pieLegendInfo}>
                    <Text style={styles.pieLegendName} numberOfLines={1}>{item.habit.name}</Text>
                    <Text style={styles.pieLegendValue}>{item.completions}次 ({percentage}%)</Text>
                  </View>
                </View>
              );
            })}
            {habitCompletionData.length === 0 && (
              <Text style={styles.pieEmptyText}>暂无打卡数据</Text>
            )}
          </View>
        </View>

        {/* 习惯对比 - 卡片式设计 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleLarge}>习惯对比</Text>
          <Text style={styles.sectionSubtitle}>完成率排行</Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.comparisonScroll}
        >
          {habits
            .map(habit => ({ ...habit, stats: getHabitStats(habit) }))
            .sort((a, b) => b.stats.completionRate - a.stats.completionRate)
            .map((habit, index) => {
              const isTop = index === 0 && habits.length > 1;
              return (
                <TouchableOpacity 
                  key={habit.id} 
                  style={[styles.comparisonCard, isTop && styles.comparisonCardTop]}
                  onPress={() => openHabitDetail(habit)}
                  activeOpacity={0.8}
                >
                  <View style={styles.comparisonCardHeader}>
                    <View style={[styles.comparisonCardIcon, { backgroundColor: isTop ? habit.color + '20' : '#F5F5F5' }]}>
                      {React.createElement(getIconComponent(habit.icon), { size: 24, color: isTop ? habit.color : '#000000' })}
                    </View>
                    {isTop && (
                      <View style={styles.crownBadge}>
                        <StarIcon size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.comparisonCardName, isTop && styles.comparisonCardNameTop]} numberOfLines={1}>{habit.name}</Text>
                  <Text style={[styles.comparisonCardStreak, isTop && styles.comparisonCardStreakTop]}>连续 {habit.stats.currentStreak} 天</Text>
                  <View style={styles.comparisonCardProgress}>
                    <View 
                      style={[
                        styles.comparisonCardProgressFill, 
                        { width: `${habit.stats.completionRate}%`, backgroundColor: isTop ? '#FFFFFF' : '#000000' }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.comparisonCardRate, isTop && styles.comparisonCardRateTop]}>
                    {habit.stats.completionRate}%
                  </Text>
                </TouchableOpacity>
              );
            })}
        </ScrollView>

        {/* 成就徽章 - 黑白极简风格 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleLarge}>成就徽章</Text>
          <Text style={styles.sectionSubtitle}>{achievements.filter(a => a.unlocked).length}/{achievements.length} 已解锁</Text>
        </View>
        <View style={styles.achievementsContainer}>
          {achievements.map(achievement => (
            <View 
              key={achievement.id} 
              style={[
                styles.achievementBadge,
                achievement.unlocked && styles.achievementBadgeUnlocked
              ]}
            >
              <View style={[
                styles.achievementRing,
                { borderColor: achievement.unlocked ? '#000000' : '#E5E5E5' }
              ]}>
                <View style={[
                  styles.achievementInner,
                  { backgroundColor: achievement.unlocked ? '#000000' : '#FAFAFA' }
                ]}>
                  <Text style={[
                    styles.achievementIcon,
                    !achievement.unlocked && styles.achievementIconLocked,
                    achievement.unlocked && { color: '#FFFFFF' }
                  ]}>
                    {achievement.icon}
                  </Text>
                </View>
              </View>
              <Text style={[
                styles.achievementName,
                !achievement.unlocked && styles.achievementNameLocked
              ]}>
                {achievement.name}
              </Text>
              <Text style={styles.achievementDesc}>{achievement.desc}</Text>
              {!achievement.unlocked && (
                <Text style={styles.achievementProgress}>
                  {achievement.progress}/{achievement.total}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* 习惯大师成就 */}
        {(() => {
          const { getMasterAchievements } = require('../utils/habitUtils');
          const masterAchievements = getMasterAchievements(habits, habitLogs);
          if (masterAchievements.length === 0) return null;
          
          return (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleLarge}>习惯大师</Text>
                <Text style={styles.sectionSubtitle}>同时维持多个习惯的成就</Text>
              </View>
              <View style={styles.masterAchievementsContainer}>
                {masterAchievements.map((achievement: {id: string; name: string; description: string; icon: string; unlocked: boolean; progress: number; required: number; target: number}) => {
                  const IconComponent = getIconComponent(achievement.icon);
                  return (
                    <View 
                      key={achievement.id} 
                      style={[
                        styles.masterAchievementItem,
                        achievement.unlocked && styles.masterAchievementItemUnlocked
                      ]}
                    >
                      <View style={styles.masterAchievementLeft}>
                        {IconComponent && (
                          <IconComponent 
                            size={28} 
                            color={achievement.unlocked ? '#000000' : '#9CA3AF'} 
                          />
                        )}
                        <View>
                          <Text style={[
                            styles.masterAchievementName,
                            !achievement.unlocked && styles.masterAchievementNameLocked
                          ]}>
                            {achievement.name}
                          </Text>
                          <Text style={styles.masterAchievementDesc}>{achievement.description}</Text>
                        </View>
                      </View>
                      <View style={styles.masterAchievementRight}>
                        {!achievement.unlocked ? (
                          <View style={styles.masterAchievementProgress}>
                            <View style={styles.masterAchievementProgressTrack}>
                              <View 
                                style={[
                                  styles.masterAchievementProgressFill,
                                  { width: `${(achievement.progress / achievement.target) * 100}%` }
                                ]} 
                              />
                            </View>
                            <Text style={styles.masterAchievementProgressText}>
                              {achievement.progress}/{achievement.target}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.masterAchievementUnlockedBadge}>
                            <CheckIcon size={14} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          );
        })()}

        {/* 周期性分析 - 黑白极简 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleLarge}>周期分析</Text>
          <Text style={styles.sectionSubtitle}>本周打卡规律</Text>
        </View>
        <View style={styles.weeklyAnalysisCard}>
          <View style={styles.weekDayHeader}>
            {['一', '二', '三', '四', '五', '六', '日'].map((day, i) => (
              <Text key={i} style={styles.weekDayLabel}>{day}</Text>
            ))}
          </View>
          <View style={styles.weeklyBars}>
            {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
              let total = 0;
              let completed = 0;
              
              habits.forEach(habit => {
                habitLogs.forEach(log => {
                  const date = new Date(log.date);
                  const dayOfWeek = date.getDay();
                  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                  
                  if (adjustedDay === dayIndex) {
                    total++;
                    if (log.completed) completed++;
                  }
                });
              });
              
              const rate = total > 0 ? completed / total : 0;
              
              return (
                <View key={dayIndex} style={styles.weeklyBarContainer}>
                  <View style={styles.weeklyBarTrack}>
                    <View 
                      style={[
                        styles.weeklyBarFill, 
                        { 
                          height: `${Math.max(10, rate * 100)}%`,
                          backgroundColor: rate > 0.7 ? '#000000' : rate > 0.4 ? '#666666' : '#CCCCCC'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.weeklyBarRate}>{Math.round(rate * 100)}%</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 习惯关联分析 */}
        {(() => {
          const { getHabitCorrelations } = require('../utils/habitUtils');
          const correlations = getHabitCorrelations(habits, habitLogs);
          if (correlations.length === 0) return null;
          
          return (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleLarge}>习惯关联</Text>
                <Text style={styles.sectionSubtitle}>发现习惯间的联系</Text>
              </View>
              <View style={styles.correlationCard}>
                {correlations.slice(0, 3).map((corr: {habitName1: string; habitName2: string; correlationScore: number; description: string}, index: number) => (
                  <View key={index} style={styles.correlationItem}>
                    <View style={styles.correlationHeader}>
                      <View style={styles.correlationHabits}>
                        <Text style={styles.correlationHabitName}>{corr.habitName1}</Text>
                        <Text style={styles.correlationLink}>↔</Text>
                        <Text style={styles.correlationHabitName}>{corr.habitName2}</Text>
                      </View>
                      <View style={[styles.correlationBadge, 
                        corr.correlationScore >= 70 ? styles.correlationBadgeHigh :
                        corr.correlationScore >= 50 ? styles.correlationBadgeMedium :
                        styles.correlationBadgeLow
                      ]}>
                        <Text style={styles.correlationScore}>{corr.correlationScore}%</Text>
                      </View>
                    </View>
                    <Text style={styles.correlationDesc}>{corr.description}</Text>
                  </View>
                ))}
              </View>
            </>
          );
        })()}

        {/* 完成概率预测 */}
        {(() => {
          const { getAllCompletionPredictions } = require('../utils/habitUtils');
          const predictions = getAllCompletionPredictions(habits, habitLogs);
          if (predictions.length === 0) return null;
          
          return (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleLarge}>完成预测</Text>
                <Text style={styles.sectionSubtitle}>基于历史数据的智能预测</Text>
              </View>
              <View style={styles.predictionCard}>
                {predictions.slice(0, 3).map((pred: {habitName: string; trend: string; probability: number; confidence: number; todayProbability: number; suggestion: string}, index: number) => {
                  const displayProbability = Math.min(pred.todayProbability, 100);
                  const barColor = displayProbability >= 70 ? Colors.gray[900] : 
                                   displayProbability >= 40 ? Colors.gray[600] : Colors.gray[400];
                  return (
                  <View key={index} style={styles.predictionItem}>
                    <View style={styles.predictionHeader}>
                      <Text style={styles.predictionHabitName}>{pred.habitName}</Text>
                      <View style={[styles.predictionTrend,
                        pred.trend === 'improving' ? styles.predictionTrendUp :
                        pred.trend === 'declining' ? styles.predictionTrendDown :
                        styles.predictionTrendStable
                      ]}>
                        {pred.trend === 'improving' ? (
                          <TrendUpIcon size={14} color={Colors.primary} />
                        ) : pred.trend === 'declining' ? (
                          <TrendDownIcon size={14} color={Colors.gray[600]} />
                        ) : (
                          <TrendStableIcon size={14} color={Colors.gray[500]} />
                        )}
                      </View>
                    </View>
                    <View style={styles.predictionBarContainer}>
                      <View style={styles.predictionBarTrack}>
                        <View 
                          style={[
                            styles.predictionBarFill, 
                            { 
                              width: `${displayProbability}%`,
                              backgroundColor: barColor
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.predictionValue}>{pred.todayProbability}%</Text>
                    </View>
                    <Text style={styles.predictionSuggestion}>{pred.suggestion}</Text>
                  </View>
                );})}
              </View>
            </>
          );
        })()}
      </ScrollView>
    );
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

        {/* 子导航 */}
        <View style={styles.subNav}>
          <View style={styles.subNavContent}>
            <View style={styles.tabButtons}>
              {[
                { key: 'overview', label: '概览' },
                { key: 'habits', label: '我的习惯' },
                { key: 'insights', label: '洞察' },
                { key: 'archived', label: '归档' },
              ].map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
                  onPress={() => setActiveTab(tab.key as TabType)}
                >
                  <Text style={[styles.tabButtonText, activeTab === tab.key && styles.tabButtonTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
              <Text style={styles.addButtonIcon}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 页面标题 */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>
            {activeTab === 'overview' && '习惯概览'}
            {activeTab === 'habits' && '我的习惯'}
            {activeTab === 'insights' && '数据洞察'}
            {activeTab === 'archived' && '归档习惯'}
          </Text>
        </View>

        {/* 内容区域 */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'habits' && renderHabitsList()}
        {activeTab === 'insights' && renderInsights()}
        {activeTab === 'archived' && renderArchivedHabits()}
      </SafeAreaView>

      {/* 添加/编辑习惯弹窗 */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingHabit ? '编辑习惯' : '新建习惯'}
              </Text>

              {/* 名称输入 */}
              <Text style={styles.modalLabel}>习惯名称</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="例如：每天阅读30分钟..."
                value={habitName}
                onChangeText={setHabitName}
                autoFocus
              />

              {/* 图标选择 */}
              <Text style={styles.modalLabel}>图标</Text>
              <View style={styles.iconGrid}>
                {HABIT_ICONS.map(iconItem => (
                  <TouchableOpacity
                    key={iconItem.name}
                    style={[styles.iconOption, habitIcon === iconItem.name && styles.iconOptionActive]}
                    onPress={() => setHabitIcon(iconItem.name)}
                  >
                    <iconItem.component size={20} color={habitIcon === iconItem.name ? '#FFFFFF' : '#000000'} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* 分类选择 */}
              <View style={styles.categoryHeader}>
                <Text style={styles.modalLabel}>分类</Text>
                <TouchableOpacity onPress={() => setShowCategoryModal(true)}>
                  <Text style={styles.categoryManageText}>管理分类</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.categoryGrid}>
                {getAllCategories().map(cat => {
                  const IconComp = cat.isCustom
                    ? OtherIcon
                    : (HABIT_CATEGORIES.find(c => c.id === cat.id)?.iconComponent || OtherIcon);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryOption, habitCategory === cat.id && styles.categoryOptionActive]}
                      onPress={() => setHabitCategory(cat.id)}
                    >
                      <View style={[styles.categoryOptionIcon, cat.isCustom && { backgroundColor: cat.color + '20' }]}>
                        {cat.isCustom ? (
                          <View style={[styles.customCategoryDot, { backgroundColor: cat.color }]} />
                        ) : (
                          <IconComp size={14} color={habitCategory === cat.id ? '#FFFFFF' : cat.color} />
                        )}
                      </View>
                      <Text style={[styles.categoryOptionText, habitCategory === cat.id && styles.categoryOptionTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 频率选择 */}
              <Text style={styles.modalLabel}>频率</Text>
              <View style={styles.frequencyButtons}>
                {[
                  { key: 'daily', label: '每天' },
                  { key: 'weekly', label: '每周' },
                  { key: 'monthly', label: '每月' },
                  { key: 'custom', label: '自定义' },
                ].map(freq => (
                  <TouchableOpacity
                    key={freq.key}
                    style={[styles.freqButton, habitFrequency === freq.key && styles.freqButtonActive]}
                    onPress={() => setHabitFrequency(freq.key as FrequencyType)}
                  >
                    <Text style={[styles.freqButtonText, habitFrequency === freq.key && styles.freqButtonTextActive]}>
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 自定义频率间隔输入 */}
              {habitFrequency === 'custom' && (
                <View style={styles.intervalInputContainer}>
                  <Text style={styles.intervalLabel}>每</Text>
                  <TextInput
                    style={styles.intervalInput}
                    value={String(habitFrequencyInterval)}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 1;
                      setHabitFrequencyInterval(Math.max(1, num));
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={styles.intervalLabel}>天</Text>
                </View>
              )}

              {/* 目标选择 */}
              <Text style={styles.modalLabel}>目标类型</Text>
              <View style={styles.targetButtons}>
                {[
                  { key: 'streak', label: '连续打卡' },
                  { key: 'count', label: '累计次数' },
                  { key: 'none', label: '无目标' },
                ].map(target => (
                  <TouchableOpacity
                    key={target.key}
                    style={[styles.targetButton, habitTarget === target.key && styles.targetButtonActive]}
                    onPress={() => setHabitTarget(target.key as typeof habitTarget)}
                  >
                    <Text style={[styles.targetButtonText, habitTarget === target.key && styles.targetButtonTextActive]}>
                      {target.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 目标值输入 */}
              {habitTarget !== 'none' && (
                <View style={styles.targetValueContainer}>
                  <Text style={styles.targetValueLabel}>
                    {habitTarget === 'streak' ? '连续' : '累计'}目标
                  </Text>
                  <TextInput
                    style={styles.targetValueInput}
                    value={String(habitTargetValue)}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 1;
                      setHabitTargetValue(Math.max(1, num));
                    }}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                  <Text style={styles.targetValueUnit}>
                    {habitTarget === 'streak' ? '天' : '次'}
                  </Text>
                </View>
              )}

              {/* 截止日期选择 */}
              <Text style={styles.modalLabel}>截止日期（可选）</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={habitDeadline ? styles.datePickerText : styles.datePickerPlaceholder}>
                  {habitDeadline ? formatDate(habitDeadline) : '选择日期'}
                </Text>
                {habitDeadline ? (
                  <TouchableOpacity
                    style={styles.clearDateButton}
                    onPress={() => setHabitDeadline('')}
                  >
                    <CloseIcon size={16} color={Colors.gray[400]} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={habitDeadline ? new Date(habitDeadline) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      const year = selectedDate.getFullYear();
                      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                      const day = String(selectedDate.getDate()).padStart(2, '0');
                      setHabitDeadline(`${year}-${month}-${day}`);
                    }
                  }}
                />
              )}

              {/* 颜色选择 */}
              <Text style={[styles.modalLabel, { marginTop: 16 }]}>颜色标记</Text>
              <View style={styles.colorGrid}>
                {HABIT_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      habitColor === color && styles.colorOptionActive,
                    ]}
                    onPress={() => setHabitColor(color)}
                  />
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setShowModal(false)}>
                  <Text style={styles.modalButtonCancelText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButtonConfirm} onPress={saveHabit}>
                  <Text style={styles.modalButtonConfirmText}>
                    {editingHabit ? '保存' : '创建'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* 补卡弹窗 */}
      <Modal
        visible={showMakeupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMakeupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.makeupModalContent}>
            <Text style={styles.modalTitle}>补卡</Text>
            <Text style={styles.makeupSubtitle}>为「{selectedHabit?.name}」补打过去的记录</Text>
            
            <Text style={styles.modalLabel}>选择日期（7天内）</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="例如：2026-02-20"
              value={makeupDate}
              onChangeText={setMakeupDate}
            />
            
            <Text style={styles.modalLabel}>备注（可选）</Text>
            <TextInput
              style={[styles.modalInput, styles.noteInput]}
              placeholder="添加备注..."
              value={makeupNote}
              onChangeText={setMakeupNote}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setShowMakeupModal(false)}>
                <Text style={styles.modalButtonCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={saveMakeup}>
                <Text style={styles.modalButtonConfirmText}>确认补卡</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 打卡备注弹窗 */}
      <Modal
        visible={showCheckinNoteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCheckinNoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.checkinNoteModalContent}>
            <View style={styles.checkinNoteHeader}>
              <Text style={styles.modalTitle}>打卡备注</Text>
              <TouchableOpacity onPress={() => setShowCheckinNoteModal(false)}>
                <CloseIcon size={24} color={Colors.gray[500]} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.checkinNoteSubtitle}>
              为「{checkinNoteHabit?.name}」添加备注（可选）
            </Text>
            
            <TextInput
              style={styles.checkinNoteInput}
              placeholder="例如：今天感觉不错，完成了5公里跑步..."
              value={checkinNoteText}
              onChangeText={setCheckinNoteText}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            <Text style={styles.checkinNoteHint}>{checkinNoteText.length}/200</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonCancel} 
                onPress={() => {
                  // 跳过备注直接打卡
                  saveCheckinWithNote();
                }}
              >
                <Text style={styles.modalButtonCancelText}>跳过</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButtonConfirm, !checkinNoteText.trim() && styles.modalButtonDisabled]} 
                onPress={saveCheckinWithNote}
                disabled={!checkinNoteText.trim()}
              >
                <Text style={styles.modalButtonConfirmText}>保存备注</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 习惯详情弹窗 */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            {selectedHabit && (
              <View style={styles.detailContent}>
                {/* 头部 */}
                <View style={styles.detailHeader}>
                  <View style={[styles.detailIcon, { backgroundColor: selectedHabit.color + '20' }]}>
                    {React.createElement(getIconComponent(selectedHabit.icon), { size: 32, color: selectedHabit.color })}
                  </View>
                  <View style={styles.detailHeaderInfo}>
                    <Text style={styles.detailTitle}>{selectedHabit.name}</Text>
                    <Text style={styles.detailMeta}>
                      {getCategoryDisplayInfo(selectedHabit.category)?.name || '其他'} • {formatFrequency(selectedHabit)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.detailCloseButton}
                    onPress={() => setShowDetailModal(false)}
                  >
                    <CloseIcon size={24} color={Colors.gray[500]} />
                  </TouchableOpacity>
                </View>

                {/* 核心统计 */}
                <View style={styles.detailStatsRow}>
                  <View style={styles.detailStatItem}>
                    <Text style={[styles.detailStatValue, { color: '#000000' }]}>
                      {getHabitStats(selectedHabit).totalCompletions}
                    </Text>
                    <Text style={styles.detailStatLabel}>总打卡</Text>
                  </View>
                  <View style={styles.detailStatItem}>
                    <Text style={[styles.detailStatValue, { color: '#000000' }]}>
                      {getHabitStats(selectedHabit).currentStreak}
                    </Text>
                    <Text style={styles.detailStatLabel}>当前连续</Text>
                  </View>
                  <View style={styles.detailStatItem}>
                    <Text style={[styles.detailStatValue, { color: '#000000' }]}>
                      {getHabitStats(selectedHabit).longestStreak}
                    </Text>
                    <Text style={styles.detailStatLabel}>最长连续</Text>
                  </View>
                  <View style={styles.detailStatItem}>
                    <Text style={[styles.detailStatValue, { color: '#000000' }]}>
                      {getHabitStats(selectedHabit).completionRate}%
                    </Text>
                    <Text style={styles.detailStatLabel}>{getCompletionRateLabel(selectedHabit)}完成率</Text>
                  </View>
                </View>

                {/* 月度日历 */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>本月打卡</Text>
                  <CalendarGrid 
                    habit={selectedHabit}
                    habitLogs={habitLogs}
                    onDatePress={handleDateCellPress}
                  />
                </View>

                {/* 近30天趋势 */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>近30天趋势</Text>
                  <View style={styles.trend30Chart}>
                    {(() => {
                      const today3 = new Date();
                      const bars = [];
                      
                      for (let i = 29; i >= 0; i--) {
                        const date = new Date(today3);
                        date.setDate(today3.getDate() - i);
                        const dateStr = date.toISOString().split('T')[0];
                        const log = habitLogs.find(l => l.habitId === selectedHabit.id && l.date === dateStr);
                        const isToday = i === 0;
                        
                        bars.push(
                          <View 
                            key={i} 
                            style={[
                              styles.trend30Bar,
                              log?.completed && { backgroundColor: '#000000' },
                              !log?.completed && styles.trend30BarEmpty,
                              isToday && styles.trend30BarToday,
                            ]}
                          />
                        );
                      }
                      
                      return bars;
                    })()}
                  </View>
                </View>

                {/* 最近打卡记录 */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>最近打卡</Text>
                  {habitLogs
                    .filter(l => l.habitId === selectedHabit.id && l.completed)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((log, index) => (
                      <View key={log.id || index} style={styles.logItem}>
                        <View style={[styles.logDot, { backgroundColor: '#000000' }]} />
                        <Text style={styles.logDate}>{formatDate(log.date)}</Text>
                        {log.note && <Text style={styles.logNote}>{log.note}</Text>}
                      </View>
                    ))}
                  {habitLogs.filter(l => l.habitId === selectedHabit.id && l.completed).length === 0 && (
                    <Text style={styles.noLogsText}>暂无打卡记录</Text>
                  )}
                </View>

                {/* 目标进度显示 */}
                {selectedHabit.target?.type !== 'none' && selectedHabit.target?.value && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>
                      {selectedHabit.target.type === 'streak' ? '连续打卡目标' : '累计打卡目标'}
                    </Text>
                    <View style={styles.goalProgressContainer}>
                      <View style={styles.goalProgressHeader}>
                        <Text style={styles.goalProgressText}>
                          {selectedHabit.target.type === 'streak'
                            ? `${getHabitStats(selectedHabit).currentStreak} / ${selectedHabit.target.value} 天`
                            : `${getHabitStats(selectedHabit).totalCompletions} / ${selectedHabit.target.value} 次`}
                        </Text>
                        <Text style={styles.goalProgressPercent}>
                          {Math.min(100, Math.round(
                            (selectedHabit.target.type === 'streak'
                              ? getHabitStats(selectedHabit).currentStreak
                              : getHabitStats(selectedHabit).totalCompletions
                            ) / selectedHabit.target.value * 100
                          ))}%
                        </Text>
                      </View>
                      <View style={styles.goalProgressBar}>
                        <View
                          style={[
                            styles.goalProgressFill,
                            {
                              width: `${Math.min(100, Math.round(
                                (selectedHabit.target.type === 'streak'
                                  ? getHabitStats(selectedHabit).currentStreak
                                  : getHabitStats(selectedHabit).totalCompletions
                                ) / selectedHabit.target.value * 100
                              ))}%`
                            }
                          ]}
                        />
                      </View>
                      {selectedHabit.target.deadline && (
                        <Text style={styles.goalDeadline}>
                          截止日期: {selectedHabit.target.deadline}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* 操作按钮 */}
                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={styles.detailActionButton}
                    onPress={() => {
                      setShowDetailModal(false);
                      openEditModal(selectedHabit);
                    }}
                  >
                    <Text style={styles.detailActionButtonText}>编辑习惯</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.detailActionButton, selectedHabit.paused && styles.detailActionButtonActive]}
                    onPress={() => togglePauseHabit(selectedHabit)}
                  >
                    <Text style={[styles.detailActionButtonText, selectedHabit.paused && styles.detailActionButtonTextActive]}>
                      {selectedHabit.paused ? '恢复习惯' : '暂停习惯'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.detailActionButton, selectedHabit.archived && styles.detailActionButtonActive]}
                    onPress={() => toggleArchiveHabit(selectedHabit)}
                  >
                    <Text style={[styles.detailActionButtonText, selectedHabit.archived && styles.detailActionButtonTextActive]}>
                      {selectedHabit.archived ? '取消归档' : '归档习惯'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.detailActionButton, styles.detailActionButtonDanger]}
                    onPress={() => {
                      setShowDetailModal(false);
                      confirmDeleteHabit(selectedHabit);
                    }}
                  >
                    <Text style={[styles.detailActionButtonText, styles.detailActionButtonTextDanger]}>删除习惯</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* 热力图日期详情弹窗 */}
      <Modal
        visible={selectedHeatmapDate !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedHeatmapDate(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.heatmapDetailModal}>
            <View style={styles.heatmapDetailHeader}>
              <Text style={styles.heatmapDetailTitle}>
                {selectedHeatmapDate ? formatDate(selectedHeatmapDate) : ''}
              </Text>
              <TouchableOpacity onPress={() => setSelectedHeatmapDate(null)}>
                <CloseIcon size={24} color={Colors.gray[500]} />
              </TouchableOpacity>
            </View>
            {selectedHeatmapDate && (
              <View style={styles.heatmapDetailContent}>
                {getDateDetails(selectedHeatmapDate).habitsCompleted.length > 0 ? (
                  getDateDetails(selectedHeatmapDate).habitsCompleted.map((item, index) => (
                    <View key={index} style={styles.heatmapDetailItem}>
                      <Text style={styles.heatmapDetailHabitName}>{item.habitName}</Text>
                      <View style={styles.heatmapDetailTags}>
                        <Text style={styles.heatmapDetailCount}>×{item.count}</Text>
                        {item.isMakeup && <Text style={styles.heatmapDetailMakeup}>补卡</Text>}
                      </View>
                      {item.note && <Text style={styles.heatmapDetailNote}>{item.note}</Text>}
                    </View>
                  ))
                ) : (
                  <Text style={styles.heatmapDetailEmpty}>今日无打卡记录</Text>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 分类管理弹窗 */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.categoryModalContent}>
            <View style={styles.categoryModalHeader}>
              <Text style={styles.modalTitle}>管理分类</Text>
              <TouchableOpacity onPress={() => {
                setShowCategoryModal(false);
                setEditingCategory(null);
              }}>
                <CloseIcon size={24} color={Colors.gray[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 添加新分类 */}
              <View style={styles.addCategorySection}>
                <Text style={[styles.modalLabel, { marginBottom: 4 }]}>添加新分类</Text>
                <TextInput
                  style={[styles.modalInput, { marginBottom: 8 }]}
                  placeholder="输入分类名称"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                />
                <Text style={[styles.modalLabel, { marginBottom: 8 }]}>选择颜色</Text>
                <View style={styles.colorGrid}>
                  {HABIT_COLORS.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newCategoryColor === color && styles.colorOptionActive
                      ]}
                      onPress={() => setNewCategoryColor(color)}
                    />
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.modalButtonConfirm, { marginTop: 8 }, !newCategoryName.trim() && styles.modalButtonDisabled]}
                  onPress={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                >
                  <Text style={styles.modalButtonConfirmText}>添加分类</Text>
                </TouchableOpacity>
              </View>

              {/* 编辑分类弹窗内嵌区域 */}
              {editingCategory && (
                <View style={styles.editCategorySection}>
                  <View style={styles.editCategoryHeader}>
                    <Text style={[styles.modalLabel, { marginBottom: 0 }]}>
                      编辑{editingCategory.isCustom ? '自定义' : '默认'}分类
                    </Text>
                    <TouchableOpacity onPress={cancelEditCategory}>
                      <CloseIcon size={20} color={Colors.gray[500]} />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[styles.modalInput, { marginBottom: 8 }]}
                    placeholder="分类名称"
                    value={editCategoryName}
                    onChangeText={setEditCategoryName}
                  />
                  <Text style={[styles.modalLabel, { marginBottom: 8 }]}>选择颜色</Text>
                  <View style={styles.colorGrid}>
                    {HABIT_COLORS.map(color => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          editCategoryColor === color && styles.colorOptionActive
                        ]}
                        onPress={() => setEditCategoryColor(color)}
                      />
                    ))}
                  </View>
                  <View style={[styles.editCategoryActions, { marginTop: 8 }]}>
                    <TouchableOpacity
                      style={[styles.modalButtonSecondary, { flex: 1 }]}
                      onPress={cancelEditCategory}
                    >
                      <Text style={styles.modalButtonSecondaryText}>取消</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButtonConfirm, { flex: 1 }, !editCategoryName.trim() && styles.modalButtonDisabled]}
                      onPress={handleSaveCategoryEdit}
                      disabled={!editCategoryName.trim()}
                    >
                      <Text style={styles.modalButtonConfirmText}>保存</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* 默认分类列表 */}
              <Text style={styles.modalLabel}>默认分类（点击编辑）</Text>
              <View style={styles.customCategoryList}>
                {HABIT_CATEGORIES.map(cat => {
                  const override = defaultCategoryOverrides.find(o => o.id === cat.id);
                  const displayName = override?.name ?? cat.name;
                  const displayColor = override?.color ?? cat.color;
                  const isModified = !!override;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.customCategoryItem}
                      onPress={() => startEditCategory({
                        id: cat.id,
                        name: displayName,
                        color: displayColor,
                        isCustom: false
                      })}
                    >
                      <View style={styles.customCategoryInfo}>
                        <View style={[styles.customCategoryColorDot, { backgroundColor: displayColor }]} />
                        <View>
                          <Text style={styles.customCategoryName}>{displayName}</Text>
                          {isModified && (
                            <Text style={styles.categoryModifiedHint}>已修改</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.categoryItemActions}>
                        {isModified && (
                          <TouchableOpacity
                            style={styles.resetCategoryButton}
                            onPress={() => handleResetDefaultCategory(cat.id)}
                          >
                            <Text style={styles.resetCategoryButtonText}>重置</Text>
                          </TouchableOpacity>
                        )}
                        <Text style={styles.editCategoryHint}>编辑</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 自定义分类列表 */}
              <Text style={styles.modalLabel}>我的分类</Text>
              {customCategories.length === 0 ? (
                <Text style={styles.emptyCategoryText}>暂无自定义分类</Text>
              ) : (
                <View style={styles.customCategoryList}>
                  {customCategories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.customCategoryItem}
                      onPress={() => startEditCategory({
                        id: cat.id,
                        name: cat.name,
                        color: cat.color,
                        isCustom: true
                      })}
                    >
                      <View style={styles.customCategoryInfo}>
                        <View style={[styles.customCategoryColorDot, { backgroundColor: cat.color }]} />
                        <Text style={styles.customCategoryName}>{cat.name}</Text>
                      </View>
                      <View style={styles.categoryItemActions}>
                        <TouchableOpacity
                          style={styles.deleteCategoryButton}
                          onPress={() => handleDeleteCategory(cat.id)}
                        >
                          <Text style={styles.deleteCategoryButtonText}>删除</Text>
                        </TouchableOpacity>
                        <Text style={styles.editCategoryHint}>编辑</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ==================== 样式 ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  subNav: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  subNavContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#000000',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 26,
  },
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000000',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // 概览页样式
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000000',
  },
  statUnit: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flameEmoji: {
    fontSize: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 12,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  // 热力图样式
  heatmapContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  heatmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLink: {
    fontSize: 13,
    color: '#666666',
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  heatmapCell: {
    width: (SCREEN_WIDTH - 72) / 53,
    height: (SCREEN_WIDTH - 72) / 53,
    borderRadius: 2,
  },
  heatmapTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  yearButton: {
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  yearButtonText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  yearButtonDisabled: {
    color: '#D1D5DB',
  },
  heatmapYearText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    minWidth: 70,
    textAlign: 'center',
  },
  heatmapDetailModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: SCREEN_WIDTH - 48,
    maxHeight: 400,
  },
  heatmapDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  heatmapDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  heatmapDetailClose: {
    fontSize: 20,
    color: '#6B7280',
    padding: 4,
  },
  heatmapDetailContent: {
    gap: 12,
  },
  heatmapDetailItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  heatmapDetailHabitName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
  },
  heatmapDetailTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  heatmapDetailCount: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  heatmapDetailMakeup: {
    fontSize: 11,
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  heatmapDetailNote: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  heatmapDetailEmpty: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 24,
  },
  // 今日习惯样式
  todayHabitsContainer: {
    marginBottom: 24,
  },
  todayHabitItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  todayHabitItemCompleted: {
    opacity: 0.7,
  },
  todayHabitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  checkButtonCompleted: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  // 新的打卡按钮样式 V2
  checkButtonV2: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkButtonV2Empty: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  checkButtonV2Text: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  checkButtonV2TextLight: {
    color: '#FFFFFF',
  },
  targetBadge: {
    fontSize: 11,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  todayHabitInfo: {
    flex: 1,
  },
  todayHabitName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  todayHabitNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  todayHabitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  streakText: {
    fontSize: 12,
    color: '#6B7280',
  },
  frequencyText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  habitIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitIconText: {
    fontSize: 24,
  },
  // 分类筛选
  categoryFilter: {
    marginBottom: 16,
  },
  categoryFilterContent: {
    paddingRight: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  categoryChipActive: {
    backgroundColor: '#000000',
  },
  categoryChipIcon: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  // 习惯列表样式
  habitListCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  habitListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  // 新的打卡按钮样式
  habitListCheckButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitListCheckButtonEmpty: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  habitListCheckButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  habitListCheckButtonTextLight: {
    color: '#FFFFFF',
  },
  habitListCheckButtonPlus: {
    fontSize: 24,
    fontWeight: '300',
    color: '#9CA3AF',
  },
  habitListIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitListIconText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  habitListInfo: {
    flex: 1,
  },
  habitListName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  habitListMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  habitListStreak: {
    alignItems: 'flex-end',
  },
  habitListStreakNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  habitListStreakLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  miniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 16,
  },
  miniGridCell: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  miniGridCellToday: {
    borderWidth: 1,
    borderColor: '#000000',
  },
  miniGridCellClickable: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  habitListFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  habitListFooterText: {
    fontSize: 12,
    color: '#6B7280',
  },
  // 洞察页样式 - Apple Fitness 风格
  ringsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  ringWrapper: {
    alignItems: 'center',
  },
  ringGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  ringItem: {
    alignItems: 'center',
  },
  ringOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringMiddle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  ringValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  ringLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  ringTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
    marginTop: 8,
  },
  ringSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionTitleLarge: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  comparisonScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  comparisonCard: {
    width: 140,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  comparisonCardTop: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  comparisonCardHeader: {
    position: 'relative',
    marginBottom: 12,
  },
  comparisonCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comparisonCardIconText: {
    fontSize: 24,
  },
  crownBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  crownText: {
    fontSize: 12,
  },
  comparisonCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 4,
  },
  comparisonCardNameTop: {
    color: '#FFFFFF',
  },
  comparisonCardStreak: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 12,
  },
  comparisonCardStreakTop: {
    color: '#CCCCCC',
  },
  comparisonCardProgress: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  comparisonCardProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  comparisonCardRate: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  comparisonCardRateTop: {
    color: '#FFFFFF',
  },
  achievementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  achievementBadge: {
    width: (SCREEN_WIDTH - 72) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  achievementBadgeUnlocked: {
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  achievementRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 28,
  },
  achievementIconLocked: {
    opacity: 0.4,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  achievementNameLocked: {
    color: '#8E8E93',
  },
  achievementDesc: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  achievementProgress: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
    fontWeight: '500',
  },
  // 习惯大师成就样式
  masterAchievementsContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  masterAchievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  masterAchievementItemUnlocked: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  masterAchievementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  masterAchievementIcon: {
    fontSize: 28,
  },
  masterAchievementName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  masterAchievementNameLocked: {
    color: '#6B7280',
  },
  masterAchievementDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  masterAchievementRight: {
    alignItems: 'flex-end',
  },
  masterAchievementProgress: {
    alignItems: 'flex-end',
    gap: 4,
  },
  masterAchievementProgressTrack: {
    width: 60,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  masterAchievementProgressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 3,
  },
  masterAchievementProgressText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  masterAchievementUnlockedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterAchievementUnlockedText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  weeklyAnalysisCard: {
    marginHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  weekDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekDayLabel: {
    flex: 1,
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  weeklyBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  weeklyBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weeklyBarTrack: {
    width: 24,
    height: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weeklyBarFill: {
    width: 24,
    borderRadius: 12,
  },
  weeklyBarRate: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 4,
  },
  // 习惯关联分析样式
  correlationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 16,
  },
  correlationItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
  },
  correlationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  correlationHabits: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  correlationHabitName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  correlationLink: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  correlationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  correlationBadgeHigh: {
    backgroundColor: '#DCFCE7',
  },
  correlationBadgeMedium: {
    backgroundColor: '#DBEAFE',
  },
  correlationBadgeLow: {
    backgroundColor: '#F3F4F6',
  },
  correlationScore: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  correlationDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  // 完成预测样式
  predictionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 16,
  },
  predictionItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionHabitName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  predictionTrend: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictionTrendUp: {
    backgroundColor: Colors.gray[100],
  },
  predictionTrendDown: {
    backgroundColor: Colors.gray[100],
  },
  predictionTrendStable: {
    backgroundColor: Colors.gray[100],
  },
  predictionTrendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  predictionBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  predictionBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  predictionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  predictionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    minWidth: 40,
    textAlign: 'right',
  },
  predictionSuggestion: {
    fontSize: 13,
    color: '#6B7280',
  },
  // 弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalScroll: {
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    color: '#000000',
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    color: '#000000',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  datePickerText: {
    fontSize: 16,
    color: '#000000',
  },
  datePickerPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  clearDateButton: {
    padding: 4,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOptionActive: {
    backgroundColor: '#000000',
  },
  iconOptionText: {
    fontSize: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  categoryOptionActive: {
    backgroundColor: '#000000',
  },
  categoryOptionIcon: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryOptionText: {
    fontSize: 13,
    color: '#6B7280',
  },
  categoryOptionTextActive: {
    color: '#FFFFFF',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryManageText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  customCategoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // 分类管理弹窗样式
  categoryModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalClose: {
    fontSize: 20,
    color: '#6B7280',
    padding: 4,
  },
  addCategorySection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    gap: 12,
  },
  modalButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  emptyCategoryText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
  customCategoryList: {
    gap: 10,
    marginBottom: 16,
  },
  customCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  customCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customCategoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  customCategoryName: {
    fontSize: 15,
    color: '#000000',
  },
  deleteCategoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  deleteCategoryButtonText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  editCategorySection: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  editCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editCategoryActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  categoryItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editCategoryHint: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  categoryModifiedHint: {
    fontSize: 11,
    color: '#22c55e',
    marginTop: 2,
  },
  resetCategoryButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  resetCategoryButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  freqButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  freqButtonActive: {
    backgroundColor: '#000000',
  },
  freqButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  freqButtonTextActive: {
    color: '#FFFFFF',
  },
  targetButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  targetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  targetButtonActive: {
    backgroundColor: '#000000',
  },
  targetButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  targetButtonTextActive: {
    color: '#FFFFFF',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorOptionActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 32,
  },
  modalButtonCancel: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalButtonCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalButtonConfirm: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#000000',
    borderRadius: 12,
  },
  modalButtonConfirmText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  modalButtonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  // 快速统计卡片
  quickStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  quickStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
  // 趋势图表
  trendCard: {
    marginHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  trendChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  trendColumn: {
    flex: 1,
    alignItems: 'center',
  },
  trendDayLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 8,
  },
  trendBarContainer: {
    width: 28,
    height: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBar: {
    width: 28,
    borderRadius: 14,
  },
  trendValue: {
    fontSize: 11,
    color: '#000000',
    fontWeight: '500',
    marginTop: 6,
  },
  // 习惯详情弹窗样式
  detailContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  detailIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailIconText: {
    fontSize: 28,
  },
  detailHeaderInfo: {
    flex: 1,
    marginLeft: 16,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  detailMeta: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  detailCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCloseText: {
    fontSize: 16,
    color: '#6B7280',
  },
  detailStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  detailStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailStatValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  detailStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calendarEmptyCell: {
    width: 36,
    height: 36,
  },
  calendarCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarCellToday: {
    borderWidth: 2,
    borderColor: '#000000',
  },
  calendarCellText: {
    fontSize: 12,
    color: '#6B7280',
  },
  calendarCellTextCompleted: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  calendarCellClickable: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  trend30Chart: {
    flexDirection: 'row',
    height: 40,
    gap: 2,
  },
  trend30Bar: {
    flex: 1,
    height: 40,
    borderRadius: 2,
    backgroundColor: '#34C759',
  },
  trend30BarEmpty: {
    backgroundColor: '#E5E7EB',
  },
  trend30BarToday: {
    borderWidth: 1,
    borderColor: '#000000',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logDate: {
    fontSize: 14,
    color: '#000000',
    marginLeft: 12,
  },
  logNote: {
    flex: 1,
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  noLogsText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
  },
  detailActions: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 10,
  },
  detailActionButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  detailActionButtonActive: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
  detailActionButtonDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  detailActionButtonText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  detailActionButtonTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  detailActionButtonTextDanger: {
    color: '#DC2626',
    fontWeight: '600',
  },
  // 自定义频率间隔输入
  intervalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  intervalLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  intervalInput: {
    width: 60,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  // 目标值输入
  targetValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  targetValueLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  targetValueInput: {
    width: 80,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  targetValueUnit: {
    fontSize: 14,
    color: '#6B7280',
  },
  // 目标进度显示
  goalProgressContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  goalProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalProgressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  goalProgressPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: 8,
    backgroundColor: '#000000',
    borderRadius: 4,
  },
  goalDeadline: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
  },
  // 习惯列表状态样式
  habitListCardPaused: {
    opacity: 0.7,
  },
  habitListNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  habitListNamePaused: {
    color: '#9CA3AF',
  },
  habitListStreakNumberPaused: {
    color: '#9CA3AF',
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeArchived: {
    backgroundColor: '#E5E7EB',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
  },
  statusBadgeTextArchived: {
    color: '#6B7280',
  },
  // 归档习惯列表
  emptyArchivedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyArchivedText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  archivedSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    marginTop: 8,
  },
  archivedSectionSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 16,
  },
  // 补卡弹窗
  makeupModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  makeupSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  noteInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  // 打卡备注弹窗
  checkinNoteModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    width: '90%',
  },
  checkinNoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkinNoteSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  checkinNoteInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    color: '#000000',
    height: 100,
    textAlignVertical: 'top',
  },
  checkinNoteHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 16,
  },
  // 每周完成对比图表
  weeklyComparisonChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  weeklyComparisonColumn: {
    flex: 1,
    alignItems: 'center',
  },
  weeklyComparisonLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 8,
  },
  weeklyComparisonBarContainer: {
    width: 32,
    height: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weeklyComparisonBar: {
    width: 32,
    borderRadius: 16,
  },
  weeklyComparisonValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginTop: 6,
  },
  weeklyComparisonTarget: {
    fontSize: 11,
    color: '#8E8E93',
  },
  // 饼图样式
  pieChartCard: {
    marginHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  pieChartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pieChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pieSlice: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  pieCenter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  pieCenterText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  pieCenterLabel: {
    fontSize: 10,
    color: '#8E8E93',
  },
  pieLegend: {
    gap: 12,
  },
  pieLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pieLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pieLegendInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pieLegendName: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
  },
  pieLegendValue: {
    fontSize: 12,
    color: '#8E8E93',
  },
  pieEmptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
