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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { TimeEntry } from '../types';
import { Colors } from '../constants/colors';
import { timeStorage } from '../utils/storage';
import { getTodayString, formatDate, generateId, getCurrentTime } from '../utils/date';

// 活动分类
const ACTIVITY_CATEGORIES = [
  { name: '工作', color: '#000000', icon: '💼' },
  { name: '学习', color: '#2563EB', icon: '📚' },
  { name: '运动', color: '#DC2626', icon: '💪' },
  { name: '休息', color: '#059669', icon: '☕' },
  { name: '娱乐', color: '#7C3AED', icon: '🎮' },
  { name: '其他', color: '#737373', icon: '📝' },
];

export default function TimeScreen() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<string>('');
  const [currentCategory, setCurrentCategory] = useState<string>('工作');
  const [currentStartTime, setCurrentStartTime] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 加载数据
  const loadEntries = async () => {
    const data = await timeStorage.get();
    if (data) {
      setEntries(data.sort((a: TimeEntry, b: TimeEntry) => 
        new Date(b.date + 'T' + b.startTime).getTime() - new Date(a.date + 'T' + a.startTime).getTime()
      ));
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEntries();
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

  // 开始计时
  const startTracking = () => {
    if (!currentActivity.trim()) return;
    
    setIsTracking(true);
    setCurrentStartTime(getCurrentTime());
    setElapsedTime(0);
    
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  // 停止计时
  const stopTracking = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const newEntry: TimeEntry = {
      id: generateId(),
      activity: currentActivity,
      category: currentCategory,
      startTime: currentStartTime,
      endTime: getCurrentTime(),
      duration: elapsedTime,
      date: getTodayString(),
    };
    
    saveEntries([newEntry, ...entries]);
    setIsTracking(false);
    setCurrentActivity('');
    setElapsedTime(0);
    setShowAddModal(false);
  };

  // 格式化时间
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 删除记录
  const deleteEntry = (id: string) => {
    const newEntries = entries.filter(entry => entry.id !== id);
    saveEntries(newEntries);
  };

  // 获取今日统计
  const getTodayStats = () => {
    const today = getTodayString();
    const todayEntries = entries.filter(e => e.date === today);
    const totalSeconds = todayEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    
    const categoryStats: Record<string, number> = {};
    todayEntries.forEach(e => {
      categoryStats[e.category] = (categoryStats[e.category] || 0) + (e.duration || 0);
    });
    
    return { totalSeconds, categoryStats, count: todayEntries.length };
  };

  const { totalSeconds, categoryStats, count } = getTodayStats();

  // 获取分类信息
  const getCategoryInfo = (name: string) => {
    return ACTIVITY_CATEGORIES.find(c => c.name === name) || ACTIVITY_CATEGORIES[5];
  };

  // 渲染时间记录项
  const renderEntry = ({ item }: { item: TimeEntry }) => {
    const category = getCategoryInfo(item.category);
    return (
      <View style={styles.entryCard}>
        <View style={[styles.entryIcon, { backgroundColor: category.color }]}>
          <Text style={styles.entryIconText}>{category.icon}</Text>
        </View>
        <View style={styles.entryInfo}>
          <Text style={styles.entryActivity}>{item.activity}</Text>
          <Text style={styles.entryTime}>
            {item.startTime} - {item.endTime || '进行中'}
          </Text>
        </View>
        <View style={styles.entryRight}>
          <Text style={styles.entryDuration}>
            {formatDuration(item.duration || 0)}
          </Text>
          <Text style={styles.entryDate}>{item.date.slice(5)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteEntry(item.id)}
        >
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
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
          <Text style={styles.headerSubtitle}>追踪你的时间</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addButton, isTracking && styles.addButtonActive]} 
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>{isTracking ? '◼' : '+'}</Text>
        </TouchableOpacity>
      </View>

      {/* 今日统计 */}
      <View style={styles.statsSection}>
        <View style={styles.mainStat}>
          <Text style={styles.mainStatValue}>{formatDuration(totalSeconds)}</Text>
          <Text style={styles.mainStatLabel}>今日总时长</Text>
        </View>
        
        {/* 分类统计 */}
        <View style={styles.categoryStats}>
          {ACTIVITY_CATEGORIES.slice(0, 4).map(cat => {
            const seconds = categoryStats[cat.name] || 0;
            const percentage = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;
            
            return (
              <View key={cat.name} style={styles.categoryStat}>
                <View style={styles.categoryStatHeader}>
                  <Text style={styles.categoryStatIcon}>{cat.icon}</Text>
                  <Text style={styles.categoryStatName}>{cat.name}</Text>
                </View>
                <View style={styles.categoryStatBar}>
                  <View 
                    style={[
                      styles.categoryStatFill, 
                      { backgroundColor: cat.color, width: `${percentage}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.categoryStatTime}>{formatDuration(seconds)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 记录列表 */}
      <View style={styles.listSection}>
        <Text style={styles.listTitle}>今日记录 ({count})</Text>
        <FlatList
          data={entries.filter(e => e.date === getTodayString())}
          keyExtractor={item => item.id}
          renderItem={renderEntry}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⏱️</Text>
              <Text style={styles.emptyText}>还没有记录</Text>
              <Text style={styles.emptySubtext}>点击右上角开始计时</Text>
            </View>
          }
        />
      </View>

      {/* 计时模态框 */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isTracking) setShowAddModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {!isTracking ? (
              <>
                <Text style={styles.modalTitle}>开始计时</Text>
                
                {/* 活动名称 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>活动名称</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="你在做什么？"
                    value={currentActivity}
                    onChangeText={setCurrentActivity}
                    autoFocus
                  />
                </View>

                {/* 分类选择 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>分类</Text>
                  <View style={styles.categoryGrid}>
                    {ACTIVITY_CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat.name}
                        style={[
                          styles.categoryOption,
                          currentCategory === cat.name && { 
                            backgroundColor: cat.color,
                            borderColor: cat.color,
                          },
                        ]}
                        onPress={() => setCurrentCategory(cat.name)}
                      >
                        <Text style={styles.categoryOptionEmoji}>{cat.icon}</Text>
                        <Text style={[
                          styles.categoryOptionText,
                          currentCategory === cat.name && styles.categoryOptionTextActive,
                        ]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalButtonCancel}
                    onPress={() => setShowAddModal(false)}
                  >
                    <Text style={styles.modalButtonCancelText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalButtonConfirm}
                    onPress={startTracking}
                  >
                    <Text style={styles.modalButtonConfirmText}>开始</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>计时中</Text>
                
                <View style={styles.trackingInfo}>
                  <Text style={styles.trackingActivity}>{currentActivity}</Text>
                  <Text style={styles.trackingCategory}>
                    {getCategoryInfo(currentCategory).icon} {currentCategory}
                  </Text>
                </View>

                <View style={styles.timerDisplay}>
                  <Text style={styles.timerText}>{formatDuration(elapsedTime)}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.stopButton}
                  onPress={stopTracking}
                >
                  <Text style={styles.stopButtonText}>停止计时</Text>
                </TouchableOpacity>
              </>
            )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonActive: {
    backgroundColor: '#DC2626',
  },
  addButtonText: {
    color: Colors.background,
    fontSize: 24,
    fontWeight: '500',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainStatValue: {
    fontSize: 48,
    fontWeight: '300',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  mainStatLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  categoryStats: {
    gap: 12,
  },
  categoryStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70,
  },
  categoryStatIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryStatName: {
    fontSize: 13,
    color: Colors.text,
    width: 40,
  },
  categoryStatBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray[100],
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  categoryStatFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryStatTime: {
    fontSize: 13,
    color: Colors.textSecondary,
    width: 60,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  entryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  entryIconText: {
    fontSize: 18,
  },
  entryInfo: {
    flex: 1,
  },
  entryActivity: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  entryTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  entryRight: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  entryDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  entryDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 16,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
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
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  modalInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
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
    borderRadius: 8,
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryOptionEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryOptionText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  categoryOptionTextActive: {
    color: Colors.background,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 8,
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
  // 计时中
  trackingInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  trackingActivity: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  trackingCategory: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerText: {
    fontSize: 64,
    fontWeight: '300',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  stopButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  stopButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
