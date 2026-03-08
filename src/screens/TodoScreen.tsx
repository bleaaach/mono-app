import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, ScrollView as GHScrollView } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Todo } from '../types';
import { Colors } from '../constants/colors';
import { todoStorage } from '../utils/storage';
import { getTodayString, formatDate, getRelativeTime, generateId } from '../utils/date';
import { CheckIcon } from '../components/Icons';
import { FontSizes, scaleFont } from '../utils/responsive';

const CATEGORIES = [
  { key: 'today', label: '今天' },
  { key: 'upcoming', label: '计划' },
  { key: 'anytime', label: '随时' },
  { key: 'someday', label: '某天' },
] as const;

const SWIPE_THRESHOLD = 60;

export default function TodoScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'anytime' | 'someday'>('today');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const loadTodos = useCallback(async () => {
    const data = await todoStorage.get();
    if (data) setTodos(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTodos();
    }, [loadTodos])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTodos();
    setRefreshing(false);
  }, [loadTodos]);

  const saveTodos = useCallback(async (newTodos: Todo[]) => {
    setTodos(newTodos);
    await todoStorage.set(newTodos);
  }, []);

  const addTodo = useCallback(() => {
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
  }, [newTodoTitle, activeTab, todos, saveTodos]);

  const toggleTodo = useCallback((id: string) => {
    const newTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos(newTodos);
  }, [todos, saveTodos]);

  const deleteTodo = useCallback((id: string) => {
    const newTodos = todos.filter(todo => todo.id !== id);
    saveTodos(newTodos);
  }, [todos, saveTodos]);

  const filteredTodos = useMemo(() => 
    todos.filter(todo => todo.category === activeTab && !todo.completed),
    [todos, activeTab]
  );
  
  const completedTodos = useMemo(() => 
    todos.filter(todo => todo.category === activeTab && todo.completed),
    [todos, activeTab]
  );
  
  const renderTodoItem = useCallback(({ item }: { item: Todo }) => (
    <TouchableOpacity 
      style={styles.todoItem}
      onPress={() => toggleTodo(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
        {item.completed && <CheckIcon size={14} color="#FFFFFF" />}
      </View>
      <Text style={[styles.todoTitle, item.completed && styles.todoTitleCompleted]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  ), [toggleTodo]);

  const changeTab = useCallback((direction: 'left' | 'right') => {
    const currentIndex = CATEGORIES.findIndex(c => c.key === activeTab);
    if (direction === 'left' && currentIndex < CATEGORIES.length - 1) {
      setActiveTab(CATEGORIES[currentIndex + 1].key as any);
    } else if (direction === 'right' && currentIndex > 0) {
      setActiveTab(CATEGORIES[currentIndex - 1].key as any);
    }
  }, [activeTab]);

  const onGestureEvent = useCallback((event: PanGestureHandlerGestureEvent) => {
    'worklet';
    translateX.value = startX.value + event.nativeEvent.translationX;
  }, []);

  const onHandlerStateChange = useCallback((event: PanGestureHandlerGestureEvent) => {
    'worklet';
    if (event.nativeEvent.state === 5) {
      const velocity = event.nativeEvent.velocityX;
      const translation = event.nativeEvent.translationX;
      
      if (velocity < -500 || translation < -SWIPE_THRESHOLD) {
        runOnJS(changeTab)('left');
      } else if (velocity > 500 || translation > SWIPE_THRESHOLD) {
        runOnJS(changeTab)('right');
      }
      
      translateX.value = withSpring(0, { damping: 20, stiffness: 100 });
    } else if (event.nativeEvent.state === 2) {
      startX.value = translateX.value;
    }
  }, [changeTab]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <View style={styles.subNav}>
        <GHScrollView horizontal showsHorizontalScrollIndicator={false}>
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
        </GHScrollView>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <PanGestureHandler 
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-50, 50]}
        failOffsetY={[-30, 30]}
      >
        <Animated.View style={[styles.content, animatedStyle]}>
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

          <TouchableOpacity 
            style={styles.quickInput}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.quickInputCircle} />
            <Text style={styles.quickInputText}>添加新任务...</Text>
          </TouchableOpacity>

          <FlatList
            data={filteredTodos}
            keyExtractor={item => item.id}
            renderItem={renderTodoItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            getItemLayout={(data, index) => ({ length: 56, offset: 56 * index, index })}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
          />

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
        </Animated.View>
      </PanGestureHandler>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
        </KeyboardAvoidingView>
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
    fontSize: FontSizes.lg,
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
    fontSize: FontSizes.xl,
    paddingTop: Platform.OS === 'android' ? 12 : 12,
    paddingBottom: Platform.OS === 'android' ? 12 : 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 24,
    lineHeight: Platform.OS === 'android' ? scaleFont(26) : undefined,
    ...(Platform.OS === 'android' && {
      includeFontPadding: false,
      textAlignVertical: 'center',
    }),
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
