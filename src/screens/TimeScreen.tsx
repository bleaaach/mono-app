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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { TimeEntry, Activity, Todo, Habit, HabitLog, TimeLinks } from '../types';
import { Colors } from '../constants/colors';
import { timeStorage, activityStorage, timeLinksStorage, todoStorage, habitStorage, habitLogStorage } from '../utils/storage';
import { getTodayString, generateId, getCurrentTime } from '../utils/date';
import { createHabitLog, isCompletedToday } from '../utils/habitUtils';

const { width } = Dimensions.get('window');

// 默认活动
const DEFAULT_ACTIVITIES: Activity[] = [
  { id: '1', name: '工作', icon: '💼', color: '#000000', createdAt: new Date().toISOString() },
  { id: '2', name: '学习', icon: '📚', color: '#2563EB', createdAt: new Date().toISOString() },
  { id: '3', name: '运动', icon: '🏃', color: '#DC2626', createdAt: new Date().toISOString() },
  { id: '4', name: '编程', icon: '💻', color: '#7C3AED', createdAt: new Date().toISOString() },
  { id: '5', name: '休息', icon: '☕', color: '#059669', createdAt: new Date().toISOString() },
];

// 可选图标
const ACTIVITY_ICONS = ['💼', '📚', '🏃', '💻', '☕', '🎮', '🎨', '🍳', '😴', '📝', '🎵', '💪'];

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

export default function TimeScreen() {
  // 数据状态
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
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
  const [newActivityIcon, setNewActivityIcon] = useState('💼');
  const [newActivityColor, setNewActivityColor] = useState('#000000');

  // 加载数据
  const loadData = async () => {
    const [entriesData, activitiesData, todosData, habitsData, logsData, linksData] = await Promise.all([
      timeStorage.get(),
      activityStorage.get(),
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
      createdAt: new Date().toISOString(),
    };
    
    await saveActivities([...activities, newActivity]);
    setNewActivityName('');
    setShowAddActivityModal(false);
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
                        {isLinked && <Text style={styles.linkCheckboxCheck}>✓</Text>}
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
                      <Text style={styles.habitLinkChipText}>
                        {isCompleted ? '✓ ' : ''}{habit.name}
                      </Text>
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
                    <Text style={styles.activityIconText}>{activity.icon}</Text>
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
  const renderActivities = () => (
    <View style={styles.tabContent}>
      <View style={styles.activitiesHeader}>
        <Text style={styles.activitiesSubtitle}>管理你的时间追踪活动</Text>
        <TouchableOpacity style={styles.addActivityBtn} onPress={() => setShowAddActivityModal(true)}>
          <Text style={styles.addActivityBtnText}>+ 添加</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activities}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const totalTime = getActivityTotalTime(item.id);
          return (
            <View style={styles.activityListItem}>
              <View style={[styles.activityListIcon, { backgroundColor: item.color }]}>
                <Text style={styles.activityListIconText}>{item.icon}</Text>
              </View>
              <View style={styles.activityListInfo}>
                <Text style={styles.activityListName}>{item.name}</Text>
                <Text style={styles.activityListTime}>累计 {formatDurationShort(totalTime)}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteActivity(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>🗑</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
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
                      <Text style={styles.distributionIconText}>{activity?.icon || '⏱'}</Text>
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

  // 渲染历史记录页面
  const renderHistory = () => {
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
        {/* 筛选器 */}
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
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <View style={[styles.historyIcon, { backgroundColor: item.activityColor }]}>
                <Text style={styles.historyIconText}>{item.activityIcon}</Text>
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyActivity}>{item.activityName}</Text>
                <Text style={styles.historyTime}>{item.startTime} - {item.endTime}</Text>
                {(item.linkedTodos?.length || item.linkedHabits?.length) ? (
                  <View style={styles.historyLinks}>
                    {item.linkedTodos?.map(todoId => {
                      const todo = todos.find(t => t.id === todoId);
                      return todo ? (
                        <View key={todoId} style={styles.historyLinkTagTodo}>
                          <Text style={styles.historyLinkTagText}>📋 {todo.title}</Text>
                        </View>
                      ) : null;
                    })}
                    {item.linkedHabits?.map(habitId => {
                      const habit = habits.find(h => h.id === habitId);
                      return habit ? (
                        <View key={habitId} style={styles.historyLinkTagHabit}>
                          <Text style={styles.historyLinkTagText}>🎯 {habit.name}</Text>
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
            </View>
          )}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⏱</Text>
              <Text style={styles.emptyText}>暂无记录</Text>
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
                    key={icon}
                    style={[styles.iconOption, newActivityIcon === icon && styles.iconOptionActive]}
                    onPress={() => setNewActivityIcon(icon)}
                  >
                    <Text style={styles.iconOptionText}>{icon}</Text>
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
});
