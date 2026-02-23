import React, { useState, useEffect, useCallback } from 'react';
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
import { DiaryEntry } from '../types';
import { Colors } from '../constants/colors';
import { diaryStorage } from '../utils/storage';
import { getTodayString, formatDate, generateId } from '../utils/date';

// 心情选项
const MOODS = [
  { key: 'happy', label: '开心', emoji: '😊' },
  { key: 'excited', label: '兴奋', emoji: '🤩' },
  { key: 'neutral', label: '平静', emoji: '😌' },
  { key: 'tired', label: '疲惫', emoji: '😴' },
  { key: 'sad', label: '难过', emoji: '😢' },
] as const;

export default function DiaryScreen() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('neutral');

  // 加载数据
  const loadEntries = async () => {
    const data = await diaryStorage.get();
    if (data) {
      setEntries(data.sort((a: DiaryEntry, b: DiaryEntry) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [])
  );

  // 保存数据
  const saveEntries = async (newEntries: DiaryEntry[]) => {
    setEntries(newEntries);
    await diaryStorage.set(newEntries);
  };

  // 添加日记
  const addEntry = () => {
    if (!newEntryContent.trim()) return;
    
    const newEntry: DiaryEntry = {
      id: generateId(),
      date: getTodayString(),
      content: newEntryContent.trim(),
      mood: selectedMood as any,
    };
    
    saveEntries([newEntry, ...entries]);
    setNewEntryContent('');
    setSelectedMood('neutral');
    setShowAddModal(false);
  };

  // 删除日记
  const deleteEntry = (id: string) => {
    const newEntries = entries.filter(entry => entry.id !== id);
    saveEntries(newEntries);
  };

  // 获取心情显示
  const getMoodDisplay = (mood?: string) => {
    const m = MOODS.find(m => m.key === mood);
    return m || MOODS[2];
  };

  // 渲染日记项
  const renderEntry = ({ item }: { item: DiaryEntry }) => {
    const mood = getMoodDisplay(item.mood);
    return (
      <View style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={styles.entryDate}>
            <Text style={styles.entryDay}>
              {new Date(item.date).getDate()}
            </Text>
            <Text style={styles.entryMonth}>
              {new Date(item.date).getMonth() + 1}月
            </Text>
          </View>
          <View style={styles.entryInfo}>
            <Text style={styles.entryWeekday}>
              {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(item.date).getDay()]}
            </Text>
            <Text style={styles.entryMood}>{mood.emoji} {mood.label}</Text>
          </View>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => deleteEntry(item.id)}
          >
            <Text style={styles.deleteText}>×</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.entryContent}>{item.content}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* 头部 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>日记</Text>
          <Text style={styles.headerSubtitle}>记录生活点滴</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 日记列表 */}
      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        renderItem={renderEntry}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>还没有日记</Text>
            <Text style={styles.emptySubtext}>点击右上角开始记录</Text>
          </View>
        }
      />

      {/* 添加模态框 */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>写日记</Text>
            <Text style={styles.modalDate}>{formatDate(getTodayString())}</Text>
            
            {/* 心情选择 */}
            <View style={styles.moodSelector}>
              <Text style={styles.moodLabel}>今天心情如何？</Text>
              <View style={styles.moodOptions}>
                {MOODS.map(mood => (
                  <TouchableOpacity
                    key={mood.key}
                    style={[
                      styles.moodOption,
                      selectedMood === mood.key && styles.moodOptionSelected,
                    ]}
                    onPress={() => setSelectedMood(mood.key)}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text style={[
                      styles.moodText,
                      selectedMood === mood.key && styles.moodTextSelected,
                    ]}>
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 内容输入 */}
            <TextInput
              style={styles.modalInput}
              placeholder="写下今天的想法..."
              value={newEntryContent}
              onChangeText={setNewEntryContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              autoFocus
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
                onPress={addEntry}
              >
                <Text style={styles.modalButtonConfirmText}>保存</Text>
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
  addButtonText: {
    color: Colors.background,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  entryCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDate: {
    alignItems: 'center',
    marginRight: 12,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  entryDay: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  entryMonth: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  entryInfo: {
    flex: 1,
  },
  entryWeekday: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  entryMood: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 18,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  entryContent: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
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
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 20,
  },
  moodSelector: {
    marginBottom: 20,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 12,
  },
  moodOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  moodOption: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  moodOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  moodTextSelected: {
    color: Colors.background,
  },
  modalInput: {
    fontSize: 16,
    lineHeight: 24,
    padding: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    height: 150,
    marginBottom: 24,
    textAlignVertical: 'top',
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
