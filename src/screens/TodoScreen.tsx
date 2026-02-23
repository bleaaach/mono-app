import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Todo } from '../types';
import { Colors } from '../constants/colors';
import { todoStorage } from '../utils/storage';
import { getTodayString, formatDate, getRelativeTime, generateId } from '../utils/date';

// 待办分类
const CATEGORIES = [
  { key: 'today', label: '今天' },
  { key: 'upcoming', label: '计划' },
  { key: 'anytime', label: '随时' },
  { key: 'someday', label: '某天' },
] as const;

export default function TodoScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'anytime' | 'someday'>('today');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  // 加载数据
  const loadTodos = async () => {
    const data = await todoStorage.get();
    if (data) setTodos(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadTodos();
    }, [])
  );

  // 保存数据
  const saveTodos = async (newTodos: Todo[]) => {
    setTodos(newTodos);
    await todoStorage.set(newTodos);
  };

  // 添加待办
  const addTodo = () => {
    if (!newTodoTitle.trim()) return;
    
    const newTodo: Todo = {
      id: generateId(),
      title: newTodoTitle.trim(),
      completed: false,
      category: activeTab,
      createdAt: getTodayString(),
    };
    
    saveTodos([newTodo, ...todos]);
    setNewTodoTitle('');
    setShowAddModal(false);
  };

  // 切换完成状态
  const toggleTodo = (id: string) => {
    const newTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos(newTodos);
  };

  // 删除待办
  const deleteTodo = (id: string) => {
    const newTodos = todos.filter(todo => todo.id !== id);
    saveTodos(newTodos);
  };

  // 获取当前标签的待办
  const filteredTodos = todos.filter(todo => todo.category === activeTab && !todo.completed);
  const completedTodos = todos.filter(todo => todo.category === activeTab && todo.completed);

  // 渲染待办项
  const renderTodoItem = ({ item }: { item: Todo }) => (
    <TouchableOpacity 
      style={styles.todoItem}
      onPress={() => toggleTodo(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
        {item.completed && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[styles.todoTitle, item.completed && styles.todoTitleCompleted]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* 子导航 */}
      <View style={styles.subNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.subNavContent}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.subNavItem, activeTab === cat.key && styles.subNavItemActive]}
                onPress={() => setActiveTab(cat.key as any)}
              >
                <Text style={[styles.subNavText, activeTab === cat.key && styles.subNavTextActive]}>
                  {cat.label}
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
        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {CATEGORIES.find(c => c.key === activeTab)?.label}
          </Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === 'today' ? formatDate(getTodayString()) : 
             activeTab === 'upcoming' ? '即将到来的任务' :
             activeTab === 'anytime' ? '没有特定时间的任务' : '将来可能会做的任务'}
          </Text>
        </View>

        {/* 快速输入 */}
        <TouchableOpacity 
          style={styles.quickInput}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.quickInputCircle} />
          <Text style={styles.quickInputText}>添加新任务...</Text>
        </TouchableOpacity>

        {/* 待办列表 */}
        <FlatList
          data={filteredTodos}
          keyExtractor={item => item.id}
          renderItem={renderTodoItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />

        {/* 已完成区域 */}
        {completedTodos.length > 0 && (
          <View style={styles.completedSection}>
            <TouchableOpacity 
              style={styles.completedHeader}
              onPress={() => setShowCompleted(!showCompleted)}
            >
              <Text style={styles.completedArrow}>{showCompleted ? '▼' : '▶'}</Text>
              <Text style={styles.completedText}>已完成 {completedTodos.length}</Text>
            </TouchableOpacity>
            {showCompleted && (
              <FlatList
                data={completedTodos}
                keyExtractor={item => item.id}
                renderItem={renderTodoItem}
                scrollEnabled={false}
              />
            )}
          </View>
        )}
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
            <Text style={styles.modalTitle}>新建任务</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="输入任务内容..."
              value={newTodoTitle}
              onChangeText={setNewTodoTitle}
              autoFocus
              onSubmitEditing={addTodo}
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
                onPress={addTodo}
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
    padding: 20,
  },
  header: {
    marginBottom: 24,
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
  quickInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    marginBottom: 20,
  },
  quickInputCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    marginRight: 12,
  },
  quickInputText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  listContent: {
    paddingBottom: 20,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  todoTitle: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  todoTitleCompleted: {
    color: Colors.completed,
    textDecorationLine: 'line-through',
  },
  completedSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  completedArrow: {
    fontSize: 12,
    color: Colors.textMuted,
    marginRight: 8,
  },
  completedText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
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
