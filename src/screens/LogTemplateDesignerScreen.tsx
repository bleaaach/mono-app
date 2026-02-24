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
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LifeLogCategory, LogField } from '../types';
import { lifeLogCategoryStorage } from '../utils/storage';
import { generateId } from '../utils/date';
import type { LogStackParamList } from '../navigation/LogNavigator';

type NavigationProp = NativeStackNavigationProp<LogStackParamList>;
type RouteProps = RouteProp<LogStackParamList, 'LogTemplateDesigner'>;

const FIELD_TYPES = [
  { type: 'text', label: '文本' },
  { type: 'number', label: '数字' },
  { type: 'rating', label: '评分' },
  { type: 'date', label: '日期' },
  { type: 'select', label: '选择' },
  { type: 'multiline', label: '多行文本' },
];

export default function LogTemplateDesignerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { categoryId } = route.params || {};

  const [template, setTemplate] = useState<LifeLogCategory | null>(null);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);

  // 新字段表单
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<LogField['type']>('text');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [fieldOptions, setFieldOptions] = useState('');

  const loadTemplate = async () => {
    if (!categoryId) {
      navigation.goBack();
      return;
    }

    const templates = await lifeLogCategoryStorage.get();
    if (templates) {
      const found = templates.find(t => t.id === categoryId);
      if (found) {
        setTemplate(found);
      } else {
        // 新建的空模板
        const newTemplate: LifeLogCategory = {
          id: categoryId,
          name: '新模板',
          description: '',
          color: '#000000',
          icon: '📝',
          fields: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setTemplate(newTemplate);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTemplate();
    }, [categoryId])
  );

  const saveTemplate = async () => {
    if (!template) return;

    const templates = await lifeLogCategoryStorage.get() || [];
    const existingIndex = templates.findIndex(t => t.id === template.id);

    if (existingIndex >= 0) {
      templates[existingIndex] = { ...template, updatedAt: new Date().toISOString() };
    } else {
      templates.push(template);
    }

    await lifeLogCategoryStorage.set(templates);
    navigation.goBack();
  };

  const addField = () => {
    if (!template || !fieldName.trim()) return;

    const newField: LogField = {
      id: generateId(),
      name: fieldName.trim(),
      type: fieldType,
      required: fieldRequired,
      placeholder: fieldPlaceholder.trim() || undefined,
      options: fieldType === 'select' ? fieldOptions.split(',').map(o => o.trim()).filter(Boolean) : undefined,
    };

    setTemplate({
      ...template,
      fields: [...template.fields, newField],
    });

    // 重置表单
    setFieldName('');
    setFieldType('text');
    setFieldRequired(false);
    setFieldPlaceholder('');
    setFieldOptions('');
    setShowAddFieldModal(false);
  };

  const removeField = (fieldId: string) => {
    if (!template) return;
    setTemplate({
      ...template,
      fields: template.fields.filter(f => f.id !== fieldId),
    });
  };

  const updateTemplateInfo = (key: keyof LifeLogCategory, value: string) => {
    if (!template) return;
    setTemplate({ ...template, [key]: value });
  };

  if (!template) {
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
        <Text style={styles.headerTitle}>设计模板</Text>
        <TouchableOpacity onPress={saveTemplate} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Template Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>模板信息</Text>
          <Text style={styles.inputLabel}>名称</Text>
          <TextInput
            style={styles.input}
            value={template.name}
            onChangeText={(text) => updateTemplateInfo('name', text)}
            placeholder="模板名称"
            placeholderTextColor="#999999"
          />
          <Text style={styles.inputLabel}>描述</Text>
          <TextInput
            style={styles.input}
            value={template.description}
            onChangeText={(text) => updateTemplateInfo('description', text)}
            placeholder="描述这个模板的用途"
            placeholderTextColor="#999999"
          />
          <Text style={styles.inputLabel}>图标</Text>
          <TextInput
            style={styles.input}
            value={template.icon}
            onChangeText={(text) => updateTemplateInfo('icon', text)}
            placeholder="📝"
            placeholderTextColor="#999999"
          />
        </View>

        {/* Fields */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>字段列表</Text>
            <TouchableOpacity onPress={() => setShowAddFieldModal(true)}>
              <Text style={styles.addFieldText}>+ 添加字段</Text>
            </TouchableOpacity>
          </View>

          {template.fields.length === 0 ? (
            <View style={styles.emptyFields}>
              <Text style={styles.emptyText}>还没有字段</Text>
              <Text style={styles.emptySubtext}>点击上方添加字段</Text>
            </View>
          ) : (
            template.fields.map((field, index) => (
              <View key={field.id} style={styles.fieldCard}>
                <View style={styles.fieldHeader}>
                  <View style={styles.fieldInfo}>
                    <Text style={styles.fieldName}>
                      {field.name}
                      {field.required && <Text style={styles.required}> *</Text>}
                    </Text>
                    <Text style={styles.fieldType}>
                      {FIELD_TYPES.find(t => t.type === field.type)?.label}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeField(field.id)}>
                    <Text style={styles.removeText}>删除</Text>
                  </TouchableOpacity>
                </View>
                {field.placeholder && (
                  <Text style={styles.fieldPlaceholder}>提示: {field.placeholder}</Text>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Field Modal */}
      <Modal
        visible={showAddFieldModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddFieldModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>添加字段</Text>
              <TouchableOpacity onPress={() => setShowAddFieldModal(false)}>
                <Text style={styles.closeBtn}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>字段名称 *</Text>
              <TextInput
                style={styles.input}
                value={fieldName}
                onChangeText={setFieldName}
                placeholder="如：电影名称、评分"
                placeholderTextColor="#999999"
                autoFocus
              />

              <Text style={styles.inputLabel}>字段类型</Text>
              <View style={styles.typeGrid}>
                {FIELD_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.type}
                    style={[
                      styles.typeButton,
                      fieldType === type.type && styles.typeButtonActive
                    ]}
                    onPress={() => setFieldType(type.type as LogField['type'])}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      fieldType === type.type && styles.typeButtonTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {fieldType === 'select' && (
                <>
                  <Text style={styles.inputLabel}>选项（用逗号分隔）</Text>
                  <TextInput
                    style={styles.input}
                    value={fieldOptions}
                    onChangeText={setFieldOptions}
                    placeholder="选项1, 选项2, 选项3"
                    placeholderTextColor="#999999"
                  />
                </>
              )}

              <Text style={styles.inputLabel}>提示文字（可选）</Text>
              <TextInput
                style={styles.input}
                value={fieldPlaceholder}
                onChangeText={setFieldPlaceholder}
                placeholder="输入框的提示文字"
                placeholderTextColor="#999999"
              />

              <View style={styles.requiredRow}>
                <Text style={styles.inputLabel}>必填</Text>
                <Switch
                  value={fieldRequired}
                  onValueChange={setFieldRequired}
                  trackColor={{ false: '#E0E0E0', true: '#000000' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.modalFooter} />
            </ScrollView>

            <TouchableOpacity
              style={[styles.createButton, !fieldName.trim() && styles.createButtonDisabled]}
              onPress={addField}
              disabled={!fieldName.trim()}
            >
              <Text style={styles.createButtonText}>添加</Text>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  addFieldText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    marginTop: 16,
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
  },
  emptyFields: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#999999',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#CCCCCC',
    marginTop: 4,
  },
  fieldCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldInfo: {
    flex: 1,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  required: {
    color: '#FF3B30',
  },
  fieldType: {
    fontSize: 13,
    color: '#999999',
    marginTop: 2,
  },
  fieldPlaceholder: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
  },
  removeText: {
    fontSize: 13,
    color: '#FF3B30',
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  typeButtonActive: {
    backgroundColor: '#000000',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  requiredRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  modalFooter: {
    height: 20,
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
