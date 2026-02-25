import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { TimeEntry, Activity, ActivityGroup, TimeGoal, Todo, Habit, HabitLog, TimeLinks } from '../types';
import { Colors } from '../constants/colors';
import { timeStorage, activityStorage, activityGroupStorage, timeGoalStorage, timeLinksStorage, todoStorage, habitStorage, habitLogStorage } from '../utils/storage';
import { getTodayString, generateId, getCurrentTime } from '../utils/date';
import { createHabitLog, isCompletedToday } from '../utils/habitUtils';
import {
  WorkIcon,
  StudyIcon,
  RunIcon,
  CodeIcon,
  CoffeeIcon,
  GameIcon,
  ArtIcon,
  CookIcon,
  SleepIcon,
  WriteIcon,
  MusicIcon,
  MuscleIcon,
  CheckIcon,
  CloseIcon,
  DiaryIcon,
  StarIcon,
  BulbIcon,
} from '../components/Icons';

const { width } = Dimensions.get('window');

const ACTIVITY_ICON_MAP: { [key: string]: React.FC<{ size?: number; color?: string }> } = {
  'work': WorkIcon,
  'study': StudyIcon,
  'run': RunIcon,
  'code': CodeIcon,
  'coffee': CoffeeIcon,
  'game': GameIcon,
  'art': ArtIcon,
  'cook': CookIcon,
  'sleep': SleepIcon,
  'write': WriteIcon,
  'music': MusicIcon,
  'muscle': MuscleIcon,
  'check': CheckIcon,
};

const getActivityIconComponent = (iconName: string): React.FC<{ size?: number; color?: string }> => {
  return ACTIVITY_ICON_MAP[iconName] || CheckIcon;
};

const LEGACY_EMOJI_TO_ICON: { [key: string]: string } = {
  '💼': 'work', '📚': 'study', '🏃': 'run', '💻': 'code', '☕': 'coffee',
  '🎮': 'game', '🎨': 'art', '🍳': 'cook', '😴': 'sleep', '📝': 'write',
  '🎵': 'music', '💪': 'muscle',
};

const convertLegacyIcon = (icon: string): string => {
  return LEGACY_EMOJI_TO_ICON[icon] || icon;
};

const DEFAULT_ACTIVITIES: Activity[] = [
  { id: '1', name: '工作', icon: 'work', color: '#000000', createdAt: new Date().toISOString() },
  { id: '2', name: '学习', icon: 'study', color: '#2563EB', createdAt: new Date().toISOString() },
  { id: '3', name: '运动', icon: 'run', color: '#DC2626', createdAt: new Date().toISOString() },
  { id: '4', name: '编程', icon: 'code', color: '#7C3AED', createdAt: new Date().toISOString() },
  { id: '5', name: '休息', icon: 'coffee', color: '#059669', createdAt: new Date().toISOString() },
];

const ACTIVITY_ICONS = [
  { name: 'work', component: WorkIcon },
  { name: 'study', component: StudyIcon },
  { name: 'run', component: RunIcon },
  { name: 'code', component: CodeIcon },
  { name: 'coffee', component: CoffeeIcon },
  { name: 'game', component: GameIcon },
  { name: 'art', component: ArtIcon },
  { name: 'cook', component: CookIcon },
  { name: 'sleep', component: SleepIcon },
  { name: 'write', component: WriteIcon },
  { name: 'music', component: MusicIcon },
  { name: 'muscle', component: MuscleIcon },
];

// 可选颜色
const ACTIVITY_COLORS = [
  '#000000', '#2563EB', '#DC2626', '#059669', '#7C3AED', '#EA580C', '#DB2777', '#0891B2', '#65A30D', '#737373'
];

// 子标签页
const TIME_TABS = [
  { key: 'timer', label: '计时器' },
  { key: 'activities', label: '活动' },
  { key: 'stats', label: '统计' },
  { key: 'history', label: '记录' },
] as const;

// 时间输入选择器选项
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export default function TimeScreen() {
  // 数据状态
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [groups, setGroups] = useState<ActivityGroup[]>([]);
  const [goals, setGoals] = useState<TimeGoal[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [timeLinks, setTimeLinks] = useState<TimeLinks>(timeLinksStorage.getDefault());

  // UI 状态
  const [activeTab, setActiveTab] = useState<'timer' | 'activities' | 'stats' | 'history'>('timer');
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'today' | 'week' | 'month'>('today');

  // 计时器状态
  const [isTracking, setIsTracking] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [currentStartTime, setCurrentStartTime] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 新增活动表单
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityIcon, setNewActivityIcon] = useState('work');
  const [newActivityColor, setNewActivityColor] = useState('#000000');
  const [newActivityGroupId, setNewActivityGroupId] = useState<string>('');

  // 手动补录/编辑记录表单
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [entryDate, setEntryDate] = useState(getTodayString());
  const [entryActivityId, setEntryActivityId] = useState('');
  const [entryStartHour, setEntryStartHour] = useState('09');
  const [entryStartMinute, setEntryStartMinute] = useState('00');
  const [entryEndHour, setEntryEndHour] = useState('10');
  const [entryEndMinute, setEntryEndMinute] = useState('00');
  const [entryNote, setEntryNote] = useState('');

  // 分组管理
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#2563EB');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // 目标管理
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalActivityId, setGoalActivityId] = useState('');
  const [goalDuration, setGoalDuration] = useState('60');
  const [goalDays, setGoalDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // 时间线视图
  const [showTimelineView, setShowTimelineView] = useState(false);
  const [timelineDate, setTimelineDate] = useState(getTodayString());

  // 加载数据
  const loadData = async () => {
    const [entriesData, activitiesData, groupsData, goalsData, todosData, habitsData, logsData, linksData] = await Promise.all([
      timeStorage.get(),
      activityStorage.get(),
      activityGroupStorage.get(),
      timeGoalStorage.get(),
      todoStorage.get(),
      habitStorage.get(),
      habitLogStorage.get(),
      timeLinksStorage.get(),
    ]);

    if (entriesData) setEntries(entriesData);
    
    if (activitiesData && activitiesData.length > 0) {
      setActivities(activitiesData);
    } else {
      setActivities(DEFAULT_ACTIVITIES);
      await activityStorage.set(DEFAULT_ACTIVITIES);
    }

    if (groupsData) setGroups(groupsData);
    if (goalsData) setGoals(goalsData);
    
    if (todosData) setTodos(todosData);
    if (habitsData) setHabits(habitsData);
    if (logsData) setHabitLogs(logsData);
    if (linksData) setTimeLinks(linksData);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, [])
  );

  // 保存数据
  const saveEntries = async (newEntries: TimeEntry[]) => {
    setEntries(newEntries);
    await timeStorage.set(newEntries);
  };

  const saveActivities = async (newActivities: Activity[]) => {
    setActivities(newActivities);
    await activityStorage.set(newActivities);
  };

  const saveGroups = async (newGroups: ActivityGroup[]) => {
    setGroups(newGroups);
    await activityGroupStorage.set(newGroups);
  };

  const saveGoals = async (newGoals: TimeGoal[]) => {
    setGoals(newGoals);
    await timeGoalStorage.set(newGoals);
  };

  const saveTimeLinks = async (newLinks: TimeLinks) => {
    setTimeLinks(newLinks);
    await timeLinksStorage.set(newLinks);
  };

  // 开始计时
  const startTracking = () => {
    if (!currentActivity) return;
    
    setIsTracking(true);
    setCurrentStartTime(getCurrentTime());
    setElapsedTime(0);
    
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  // 暂停计时
  const pauseTracking = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTracking(false);
  };

  // 停止计时并保存
  const stopTracking = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (!currentActivity || elapsedTime === 0) return;

    const today = getTodayString();
    const endTime = getCurrentTime();
    
    // 获取关联的待办和习惯
    const linkedTodos: string[] = [];
    const linkedHabits: string[] = [];
    
    Object.entries(timeLinks.todoActivities).forEach(([todoId, activityId]) => {
      if (activityId === currentActivity.id) linkedTodos.push(todoId);
    });
    Object.entries(timeLinks.habitActivities).forEach(([habitId, activityId]) => {
      if (activityId === currentActivity.id) linkedHabits.push(habitId);
    });

    const newEntry: TimeEntry = {
      id: generateId(),
      activityId: currentActivity.id,
      activityName: currentActivity.name,
      activityIcon: currentActivity.icon,
      activityColor: currentActivity.color,
      startTime: currentStartTime,
      endTime,
      duration: elapsedTime,
      date: today,
      linkedTodos,
      linkedHabits,
    };
    
    await saveEntries([newEntry, ...entries]);

    // 自动完成关联的待办（如果计时超过5分钟）
    if (elapsedTime >= 300) {
      const updatedTodos = todos.map(todo => {
        if (linkedTodos.includes(todo.id) && !todo.completed) {
          return { ...todo, completed: true };
        }
        return todo;
      });
      setTodos(updatedTodos);
      await todoStorage.set(updatedTodos);

      // 自动打卡关联的习惯
      const newLogs = [...habitLogs];
      for (const habitId of linkedHabits) {
        const habit = habits.find(h => h.id === habitId);
        if (habit && !isCompletedToday(habitLogs.filter(l => l.habitId === habitId))) {
          const log = createHabitLog(habitId, today, 1, false);
          newLogs.push(log);
        }
      }
      if (newLogs.length > habitLogs.length) {
        setHabitLogs(newLogs);
        await habitLogStorage.set(newLogs);
      }
    }

    // 重置状态
    setIsTracking(false);
    setElapsedTime(0);
    setCurrentActivity(null);
  };

  // 格式化时间
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDurationShort = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // 添加活动
  const addActivity = async () => {
    if (!newActivityName.trim()) return;
    
    const newActivity: Activity = {
      id: generateId(),
      name: newActivityName.trim(),
      icon: newActivityIcon,
      color: newActivityColor,
      groupId: newActivityGroupId || undefined,
      createdAt: new Date().toISOString(),
    };
    
    await saveActivities([...activities, newActivity]);
    setNewActivityName('');
    setNewActivityGroupId('');
    setShowAddActivityModal(false);
  };

  // 添加分组
  const addGroup = async () => {
    if (!newGroupName.trim()) return;
    
    const newGroup: ActivityGroup = {
      id: generateId(),
      name: newGroupName.trim(),
      color: newGroupColor,
      order: groups.length,
      createdAt: new Date().toISOString(),
    };
    
    await saveGroups([...groups, newGroup]);
    setNewGroupName('');
    setShowGroupModal(false);
  };

  // 删除分组
  const deleteGroup = async (groupId: string) => {
    // 将该分组下的活动移到未分组
    const updatedActivities = activities.map(a => 
      a.groupId === groupId ? { ...a, groupId: undefined } : a
    );
    await saveActivities(updatedActivities);
    
    const newGroups = groups.filter(g => g.id !== groupId);
    await saveGroups(newGroups);
  };

  // 添加目标
  const addGoal = async () => {
    if (!goalActivityId || !goalDuration) return;
    
    // 检查是否已存在该活动的目标
    const existingIndex = goals.findIndex(g => g.activityId === goalActivityId);
    const newGoal: TimeGoal = {
      id: generateId(),
      activityId: goalActivityId,
      targetDuration: parseInt(goalDuration),
      daysOfWeek: goalDays,
      createdAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      // 更新现有目标
      const updatedGoals = [...goals];
      updatedGoals[existingIndex] = { ...updatedGoals[existingIndex], ...newGoal };
      await saveGoals(updatedGoals);
    } else {
      // 添加新目标
      await saveGoals([...goals, newGoal]);
    }
    
    setShowGoalModal(false);
    setGoalActivityId('');
    setGoalDuration('60');
    setGoalDays([1, 2, 3, 4, 5]);
  };

  // 删除目标
  const deleteGoal = async (goalId: string) => {
    const newGoals = goals.filter(g => g.id !== goalId);
    await saveGoals(newGoals);
  };

  // 获取今日目标完成进度
  const getGoalProgress = (goal: TimeGoal) => {
    const today = getTodayString();
    const todayEntries = entries.filter(e => 
      e.date === today && e.activityId === goal.activityId
    );
    const totalMinutes = todayEntries.reduce((sum, e) => sum + e.duration / 60, 0);
    const percentage = Math.min(100, (totalMinutes / goal.targetDuration) * 100);
    return { totalMinutes, percentage };
  };

  // 删除活动
  const deleteActivity = async (id: string) => {
    const newActivities = activities.filter(a => a.id !== id);
    const newEntries = entries.filter(e => e.activityId !== id);
    
    // 清理关联
    const newLinks = { ...timeLinks };
    Object.keys(newLinks.todoActivities).forEach(todoId => {
      if (newLinks.todoActivities[todoId] === id) delete newLinks.todoActivities[todoId];
    });
    Object.keys(newLinks.habitActivities).forEach(habitId => {
      if (newLinks.habitActivities[habitId] === id) delete newLinks.habitActivities[habitId];
    });
    
    await saveActivities(newActivities);
    await saveEntries(newEntries);
    await saveTimeLinks(newLinks);
    setEntries(newEntries);
  };

  // 打开补录/编辑记录弹窗
  const openEntryModal = (entry?: TimeEntry) => {
    if (entry) {
      // 编辑模式
      setEditingEntry(entry);
      setEntryDate(entry.date);
      setEntryActivityId(entry.activityId);
      const [startHour, startMinute] = entry.startTime.split(':');
      const [endHour, endMinute] = entry.endTime.split(':');
      setEntryStartHour(startHour);
      setEntryStartMinute(startMinute);
      setEntryEndHour(endHour);
      setEntryEndMinute(endMinute);
      setEntryNote(entry.note || '');
    } else {
      // 新建模式
      setEditingEntry(null);
      setEntryDate(getTodayString());
      setEntryActivityId(activities[0]?.id || '');
      const now = new Date();
      const hour = String(now.getHours()).padStart(2, '0');
      const minute = String(now.getMinutes()).padStart(2, '0');
      setEntryStartHour(hour);
      setEntryStartMinute(minute);
      const endHour = String(Math.min(23, now.getHours() + 1)).padStart(2, '0');
      setEntryEndHour(endHour);
      setEntryEndMinute(minute);
      setEntryNote('');
    }
    setShowEntryModal(true);
  };

  // 保存记录（新建或编辑）
  const saveEntry = async () => {
    const activity = activities.find(a => a.id === entryActivityId);
    if (!activity) return;

    const startTime = `${entryStartHour}:${entryStartMinute}`;
    const endTime = `${entryEndHour}:${entryEndMinute}`;
    
    // 计算持续时间（秒）
    const startMinutes = parseInt(entryStartHour) * 60 + parseInt(entryStartMinute);
    const endMinutes = parseInt(entryEndHour) * 60 + parseInt(entryEndMinute);
    const durationMinutes = endMinutes > startMinutes 
      ? endMinutes - startMinutes 
      : endMinutes + 24 * 60 - startMinutes; // 跨天情况
    const duration = durationMinutes * 60;

    if (editingEntry) {
      // 编辑模式
      const updatedEntries = entries.map(e => 
        e.id === editingEntry.id 
          ? {
              ...e,
              activityId: activity.id,
              activityName: activity.name,
              activityIcon: activity.icon,
              activityColor: activity.color,
              date: entryDate,
              startTime,
              endTime,
              duration,
              note: entryNote,
            }
          : e
      );
      await saveEntries(updatedEntries);
    } else {
      // 新建模式
      const newEntry: TimeEntry = {
        id: generateId(),
        activityId: activity.id,
        activityName: activity.name,
        activityIcon: activity.icon,
        activityColor: activity.color,
        date: entryDate,
        startTime,
        endTime,
        duration,
        note: entryNote,
      };
      await saveEntries([newEntry, ...entries]);
    }

    setShowEntryModal(false);
    setEditingEntry(null);
  };

  // 删除记录
  const deleteEntry = async (entryId: string) => {
    const newEntries = entries.filter(e => e.id !== entryId);
    await saveEntries(newEntries);
  };

  // 关联待办到活动
  const linkTodoToActivity = async (todoId: string) => {
    const newLinks = { ...timeLinks };
    if (newLinks.todoActivities[todoId] === currentActivity?.id) {
      delete newLinks.todoActivities[todoId];
    } else if (currentActivity) {
      newLinks.todoActivities[todoId] = currentActivity.id;
    }
    await saveTimeLinks(newLinks);
  };

  // 关联习惯到活动
  const linkHabitToActivity = async (habitId: string) => {
    const newLinks = { ...timeLinks };
    if (newLinks.habitActivities[habitId] === currentActivity?.id) {
      delete newLinks.habitActivities[habitId];
    } else if (currentActivity) {
      newLinks.habitActivities[habitId] = currentActivity.id;
    }
    await saveTimeLinks(newLinks);
  };

  // 获取活动总时间
  const getActivityTotalTime = (activityId: string) => {
    return entries
      .filter(e => e.activityId === activityId)
      .reduce((sum, e) => sum + e.duration, 0);
  };

  // 获取今日统计
  const getTodayStats = () => {
    const today = getTodayString();
    const todayEntries = entries.filter(e => e.date === today);
    const totalSeconds = todayEntries.reduce((sum, e) => sum + e.duration, 0);
    
    const activityStats: Record<string, number> = {};
    todayEntries.forEach(e => {
      activityStats[e.activityId] = (activityStats[e.activityId] || 0) + e.duration;
    });
    
    return { totalSeconds, activityStats, count: todayEntries.length };
  };

  // 获取连续记录天数
  const getStreak = () => {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      if (entries.some(e => e.date === dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  // 渲染计时器页面
  const renderTimer = () => {
    const today = getTodayString();
    const todayTodos = todos.filter(t => 
      (t.category === 'today' || t.dueDate === today) && !t.completed
    );

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* 计时显示 */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerDisplay}>{formatDuration(elapsedTime)}</Text>
          <Text style={styles.timerActivityName}>
            {currentActivity ? currentActivity.name : '选择一项活动开始计时'}
          </Text>
          
          {/* 控制按钮 */}
          <View style={styles.timerControls}>
            {!isTracking ? (
              <TouchableOpacity 
                style={[styles.timerButton, styles.timerButtonStart, !currentActivity && styles.timerButtonDisabled]}
                onPress={startTracking}
                disabled={!currentActivity}
              >
                <Text style={styles.timerButtonIcon}>▶</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity 
                  style={[styles.timerButton, styles.timerButtonPause]}
                  onPress={pauseTracking}
                >
                  <Text style={styles.timerButtonIcon}>⏸</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.timerButton, styles.timerButtonStop]}
                  onPress={stopTracking}
                >
                  <Text style={styles.timerButtonIcon}>⏹</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* 关联待办 */}
        {currentActivity && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>关联待办</Text>
              {todayTodos.length === 0 ? (
                <Text style={styles.emptyText}>今天没有待办任务</Text>
              ) : (
                todayTodos.map(todo => {
                  const isLinked = timeLinks.todoActivities[todo.id] === currentActivity.id;
                  return (
                    <TouchableOpacity
                      key={todo.id}
                      style={[styles.linkItem, isLinked && styles.linkItemActive]}
                      onPress={() => linkTodoToActivity(todo.id)}
                    >
                      <View style={[styles.linkCheckbox, isLinked && styles.linkCheckboxActive]}>
                        {isLinked && <CheckIcon size={14} color="#FFFFFF" />}
                      </View>
                      <Text style={[styles.linkItemText, isLinked && styles.linkItemTextActive]}>
                        {todo.title}
                      </Text>
                      {todo.tags?.map(tag => (
                        <View key={tag} style={styles.linkTag}>
                          <Text style={styles.linkTagText}>{tag}</Text>
                        </View>
                      ))}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* 关联习惯 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>关联习惯</Text>
              <View style={styles.habitLinks}>
                {habits.filter(h => !h.archived).map(habit => {
                  const isCompleted = isCompletedToday(habitLogs.filter(l => l.habitId === habit.id));
                  const isLinked = timeLinks.habitActivities[habit.id] === currentActivity.id;
                  return (
                    <TouchableOpacity
                      key={habit.id}
                      style={[
                        styles.habitLinkChip,
                        isLinked && styles.habitLinkChipActive,
                        isCompleted && styles.habitLinkChipCompleted
                      ]}
                      onPress={() => linkHabitToActivity(habit.id)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {isCompleted && <View style={{ marginRight: 4 }}><CheckIcon size={12} color="#FFFFFF" /></View>}
                        <Text style={styles.habitLinkChipText}>{habit.name}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* 快速选择活动 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择活动</Text>
          <View style={styles.activitiesGrid}>
            {activities.map(activity => {
              const isSelected = currentActivity?.id === activity.id;
              return (
                <TouchableOpacity
                  key={activity.id}
                  style={[styles.activityCard, isSelected && styles.activityCardActive]}
                  onPress={() => setCurrentActivity(isSelected ? null : activity)}
                >
                  <View style={[styles.activityIcon, { backgroundColor: activity.color }]}>
                    {React.createElement(getActivityIconComponent(convertLegacyIcon(activity.icon)), { size: 20, color: '#FFFFFF' })}
                  </View>
                  <Text style={[styles.activityName, isSelected && styles.activityNameActive]}>
                    {activity.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    );
  };

  // 渲染活动管理页面
  const renderActivities = () => {
    // 按分组组织活动
    const groupedActivities = groups.map(group => ({
      group,
      activities: activities.filter(a => a.groupId === group.id),
    }));
    const ungroupedActivities = activities.filter(a => !a.groupId);

    return (
      <View style={styles.tabContent}>
        <View style={styles.activitiesHeader}>
          <Text style={styles.activitiesSubtitle}>管理你的时间追踪活动</Text>
          <View style={styles.activitiesHeaderButtons}>
            <TouchableOpacity style={styles.addGroupBtn} onPress={() => setShowGroupModal(true)}>
              <Text style={styles.addGroupBtnText}>+ 分组</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addActivityBtn} onPress={() => setShowAddActivityModal(true)}>
              <Text style={styles.addActivityBtnText}>+ 添加</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 目标管理入口 */}
          <TouchableOpacity 
            style={styles.goalsCard}
            onPress={() => setShowGoalModal(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BulbIcon size={18} color={Colors.primary} />
              <Text style={[styles.goalsCardTitle, { marginLeft: 8 }]}>每日目标</Text>
            </View>
            <Text style={styles.goalsCardSubtitle}>
              {goals.length > 0 ? `已设置 ${goals.length} 个目标` : '点击设置每日时间目标'}
            </Text>
          </TouchableOpacity>

          {/* 分组列表 */}
          {groupedActivities.map(({ group, activities: groupActivities }) => (
            <View key={group.id} style={styles.groupSection}>
              <View style={[styles.groupHeader, { backgroundColor: group.color + '20' }]}>
                <View style={[styles.groupDot, { backgroundColor: group.color }]} />
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupCount}>({groupActivities.length})</Text>
                <TouchableOpacity 
                  style={styles.groupDeleteBtn}
                  onPress={() => {
                    Alert.alert(
                      '删除分组',
                      `确定要删除分组"${group.name}"吗？分组内的活动将变为未分组。`,
                      [
                        { text: '取消', style: 'cancel' },
                        { text: '删除', style: 'destructive', onPress: () => deleteGroup(group.id) },
                      ]
                    );
                  }}
                >
                  <Text style={styles.groupDeleteBtnText}>×</Text>
                </TouchableOpacity>
              </View>
              {groupActivities.map(activity => (
                <ActivityListItem 
                  key={activity.id} 
                  activity={activity} 
                  totalTime={getActivityTotalTime(activity.id)}
                  onDelete={() => deleteActivity(activity.id)}
                />
              ))}
            </View>
          ))}

          {/* 未分组活动 */}
          {ungroupedActivities.length > 0 && (
            <View style={styles.groupSection}>
              <View style={styles.groupHeader}>
                <View style={[styles.groupDot, { backgroundColor: Colors.gray[400] }]} />
                <Text style={styles.groupName}>未分组</Text>
                <Text style={styles.groupCount}>({ungroupedActivities.length})</Text>
              </View>
              {ungroupedActivities.map(activity => (
                <ActivityListItem 
                  key={activity.id} 
                  activity={activity} 
                  totalTime={getActivityTotalTime(activity.id)}
                  onDelete={() => deleteActivity(activity.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // 活动列表项组件
  const ActivityListItem = ({ activity, totalTime, onDelete }: { 
    activity: Activity; 
    totalTime: number; 
    onDelete: () => void;
  }) => (
    <View style={styles.activityListItem}>
      <View style={[styles.activityListIcon, { backgroundColor: activity.color }]}>
        {React.createElement(getActivityIconComponent(convertLegacyIcon(activity.icon)), { size: 18, color: '#FFFFFF' })}
      </View>
      <View style={styles.activityListInfo}>
        <Text style={styles.activityListName}>{activity.name}</Text>
        <Text style={styles.activityListTime}>累计 {formatDurationShort(totalTime)}</Text>
      </View>
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <Text style={styles.deleteBtnText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  // 渲染统计页面
  const renderStats = () => {
    const { totalSeconds, activityStats, count } = getTodayStats();
    const sortedActivities = Object.entries(activityStats)
      .sort((a, b) => b[1] - a[1]);
    const topActivity = sortedActivities[0];
    const topActivityData = topActivity ? activities.find(a => a.id === topActivity[0]) : null;
    const streak = getStreak();

    // 本周数据
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayEntries = entries.filter(e => e.date === dateStr);
      const daySeconds = dayEntries.reduce((sum, e) => sum + e.duration, 0);
      weeklyData.push({
        day: days[date.getDay()],
        hours: daySeconds / 3600,
        date: dateStr,
      });
    }
    const maxHours = Math.max(...weeklyData.map(d => d.hours), 1);

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* 今日概览 */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDurationShort(totalSeconds)}</Text>
            <Text style={styles.statLabel}>今日记录</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{count}</Text>
            <Text style={styles.statLabel}>活动数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{topActivityData?.name || '-'}</Text>
            <Text style={styles.statLabel}>主要活动</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>连续记录</Text>
          </View>
        </View>

        {/* 目标进度 */}
        {goals.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>今日目标</Text>
            <View style={styles.goalsList}>
              {goals.map(goal => {
                const activity = activities.find(a => a.id === goal.activityId);
                if (!activity) return null;
                const { totalMinutes, percentage } = getGoalProgress(goal);
                const isCompleted = percentage >= 100;
                return (
                  <View key={goal.id} style={styles.goalItem}>
                    <View style={styles.goalHeader}>
                      <View style={styles.goalActivity}>
                        <View style={[styles.goalIcon, { backgroundColor: activity.color }]}>
                          {React.createElement(getActivityIconComponent(convertLegacyIcon(activity.icon)), { size: 14, color: '#FFFFFF' })}
                        </View>
                        <Text style={styles.goalName}>{activity.name}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {isCompleted && <View style={{ marginRight: 4 }}><CheckIcon size={12} color="#059669" /></View>}
                        <Text style={[styles.goalProgress, isCompleted && styles.goalProgressCompleted]}>
                          {Math.round(totalMinutes)}/{goal.targetDuration}分钟
                        </Text>
                      </View>
                    </View>
                    <View style={styles.goalProgressBg}>
                      <View 
                        style={[
                          styles.goalProgressFill, 
                          { 
                            backgroundColor: isCompleted ? '#059669' : activity.color, 
                            width: `${Math.min(100, percentage)}%` 
                          }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 时间分布 */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>今日时间分布</Text>
          {sortedActivities.length === 0 ? (
            <Text style={styles.emptyText}>今天还没有记录</Text>
          ) : (
            <View style={styles.distributionList}>
              {sortedActivities.map(([activityId, duration]) => {
                const activity = activities.find(a => a.id === activityId);
                const percentage = totalSeconds > 0 ? (duration / totalSeconds) * 100 : 0;
                return (
                  <View key={activityId} style={styles.distributionItem}>
                    <View style={[styles.distributionIcon, { backgroundColor: activity?.color || '#999' }]}>
                      {activity ? React.createElement(getActivityIconComponent(convertLegacyIcon(activity.icon)), { size: 16, color: '#FFFFFF' }) : null}
                    </View>
                    <View style={styles.distributionBar}>
                      <View style={styles.distributionBarHeader}>
                        <Text style={styles.distributionName}>{activity?.name || '未知'}</Text>
                        <Text style={styles.distributionTime}>
                          {formatDurationShort(duration)} ({percentage.toFixed(1)}%)
                        </Text>
                      </View>
                      <View style={styles.distributionProgressBg}>
                        <View 
                          style={[
                            styles.distributionProgressFill, 
                            { backgroundColor: activity?.color || '#999', width: `${percentage}%` }
                          ]} 
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 本周趋势 */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>本周趋势</Text>
          <View style={styles.weeklyChart}>
            {weeklyData.map((data, index) => {
              const height = Math.min(100, (data.hours / maxHours) * 100);
              return (
                <View key={index} style={styles.weeklyChartItem}>
                  <View style={styles.weeklyChartBarContainer}>
                    <View style={[styles.weeklyChartBar, { height: `${height}%` }]} />
                  </View>
                  <Text style={styles.weeklyChartDay}>{data.day}</Text>
                  <Text style={styles.weeklyChartHours}>{data.hours.toFixed(1)}h</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    );
  };

  // 渲染时间线视图
  const renderTimelineView = () => {
    const dayEntries = entries.filter(e => e.date === timelineDate).sort((a, b) => {
      const aTime = parseInt(a.startTime.replace(':', ''));
      const bTime = parseInt(b.startTime.replace(':', ''));
      return aTime - bTime;
    });

    // 生成24小时时间刻度
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <View style={styles.tabContent}>
        <View style={styles.timelineHeader}>
          <TouchableOpacity onPress={() => {
            const date = new Date(timelineDate);
            date.setDate(date.getDate() - 1);
            setTimelineDate(date.toISOString().split('T')[0]);
          }}>
            <Text style={styles.timelineNavBtn}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.timelineDate}>{timelineDate}</Text>
          <TouchableOpacity onPress={() => {
            const date = new Date(timelineDate);
            date.setDate(date.getDate() + 1);
            setTimelineDate(date.toISOString().split('T')[0]);
          }}>
            <Text style={styles.timelineNavBtn}>▶</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => setShowTimelineView(false)}>
            <CloseIcon size={24} color={Colors.gray[500]} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.timelineContainer}>
          {hours.map(hour => {
            const hourEntries = dayEntries.filter(e => {
              const startHour = parseInt(e.startTime.split(':')[0]);
              return startHour === hour;
            });

            return (
              <View key={hour} style={styles.timelineHour}>
                <Text style={styles.timelineHourLabel}>{String(hour).padStart(2, '0')}:00</Text>
                <View style={styles.timelineHourLine}>
                  {hourEntries.map(entry => {
                    const activity = activities.find(a => a.id === entry.activityId);
                    const startMin = parseInt(entry.startTime.split(':')[1]);
                    const endMin = parseInt(entry.endTime.split(':')[1]);
                    const duration = entry.duration / 60;
                    const leftPercent = (startMin / 60) * 100;
                    const widthPercent = Math.max(5, (duration / 60) * 100);

                    return (
                      <TouchableOpacity
                        key={entry.id}
                        style={[
                          styles.timelineEntry,
                          {
                            backgroundColor: activity?.color || '#999',
                            left: `${leftPercent}%`,
                            width: `${Math.min(100 - leftPercent, widthPercent)}%`,
                          }
                        ]}
                        onPress={() => openEntryModal(entry)}
                      >
                        <Text style={styles.timelineEntryText} numberOfLines={1}>
                          {activity?.name}
                        </Text>
                        <Text style={styles.timelineEntryTime}>
                          {entry.startTime}-{entry.endTime}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // 渲染历史记录页面
  const renderHistory = () => {
    if (showTimelineView) {
      return renderTimelineView();
    }

    let filtered = entries;
    const today = getTodayString();
    
    if (historyFilter === 'today') {
      filtered = entries.filter(e => e.date === today);
    } else if (historyFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = entries.filter(e => new Date(e.date) >= weekAgo);
    } else if (historyFilter === 'month') {
      const monthStart = today.slice(0, 7);
      filtered = entries.filter(e => e.date.startsWith(monthStart));
    }

    return (
      <View style={styles.tabContent}>
        {/* 筛选器和补录按钮 */}
        <View style={styles.filterContainer}>
          {(['today', 'week', 'month'] as const).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterBtn, historyFilter === filter && styles.filterBtnActive]}
              onPress={() => setHistoryFilter(filter)}
            >
              <Text style={[styles.filterBtnText, historyFilter === filter && styles.filterBtnTextActive]}>
                {filter === 'today' ? '今日' : filter === 'week' ? '本周' : '本月'}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.timelineToggleBtn}
            onPress={() => setShowTimelineView(true)}
          >
            <Text style={styles.timelineToggleBtnText}>时间线</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addEntryBtn}
            onPress={() => openEntryModal()}
          >
            <Text style={styles.addEntryBtnText}>+ 补录</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.historyItem}
              onPress={() => openEntryModal(item)}
              onLongPress={() => {
                // 长按删除
                Alert.alert(
                  '删除记录',
                  `确定要删除这条${item.activityName}记录吗？`,
                  [
                    { text: '取消', style: 'cancel' },
                    { 
                      text: '删除', 
                      style: 'destructive',
                      onPress: () => deleteEntry(item.id)
                    },
                  ]
                );
              }}
            >
              <View style={[styles.historyIcon, { backgroundColor: item.activityColor }]}>
                <Text style={styles.historyIconText}>{item.activityIcon}</Text>
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyActivity}>{item.activityName}</Text>
                <Text style={styles.historyTime}>{item.startTime} - {item.endTime}</Text>
                {item.note ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <DiaryIcon size={12} color={Colors.gray[500]} />
                    <Text style={[styles.historyNote, { marginLeft: 4 }]} numberOfLines={1}>{item.note}</Text>
                  </View>
                ) : null}
                {(item.linkedTodos?.length || item.linkedHabits?.length) ? (
                  <View style={styles.historyLinks}>
                    {item.linkedTodos?.map(todoId => {
                      const todo = todos.find(t => t.id === todoId);
                      return todo ? (
                        <View key={todoId} style={styles.historyLinkTagTodo}>
                          <Text style={styles.historyLinkTagText}>{todo.title}</Text>
                        </View>
                      ) : null;
                    })}
                    {item.linkedHabits?.map(habitId => {
                      const habit = habits.find(h => h.id === habitId);
                      return habit ? (
                        <View key={habitId} style={styles.historyLinkTagHabit}>
                          <Text style={styles.historyLinkTagText}>{habit.name}</Text>
                        </View>
                      ) : null;
                    })}
                  </View>
                ) : null}
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyDuration}>{formatDurationShort(item.duration)}</Text>
                <Text style={styles.historyDate}>{item.date.slice(5)}</Text>
              </View>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⏱</Text>
              <Text style={styles.emptyText}>暂无记录</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={() => openEntryModal()}>
                <Text style={styles.emptyAddBtnText}>添加记录</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* 头部 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>时间</Text>
          <Text style={styles.headerSubtitle}>记录每一刻，了解时间去向</Text>
        </View>
      </View>

      {/* 子导航 */}
      <View style={styles.subNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TIME_TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.subNavItem, activeTab === tab.key && styles.subNavItemActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.subNavText, activeTab === tab.key && styles.subNavTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 内容区域 */}
      {activeTab === 'timer' && renderTimer()}
      {activeTab === 'activities' && renderActivities()}
      {activeTab === 'stats' && renderStats()}
      {activeTab === 'history' && renderHistory()}

      {/* 添加活动弹窗 */}
      <Modal
        visible={showAddActivityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddActivityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>添加活动</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>活动名称</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="例如：工作、学习..."
                value={newActivityName}
                onChangeText={setNewActivityName}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>图标</Text>
              <View style={styles.iconGrid}>
                {ACTIVITY_ICONS.map(icon => (
                  <TouchableOpacity
                    key={icon.name}
                    style={[styles.iconOption, newActivityIcon === icon.name && styles.iconOptionActive]}
                    onPress={() => setNewActivityIcon(icon.name)}
                  >
                    <icon.component size={20} color={newActivityIcon === icon.name ? '#FFFFFF' : '#000000'} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>颜色</Text>
              <View style={styles.colorGrid}>
                {ACTIVITY_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorOption, { backgroundColor: color }, newActivityColor === color && styles.colorOptionActive]}
                    onPress={() => setNewActivityColor(color)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>分组（可选）</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.groupSelectList}>
                  <TouchableOpacity
                    style={[styles.groupSelectOption, !newActivityGroupId && styles.groupSelectOptionActive]}
                    onPress={() => setNewActivityGroupId('')}
                  >
                    <Text style={[styles.groupSelectText, !newActivityGroupId && styles.groupSelectTextActive]}>未分组</Text>
                  </TouchableOpacity>
                  {groups.map(group => (
                    <TouchableOpacity
                      key={group.id}
                      style={[styles.groupSelectOption, newActivityGroupId === group.id && styles.groupSelectOptionActive]}
                      onPress={() => setNewActivityGroupId(group.id)}
                    >
                      <View style={[styles.groupSelectDot, { backgroundColor: group.color }]} />
                      <Text style={[styles.groupSelectText, newActivityGroupId === group.id && styles.groupSelectTextActive]}>
                        {group.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowAddActivityModal(false)}>
                <Text style={styles.modalBtnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={addActivity}>
                <Text style={styles.modalBtnConfirmText}>添加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 补录/编辑记录弹窗 */}
      <Modal
        visible={showEntryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEntryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.entryModalScroll} contentContainerStyle={styles.entryModalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingEntry ? '编辑记录' : '补录记录'}</Text>
              
              {/* 日期选择 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>日期</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="YYYY-MM-DD"
                  value={entryDate}
                  onChangeText={setEntryDate}
                />
              </View>

              {/* 活动选择 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>活动</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.entryActivityScroll}>
                  <View style={styles.entryActivityList}>
                    {activities.map(activity => (
                      <TouchableOpacity
                        key={activity.id}
                        style={[
                          styles.entryActivityOption,
                          entryActivityId === activity.id && styles.entryActivityOptionActive
                        ]}
                        onPress={() => setEntryActivityId(activity.id)}
                      >
                        <View style={[styles.entryActivityIcon, { backgroundColor: activity.color }]}>
                          {React.createElement(getActivityIconComponent(convertLegacyIcon(activity.icon)), { size: 16, color: '#FFFFFF' })}
                        </View>
                        <Text style={[
                          styles.entryActivityText,
                          entryActivityId === activity.id && styles.entryActivityTextActive
                        ]}>
                          {activity.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* 开始时间 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>开始时间</Text>
                <View style={styles.timePicker}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                    {HOURS.map(h => (
                      <TouchableOpacity
                        key={`start-h-${h}`}
                        style={[styles.timeOption, entryStartHour === h && styles.timeOptionActive]}
                        onPress={() => setEntryStartHour(h)}
                      >
                        <Text style={[styles.timeOptionText, entryStartHour === h && styles.timeOptionTextActive]}>{h}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={styles.timeSeparator}>:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                    {MINUTES.map(m => (
                      <TouchableOpacity
                        key={`start-m-${m}`}
                        style={[styles.timeOption, entryStartMinute === m && styles.timeOptionActive]}
                        onPress={() => setEntryStartMinute(m)}
                      >
                        <Text style={[styles.timeOptionText, entryStartMinute === m && styles.timeOptionTextActive]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* 结束时间 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>结束时间</Text>
                <View style={styles.timePicker}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                    {HOURS.map(h => (
                      <TouchableOpacity
                        key={`end-h-${h}`}
                        style={[styles.timeOption, entryEndHour === h && styles.timeOptionActive]}
                        onPress={() => setEntryEndHour(h)}
                      >
                        <Text style={[styles.timeOptionText, entryEndHour === h && styles.timeOptionTextActive]}>{h}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={styles.timeSeparator}>:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                    {MINUTES.map(m => (
                      <TouchableOpacity
                        key={`end-m-${m}`}
                        style={[styles.timeOption, entryEndMinute === m && styles.timeOptionActive]}
                        onPress={() => setEntryEndMinute(m)}
                      >
                        <Text style={[styles.timeOptionText, entryEndMinute === m && styles.timeOptionTextActive]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* 备注 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>备注（可选）</Text>
                <TextInput
                  style={[styles.modalInput, styles.noteInput]}
                  placeholder="添加备注..."
                  value={entryNote}
                  onChangeText={setEntryNote}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowEntryModal(false)}>
                  <Text style={styles.modalBtnCancelText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnConfirm} onPress={saveEntry}>
                  <Text style={styles.modalBtnConfirmText}>{editingEntry ? '保存' : '添加'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* 添加分组弹窗 */}
      <Modal
        visible={showGroupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>添加分组</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>分组名称</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="例如：工作、生活..."
                value={newGroupName}
                onChangeText={setNewGroupName}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>颜色</Text>
              <View style={styles.colorGrid}>
                {ACTIVITY_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorOption, { backgroundColor: color }, newGroupColor === color && styles.colorOptionActive]}
                    onPress={() => setNewGroupColor(color)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowGroupModal(false)}>
                <Text style={styles.modalBtnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={addGroup}>
                <Text style={styles.modalBtnConfirmText}>添加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 目标管理弹窗 */}
      <Modal
        visible={showGoalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.entryModalScroll} contentContainerStyle={styles.entryModalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>每日目标</Text>
              
              {/* 现有目标列表 */}
              {goals.length > 0 && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>已设置的目标</Text>
                  {goals.map(goal => {
                    const activity = activities.find(a => a.id === goal.activityId);
                    if (!activity) return null;
                    return (
                      <View key={goal.id} style={styles.existingGoalItem}>
                        <View style={styles.existingGoalInfo}>
                          <View style={[styles.existingGoalIcon, { backgroundColor: activity.color }]}>
                            {React.createElement(getActivityIconComponent(convertLegacyIcon(activity.icon)), { size: 14, color: '#FFFFFF' })}
                          </View>
                          <Text style={styles.existingGoalText}>
                            {activity.name}: {goal.targetDuration}分钟/天
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => deleteGoal(goal.id)}>
                          <Text style={styles.existingGoalDelete}>×</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              <View style={styles.divider} />
              <Text style={styles.modalTitle}>添加新目标</Text>

              {/* 选择活动 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>选择活动</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.goalActivityList}>
                    {activities.map(activity => (
                      <TouchableOpacity
                        key={activity.id}
                        style={[styles.goalActivityOption, goalActivityId === activity.id && styles.goalActivityOptionActive]}
                        onPress={() => setGoalActivityId(activity.id)}
                      >
                        <View style={[styles.goalActivityIcon, { backgroundColor: activity.color }]}>
                          {React.createElement(getActivityIconComponent(convertLegacyIcon(activity.icon)), { size: 16, color: '#FFFFFF' })}
                        </View>
                        <Text style={[styles.goalActivityText, goalActivityId === activity.id && styles.goalActivityTextActive]}>
                          {activity.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* 目标时长 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>目标时长（分钟）</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="例如：60"
                  value={goalDuration}
                  onChangeText={setGoalDuration}
                  keyboardType="numeric"
                />
              </View>

              {/* 生效日期 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>生效日期</Text>
                <View style={styles.daysSelector}>
                  {['一', '二', '三', '四', '五', '六', '日'].map((day, index) => {
                    const dayNum = index + 1;
                    const isSelected = goalDays.includes(dayNum);
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[styles.dayOption, isSelected && styles.dayOptionActive]}
                        onPress={() => {
                          if (isSelected) {
                            setGoalDays(goalDays.filter(d => d !== dayNum));
                          } else {
                            setGoalDays([...goalDays, dayNum].sort());
                          }
                        }}
                      >
                        <Text style={[styles.dayOptionText, isSelected && styles.dayOptionTextActive]}>{day}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowGoalModal(false)}>
                  <Text style={styles.modalBtnCancelText}>关闭</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnConfirm} onPress={addGoal}>
                  <Text style={styles.modalBtnConfirmText}>添加目标</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  subNav: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  subNavItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  subNavItemActive: {
    backgroundColor: Colors.primary,
  },
  subNavText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  subNavTextActive: {
    color: Colors.background,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  
  // 计时器样式
  timerContainer: {
    backgroundColor: Colors.gray[50],
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  timerDisplay: {
    fontSize: 64,
    fontWeight: '300',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  timerActivityName: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 8,
    marginBottom: 24,
  },
  timerControls: {
    flexDirection: 'row',
    gap: 16,
  },
  timerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerButtonStart: {
    backgroundColor: Colors.primary,
  },
  timerButtonPause: {
    backgroundColor: '#6B7280',
  },
  timerButtonStop: {
    backgroundColor: Colors.gray[200],
  },
  timerButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  timerButtonIcon: {
    fontSize: 24,
    color: Colors.background,
  },
  
  // 分区样式
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textMuted,
    marginBottom: 12,
  },
  
  // 关联项目样式
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  linkItemActive: {
    backgroundColor: Colors.gray[100],
    borderColor: Colors.primary,
  },
  linkCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkCheckboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  linkCheckboxCheck: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  linkItemText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  linkItemTextActive: {
    color: Colors.text,
    fontWeight: '500',
  },
  linkTag: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  linkTagText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  habitLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  habitLinkChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  habitLinkChipActive: {
    backgroundColor: Colors.gray[100],
    borderColor: Colors.primary,
  },
  habitLinkChipCompleted: {
    opacity: 0.5,
  },
  habitLinkChipText: {
    fontSize: 13,
    color: Colors.text,
  },
  
  // 活动网格
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityCard: {
    width: (width - 52) / 2,
    padding: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activityCardActive: {
    backgroundColor: Colors.gray[100],
    borderColor: Colors.primary,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityIconText: {
    fontSize: 24,
  },
  activityName: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  activityNameActive: {
    color: Colors.text,
    fontWeight: '500',
  },
  
  // 活动管理
  activitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activitiesSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  addActivityBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addActivityBtnText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '500',
  },
  activityListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    marginBottom: 8,
  },
  activityListIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityListIconText: {
    fontSize: 20,
  },
  activityListInfo: {
    flex: 1,
  },
  activityListName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  activityListTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  deleteBtn: {
    padding: 8,
  },
  deleteBtnText: {
    fontSize: 16,
  },
  
  // 统计
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  chartCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  distributionList: {
    gap: 12,
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distributionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  distributionIconText: {
    fontSize: 16,
  },
  distributionBar: {
    flex: 1,
  },
  distributionBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  distributionName: {
    fontSize: 14,
    color: Colors.text,
  },
  distributionTime: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  distributionProgressBg: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 140,
    alignItems: 'flex-end',
  },
  weeklyChartItem: {
    flex: 1,
    alignItems: 'center',
  },
  weeklyChartBarContainer: {
    width: '70%',
    height: 100,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weeklyChartBar: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  weeklyChartDay: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 8,
  },
  weeklyChartHours: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  
  // 历史记录
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBtnText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterBtnTextActive: {
    color: Colors.background,
    fontWeight: '500',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    marginBottom: 8,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyIconText: {
    fontSize: 18,
  },
  historyInfo: {
    flex: 1,
  },
  historyActivity: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  historyTime: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  historyNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  addEntryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addEntryBtnText: {
    color: Colors.background,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyAddBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '500',
  },
  historyLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  historyLinkTagTodo: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyLinkTagHabit: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyLinkTagText: {
    fontSize: 11,
    color: Colors.text,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  historyDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  
  // 空状态
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  
  // 模态框
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 12,
  },
  modalInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    color: Colors.text,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOptionActive: {
    backgroundColor: Colors.gray[200],
  },
  iconOptionText: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorOptionActive: {
    borderWidth: 3,
    borderColor: Colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // 补录弹窗样式
  entryModalScroll: {
    flex: 1,
  },
  entryModalScrollContent: {
    justifyContent: 'flex-end',
    minHeight: '100%',
  },
  entryActivityScroll: {
    maxHeight: 80,
  },
  entryActivityList: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  entryActivityOption: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.gray[50],
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 64,
  },
  entryActivityOptionActive: {
    backgroundColor: Colors.gray[100],
    borderColor: Colors.primary,
  },
  entryActivityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryActivityText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  entryActivityTextActive: {
    color: Colors.text,
    fontWeight: '500',
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: 8,
  },
  timeScroll: {
    maxHeight: 120,
  },
  timeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 8,
  },
  timeOptionActive: {
    backgroundColor: Colors.primary,
  },
  timeOptionText: {
    fontSize: 16,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  timeOptionTextActive: {
    color: Colors.background,
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginHorizontal: 8,
  },
  noteInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalBtnCancel: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalBtnCancelText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalBtnConfirm: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  modalBtnConfirmText: {
    fontSize: 16,
    color: Colors.background,
    fontWeight: '500',
  },

  // 活动管理 - 分组相关
  activitiesHeaderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addGroupBtn: {
    backgroundColor: Colors.gray[200],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addGroupBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  goalsCard: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalsCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  goalsCardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  groupSection: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  groupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  groupCount: {
    fontSize: 13,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  groupDeleteBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  groupDeleteBtnText: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  groupSelectList: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  groupSelectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  groupSelectOptionActive: {
    backgroundColor: Colors.gray[100],
    borderColor: Colors.primary,
  },
  groupSelectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  groupSelectText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  groupSelectTextActive: {
    color: Colors.text,
    fontWeight: '500',
  },

  // 目标相关样式
  goalsList: {
    gap: 16,
  },
  goalItem: {
    gap: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalActivity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  goalName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  goalProgress: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  goalProgressCompleted: {
    color: '#059669',
    fontWeight: '600',
  },
  goalProgressBg: {
    height: 6,
    backgroundColor: Colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  existingGoalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    marginBottom: 8,
  },
  existingGoalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  existingGoalIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  existingGoalText: {
    fontSize: 14,
    color: Colors.text,
  },
  existingGoalDelete: {
    fontSize: 20,
    color: Colors.textMuted,
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: 20,
  },
  goalActivityList: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  goalActivityOption: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.gray[50],
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 64,
  },
  goalActivityOptionActive: {
    backgroundColor: Colors.gray[100],
    borderColor: Colors.primary,
  },
  goalActivityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalActivityText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  goalActivityTextActive: {
    color: Colors.text,
    fontWeight: '500',
  },
  daysSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  dayOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayOptionActive: {
    backgroundColor: Colors.primary,
  },
  dayOptionText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  dayOptionTextActive: {
    color: Colors.background,
    fontWeight: '600',
  },

  // 时间线视图样式
  timelineToggleBtn: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  timelineToggleBtnText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  timelineNavBtn: {
    fontSize: 18,
    color: Colors.primary,
    padding: 8,
  },
  timelineDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginHorizontal: 12,
  },
  timelineCloseBtn: {
    fontSize: 18,
    color: Colors.textMuted,
    padding: 8,
  },
  timelineContainer: {
    flex: 1,
  },
  timelineHour: {
    flexDirection: 'row',
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  timelineHourLabel: {
    width: 50,
    fontSize: 12,
    color: Colors.textMuted,
    paddingTop: 8,
  },
  timelineHourLine: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    marginVertical: 4,
  },
  timelineEntry: {
    position: 'absolute',
    top: 4,
    height: 44,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  timelineEntryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  timelineEntryTime: {
    color: '#FFFFFF',
    fontSize: 9,
    opacity: 0.9,
  },
});
