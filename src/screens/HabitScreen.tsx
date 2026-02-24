import React, { useState, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Habit, HabitLog, HabitStats } from '../types';
import { Colors } from '../constants/colors';
import { habitStorage, habitLogStorage } from '../utils/storage';
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
};

// 兼容旧数据的 emoji 映射
const LEGACY_EMOJI_MAP: { [key: string]: string } = {
  '✓': 'check', '★': 'star', '♥': 'heart', '☀': 'sun', '☽': 'moon',
  '⚡': 'fire', '💪': 'muscle', '🧘': 'yoga', '🎵': 'music', '🎨': 'art',
  '💡': 'bulb', '☕': 'coffee', '🍎': 'apple', '�': 'run', '📚': 'book',
  '❤️': 'heart', '🏠': 'life', '📖': 'book', '🌙': 'moon', '💼': 'work',
};

// 获取图标组件
const getIconComponent = (icon: string): React.FC<{ size?: number; color?: string }> => {
  if (ICON_COMPONENT_MAP[icon]) return ICON_COMPONENT_MAP[icon];
  if (LEGACY_EMOJI_MAP[icon]) return ICON_COMPONENT_MAP[LEGACY_EMOJI_MAP[icon]] || CheckIcon;
  return CheckIcon;
};

// 获取图标符号（用于黑白极简风格）
const getIconSymbol = (icon: string): string => {
  const symbolMap: { [key: string]: string } = {
    'check': '✓',
    'star': '★',
    'heart': '♥',
    'sun': '☀',
    'moon': '☽',
    'fire': '⚡',
    'muscle': '💪',
    'yoga': '🧘',
    'music': '♪',
    'art': '✎',
    'bulb': '💡',
    'coffee': '☕',
    'apple': '🍎',
    'run': '🏃',
    'book': '📚',
    'health': '♥',
    'study': '✎',
    'work': '💼',
    'life': '🏠',
    'sport': '⚡',
    'read': '📚',
    'meditation': '🧘',
    'other': '○',
  };
  return symbolMap[icon] || symbolMap[LEGACY_EMOJI_MAP[icon]] || '○';
};

// 热力图颜色
const HEATMAP_COLORS = {
  0: '#F3F4F6',
  1: '#D1D5DB',
  2: '#9CA3AF',
  3: '#6B7280',
  4: '#000000',
};

type TabType = 'overview' | 'habits' | 'insights';
type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'custom';

// ==================== 主组件 ====================

export default function HabitScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
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
  const [habitTarget, setHabitTarget] = useState<'streak' | 'count' | 'none'>('streak');

  // 习惯详情弹窗状态
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const loadData = async () => {
    const [habitsData, logsData] = await Promise.all([
      habitStorage.get(),
      habitLogStorage.get(),
    ]);
    if (habitsData) setHabits(habitsData);
    if (logsData) setHabitLogs(logsData);
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

    const daysSinceCreated = Math.max(1, Math.floor((new Date().getTime() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
    const completionRate = Math.round((totalCompletions / daysSinceCreated) * 100);

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

    // 今日统计
    const todayCompleted = habits.filter(h => isCompletedToday(h.id)).length;
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
      const dayLogs = habitLogs.filter(l => l.date === dateStr && l.completed);
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
      const dayLogs = habitLogs.filter(l => l.date === dateStr && l.completed);
      monthCompleted += dayLogs.length;
      monthTarget += habits.filter(h => isHabitDueOnDate(h, d)).length;
    }
    const monthRate = monthTarget > 0 ? Math.round((monthCompleted / monthTarget) * 100) : 0;

    // 总打卡次数
    const totalCompletions = habitLogs.filter(l => l.completed).length;

    // 平均连续天数
    const allStreaks = habits.map(h => getHabitStats(h).currentStreak);
    const avgStreak = allStreaks.length > 0 
      ? Math.round(allStreaks.reduce((a, b) => a + b, 0) / allStreaks.length)
      : 0;

    // 最长连续
    const maxStreak = Math.max(0, ...habits.map(h => getHabitStats(h).longestStreak));

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
    const today = new Date();
    const data: { date: string; intensity: number }[] = [];

    for (let week = 0; week < 53; week++) {
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() - ((52 - week) * 7 + (6 - day)));
        const dateStr = date.toISOString().split('T')[0];
        
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
    }

    return data;
  }, [habits, habitLogs]);

  // ==================== 操作函数 ====================

  const toggleHabit = async (habitId: string) => {
    // 触发动画
    if (!checkAnimations[habitId]) {
      checkAnimations[habitId] = new Animated.Value(1);
    }
    
    Animated.sequence([
      Animated.timing(checkAnimations[habitId], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(checkAnimations[habitId], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    const today = getTodayString();
    const existingLog = habitLogs.find(l => l.habitId === habitId && l.date === today);

    if (existingLog) {
      const newLogs = habitLogs.filter(l => !(l.habitId === habitId && l.date === today));
      await saveHabitLogs(newLogs);
    } else {
      const newLog: HabitLog = {
        id: generateId(),
        habitId,
        date: today,
        completed: true,
        count: 1,
        isMakeup: false,
        createdAt: today,
      };
      await saveHabitLogs([...habitLogs, newLog]);
    }
  };

  const openAddModal = () => {
    setEditingHabit(null);
    setHabitName('');
    setHabitColor(HABIT_COLORS[0]);
    setHabitIcon(HABIT_ICONS[0].name);
    setHabitCategory('other');
    setHabitFrequency('daily');
    setHabitTarget('streak');
    setShowModal(true);
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitName(habit.name);
    setHabitColor(habit.color);
    setHabitIcon(habit.icon);
    setHabitCategory(habit.category);
    setHabitFrequency(habit.frequency.type);
    setHabitTarget(habit.target.type);
    setShowModal(true);
  };

  const saveHabit = async () => {
    if (!habitName.trim()) {
      Alert.alert('提示', '请输入习惯名称');
      return;
    }

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
              frequency: { ...h.frequency, type: habitFrequency },
              target: { ...h.target, type: habitTarget },
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
        frequency: { 
          type: habitFrequency,
          days: habitFrequency === 'daily' ? [1, 2, 3, 4, 5, 6, 7] : 
                habitFrequency === 'weekly' ? [1, 2, 3, 4, 5] : undefined,
        },
        target: { type: habitTarget },
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

  const openHabitDetail = (habit: Habit) => {
    setSelectedHabit(habit);
    setShowDetailModal(true);
  };

  // ==================== 筛选后的习惯列表 ====================

  const filteredHabits = useMemo(() => {
    if (selectedCategory === 'all') return habits;
    return habits.filter(h => h.category === selectedCategory);
  }, [habits, selectedCategory]);

  // ==================== 渲染组件 ====================

  const renderOverview = () => {
    const today = getTodayString();

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.flameEmoji}>🔥</Text>
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
            <Text style={styles.sectionTitle}>年度热力图</Text>
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
              <View
                key={index}
                style={[
                  styles.heatmapCell,
                  { backgroundColor: HEATMAP_COLORS[item.intensity as keyof typeof HEATMAP_COLORS] },
                ]}
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
          {habits.filter(h => isHabitDueOnDate(h, new Date())).map(habit => {
            const isCompleted = isCompletedToday(habit.id);
            const stats = getHabitStats(habit);
            
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
                  {/* 打卡按钮 */}
                  <TouchableOpacity
                    style={[styles.checkButton, isCompleted && styles.checkButtonCompleted]}
                    onPress={() => toggleHabit(habit.id)}
                    activeOpacity={0.7}
                  >
                    {isCompleted && <Text style={styles.checkMark}>✓</Text>}
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
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
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
          {HABIT_CATEGORIES.map(cat => {
            const IconComp = cat.iconComponent;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <View style={styles.categoryChipIcon}>
                  <IconComp size={14} color={selectedCategory === cat.id ? '#FFFFFF' : cat.color} />
                </View>
                <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 习惯列表 */}
        {filteredHabits.map(habit => {
          const stats = getHabitStats(habit);
          const recentLogs = habitLogs
            .filter(l => l.habitId === habit.id)
            .slice(-30);

          return (
            <TouchableOpacity
              key={habit.id}
              style={styles.habitListCard}
              onPress={() => openHabitDetail(habit)}
              onLongPress={() => confirmDeleteHabit(habit)}
              activeOpacity={0.8}
            >
              <View style={styles.habitListHeader}>
                <View style={[styles.habitListIcon, { backgroundColor: '#000000' }]}>
                  <Text style={styles.habitListIconText}>{getIconSymbol(habit.icon)}</Text>
                </View>
                <View style={styles.habitListInfo}>
                  <Text style={styles.habitListName}>{habit.name}</Text>
                  <Text style={styles.habitListMeta}>
                    {formatFrequency(habit)} • 创建于 {formatDate(habit.createdAt)}
                  </Text>
                </View>
                <View style={styles.habitListStreak}>
                  <Text style={styles.habitListStreakNumber}>{stats.currentStreak}</Text>
                  <Text style={styles.habitListStreakLabel}>连续天数</Text>
                </View>
              </View>

              {/* 30天打卡网格 */}
              <View style={styles.miniGrid}>
                {Array.from({ length: 30 }).map((_, idx) => {
                  const logIndex = recentLogs.length - 30 + idx;
                  const log = logIndex >= 0 ? recentLogs[logIndex] : null;
                  const isToday = idx === 29;
                  
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.miniGridCell,
                        log?.completed && { backgroundColor: '#000000' },
                        !log?.completed && { backgroundColor: '#F5F5F5' },
                        isToday && styles.miniGridCellToday,
                      ]}
                    />
                  );
                })}
              </View>

              <View style={styles.habitListFooter}>
                <Text style={styles.habitListFooterText}>完成率 {stats.completionRate}%</Text>
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
                        <Text style={styles.crownText}>★</Text>
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
          </Text>
        </View>

        {/* 内容区域 */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'habits' && renderHabitsList()}
        {activeTab === 'insights' && renderInsights()}
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
              <Text style={styles.modalLabel}>分类</Text>
              <View style={styles.categoryGrid}>
                {HABIT_CATEGORIES.map(cat => {
                  const IconComp = cat.iconComponent;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryOption, habitCategory === cat.id && styles.categoryOptionActive]}
                      onPress={() => setHabitCategory(cat.id)}
                    >
                      <View style={styles.categoryOptionIcon}>
                        <IconComp size={14} color={habitCategory === cat.id ? '#FFFFFF' : cat.color} />
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

              {/* 颜色选择 */}
              <Text style={styles.modalLabel}>颜色标记</Text>
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
                      {HABIT_CATEGORIES.find(c => c.id === selectedHabit.category)?.name || '其他'} • {formatFrequency(selectedHabit)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.detailCloseButton}
                    onPress={() => setShowDetailModal(false)}
                  >
                    <Text style={styles.detailCloseText}>✕</Text>
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
                    <Text style={styles.detailStatLabel}>完成率</Text>
                  </View>
                </View>

                {/* 月度日历 */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>本月打卡</Text>
                  <View style={styles.calendarGrid}>
                    {(() => {
                      const today2 = new Date();
                      const year = today2.getFullYear();
                      const month = today2.getMonth();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const firstDayOfWeek = new Date(year, month, 1).getDay();
                      const days = [];
                      
                      // 空白填充
                      for (let i = 0; i < firstDayOfWeek; i++) {
                        days.push(<View key={`empty-${i}`} style={styles.calendarEmptyCell} />);
                      }
                      
                      // 日期
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const log = habitLogs.find(l => l.habitId === selectedHabit.id && l.date === dateStr);
                        const isToday = day === today2.getDate();
                        
                        days.push(
                          <View 
                            key={day} 
                            style={[
                              styles.calendarCell,
                              log?.completed && { backgroundColor: '#000000' },
                              isToday && styles.calendarCellToday,
                            ]}
                          >
                            <Text style={[
                              styles.calendarCellText,
                              log?.completed && styles.calendarCellTextCompleted,
                            ]}>
                              {day}
                            </Text>
                          </View>
                        );
                      }
                      
                      return days;
                    })()}
                  </View>
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
                </View>
              </View>
            )}
          </ScrollView>
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
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 16,
  },
  modalInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    color: '#000000',
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
    paddingTop: 16,
  },
  detailActionButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailActionButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
