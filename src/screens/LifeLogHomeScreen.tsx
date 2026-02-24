import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LifeLogCategory, LifeLogEntry, LogField } from '../types';
import { lifeLogCategoryStorage, lifeLogEntryStorage } from '../utils/storage';
import { generateId } from '../utils/date';

type LifeLogStackParamList = {
  LifeLogHome: undefined;
  LifeLogEntries: { categoryId: string };
  LifeLogEntryDetail: { entryId: string; categoryId: string };
};

type NavigationProp = NativeStackNavigationProp<LifeLogStackParamList>;

// 默认示例分类
const DEFAULT_CATEGORIES: LifeLogCategory[] = [
  {
    id: 'movie',
    name: '观影记录',
    description: '记录看过的电影',
    color: '#000000',
    icon: '🎬',
    fields: [
      { id: 'title', name: '电影名称', type: 'text', required: true, placeholder: '输入电影名称' },
      { id: 'director', name: '导演', type: 'text', required: false, placeholder: '导演姓名' },
      { id: 'rating', name: '评分', type: 'rating', required: true },
      { id: 'review', name: '影评', type: 'multiline', required: false, placeholder: '写下你的观影感受...' },
      { id: 'date', name: '观影日期', type: 'date', required: true },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'book',
    name: '阅读记录',
    description: '记录读过的书',
    color: '#333333',
    icon: '📚',
    fields: [
      { id: 'title', name: '书名', type: 'text', required: true, placeholder: '输入书名' },
      { id: 'author', name: '作者', type: 'text', required: false, placeholder: '作者姓名' },
      { id: 'rating', name: '评分', type: 'rating', required: true },
      { id: 'notes', name: '读书笔记', type: 'multiline', required: false, placeholder: '记录你的读书心得...' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'restaurant',
    name: '美食记录',
    description: '记录吃过的美食',
    color: '#666666',
    icon: '🍽️',
    fields: [
      { id: 'name', name: '店名', type: 'text', required: true, placeholder: '餐厅名称' },
      { id: 'dish', name: '菜品', type: 'text', required: true, placeholder: '吃了什么' },
      { id: 'rating', name: '评分', type: 'rating', required: true },
      { id: 'review', name: '评价', type: 'multiline', required: false, placeholder: '味道如何...' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function LifeLogHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [categories, setCategories] = useState<LifeLogCategory[]>([]);
  const [entries, setEntries] = useState<LifeLogEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // 新建分类表单
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  const loadData = async () => {
    const [cats, ents] = await Promise.all([
      lifeLogCategoryStorage.get(),
      lifeLogEntryStorage.get(),
    ]);
    
    if (cats && cats.length > 0) {
      setCategories(cats);
    } else {
      // 首次使用，设置默认分类
      setCategories(DEFAULT_CATEGORIES);
      await lifeLogCategoryStorage.set(DEFAULT_CATEGORIES);
    }
    
    if (ents) {
      setEntries(ents);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const getEntryCount = (categoryId: string) => {
    return entries.filter(e => e.categoryId === categoryId).length;
  };

  const getLastEntryDate = (categoryId: string) => {
    const categoryEntries = entries.filter(e => e.categoryId === categoryId);
    if (categoryEntries.length === 0) return null;
    return categoryEntries.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0].createdAt;
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;

    const newCategory: LifeLogCategory = {
      id: generateId(),
      name: newCategoryName.trim(),
      description: newCategoryDesc.trim() || undefined,
      color: '#000000',
      icon: '📝',
      fields: [
        { id: 'title', name: '标题', type: 'text', required: true, placeholder: '输入标题' },
        { id: 'content', name: '内容', type: 'multiline', required: false, placeholder: '详细描述...' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newCategories = [...categories, newCategory];
    setCategories(newCategories);
    await lifeLogCategoryStorage.set(newCategories);
    
    setNewCategoryName('');
    setNewCategoryDesc('');
    setShowAddModal(false);
  };

  const deleteCategory = (category: LifeLogCategory) => {
    Alert.alert(
      '删除分类',
      `确定要删除"${category.name}"吗？该分类下的所有记录也会被删除。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const newCategories = categories.filter(c => c.id !== category.id);
            const newEntries = entries.filter(e => e.categoryId !== category.id);
            setCategories(newCategories);
            setEntries(newEntries);
            await lifeLogCategoryStorage.set(newCategories);
            await lifeLogEntryStorage.set(newEntries);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Life Log</Text>
          <Text style={styles.headerSubtitle}>记录生活的点滴</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{categories.length}</Text>
            <Text style={styles.statLabel}>分类</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{entries.length}</Text>
            <Text style={styles.statLabel}>记录</Text>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>我的日志本</Text>
          
          {categories.map(category => {
            const count = getEntryCount(category.id);
            const lastDate = getLastEntryDate(category.id);
            
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => navigation.navigate('LifeLogEntries', { categoryId: category.id })}
                onLongPress={() => deleteCategory(category)}
              >
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    {category.description && (
                      <Text style={styles.categoryDesc}>{category.description}</Text>
                    )}
                  </View>
                  <Text style={styles.categoryArrow}>→</Text>
                </View>
                
                <View style={styles.categoryFooter}>
                  <Text style={styles.categoryCount}>{count} 条记录</Text>
                  {lastDate && (
                    <Text style={styles.categoryDate}>
                      最近 {new Date(lastDate).toLocaleDateString('zh-CN')}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Category Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>新建日志本</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeBtn}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>名称</Text>
              <TextInput
                style={styles.input}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="如：观影记录、旅行日记..."
                placeholderTextColor="#999999"
              />

              <Text style={styles.inputLabel}>描述（可选）</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newCategoryDesc}
                onChangeText={setNewCategoryDesc}
                placeholder="简单描述这个日志本的用途..."
                placeholderTextColor="#999999"
                multiline
              />
            </View>

            <TouchableOpacity
              style={[styles.createButton, !newCategoryName.trim() && styles.createButtonDisabled]}
              onPress={addCategory}
              disabled={!newCategoryName.trim()}
            >
              <Text style={styles.createButtonText}>创建</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#999999',
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  statNumber: {
    fontSize: 42,
    fontWeight: '200',
    color: '#000000',
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 13,
    color: '#999999',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoriesSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  categoryDesc: {
    fontSize: 13,
    color: '#999999',
  },
  categoryArrow: {
    fontSize: 20,
    color: '#CCCCCC',
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  categoryCount: {
    fontSize: 13,
    color: '#666666',
  },
  categoryDate: {
    fontSize: 12,
    color: '#999999',
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  closeBtn: {
    fontSize: 28,
    color: '#999999',
  },
  modalBody: {
    padding: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    marginBottom: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: '#000000',
    margin: 24,
    marginTop: 0,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
