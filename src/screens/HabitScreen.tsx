import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Habit } from '../types';
import { Colors, HeatmapColors } from '../constants/colors';
import { habitStorage } from '../utils/storage';
import { getTodayString, formatDate, getWeekRange, generateId, getDayName } from '../utils/date';

const { width } = Dimensions.get('window');

// 习惯标签
const HABIT_TABS = [
  { key: 'overview', label: '概览' },
  { key: 'habits', label: '我的习惯' },
  { key: 'insights', label: '洞察' },
] as const;

// 星期名称
const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function HabitScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'habits' | 'insights'>('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');

  // 加载数据
  const loadHabits = async () => {
    const data = await habitStorage.get();
    if (data) {
      setHabits(data);
    } else {
      // 默认习惯数据
      const defaultHabits: Habit[] = [
        {
          id: generateId(),
          name: '早起',
          color: '#000000',
          icon: '☀️',
          frequency: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
          completedDates: [],
          createdAt: getTodayString(),
        },
        {
          id: generateId(),
          name: '运动',
          color: '#DC2626',
          icon: '💪',
          frequency: ['mon', 'wed', 'fri'],
          completedDates: [],
          createdAt: getTodayString(),
        },
        {
          id: generateId(),
          name: '阅读',
          color: '#2563EB',
          icon: '📚',
          frequency: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
          completedDates: [],
          createdAt: getTodayString(),
        },
      ];
      setHabits(defaultHabits);
      await habitStorage.set(defaultHabits);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [])
  );

  // 保存数据
  const saveHabits = async (newHabits: Habit[]) => {
    setHabits(newHabits);
    await habitStorage.set(newHabits);
  };

  // 添加习惯
  const addHabit = () => {
    if (!newHabitName.trim()) return;
    
    const newHabit: Habit = {
      id: generateId(),
      name: newHabitName.trim(),
      color: Colors.primary,
      icon: '✓',
      frequency: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      completedDates: [],
      createdAt: getTodayString(),
    };
    
    saveHabits([...habits, newHabit]);
    setNewHabitName('');
    setShowAddModal(false);
  };

  // 切换习惯完成状态
  const toggleHabit = (id: string) => {
    const today = getTodayString();
    const newHabits = habits.map(habit => {
      if (habit.id === id) {
        const isCompleted = habit.completedDates.includes(today);
        return {
          ...habit,
          completedDates: isCompleted
            ? habit.completedDates.filter(d => d !== today)
            : [...habit.completedDates, today],
        };
      }
      return habit;
    });
    saveHabits(newHabits);
  };

  // 计算统计数据
  const today = getTodayString();
  const todayCompleted = habits.filter(h => h.completedDates.includes(today)).length;
  const totalHabits = habits.length;
  const longestStreak = Math.max(...habits.map(h => calculateStreak(h)), 0);
  const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0);

  // 计算连续天数
  function calculateStreak(habit: Habit): number {
    if (habit.completedDates.length === 0) return 0;
    const sorted = [...habit.completedDates].sort().reverse();
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < sorted.length; i++) {
      const date = new Date(sorted[i]);
      const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === i || (i === 0 && diffDays === 1)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  // 生成热力图数据
  const generateHeatmapData = () => {
    const data: { date: string; count: number }[] = [];
    const today = new Date();
    
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = habits.reduce((sum, habit) => {
        return sum + (habit.completedDates.includes(dateStr) ? 1 : 0);
      }, 0);
      
      data.push({ date: dateStr, count });
    }
    return data;
  };

  const heatmapData = generateHeatmapData();

  // 渲染概览页
  const renderOverview = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* 统计卡片 */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>今日完成</Text>
          <Text style={styles.statValue}>{todayCompleted}/{totalHabits}</Text>
          <Text style={styles.statUnit}>个习惯</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>最长连续</Text>
          <View style={styles.statValueRow}>
            <Text style={styles.statValue}>{longestStreak}</Text>
            <Text style={styles.flameIcon}>🔥</Text>
          </View>
          <Text style={styles.statUnit}>天</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>本周完成率</Text>
          <Text style={styles.statValue}>
            {totalHabits > 0 ? Math.round((todayCompleted / totalHabits) * 100) : 0}%
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${totalHabits > 0 ? (todayCompleted / totalHabits) * 100 : 0}%` }
              ]} 
            />
          </View>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>总打卡次数</Text>
          <Text style={styles.statValue}>{totalCompletions}</Text>
          <Text style={styles.statUnit}>次</Text>
        </View>
      </View>

      {/* 热力图 */}
      <View style={styles.heatmapContainer}>
        <View style={styles.heatmapHeader}>
          <Text style={styles.sectionTitle}>年度热力图</Text>
          <View style={styles.heatmapLegend}>
            <Text style={styles.legendText}>少</Text>
            {HeatmapColors.map((color, i) => (
              <View key={i} style={[styles.legendDot, { backgroundColor: color }]} />
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
                { backgroundColor: HeatmapColors[Math.min(item.count, 4)] },
              ]}
            />
          ))}
        </View>
      </View>

      {/* 今日待完成 */}
      <View style={styles.todaySection}>
        <Text style={styles.sectionTitle}>今日待完成</Text>
        {habits.map(habit => {
          const isCompleted = habit.completedDates.includes(today);
          return (
            <TouchableOpacity
              key={habit.id}
              style={styles.habitItem}
              onPress={() => toggleHabit(habit.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.habitIcon, { backgroundColor: habit.color }]}>
                <Text style={styles.habitIconText}>{habit.icon}</Text>
              </View>
              <Text style={[styles.habitName, isCompleted && styles.habitNameCompleted]}>
                {habit.name}
              </Text>
              <View style={[styles.checkCircle, isCompleted && styles.checkCircleCompleted]}>
                {isCompleted && <Text style={styles.checkIcon}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  // 渲染习惯列表页
  const renderHabits = () => (
    <FlatList
      data={habits}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.habitsList}
      renderItem={({ item: habit }) => (
        <View style={styles.habitCard}>
          <View style={styles.habitCardHeader}>
            <View style={[styles.habitCardIcon, { backgroundColor: habit.color }]}>
              <Text style={styles.habitCardIconText}>{habit.icon}</Text>
            </View>
            <View style={styles.habitCardInfo}>
              <Text style={styles.habitCardName}>{habit.name}</Text>
              <Text style={styles.habitCardFreq}>
                {habit.frequency.map(d => WEEK_DAYS[['mon','tue','wed','thu','fri','sat','sun'].indexOf(d)]).join(' ')}
              </Text>
            </View>
            <Text style={styles.habitCardStreak}>
              {calculateStreak(habit)}🔥
            </Text>
          </View>
          {/* 本周打卡情况 */}
          <View style={styles.weekProgress}>
            {WEEK_DAYS.map((day, index) => {
              const dayKey = ['mon','tue','wed','thu','fri','sat','sun'][index];
              const isActive = habit.frequency.includes(dayKey as any);
              const { days } = getWeekRange();
              const dateStr = days[index].toISOString().split('T')[0];
              const isCompleted = habit.completedDates.includes(dateStr);
              
              return (
                <View key={day} style={styles.weekDay}>
                  <Text style={styles.weekDayLabel}>{day.slice(-1)}</Text>
                  <View style={[
                    styles.weekDayDot,
                    !isActive && styles.weekDayDotInactive,
                    isCompleted && styles.weekDayDotCompleted,
                  ]} />
                </View>
              );
            })}
          </View>
        </View>
      )}
    />
  );

  // 渲染洞察页
  const renderInsights = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* 最佳习惯 */}
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>最佳习惯</Text>
        {habits.length > 0 && (
          <View style={styles.bestHabit}>
            <View style={[styles.bestHabitIcon, { backgroundColor: habits[0].color }]}>
              <Text style={styles.bestHabitIconText}>{habits[0].icon}</Text>
            </View>
            <View>
              <Text style={styles.bestHabitName}>{habits[0].name}</Text>
              <Text style={styles.bestHabitStat}>
                连续 {calculateStreak(habits[0])} 天 · 总计 {habits[0].completedDates.length} 次
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 习惯对比 */}
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>习惯对比</Text>
        {habits.map(habit => (
          <View key={habit.id} style={styles.comparisonItem}>
            <View style={styles.comparisonLeft}>
              <View style={[styles.comparisonDot, { backgroundColor: habit.color }]} />
              <Text style={styles.comparisonName}>{habit.name}</Text>
            </View>
            <View style={styles.comparisonBar}>
              <View 
                style={[
                  styles.comparisonFill, 
                  { 
                    backgroundColor: habit.color,
                    width: `${Math.min((habit.completedDates.length / 30) * 100, 100)}%` 
                  }
                ]} 
              />
            </View>
            <Text style={styles.comparisonValue}>{habit.completedDates.length}</Text>
          </View>
        ))}
      </View>

      {/* 周期性分析 */}
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>周期性分析</Text>
        <View style={styles.weekAnalysis}>
          {WEEK_DAYS.map((day, index) => {
            const dayKey = ['mon','tue','wed','thu','fri','sat','sun'][index];
            const completions = habits.reduce((sum, h) => {
              return sum + h.completedDates.filter(date => {
                const d = new Date(date);
                const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
                return dayIndex === index;
              }).length;
            }, 0);
            const maxCompletions = Math.max(...WEEK_DAYS.map((_, i) => 
              habits.reduce((sum, h) => sum + h.completedDates.filter(date => {
                const d = new Date(date);
                const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
                return dayIndex === i;
              }).length, 0)
            ), 1);
            
            return (
              <View key={day} style={styles.analysisDay}>
                <View style={styles.analysisBarContainer}>
                  <View 
                    style={[
                      styles.analysisBar,
                      { height: (completions / maxCompletions) * 60 }
                    ]} 
                  />
                </View>
                <Text style={styles.analysisDayLabel}>{day.slice(-1)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* 子导航 */}
      <View style={styles.subNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.subNavContent}>
            {HABIT_TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.subNavItem, activeTab === tab.key && styles.subNavItemActive]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Text style={[styles.subNavText, activeTab === tab.key && styles.subNavTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 内容区域 */}
      <View style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'habits' && renderHabits()}
        {activeTab === 'insights' && renderInsights()}
      </View>

      {/* 添加模态框 */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>新建习惯</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="输入习惯名称..."
              value={newHabitName}
              onChangeText={setNewHabitName}
              autoFocus
              onSubmitEditing={addHabit}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonCancel}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonConfirm}
                onPress={addHabit}
              >
                <Text style={styles.modalButtonConfirmText}>添加</Text>
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
  subNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  subNavContent: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  subNavItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  subNavItemActive: {
    backgroundColor: Colors.primary,
  },
  subNavText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[400],
  },
  subNavTextActive: {
    color: Colors.background,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addButtonText: {
    color: Colors.background,
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // 统计卡片
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 56) / 2,
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.text,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flameIcon: {
    fontSize: 20,
    marginLeft: 4,
  },
  statUnit: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.gray[200],
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  // 热力图
  heatmapContainer: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  heatmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  heatmapCell: {
    width: (width - 70) / 20,
    height: (width - 70) / 20,
    borderRadius: 2,
  },
  // 今日习惯
  todaySection: {
    marginBottom: 20,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  habitIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitIconText: {
    fontSize: 18,
  },
  habitName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  habitNameCompleted: {
    color: Colors.completed,
    textDecorationLine: 'line-through',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkIcon: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  // 习惯列表
  habitsList: {
    paddingBottom: 20,
  },
  habitCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  habitCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  habitCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitCardIconText: {
    fontSize: 20,
  },
  habitCardInfo: {
    flex: 1,
  },
  habitCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  habitCardFreq: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  habitCardStreak: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  weekProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    alignItems: 'center',
  },
  weekDayLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  weekDayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray[200],
  },
  weekDayDotInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  weekDayDotCompleted: {
    backgroundColor: Colors.primary,
  },
  // 洞察
  insightCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  bestHabit: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestHabitIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bestHabitIconText: {
    fontSize: 24,
  },
  bestHabitName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  bestHabitStat: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  comparisonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  comparisonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  comparisonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  comparisonName: {
    fontSize: 14,
    color: Colors.text,
  },
  comparisonBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray[200],
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  comparisonFill: {
    height: '100%',
    borderRadius: 3,
  },
  comparisonValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    width: 30,
    textAlign: 'right',
  },
  weekAnalysis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 80,
    paddingTop: 10,
  },
  analysisDay: {
    alignItems: 'center',
    flex: 1,
  },
  analysisBarContainer: {
    height: 60,
    justifyContent: 'flex-end',
  },
  analysisBar: {
    width: 24,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  analysisDayLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
  // 模态框
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalInput: {
    fontSize: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  modalButtonCancel: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalButtonCancelText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalButtonConfirm: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  modalButtonConfirmText: {
    fontSize: 16,
    color: Colors.background,
    fontWeight: '500',
  },
});
