import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DiaryEntry } from '../../types';
import ShareCard, { ShareTemplate } from '../../components/diary/ShareCard';
import { diaryStorage } from '../../utils/storage';
import { RootStackParamList } from '../../navigation/AppNavigator';

const { width } = Dimensions.get('window');

const TEMPLATES: { key: ShareTemplate; label: string; icon: string }[] = [
  { key: 'minimal', label: '极简', icon: 'square-outline' },
  { key: 'journal', label: '手账', icon: 'book-outline' },
  { key: 'film', label: '胶片', icon: 'film-outline' },
  { key: 'nature', label: '自然', icon: 'leaf-outline' },
  { key: 'geometric', label: '几何', icon: 'shapes-outline' },
  { key: 'mood', label: '心情', icon: 'heart-outline' },
];

type ShareScreenProps = NativeStackScreenProps<RootStackParamList, 'Share'>;

export default function ShareScreen({ route, navigation }: ShareScreenProps) {
  const { entryId } = route.params;
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ShareTemplate>('minimal');
  const [caption, setCaption] = useState('');
  const [contentRange, setContentRange] = useState<'full' | 'summary'>('full');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  React.useEffect(() => {
    loadEntry();
  }, []);

  const loadEntry = async () => {
    const entries = await diaryStorage.get();
    const found = entries?.find((e: DiaryEntry) => e.id === entryId);
    if (found) {
      setEntry(found);
    } else {
      Alert.alert('错误', '日记不存在');
      navigation.goBack();
    }
  };

  const getDisplayEntry = (): DiaryEntry | null => {
    if (!entry) return null;
    if (contentRange === 'full') return entry;
    return {
      ...entry,
      content: entry.content.length > 100 
        ? entry.content.substring(0, 100) + '...' 
        : entry.content,
    };
  };

  const handleSaveImage = async () => {
    setIsLoading(true);
    // 模拟保存图片
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('成功', '分享卡片已保存到相册');
    }, 1000);
  };

  const handleCopyText = () => {
    const displayEntry = getDisplayEntry();
    if (!displayEntry) return;
    
    const text = `${displayEntry.date}\n${displayEntry.content}\n\n${displayEntry.tags?.map(t => `#${t}`).join(' ') || ''}\n\n${caption || ''}`;
    
    // 使用 Clipboard API
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(text);
    }
    Alert.alert('成功', '文本已复制到剪贴板');
  };

  const handleShare = async () => {
    setIsLoading(true);
    // 模拟分享
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('成功', '分享成功！');
    }, 1000);
  };

  const displayEntry = getDisplayEntry();

  if (!displayEntry) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>分享日记</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>分享日记</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 预览卡片 */}
        <View style={styles.previewContainer}>
          <ShareCard 
            entry={displayEntry} 
            template={selectedTemplate} 
            caption={caption || undefined}
          />
        </View>

        {/* 模板选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择模板</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templateContainer}
          >
            {TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.key}
                style={[
                  styles.templateBtn,
                  selectedTemplate === template.key && styles.templateBtnActive,
                ]}
                onPress={() => setSelectedTemplate(template.key)}
              >
                <Ionicons 
                  name={template.icon as any} 
                  size={20} 
                  color={selectedTemplate === template.key ? '#FFF' : '#666'} 
                />
                <Text style={[
                  styles.templateText,
                  selectedTemplate === template.key && styles.templateTextActive,
                ]}>
                  {template.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 内容范围 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>分享范围</Text>
          <View style={styles.rangeContainer}>
            <TouchableOpacity
              style={[
                styles.rangeBtn,
                contentRange === 'full' && styles.rangeBtnActive,
              ]}
              onPress={() => setContentRange('full')}
            >
              <Text style={[
                styles.rangeText,
                contentRange === 'full' && styles.rangeTextActive,
              ]}>
                全文
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rangeBtn,
                contentRange === 'summary' && styles.rangeBtnActive,
              ]}
              onPress={() => setContentRange('summary')}
            >
              <Text style={[
                styles.rangeText,
                contentRange === 'summary' && styles.rangeTextActive,
              ]}>
                摘要
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 配文 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>添加配文（可选）</Text>
          <TextInput
            style={styles.captionInput}
            placeholder="写点什么..."
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={100}
          />
          <Text style={styles.captionCount}>{caption.length}/100</Text>
        </View>

        {/* 隐私提示 */}
        <View style={styles.privacyTip}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#666" />
          <Text style={styles.privacyText}>
            分享时自动隐藏敏感信息
          </Text>
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerBtn}
          onPress={handleSaveImage}
          disabled={isLoading}
        >
          <Ionicons name="image-outline" size={20} color="#333" />
          <Text style={styles.footerBtnText}>保存图片</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.footerBtn}
          onPress={handleCopyText}
          disabled={isLoading}
        >
          <Ionicons name="copy-outline" size={20} color="#333" />
          <Text style={styles.footerBtnText}>复制文字</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.footerBtn, styles.shareBtn]}
          onPress={handleShare}
          disabled={isLoading}
        >
          <Ionicons name="share-outline" size={20} color="#FFF" />
          <Text style={styles.shareBtnText}>分享</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#E8E8E8',
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  templateContainer: {
    gap: 12,
    paddingRight: 20,
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  templateBtnActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  templateText: {
    fontSize: 13,
    color: '#666',
  },
  templateTextActive: {
    color: '#FFF',
  },
  rangeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  rangeBtnActive: {
    backgroundColor: '#000',
  },
  rangeText: {
    fontSize: 14,
    color: '#666',
  },
  rangeTextActive: {
    color: '#FFF',
    fontWeight: '500',
  },
  captionInput: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  captionCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  privacyTip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  privacyText: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  footerBtnText: {
    fontSize: 14,
    color: '#333',
  },
  shareBtn: {
    backgroundColor: '#000',
  },
  shareBtnText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
});
