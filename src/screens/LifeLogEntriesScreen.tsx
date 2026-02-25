import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LifeLogCategory, LifeLogEntry, LogField } from '../types';
import { lifeLogCategoryStorage, lifeLogEntryStorage } from '../utils/storage';
import { generateId } from '../utils/date';
import { StarIcon } from '../components/Icons';

type LifeLogStackParamList = {
  LifeLogHome: undefined;
  LifeLogEntries: { categoryId: string };
};

type NavigationProp = NativeStackNavigationProp<LifeLogStackParamList>;
type RouteProps = RouteProp<LifeLogStackParamList, 'LifeLogEntries'>;

// 评分组件
const RatingInput = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <View style={styles.ratingContainer}>
    {[1, 2, 3, 4, 5].map(star => (
      <TouchableOpacity key={star} onPress={() => onChange(star)}>
        <StarIcon
          size={24}
          color={star <= value ? '#FFB800' : '#D1D5DB'}
        />
      </TouchableOpacity>
    ))}
  </View>
);

export default function LifeLogEntriesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { categoryId } = route.params;

  const [category, setCategory] = useState<LifeLogCategory | null>(null);
  const [entries, setEntries] = useState<LifeLogEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LifeLogEntry | null>(null);

  // 表单数据
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formTags, setFormTags] = useState<string[]>([]);

  const loadData = async () => {
    const [cats, ents] = await Promise.all([
      lifeLogCategoryStorage.get(),
      lifeLogEntryStorage.getByCategory(categoryId),
    ]);

    if (cats) {
      const cat = cats.find(c => c.id === categoryId);
      if (cat) setCategory(cat);
    }
    setEntries(ents);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [categoryId])
  );

  const resetForm = () => {
    setFormData({});
    setFormTags([]);
    setEditingEntry(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (entry: LifeLogEntry) => {
    setEditingEntry(entry);
    setFormData(entry.data);
    setFormTags(entry.tags);
    setShowAddModal(true);
  };

  const saveEntry = async () => {
    if (!category) return;

    // 验证必填字段
    const requiredFields = category.fields.filter(f => f.required);
    for (const field of requiredFields) {
      if (!formData[field.id] || formData[field.id] === '') {
        Alert.alert('提示', `请填写${field.name}`);
        return;
      }
    }

    const now = new Date().toISOString();

    if (editingEntry) {
      // 更新
      const updatedEntry: LifeLogEntry = {
        ...editingEntry,
        title: formData[category.fields[0]?.id] || '无标题',
        data: formData,
        tags: formTags,
        updatedAt: now,
      };

      const allEntries = await lifeLogEntryStorage.get() || [];
      const newEntries = allEntries.map(e => e.id === updatedEntry.id ? updatedEntry : e);
      await lifeLogEntryStorage.set(newEntries);
    } else {
      // 新建
      const newEntry: LifeLogEntry = {
        id: generateId(),
        categoryId,
        title: formData[category.fields[0]?.id] || '无标题',
        data: formData,
        tags: formTags,
        createdAt: now,
        updatedAt: now,
      };

      const allEntries = await lifeLogEntryStorage.get() || [];
      await lifeLogEntryStorage.set([newEntry, ...allEntries]);
    }

    resetForm();
    setShowAddModal(false);
    loadData();
  };

  const deleteEntry = (entry: LifeLogEntry) => {
    Alert.alert(
      '删除记录',
      '确定要删除这条记录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const allEntries = await lifeLogEntryStorage.get() || [];
            const newEntries = allEntries.filter(e => e.id !== entry.id);
            await lifeLogEntryStorage.set(newEntries);
            loadData();
          },
        },
      ]
    );
  };

  const renderFieldInput = (field: LogField) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'rating':
        return (
          <RatingInput
            value={Number(value) || 0}
            onChange={(v) => setFormData({ ...formData, [field.id]: v })}
          />
        );
      case 'multiline':
        return (
          <TextInput
            style={[styles.input, styles.textArea]}
            value={value}
            onChangeText={(text) => setFormData({ ...formData, [field.id]: text })}
            placeholder={field.placeholder}
            placeholderTextColor="#999999"
            multiline
            numberOfLines={4}
          />
        );
      case 'date':
        // 简化处理，使用文本输入
        return (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={(text) => setFormData({ ...formData, [field.id]: text })}
            placeholder={field.placeholder || 'YYYY-MM-DD'}
            placeholderTextColor="#999999"
          />
        );
      default:
        return (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={(text) => setFormData({ ...formData, [field.id]: text })}
            placeholder={field.placeholder}
            placeholderTextColor="#999999"
          />
        );
    }
  };

  const renderEntryValue = (entry: LifeLogEntry, field: LogField) => {
    const value = entry.data[field.id];
    if (!value) return null;

    if (field.type === 'rating') {
      return (
        <View style={{ flexDirection: 'row' }}>
          {Array.from({ length: Number(value) }).map((_, i) => (
            <StarIcon key={i} size={14} color="#FFB800" />
          ))}
        </View>
      );
    }
    return String(value);
  };

  if (!category) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>加载中...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerIcon}>{category.icon}</Text>
          <Text style={styles.headerTitle}>{category.name}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Entries List */}
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{category.icon}</Text>
            <Text style={styles.emptyTitle}>还没有记录</Text>
            <Text style={styles.emptyDesc}>点击右上角 + 添加第一条记录</Text>
          </View>
        ) : (
          <View style={styles.entriesList}>
            {entries.map((entry, index) => (
              <View key={entry.id} style={styles.entryCard}>
                <TouchableOpacity
                  style={styles.entryContent}
                  onPress={() => openEditModal(entry)}
                >
                  {/* Entry Header */}
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryDate}>
                      {new Date(entry.createdAt).toLocaleDateString('zh-CN')}
                    </Text>
                    <View style={styles.entryActions}>
                      <TouchableOpacity onPress={() => openEditModal(entry)}>
                        <Text style={styles.actionText}>编辑</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteEntry(entry)}>
                        <Text style={[styles.actionText, styles.deleteText]}>删除</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Entry Title */}
                  <Text style={styles.entryTitle}>{entry.title}</Text>

                  {/* Entry Fields */}
                  {category.fields.slice(1).map(field => {
                    const value = renderEntryValue(entry, field);
                    if (!value) return null;
                    return (
                      <View key={field.id} style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>{field.name}</Text>
                        <Text style={styles.fieldValue}>{value}</Text>
                      </View>
                    );
                  })}

                  {/* Tags */}
                  {entry.tags.length > 0 && (
                    <View style={styles.tagsRow}>
                      {entry.tags.map((tag, i) => (
                        <Text key={i} style={styles.tag}>#{tag}</Text>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          resetForm();
          setShowAddModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEntry ? '编辑记录' : '添加记录'}
              </Text>
              <TouchableOpacity onPress={() => {
                resetForm();
                setShowAddModal(false);
              }}>
                <Text style={styles.closeBtn}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Dynamic Fields */}
              {category.fields.map(field => (
                <View key={field.id} style={styles.fieldContainer}>
                  <Text style={styles.fieldInputLabel}>
                    {field.name}
                    {field.required && <Text style={styles.required}> *</Text>}
                  </Text>
                  {renderFieldInput(field)}
                </View>
              ))}

              {/* Tags */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldInputLabel}>标签</Text>
                <TextInput
                  style={styles.input}
                  value={formTags.join(', ')}
                  onChangeText={(text) => setFormTags(text.split(',').map(t => t.trim()).filter(Boolean))}
                  placeholder="用逗号分隔多个标签"
                  placeholderTextColor="#999999"
                />
              </View>

              <View style={styles.modalFooter} />
            </ScrollView>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveEntry}
            >
              <Text style={styles.saveButtonText}>
                {editingEntry ? '更新' : '保存'}
              </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: '#000000',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#999999',
  },
  entriesList: {
    padding: 20,
  },
  entryCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    marginBottom: 16,
  },
  entryContent: {
    padding: 20,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 12,
    color: '#999999',
  },
  entryActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionText: {
    fontSize: 13,
    color: '#666666',
  },
  deleteText: {
    color: '#FF3B30',
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#999999',
    width: 60,
    marginRight: 8,
  },
  fieldValue: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  tag: {
    fontSize: 12,
    color: '#666666',
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
    maxHeight: '90%',
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
  fieldContainer: {
    marginBottom: 20,
  },
  fieldInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingStar: {
    fontSize: 32,
    color: '#E0E0E0',
  },
  ratingStarActive: {
    color: '#000000',
  },
  modalFooter: {
    height: 20,
  },
  saveButton: {
    backgroundColor: '#000000',
    margin: 24,
    marginTop: 0,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
