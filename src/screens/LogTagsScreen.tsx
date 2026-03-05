import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LifeLogCategory, LifeLogEntry } from '../types';
import { lifeLogCategoryStorage, lifeLogEntryStorage } from '../utils/storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LogStackParamList } from '../navigation/LogNavigator';
import { FontSizes, scaleFont } from '../utils/responsive';

interface TagStats {
  name: string;
  count: number;
  entries: LifeLogEntry[];
}

export default function LogTagsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LogStackParamList>>();
  const [categories, setCategories] = useState<LifeLogCategory[]>([]);
  const [entries, setEntries] = useState<LifeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const loadData = async () => {
    try {
      const [cats, ents] = await Promise.all([
        lifeLogCategoryStorage.get(),
        lifeLogEntryStorage.get(),
      ]);
      setCategories(cats || []);
      setEntries(ents || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  const calculateTagStats = (): TagStats[] => {
    const tagMap = new Map<string, { count: number; entries: LifeLogEntry[] }>();

    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        const existing = tagMap.get(tag) || { count: 0, entries: [] };
        existing.count++;
        existing.entries.push(entry);
        tagMap.set(tag, existing);
      });
    });

    return Array.from(tagMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        entries: data.entries,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const tagStats = calculateTagStats();
  const maxCount = tagStats.length > 0 ? tagStats[0].count : 0;
  const minCount = tagStats.length > 0 ? tagStats[tagStats.length - 1].count : 0;

  const getTagSize = (count: number) => {
    if (maxCount === minCount) return 16;
    const ratio = (count - minCount) / (maxCount - minCount);
    return 12 + ratio * 12;
  };

  const getTagOpacity = (count: number) => {
    if (maxCount === minCount) return 1;
    const ratio = (count - minCount) / (maxCount - minCount);
    return 0.4 + ratio * 0.6;
  };

  const handleDeleteTag = (tagName: string) => {
    Alert.alert(
      '删除标签',
      `确定要删除标签"${tagName}"吗？这将从所有记录中移除该标签。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedEntries = entries.map(entry => ({
                ...entry,
                tags: entry.tags.filter(t => t !== tagName),
              }));
              await lifeLogEntryStorage.set(updatedEntries);
              setEntries(updatedEntries);
              setSelectedTag(null);
            } catch (error) {
              Alert.alert('错误', '删除失败，请重试');
            }
          },
        },
      ]
    );
  };

  const handleRenameTag = async () => {
    if (!selectedTag || !renameValue.trim() || renameValue.trim() === selectedTag) {
      setShowRenameModal(false);
      return;
    }

    const newName = renameValue.trim();
    const exists = tagStats.some(t => t.name === newName);

    if (exists) {
      Alert.alert('错误', '该标签名称已存在');
      return;
    }

    try {
      const updatedEntries = entries.map(entry => ({
        ...entry,
        tags: entry.tags.map(t => t === selectedTag ? newName : t),
      }));
      await lifeLogEntryStorage.set(updatedEntries);
      setEntries(updatedEntries);
      setSelectedTag(newName);
      setShowRenameModal(false);
      setRenameValue('');
    } catch (error) {
      Alert.alert('错误', '重命名失败，请重试');
    }
  };

  const selectedTagData = selectedTag ? tagStats.find(t => t.name === selectedTag) : null;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>标签</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tag Cloud */}
        <View style={styles.tagCloudSection}>
          <Text style={styles.sectionTitle}>标签云</Text>
          {tagStats.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>还没有标签</Text>
              <Text style={styles.emptySubtext}>为记录添加标签后会显示在这里</Text>
            </View>
          ) : (
            <View style={styles.tagCloud}>
              {tagStats.map((tag) => (
                <TouchableOpacity
                  key={tag.name}
                  style={[
                    styles.tagItem,
                    selectedTag === tag.name && styles.tagItemSelected,
                  ]}
                  onPress={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selectedTag === tag.name && styles.tagTextSelected,
                      { fontSize: getTagSize(tag.count) },
                    ]}
                  >
                    {tag.name}
                  </Text>
                  <View style={[
                    styles.tagCount,
                    selectedTag === tag.name && styles.tagCountSelected,
                  ]}>
                    <Text style={[
                      styles.tagCountText,
                      selectedTag === tag.name && styles.tagCountTextSelected,
                    ]}>
                      {tag.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Selected Tag Details */}
        {selectedTagData && (
          <View style={styles.detailsSection}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>
                #{selectedTagData.name}
              </Text>
              <Text style={styles.detailsCount}>{selectedTagData.count} 条记录</Text>
            </View>

            {/* Tag Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setRenameValue(selectedTagData.name);
                  setShowRenameModal(true);
                }}
              >
                <Ionicons name="create-outline" size={18} color="#000" />
                <Text style={styles.actionButtonText}>重命名</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteTag(selectedTagData.name)}
              >
                <Ionicons name="trash-outline" size={18} color="#ff3b30" />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>删除</Text>
              </TouchableOpacity>
            </View>

            {/* Entries List */}
            <View style={styles.entriesList}>
              {selectedTagData.entries.map(entry => {
                const category = getCategoryById(entry.categoryId);
                const titleField = category?.fields[0];
                const title = titleField ? entry.data[titleField.id] : entry.title;

                return (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.entryCard}
                    onPress={() => navigation.navigate('LogEntryForm', {
                      categoryId: entry.categoryId,
                      entryId: entry.id,
                    })}
                  >
                    <View style={styles.entryHeader}>
                      <View style={[styles.categoryDot, { backgroundColor: category?.color || '#000' }]} />
                      <Text style={styles.categoryName}>{category?.name}</Text>
                    </View>
                    <Text style={styles.entryTitle}>{title || '未命名记录'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* All Tags List */}
        {!selectedTag && tagStats.length > 0 && (
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>所有标签</Text>
            {tagStats.map((tag, index) => (
              <TouchableOpacity
                key={tag.name}
                style={styles.listItem}
                onPress={() => setSelectedTag(tag.name)}
              >
                <Text style={styles.listItemRank}>#{index + 1}</Text>
                <Text style={styles.listItemName}>{tag.name}</Text>
                <Text style={styles.listItemCount}>{tag.count} 条记录</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Rename Modal */}
      <Modal
        visible={showRenameModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>重命名标签</Text>
              <TouchableOpacity onPress={() => setShowRenameModal(false)}>
                <Text style={styles.closeBtn}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>新名称</Text>
              <TextInput
                style={styles.input}
                value={renameValue}
                onChangeText={setRenameValue}
                placeholder="输入新标签名称"
                placeholderTextColor="#999"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, !renameValue.trim() && styles.confirmButtonDisabled]}
              onPress={handleRenameTag}
              disabled={!renameValue.trim()}
            >
              <Text style={styles.confirmButtonText}>确认</Text>
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
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  tagCloudSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#ccc',
  },
  tagCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tagItemSelected: {
    backgroundColor: '#000',
  },
  tagText: {
    color: '#333',
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#fff',
  },
  tagCount: {
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagCountSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tagCountText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  tagCountTextSelected: {
    color: '#fff',
  },
  detailsSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  detailsCount: {
    fontSize: 14,
    color: '#666',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    color: '#ff3b30',
  },
  entriesList: {
    gap: 12,
  },
  entryCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#666',
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  listSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemRank: {
    width: 36,
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  listItemName: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  listItemCount: {
    fontSize: 13,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  closeBtn: {
    fontSize: 28,
    color: '#999',
  },
  modalBody: {
    padding: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
  },
  confirmButton: {
    backgroundColor: '#000',
    margin: 24,
    marginTop: 0,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
