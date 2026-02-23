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
import { InventoryItem } from '../types';
import { Colors } from '../constants/colors';
import { inventoryStorage } from '../utils/storage';
import { getTodayString, generateId } from '../utils/date';

// 分类选项
const CATEGORIES = ['电子产品', '衣物', '书籍', '食品', '药品', '其他'];

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  
  // 表单状态
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(CATEGORIES[0]);
  const [newItemLocation, setNewItemLocation] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemNotes, setNewItemNotes] = useState('');

  // 加载数据
  const loadItems = async () => {
    const data = await inventoryStorage.get();
    if (data) setItems(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  // 保存数据
  const saveItems = async (newItems: InventoryItem[]) => {
    setItems(newItems);
    await inventoryStorage.set(newItems);
  };

  // 添加物品
  const addItem = () => {
    if (!newItemName.trim()) return;
    
    const newItem: InventoryItem = {
      id: generateId(),
      name: newItemName.trim(),
      category: newItemCategory,
      location: newItemLocation.trim() || '未指定',
      quantity: parseInt(newItemQuantity) || 1,
      notes: newItemNotes.trim(),
      createdAt: getTodayString(),
    };
    
    saveItems([newItem, ...items]);
    resetForm();
    setShowAddModal(false);
  };

  // 重置表单
  const resetForm = () => {
    setNewItemName('');
    setNewItemCategory(CATEGORIES[0]);
    setNewItemLocation('');
    setNewItemQuantity('1');
    setNewItemNotes('');
  };

  // 删除物品
  const deleteItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    saveItems(newItems);
  };

  // 更新数量
  const updateQuantity = (id: string, delta: number) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    });
    saveItems(newItems);
  };

  // 获取分类统计
  const getCategoryCount = (category: string) => {
    if (category === '全部') return items.length;
    return items.filter(item => item.category === category).length;
  };

  // 过滤物品
  const filteredItems = selectedCategory === '全部' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  // 渲染物品项
  const renderItem = ({ item }: { item: InventoryItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemMain}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.itemMeta}>
            <Text style={styles.itemCategory}>{item.category}</Text>
            <Text style={styles.itemDot}>·</Text>
            <Text style={styles.itemLocation}>{item.location}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteItem(item.id)}
        >
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
      </View>
      
      {item.notes && (
        <Text style={styles.itemNotes}>{item.notes}</Text>
      )}
      
      <View style={styles.itemFooter}>
        <View style={styles.quantityControl}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, -1)}
          >
            <Text style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, 1)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.itemDate}>{item.createdAt}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* 头部 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>收纳</Text>
          <Text style={styles.headerSubtitle}>管理你的物品</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 分类筛选 */}
      <View style={styles.categorySection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryList}>
            {['全部', ...CATEGORIES].map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}>
                  {category} ({getCategoryCount(category)})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 统计 */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          共 {filteredItems.length} 件物品
        </Text>
      </View>

      {/* 物品列表 */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>还没有物品</Text>
            <Text style={styles.emptySubtext}>点击右上角添加</Text>
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
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>添加物品</Text>
              
              {/* 名称 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>名称</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="物品名称"
                  value={newItemName}
                  onChangeText={setNewItemName}
                  autoFocus
                />
              </View>

              {/* 分类 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>分类</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryOption,
                        newItemCategory === cat && styles.categoryOptionActive,
                      ]}
                      onPress={() => setNewItemCategory(cat)}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        newItemCategory === cat && styles.categoryOptionTextActive,
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 位置 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>位置</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="存放位置"
                  value={newItemLocation}
                  onChangeText={setNewItemLocation}
                />
              </View>

              {/* 数量 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>数量</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="数量"
                  value={newItemQuantity}
                  onChangeText={setNewItemQuantity}
                  keyboardType="number-pad"
                />
              </View>

              {/* 备注 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>备注</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalInputMultiline]}
                  placeholder="备注信息（可选）"
                  value={newItemNotes}
                  onChangeText={setNewItemNotes}
                  multiline
                  numberOfLines={3}
                />
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
                  onPress={addItem}
                >
                  <Text style={styles.modalButtonConfirmText}>添加</Text>
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
  categorySection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoryList: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.background,
  },
  statsBar: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  statsText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  itemCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemMain: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  itemDot: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 6,
  },
  itemLocation: {
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
  itemNotes: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quantityButtonText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  itemDate: {
    fontSize: 12,
    color: Colors.textMuted,
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
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    marginTop: 60,
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
  modalInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
});
