import React, { useState, useRef, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { captureRef } from 'react-native-view-shot';
import { DiaryEntry } from '../../types';
import ShareCard, { ShareTemplate } from '../../components/diary/ShareCard';
import { diaryStorage } from '../../utils/storage';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { FontSizes, scaleFont } from '../../utils/responsive';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

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
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 100 });
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const shareCardRef = useRef<View>(null);

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
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    const selectedContent = entry.content.substring(start, end);
    return {
      ...entry,
      content: selectedContent + (end < entry.content.length ? '...' : ''),
    };
  };

  const handleSaveImage = async () => {
    if (!shareCardRef.current) return;
    
    setIsLoading(true);
    try {
      if (Platform.OS === 'web') {
        const element = shareCardRef.current as unknown as HTMLElement;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('无法创建 Canvas 上下文');
        }
        
        const rect = element.getBoundingClientRect();
        const scale = 2;
        canvas.width = rect.width * scale;
        canvas.height = rect.height * scale;
        ctx.scale(scale, scale);
        
        const html2canvas = (await import('html2canvas')).default;
        const renderedCanvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#FFFFFF',
        });
        
        const dataUrl = renderedCanvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `diary-${entry?.date || 'share'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Alert.alert('成功', '分享卡片已下载');
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('权限不足', '需要相册权限才能保存图片');
          return;
        }
        
        const uri = await captureRef(shareCardRef.current, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });
        
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('成功', '分享卡片已保存到相册');
      }
    } catch (error) {
      console.error('Save image error:', error);
      Alert.alert('错误', '保存图片失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = async () => {
    const displayEntry = getDisplayEntry();
    if (!displayEntry) return;
    
    const text = `${displayEntry.date}\n${displayEntry.content}\n\n${displayEntry.tags?.map(t => `#${t}`).join(' ') || ''}\n\n${caption || ''}`;
    
    await Clipboard.setStringAsync(text);
    Alert.alert('成功', '文本已复制到剪贴板');
  };

  const handleShare = async () => {
    if (!shareCardRef.current) return;
    
    setIsLoading(true);
    try {
      if (Platform.OS === 'web') {
        const text = `${entry?.date}\n${entry?.content}\n\n${entry?.tags?.map(t => `#${t}`).join(' ') || ''}`;
        if (navigator.share) {
          await navigator.share({
            title: '日记分享',
            text: text,
          });
        } else {
          await handleCopyText();
        }
      } else {
        const uri = await captureRef(shareCardRef.current, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });
        
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: '分享日记',
          });
        } else {
          Alert.alert('错误', '当前设备不支持分享功能');
        }
      }
    } catch (error) {
      console.error('Share error:', error);
      if ((error as Error).name !== 'AbortError') {
        Alert.alert('错误', '分享失败，请重试');
      }
    } finally {
      setIsLoading(false);
    }
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
          <View ref={shareCardRef} collapsable={false}>
            <ShareCard 
              entry={displayEntry} 
              template={selectedTemplate} 
              caption={caption || undefined}
            />
          </View>
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
          
          {/* 摘要选择区域 */}
          {contentRange === 'summary' && entry && (
            <View style={styles.summarySelector}>
              <Text style={styles.summaryHint}>
                在下方文本中划选要分享的内容（共 {entry.content.length} 字）
              </Text>
              
              {/* 可划选的文本区域 */}
              <TextInput
                style={styles.selectableText}
                value={entry.content}
                multiline
                editable={false}
                selection={selection}
                onSelectionChange={(e) => {
                  const { start, end } = e.nativeEvent.selection;
                  setSelection({ start, end });
                }}
              />
              
              <Text style={styles.summaryCharCount}>
                已选择 {Math.abs(selection.end - selection.start)} 字
              </Text>
              
              {/* 快捷选择按钮 */}
              <View style={styles.quickSelectContainer}>
                <TouchableOpacity
                  style={styles.quickSelectBtn}
                  onPress={() => setSelection({ start: 0, end: Math.min(50, entry.content.length) })}
                >
                  <Text style={styles.quickSelectText}>前50字</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickSelectBtn}
                  onPress={() => setSelection({ start: 0, end: Math.min(100, entry.content.length) })}
                >
                  <Text style={styles.quickSelectText}>前100字</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickSelectBtn}
                  onPress={() => setSelection({ start: 0, end: Math.min(200, entry.content.length) })}
                >
                  <Text style={styles.quickSelectText}>前200字</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickSelectBtn}
                  onPress={() => setSelection({ start: 0, end: entry.content.length })}
                >
                  <Text style={styles.quickSelectText}>全选</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    fontSize: FontSizes.md,
    lineHeight: scaleFont(22),
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
  // 摘要选择器样式
  summarySelector: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  summaryHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  selectableText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: 'top',
  },
  summaryCharCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 12,
  },
  quickSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickSelectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  quickSelectText: {
    fontSize: 13,
    color: '#666',
  },
});
