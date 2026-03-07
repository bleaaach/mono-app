import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LifeLogCategory, LifeLogEntry, LogField } from '../types';
import { lifeLogCategoryStorage, lifeLogEntryStorage } from '../utils/storage';
import { generateId } from '../utils/id';
import { FontSizes, scaleFont } from '../utils/responsive';

export default function LogEntryFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { categoryId, entryId } = route.params as { categoryId: string; entryId?: string };

  const [category, setCategory] = useState<LifeLogCategory | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);

  const isEditing = !!entryId;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const categories = await lifeLogCategoryStorage.get();
      const foundCategory = categories?.find(c => c.id === categoryId) || null;
      setCategory(foundCategory);

      if (isEditing && entryId) {
        const entries = await lifeLogEntryStorage.get();
        const entry = entries?.find(e => e.id === entryId);
        if (entry) {
          setFormData(entry.data);
          setTags(entry.tags);
        }
      } else if (foundCategory) {
        // Initialize form data with empty values
        const initialData: Record<string, any> = {};
        foundCategory.fields.forEach(field => {
          if (field.type === 'date') {
            initialData[field.id] = new Date().toISOString();
          } else if (field.type === 'rating') {
            initialData[field.id] = 0;
          } else {
            initialData[field.id] = '';
          }
        });
        setFormData(initialData);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    const requiredFields = category?.fields.filter(f => f.required) || [];
    for (const field of requiredFields) {
      const value = formData[field.id];
      if (value === undefined || value === null || value === '' || value === 0) {
        Alert.alert('提示', `请填写「${field.name}」`);
        return;
      }
    }

    try {
      const entries = await lifeLogEntryStorage.get() || [];
      const titleField = category?.fields[0];
      const title = titleField ? formData[titleField.id] : '未命名记录';

      if (isEditing && entryId) {
        // Update existing entry
        const updated = entries.map(e =>
          e.id === entryId
            ? {
                ...e,
                title,
                data: formData,
                tags,
                updatedAt: new Date().toISOString(),
              }
            : e
        );
        await lifeLogEntryStorage.set(updated);
      } else {
        // Create new entry
        const newEntry: LifeLogEntry = {
          id: generateId(),
          categoryId,
          title,
          data: formData,
          tags,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await lifeLogEntryStorage.set([newEntry, ...entries]);
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('错误', '保存失败，请重试');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const renderField = (field: LogField) => {
    const value = formData[field.id];

    switch (field.type) {
      case 'text':
        return (
          <TextInput
            style={styles.textInput}
            value={value || ''}
            onChangeText={text => setFormData({ ...formData, [field.id]: text })}
            placeholder={field.placeholder || `请输入${field.name}`}
            placeholderTextColor="#999"
          />
        );

      case 'multiline':
        return (
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={value || ''}
            onChangeText={text => setFormData({ ...formData, [field.id]: text })}
            placeholder={field.placeholder || `请输入${field.name}`}
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        );

      case 'number':
        return (
          <TextInput
            style={styles.textInput}
            value={value?.toString() || ''}
            onChangeText={text => {
              const num = parseFloat(text);
              setFormData({ ...formData, [field.id]: isNaN(num) ? '' : num });
            }}
            placeholder={field.placeholder || `请输入${field.name}`}
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        );

      case 'rating':
        return (
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity
                key={star}
                onPress={() => setFormData({ ...formData, [field.id]: star })}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= (value || 0) ? 'star' : 'star-outline'}
                  size={28}
                  color="#000"
                />
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'date':
        return (
          <View>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(field.id)}
            >
              <Text style={styles.dateButtonText}>
                {value ? new Date(value).toLocaleDateString('zh-CN') : '选择日期'}
              </Text>
              <Ionicons name="calendar-outline" size={18} color="#666" />
            </TouchableOpacity>
            {showDatePicker === field.id && (
              <DateTimePicker
                value={value ? new Date(value) : new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(null);
                  if (selectedDate) {
                    setFormData({ ...formData, [field.id]: selectedDate.toISOString() });
                  }
                }}
              />
            )}
          </View>
        );

      case 'select':
        return (
          <View style={styles.selectContainer}>
            {field.options?.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.selectOption,
                  value === option && styles.selectOptionActive,
                ]}
                onPress={() => setFormData({ ...formData, [field.id]: option })}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    value === option && styles.selectOptionTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? '编辑记录' : `添加${category?.name || '记录'}`}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Form Fields */}
        <View style={styles.formContainer}>
          {category?.fields.map((field, index) => (
            <View
              key={field.id}
              style={[
                styles.fieldContainer,
                index === (category.fields.length - 1) && styles.lastField,
              ]}
            >
              <View style={styles.fieldLabelContainer}>
                <Text style={styles.fieldLabel}>{field.name}</Text>
                {field.required && <Text style={styles.requiredMark}>*</Text>}
              </View>
              {renderField(field)}
            </View>
          ))}
        </View>

        {/* Tags Section */}
        <View style={styles.tagsSection}>
          <Text style={styles.sectionTitle}>标签</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="添加标签"
              placeholderTextColor="#999"
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.tagsList}>
            {tags.map(tag => (
              <View key={tag} style={styles.tagItem}>
                <Text style={styles.tagText}>{tag}</Text>
                <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                  <Ionicons name="close-circle" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    margin: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    overflow: 'hidden',
  },
  fieldContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastField: {
    borderBottomWidth: 0,
  },
  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  requiredMark: {
    fontSize: 15,
    color: '#ff3b30',
    marginLeft: 4,
  },
  textInput: {
    fontSize: FontSizes.lg,
    color: '#000',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    lineHeight: Platform.OS === 'android' ? scaleFont(24) : undefined,
    ...(Platform.OS === 'android' && {
      includeFontPadding: false,
      textAlignVertical: 'center',
    }),
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    lineHeight: Platform.OS === 'android' ? scaleFont(24) : undefined,
    ...(Platform.OS === 'android' && {
      includeFontPadding: false,
      paddingTop: 12,
      paddingBottom: 12,
    }),
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#000',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectOptionActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  selectOptionText: {
    fontSize: 14,
    color: '#666',
  },
  selectOptionTextActive: {
    color: '#fff',
  },
  tagsSection: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    fontSize: 15,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    lineHeight: Platform.OS === 'android' ? scaleFont(22) : undefined,
    ...(Platform.OS === 'android' && {
      includeFontPadding: false,
      textAlignVertical: 'center',
    }),
  },
  addTagButton: {
    width: 44,
    height: 44,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: '#333',
  },
  bottomSpacing: {
    height: 40,
  },
});
