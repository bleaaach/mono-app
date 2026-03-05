import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LifeLogCategory, LifeLogEntry } from '../types';
import { lifeLogCategoryStorage, lifeLogEntryStorage } from '../utils/storage';
import { formatDate } from '../utils/date';
import type { LogStackParamList } from '../navigation/LogNavigator';
import { FontSizes, scaleFont } from '../utils/responsive';

export default function LogEntryListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LogStackParamList>>();
  const route = useRoute<RouteProp<LogStackParamList, 'LogEntryList'>>();
  const { categoryId } = route.params;

  const [category, setCategory] = useState<LifeLogCategory | null>(null);
  const [entries, setEntries] = useState<LifeLogEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LifeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [categories, allEntries] = await Promise.all([
        lifeLogCategoryStorage.get(),
        lifeLogEntryStorage.get(),
      ]);

      const foundCategory = categories?.find(c => c.id === categoryId) || null;
      setCategory(foundCategory);

      const categoryEntries = allEntries?.filter(e => e.categoryId === categoryId) || [];
      categoryEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEntries(categoryEntries);
      setFilteredEntries(categoryEntries);

      // 提取所有标签
      const tagsSet = new Set<string>();
      categoryEntries.forEach(entry => {
        entry.tags.forEach(tag => tagsSet.add(tag));
      });
      setAllTags(Array.from(tagsSet).sort());
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  // 搜索和筛选
  useEffect(() => {
    let result = [...entries];

    // 关键词搜索
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(entry => {
        // 搜索标题
        const titleField = category?.fields[0];
        const title = titleField ? entry.data[titleField.id] : entry.title;
        if (title?.toLowerCase().includes(query)) return true;

        // 搜索标签
        if (entry.tags.some(tag => tag.toLowerCase().includes(query))) return true;

        // 搜索内容
        return category?.fields.some(field => {
          const value = entry.data[field.id];
          if (typeof value === 'string' && value.toLowerCase().includes(query)) {
            return true;
          }
          return false;
        });
      });
    }

    // 标签筛选
    if (selectedTags.length > 0) {
      result = result.filter(entry =>
        selectedTags.some(tag => entry.tags.includes(tag))
      );
    }

    setFilteredEntries(result);
  }, [searchQuery, selectedTags, entries, category]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDeleteEntry = (entry: LifeLogEntry) => {
    Alert.alert(
      '删除记录',
      '确定要删除这条记录吗？此操作无法撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const allEntries = await lifeLogEntryStorage.get() || [];
              const updated = allEntries.filter(e => e.id !== entry.id);
              await lifeLogEntryStorage.set(updated);
              setEntries(prev => prev.filter(e => e.id !== entry.id));
            } catch (error) {
              Alert.alert('错误', '删除失败，请重试');
            }
          },
        },
      ]
    );
  };

  const renderFieldValue = (field: any, value: any) => {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    switch (field.type) {
      case 'rating':
        return (
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map(star => (
              <View
                key={star}
                style={[
                  styles.ratingDot,
                  star <= value && styles.ratingDotActive,
                ]}
              />
            ))}
          </View>
        );
      case 'date':
        return <Text style={styles.fieldValue}>{formatDate(new Date(value))}</Text>;
      case 'select':
        return <Text style={styles.fieldValue}>{value}</Text>;
      case 'number':
        return <Text style={styles.fieldValue}>{value}</Text>;
      case 'multiline':
        return (
          <Text style={styles.multilineValue} numberOfLines={2}>
            {value}
          </Text>
        );
      default:
        return <Text style={styles.fieldValue}>{value}</Text>;
    }
  };

  const renderEntry = ({ item }: { item: LifeLogEntry }) => {
    const titleField = category?.fields[0];
    const title = titleField ? item.data[titleField.id] : item.title;
    const subtitleFields = category?.fields.slice(1, 3) || [];

    return (
      <TouchableOpacity
        style={styles.entryCard}
        onPress={() => navigation.navigate('LogEntryForm', { categoryId, entryId: item.id })}
        onLongPress={() => handleDeleteEntry(item)}
      >
        {/* 标题行 */}
        <View style={styles.entryHeader}>
          <Text style={styles.entryTitle} numberOfLines={1}>
            {title || '未命名记录'}
          </Text>
          <Text style={styles.entryDate}>{formatDate(new Date(item.createdAt))}</Text>
        </View>

        {/* 字段预览 - 更简洁 */}
        {subtitleFields.length > 0 && (
          <View style={styles.fieldsPreview}>
            {subtitleFields.map(field => {
              const value = item.data[field.id];
              if (!value) return null;
              return (
                <View key={field.id} style={styles.fieldItem}>
                  <Text style={styles.fieldLabel}>{field.name}</Text>
                  {renderFieldValue(field, value)}
                </View>
              );
            })}
          </View>
        )}

        {/* 标签 */}
        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={styles.tagMore}>+{item.tags.length - 3}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="document-text-outline" size={32} color="#999" />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery || selectedTags.length > 0 ? '没有匹配的记录' : '还没有记录'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedTags.length > 0 ? '尝试其他搜索条件' : '点击右下角添加第一条记录'}
      </Text>
    </View>
  );

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setShowSearch(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - 极简风格 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category?.name || '记录列表'}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name={showSearch ? "close" : "search"} size={22} color="#000" />
          </TouchableOpacity>
          {allTags.length > 0 && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="filter" size={22} color="#000" />
              {selectedTags.length > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{selectedTags.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="搜索标题、内容、标签..."
            placeholderTextColor="#999"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Active Filters */}
      {(searchQuery || selectedTags.length > 0) && (
        <View style={styles.activeFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {searchQuery && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>搜索: {searchQuery}</Text>
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close" size={14} color="#666" />
                </TouchableOpacity>
              </View>
            )}
            {selectedTags.map(tag => (
              <View key={tag} style={styles.filterChip}>
                <Text style={styles.filterChipText}>{tag}</Text>
                <TouchableOpacity onPress={() => toggleTag(tag)}>
                  <Ionicons name="close" size={14} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>清除全部</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* 记录数量 */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>
          共 {filteredEntries.length} 条记录
          {filteredEntries.length !== entries.length && ` (总计 ${entries.length})`}
        </Text>
      </View>

      {/* Entry List */}
      <FlatList
        data={filteredEntries}
        renderItem={renderEntry}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContainer,
          filteredEntries.length === 0 && styles.emptyListContainer,
        ]}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('LogEntryForm', { categoryId })}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>筛选标签</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {allTags.length === 0 ? (
                <Text style={styles.noTagsText}>该分类下没有标签</Text>
              ) : (
                <View style={styles.tagsGrid}>
                  {allTags.map(tag => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tagOption,
                        selectedTags.includes(tag) && styles.tagOptionSelected,
                      ]}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text
                        style={[
                          styles.tagOptionText,
                          selectedTags.includes(tag) && styles.tagOptionTextSelected,
                        ]}
                      >
                        {tag}
                      </Text>
                      {selectedTags.includes(tag) && (
                        <Ionicons name="checkmark" size={14} color="#fff" style={styles.checkIcon} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearButton} onPress={() => setSelectedTags([])}>
                <Text style={styles.clearButtonText}>清除筛选</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>
                  确定 {selectedTags.length > 0 && `(${selectedTags.length})`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  // Header - 极简
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  // 搜索栏
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    paddingVertical: 8,
  },
  // 活跃筛选
  activeFilters: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
  },
  filterChipText: {
    fontSize: 13,
    color: '#333',
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearFiltersText: {
    fontSize: 13,
    color: '#666',
  },
  // 计数栏
  countBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  countText: {
    fontSize: 13,
    color: '#999',
  },
  // 列表
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyListContainer: {
    flex: 1,
  },
  // 记录卡片 - 极简风格
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  entryDate: {
    fontSize: 12,
    color: '#999',
  },
  // 字段预览 - 水平排列
  fieldsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  fieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 6,
  },
  fieldValue: {
    fontSize: 13,
    color: '#333',
  },
  multilineValue: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    flex: 1,
  },
  // 评分 - 极简圆点
  ratingContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  ratingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e5e5e5',
  },
  ratingDotActive: {
    backgroundColor: '#000',
  },
  // 标签
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  tag: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
  },
  tagMore: {
    fontSize: 11,
    color: '#999',
    paddingVertical: 4,
  },
  // 空状态
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
  },
  // 筛选弹窗
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalBody: {
    padding: 20,
  },
  noTagsText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 40,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  tagOptionSelected: {
    backgroundColor: '#000',
  },
  tagOptionText: {
    fontSize: 14,
    color: '#333',
  },
  tagOptionTextSelected: {
    color: '#fff',
  },
  checkIcon: {
    marginLeft: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  clearButtonText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 12,
  },
  applyButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  // 添加按钮
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});
