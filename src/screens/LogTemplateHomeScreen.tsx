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
import { LifeLogCategory, LifeLogEntry } from '../types';
import { lifeLogCategoryStorage, lifeLogEntryStorage } from '../utils/storage';
import { generateId } from '../utils/date';
import { Colors } from '../constants/colors';
import { FontSizes, scaleFont } from '../utils/responsive';
import type { LogStackParamList } from '../navigation/LogNavigator';
import {
  MovieIcon,
  CoffeeIcon,
  WriteIcon,
  OtherIcon,
  ChartIcon,
  RestIcon,
  SearchIcon,
} from '../components/Icons';

type NavigationProp = NativeStackNavigationProp<LogStackParamList>;

const TEMPLATE_ICON_MAP: { [key: string]: React.FC<{ size?: number; color?: string }> } = {
  'movie': MovieIcon,
  'coffee': CoffeeIcon,
  'write': WriteIcon,
  'other': OtherIcon,
};

const getTemplateIconComponent = (iconName: string): React.FC<{ size?: number; color?: string }> => {
  return TEMPLATE_ICON_MAP[iconName] || OtherIcon;
};

const LEGACY_EMOJI_TO_ICON: { [key: string]: string } = {
  '🎬': 'movie', '☕': 'coffee', '📝': 'write',
};

const convertLegacyIcon = (icon: string): string => {
  return LEGACY_EMOJI_TO_ICON[icon] || icon;
};

const DEFAULT_TEMPLATES: LifeLogCategory[] = [
  {
    id: 'movie',
    name: '观影记录',
    description: '记录看过的电影',
    color: '#000000',
    icon: 'movie',
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
    id: 'coffee',
    name: '咖啡测评',
    description: '记录喝过的咖啡',
    color: '#333333',
    icon: 'coffee',
    fields: [
      { id: 'brand', name: '品牌', type: 'text', required: true, placeholder: '咖啡品牌' },
      { id: 'origin', name: '产地', type: 'text', required: false, placeholder: '咖啡豆产地' },
      { id: 'roast', name: '烘焙度', type: 'select', required: false, options: ['浅烘', '中烘', '深烘'], placeholder: '选择烘焙度' },
      { id: 'rating', name: '评分', type: 'rating', required: true },
      { id: 'notes', name: '口感笔记', type: 'multiline', required: false, placeholder: '描述口感、风味...' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function LogTemplateHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [templates, setTemplates] = useState<LifeLogCategory[]>([]);
  const [entries, setEntries] = useState<LifeLogEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  const loadData = async () => {
    const [cats, ents] = await Promise.all([
      lifeLogCategoryStorage.get(),
      lifeLogEntryStorage.get(),
    ]);

    if (cats && cats.length > 0) {
      setTemplates(cats);
    } else {
      setTemplates(DEFAULT_TEMPLATES);
      await lifeLogCategoryStorage.set(DEFAULT_TEMPLATES);
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

  const getEntryCount = (templateId: string) => {
    return entries.filter(e => e.categoryId === templateId).length;
  };

  const getLastEntryDate = (templateId: string) => {
    const templateEntries = entries.filter(e => e.categoryId === templateId);
    if (templateEntries.length === 0) return null;
    return templateEntries.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0].createdAt;
  };

  const createTemplate = () => {
    if (!newTemplateName.trim()) return;

    const newTemplate: LifeLogCategory = {
      id: generateId(),
      name: newTemplateName.trim(),
      description: '',
      color: '#000000',
      icon: 'write',
      fields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setShowAddModal(false);
    setNewTemplateName('');
    navigation.navigate('LogTemplateDesigner', { categoryId: newTemplate.id });
  };

  const deleteTemplate = (template: LifeLogCategory) => {
    Alert.alert(
      '删除模板',
      `确定要删除"${template.name}"吗？该模板下的所有记录也会被删除。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const newTemplates = templates.filter(t => t.id !== template.id);
            const newEntries = entries.filter(e => e.categoryId !== template.id);
            setTemplates(newTemplates);
            setEntries(newEntries);
            await lifeLogCategoryStorage.set(newTemplates);
            await lifeLogEntryStorage.set(newEntries);
          },
        },
      ]
    );
  };

  const totalEntries = entries.length;
  const totalTemplates = templates.length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Life Log</Text>
          <Text style={styles.headerSubtitle}>自定义记录一切</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalTemplates}</Text>
            <Text style={styles.statLabel}>模板</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalEntries}</Text>
            <Text style={styles.statLabel}>记录</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('LogStats')}
          >
            <View style={styles.quickActionIcon}>
              <ChartIcon size={24} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionText}>统计</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('LogCalendar')}
          >
            <View style={styles.quickActionIcon}>
              <RestIcon size={24} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionText}>日历</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('LogTags')}
          >
            <View style={styles.quickActionIcon}>
              <SearchIcon size={24} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionText}>标签</Text>
          </TouchableOpacity>
        </View>

        {/* Templates */}
        <View style={styles.templatesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>我的记录模板</Text>
            <TouchableOpacity onPress={() => setShowAddModal(true)}>
              <Text style={styles.addTemplateText}>+ 新建</Text>
            </TouchableOpacity>
          </View>

          {templates.map(template => {
            const count = getEntryCount(template.id);
            const lastDate = getLastEntryDate(template.id);

            return (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => navigation.navigate('LogEntryList', { categoryId: template.id })}
                onLongPress={() => deleteTemplate(template)}
              >
                <View style={styles.templateHeader}>
                  <View style={styles.templateIcon}>
                    {React.createElement(getTemplateIconComponent(convertLegacyIcon(template.icon)), { size: 24, color: template.color || '#000000' })}
                  </View>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    {template.description ? (
                      <Text style={styles.templateDesc}>{template.description}</Text>
                    ) : (
                      <Text style={styles.templateFields}>
                        {template.fields.length} 个字段
                      </Text>
                    )}
                  </View>
                  <Text style={styles.templateArrow}>→</Text>
                </View>

                <View style={styles.templateFooter}>
                  <Text style={styles.templateCount}>{count} 条记录</Text>
                  {lastDate && (
                    <Text style={styles.templateDate}>
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

      {/* Add Template Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>新建记录模板</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeBtn}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>模板名称</Text>
              <TextInput
                style={styles.input}
                value={newTemplateName}
                onChangeText={setNewTemplateName}
                placeholder="如：观影记录、咖啡测评..."
                placeholderTextColor="#999999"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.createButton, !newTemplateName.trim() && styles.createButtonDisabled]}
              onPress={createTemplate}
              disabled={!newTemplateName.trim()}
            >
              <Text style={styles.createButtonText}>创建并设计字段</Text>
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
  quickActionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  templatesSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
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
  addTemplateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  templateCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  templateDesc: {
    fontSize: 13,
    color: '#999999',
  },
  templateFields: {
    fontSize: 13,
    color: '#999999',
  },
  templateArrow: {
    fontSize: 20,
    color: '#CCCCCC',
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  templateCount: {
    fontSize: 13,
    color: '#666666',
  },
  templateDate: {
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
    fontSize: FontSizes.lg,
    color: '#000000',
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
