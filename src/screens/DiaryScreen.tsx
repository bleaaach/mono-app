import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { PieChart } from 'react-native-chart-kit';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import AnimatedLib, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { DiaryEntry, DiaryEditHistory, CustomMood, MoodAnalysis } from '../types';
import { Colors } from '../constants/colors';
import { diaryStorage } from '../utils/storage';
import { diaryEvents, DIARY_EVENTS, setPendingEditEntry, getPendingEditEntry } from '../utils/events';
import { getTodayString, formatDate, generateId } from '../utils/date';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  SunnyMoodIcon,
  CloudyMoodIcon,
  RainyMoodIcon,
  StormMoodIcon,
  PeacefulMoodIcon,
  SparkleIcon,
  DiaryIcon,
  HappyIcon,
  NeutralIcon,
  SadIcon,
} from '../components/Icons';

const MOODS = [
  { key: 'sunny', label: '晴朗', iconComponent: SunnyMoodIcon, color: '#FFB800', intensity: 5 },
  { key: 'cloudy', label: '多云', iconComponent: CloudyMoodIcon, color: '#8E8E93', intensity: 3 },
  { key: 'rainy', label: '下雨', iconComponent: RainyMoodIcon, color: '#007AFF', intensity: 2 },
  { key: 'storm', label: '雷雨', iconComponent: StormMoodIcon, color: '#5856D6', intensity: 1 },
  { key: 'peaceful', label: '宁静', iconComponent: PeacefulMoodIcon, color: '#FF9500', intensity: 4 },
  { key: 'sparkle', label: '美好', iconComponent: SparkleIcon, color: '#FF2D55', intensity: 5 },
] as const;

const DEFAULT_TAGS = ['工作', '生活', '思考', '旅行', '阅读', '运动'];

// 骨架屏组件
const SkeletonItem = () => {
  const opacity = useState(new Animated.Value(0.3))[0];
  
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonMood} />
        <View style={styles.skeletonTag} />
      </View>
      <View style={styles.skeletonContent} />
      <View style={styles.skeletonContentShort} />
    </Animated.View>
  );
};

type DiaryTab = 'timeline' | 'calendar' | 'stats';

export default function DiaryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<DiaryTab>('timeline');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  
  // 手势滑动相关
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const DIARY_TABS: DiaryTab[] = ['timeline', 'calendar', 'stats'];
  const SWIPE_THRESHOLD = 60;
  
  const changeTab = useCallback((direction: 'left' | 'right') => {
    const currentIndex = DIARY_TABS.indexOf(activeTab);
    if (direction === 'left' && currentIndex < DIARY_TABS.length - 1) {
      setActiveTab(DIARY_TABS[currentIndex + 1]);
    } else if (direction === 'right' && currentIndex > 0) {
      setActiveTab(DIARY_TABS[currentIndex - 1]);
    }
  }, [activeTab]);

  const onGestureEvent = useCallback((event: any) => {
    'worklet';
    translateX.value = startX.value + event.nativeEvent.translationX;
  }, []);

  const onHandlerStateChange = useCallback((event: any) => {
    'worklet';
    if (event.nativeEvent.state === State.END) {
      const velocity = event.nativeEvent.velocityX;
      const translation = event.nativeEvent.translationX;
      
      if (velocity < -500 || translation < -SWIPE_THRESHOLD) {
        runOnJS(changeTab)('left');
      } else if (velocity > 500 || translation > SWIPE_THRESHOLD) {
        runOnJS(changeTab)('right');
      }
      
      translateX.value = withSpring(0, { damping: 20, stiffness: 100 });
    } else if (event.nativeEvent.state === State.BEGAN) {
      startX.value = translateX.value;
    }
  }, [changeTab]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });
  
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorMood, setEditorMood] = useState<string>('cloudy');
  const [editorTags, setEditorTags] = useState<string[]>([]);
  const [editorImages, setEditorImages] = useState<string[]>([]);
  const [editorWeather, setEditorWeather] = useState<{type: string; temp: number; description: string; icon?: string; humidity?: number; windSpeed?: number} | undefined>(undefined);
  const [editorLocation, setEditorLocation] = useState<{name: string} | undefined>(undefined);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isMarkdown, setIsMarkdown] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [editHistory, setEditHistory] = useState<DiaryEditHistory[]>([]);
  
  const [showDetail, setShowDetail] = useState(false);
  const [detailEntry, setDetailEntry] = useState<DiaryEntry | null>(null);
  
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // 新增状态
  const [isLoading, setIsLoading] = useState(true);
  const [showJumpModal, setShowJumpModal] = useState(false);
  const [jumpYear, setJumpYear] = useState(new Date().getFullYear());
  const [jumpMonth, setJumpMonth] = useState(new Date().getMonth() + 1);
  const [customMoods, setCustomMoods] = useState<CustomMood[]>([]);
  const [showCustomMoodModal, setShowCustomMoodModal] = useState(false);
  const [editorMoodIntensity, setEditorMoodIntensity] = useState<number>(3);
  const [moodAnalysis, setMoodAnalysis] = useState<MoodAnalysis | null>(null);
  const [showMoodAnalysis, setShowMoodAnalysis] = useState(false);
  const [jumpTargetDate, setJumpTargetDate] = useState<string | null>(null);
  const timelineScrollViewRef = useRef<ScrollView>(null);

  const allTags = [...DEFAULT_TAGS, ...customTags];

  // 加载数据
  const loadEntries = async (): Promise<DiaryEntry[]> => {
    setIsLoading(true);
    try {
      const data = await diaryStorage.get();
      console.log('[Diary] Loaded entries:', data?.length || 0, data);
      if (data && Array.isArray(data)) {
        const sorted = data.sort((a: DiaryEntry, b: DiaryEntry) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setEntries(sorted);
        // 检查心情提醒
        checkMoodReminder(data);
        // 计算心情分析
        calculateMoodAnalysis(data);
        return sorted;
      } else {
        console.log('[Diary] No data found or invalid data');
        setEntries([]);
        return [];
      }
    } catch (error) {
      console.error('[Diary] Error loading entries:', error);
      setEntries([]);
      return [];
    } finally {
      setTimeout(() => setIsLoading(false), 800);
    }
  };
  
  // 检查心情提醒（连续低落提醒）
  const checkMoodReminder = async (entries: DiaryEntry[]) => {
    const lowMoods = ['storm', 'rainy'];
    let streak = 0;
    const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (const entry of sorted) {
      if (lowMoods.includes(entry.mood || '')) {
        streak++;
      } else {
        break;
      }
    }
    
    if (streak >= 3) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '心情提醒',
          body: `你已经连续 ${streak} 天心情低落了，要不要试试放松一下？`,
        },
        trigger: null,
      });
    }
  };
  
  // 计算心情分析
  const calculateMoodAnalysis = (entries: DiaryEntry[]) => {
    const weeklyPattern: Record<string, number> = {};
    const tagCorrelation: Record<string, Record<string, number>> = {};
    let lowMoodStreak = 0;
    let lastLowMoodDate: string | undefined;
    
    const lowMoods = ['storm', 'rainy'];
    const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // 计算连续低落天数
    for (const entry of sorted) {
      if (lowMoods.includes(entry.mood || '')) {
        lowMoodStreak++;
        lastLowMoodDate = entry.date;
      } else {
        break;
      }
    }
    
    // 计算周几的心情分布
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const dayOfWeek = date.toLocaleDateString('zh-CN', { weekday: 'short' });
      const moodScore = MOODS.find(m => m.key === entry.mood)?.intensity || 3;
      weeklyPattern[dayOfWeek] = (weeklyPattern[dayOfWeek] || 0) + moodScore;
    });
    
    // 计算标签与心情的关联
    entries.forEach(entry => {
      const mood = entry.mood || 'cloudy';
      entry.tags?.forEach(tag => {
        if (!tagCorrelation[tag]) tagCorrelation[tag] = {};
        tagCorrelation[tag][mood] = (tagCorrelation[tag][mood] || 0) + 1;
      });
    });
    
    setMoodAnalysis({
      weeklyPattern,
      tagCorrelation,
      lowMoodStreak,
      lastLowMoodDate,
    });
  };
  
  // 跳转到指定年月
  const jumpToDate = () => {
    const targetMonth = `${jumpYear}-${String(jumpMonth).padStart(2, '0')}`;
    
    // 如果在日历视图，切换月份
    if (activeTab === 'calendar') {
      const newDate = new Date(jumpYear, jumpMonth - 1, 1);
      setCalendarMonth(newDate);
    } else {
      // 如果在时间线视图，查找该月份的第一个日记并滚动到那里
      const targetEntries = entries.filter(e => e.date.startsWith(targetMonth));
      if (targetEntries.length > 0) {
        // 按日期排序，找到最早的
        const sorted = [...targetEntries].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setJumpTargetDate(sorted[0].date);
      } else {
        Alert.alert('提示', `${jumpYear}年${jumpMonth}月没有日记记录`);
      }
    }
    
    setShowJumpModal(false);
  };
  
  // 添加自定义心情
  const addCustomMood = (name: string, emoji: string, color: string, intensity: number) => {
    const newMood: CustomMood = {
      id: generateId(),
      name,
      emoji,
      color,
      intensity,
    };
    setCustomMoods(prev => [...prev, newMood]);
  };

  useFocusEffect(
    useCallback(() => {
      loadEntries().then((loadedEntries) => {
        const pendingId = getPendingEditEntry();
        if (pendingId && loadedEntries) {
          const entry = loadedEntries.find((e: DiaryEntry) => e.id === pendingId);
          if (entry) {
            setTimeout(() => openEditor(entry), 100);
          }
        }
      });
    }, [])
  );

  useEffect(() => {
    const handleEditEntry = (entryId: string) => {
      const entry = entries.find(e => e.id === entryId);
      if (entry) {
        openEditor(entry);
      }
    };

    diaryEvents.on(DIARY_EVENTS.EDIT_ENTRY, handleEditEntry);
    return () => {
      diaryEvents.off(DIARY_EVENTS.EDIT_ENTRY, handleEditEntry);
    };
  }, [entries]);

  // 保存数据
  const saveEntries = async (newEntries: DiaryEntry[]) => {
    setEntries(newEntries);
    await diaryStorage.set(newEntries);
  };

  const getMoodDisplay = (mood?: string) => {
    return MOODS.find(m => m.key === mood) || MOODS[1];
  };

  const openEditor = (entry?: DiaryEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setEditorContent(entry.content);
      // 优先使用自定义心情ID，否则使用预设心情
      setEditorMood(entry.customMoodId || entry.mood || 'cloudy');
      setEditorTags(entry.tags || []);
      setEditorImages(entry.images || []);
      setEditorWeather(entry.weather);
      setEditorLocation(entry.location);
      setIsMarkdown(entry.isMarkdown || false);
      setEditHistory(entry.editHistory || []);
      setEditorMoodIntensity(entry.moodIntensity || 3);
    } else {
      setEditingEntry(null);
      setEditorContent('');
      setEditorMood('cloudy');
      setEditorTags([]);
      setEditorImages([]);
      setEditorWeather(undefined);
      setEditorLocation(undefined);
      setIsMarkdown(false);
      setEditHistory([]);
      setEditorMoodIntensity(3);
    }
    setShowEditor(true);
  };

  // 获取天气信息
  const fetchWeather = async () => {
    setIsFetchingWeather(true);
    try {
      let latitude: number;
      let longitude: number;

      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          Alert.alert('提示', '浏览器不支持地理位置功能');
          setIsFetchingWeather(false);
          return;
        }
        
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          });
        });
        
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('提示', '需要位置权限才能获取天气');
          setIsFetchingWeather(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
      }
      
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.current) {
        throw new Error('Invalid weather data');
      }
      
      const weatherCode = data.current.weather_code;
      const weatherInfo = getWeatherInfo(weatherCode);
      
      setEditorWeather({
        type: weatherInfo.type,
        temp: Math.round(data.current.temperature_2m),
        description: weatherInfo.description,
        icon: weatherInfo.icon,
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
      });
    } catch (error) {
      console.error('获取天气失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      Alert.alert('提示', `获取天气失败: ${errorMessage}`);
    }
    setIsFetchingWeather(false);
  };

  // 天气代码转换为可读信息
  const getWeatherInfo = (code: number): { type: string; description: string; icon: string } => {
    const weatherMap: Record<number, { type: string; description: string; icon: string }> = {
      0: { type: 'clear', description: '晴', icon: 'sunny' },
      1: { type: 'clear', description: '晴', icon: 'sunny' },
      2: { type: 'partly_cloudy', description: '少云', icon: 'partly-cloudy' },
      3: { type: 'cloudy', description: '多云', icon: 'cloudy' },
      45: { type: 'fog', description: '雾', icon: 'fog' },
      48: { type: 'fog', description: '雾', icon: 'fog' },
      51: { type: 'drizzle', description: '小雨', icon: 'rain' },
      53: { type: 'drizzle', description: '小雨', icon: 'rain' },
      55: { type: 'drizzle', description: '小雨', icon: 'rain' },
      61: { type: 'rain', description: '雨', icon: 'rain' },
      63: { type: 'rain', description: '中雨', icon: 'rain' },
      65: { type: 'rain', description: '大雨', icon: 'rain' },
      71: { type: 'snow', description: '小雪', icon: 'snow' },
      73: { type: 'snow', description: '中雪', icon: 'snow' },
      75: { type: 'snow', description: '大雪', icon: 'snow' },
      80: { type: 'showers', description: '阵雨', icon: 'rain' },
      81: { type: 'showers', description: '阵雨', icon: 'rain' },
      82: { type: 'showers', description: '暴雨', icon: 'rain' },
      95: { type: 'thunderstorm', description: '雷暴', icon: 'thunderstorm' },
      96: { type: 'thunderstorm', description: '雷暴冰雹', icon: 'thunderstorm' },
      99: { type: 'thunderstorm', description: '强雷暴', icon: 'thunderstorm' },
    };
    return weatherMap[code] || { type: 'unknown', description: '未知', icon: 'help' };
  };

  // 语音输入
  const startVoiceRecording = async () => {
    setIsRecording(true);
    try {
      // 使用 expo-speech 的语音识别功能（需要 expo-av 配合）
      // 这里使用简单的模拟，实际需要 expo-av 或 react-native-voice
      Alert.alert(
        '语音输入',
        '请开始说话...',
        [
          {
            text: '停止录音',
            onPress: () => {
              setIsRecording(false);
              // 模拟语音识别结果
              const mockText = '这是语音输入的内容';
              setEditorContent(prev => prev + (prev ? '\n' : '') + mockText);
            },
          },
        ],
        { cancelable: true, onDismiss: () => setIsRecording(false) }
      );
    } catch (error) {
      console.error('语音识别失败:', error);
      Alert.alert('提示', '语音识别失败');
      setIsRecording(false);
    }
  };

  // Markdown 快捷插入
  const insertMarkdown = (type: 'bold' | 'italic' | 'heading' | 'list' | 'quote' | 'code') => {
    const insertions: Record<string, string> = {
      bold: '****',
      italic: '**',
      heading: '## ',
      list: '- ',
      quote: '> ',
      code: '```\n\n```',
    };
    setEditorContent(prev => prev + insertions[type]);
  };

  // 恢复历史版本
  const restoreVersion = (history: DiaryEditHistory) => {
    setEditorContent(history.content);
    setEditorMood(history.mood || 'cloudy');
    setEditorTags(history.tags || []);
    setShowEditHistory(false);
    Alert.alert('成功', '已恢复到历史版本');
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('提示', '需要相册权限才能选择图片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: false,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setEditorImages(prev => [...prev, ...newImages].slice(0, 9));
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('提示', '需要相机权限才能拍照');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets) {
      setEditorImages(prev => [...prev, result.assets[0].uri].slice(0, 9));
    }
  };

  const removeImage = (index: number) => {
    setEditorImages(prev => prev.filter((_, i) => i !== index));
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('提示', '需要位置权限才能获取位置');
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      const [place] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      const locationName = place.city || place.region || place.name || '未知位置';
      setEditorLocation({ name: locationName });
    } catch (error) {
      Alert.alert('提示', '获取位置失败');
    }
  };

  const addCustomTag = () => {
    const tag = newTagInput.trim();
    if (tag && !allTags.includes(tag)) {
      setCustomTags(prev => [...prev, tag]);
      setEditorTags(prev => [...prev, tag]);
      setNewTagInput('');
      setShowTagInput(false);
    }
  };

  const deleteTag = (tag: string) => {
    if (DEFAULT_TAGS.includes(tag)) {
      Alert.alert('提示', '默认标签不能删除');
      return;
    }
    setCustomTags(prev => prev.filter(t => t !== tag));
    setEditorTags(prev => prev.filter(t => t !== tag));
  };

  const saveDiary = () => {
    if (!editorContent.trim() && editorImages.length === 0) {
      Alert.alert('提示', '请输入日记内容或添加图片');
      return;
    }

    const now = new Date().toISOString();
    const wordCount = editorContent.trim().length;
    
    // 检查是否是自定义心情
    const customMood = customMoods.find(m => m.id === editorMood);

    if (editingEntry) {
      // 创建编辑历史记录
      const newHistory: DiaryEditHistory = {
        id: generateId(),
        editedAt: now,
        content: editingEntry.content,
        mood: editingEntry.mood,
        tags: editingEntry.tags,
      };
      
      const existingHistory = editingEntry.editHistory || [];
      const updatedHistory = [newHistory, ...existingHistory].slice(0, 20); // 保留最近20条历史
      
      const updated = entries.map(e => 
        e.id === editingEntry.id 
          ? { 
              ...e, 
              content: editorContent, 
              mood: customMood ? undefined : (editorMood as any),
              customMoodId: customMood ? editorMood : undefined,
              moodIntensity: editorMoodIntensity,
              tags: editorTags,
              images: editorImages,
              weather: editorWeather,
              location: editorLocation,
              wordCount,
              isMarkdown,
              editHistory: updatedHistory,
              updatedAt: now
            }
          : e
      );
      saveEntries(updated);
    } else {
      const newEntry: DiaryEntry = {
        id: generateId(),
        date: getTodayString(),
        content: editorContent.trim(),
        mood: customMood ? undefined : (editorMood as any),
        customMoodId: customMood ? editorMood : undefined,
        moodIntensity: editorMoodIntensity,
        tags: editorTags,
        images: editorImages,
        weather: editorWeather,
        location: editorLocation,
        wordCount,
        isMarkdown,
        createdAt: now,
      };
      saveEntries([newEntry, ...entries]);
    }
    setShowEditor(false);
  };

  // 删除日记
  const deleteDiary = (id: string) => {
    Alert.alert(
      '删除日记',
      '确定要删除这篇日记吗？此操作无法撤销。',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '删除', 
          style: 'destructive',
          onPress: () => {
            const updated = entries.filter(e => e.id !== id);
            saveEntries(updated);
            setShowDetail(false);
          }
        },
      ]
    );
  };

  // 打开详情
  const openDetail = (entry: DiaryEntry) => {
    setDetailEntry(entry);
    setShowDetail(true);
  };

  // 切换标签选择
  const toggleTag = (tag: string) => {
    if (editorTags.includes(tag)) {
      setEditorTags(editorTags.filter(t => t !== tag));
    } else {
      setEditorTags([...editorTags, tag]);
    }
  };

  // 过滤日记
  const filteredEntries = entries.filter(entry => {
    if (selectedTag !== 'all' && !entry.tags?.includes(selectedTag)) return false;
    if (searchQuery && !entry.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // 按日期分组
  const groupByDate = (entries: DiaryEntry[]) => {
    const grouped: Record<string, DiaryEntry[]> = {};
    entries.forEach(entry => {
      if (!grouped[entry.date]) grouped[entry.date] = [];
      grouped[entry.date].push(entry);
    });
    return Object.entries(grouped).sort((a, b) => 
      new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  };

  // 计算统计数据
  const stats = {
    total: entries.length,
    thisMonth: entries.filter(e => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    streak: calculateStreak(entries),
    firstDate: entries.length > 0 ? entries[entries.length - 1].date : '-',
  };

  // 计算连续记录天数
  function calculateStreak(entries: DiaryEntry[]) {
    if (entries.length === 0) return 0;
    const dates = [...new Set(entries.map(e => e.date))].sort().reverse();
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      d.setHours(0, 0, 0, 0);
      const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === i || (i === 0 && diff <= 1)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  // 获取心情分布
  const getMoodDistribution = () => {
    const dist: Record<string, number> = {};
    entries.forEach(e => {
      const mood = e.mood || 'cloudy';
      dist[mood] = (dist[mood] || 0) + 1;
    });
    return Object.entries(dist).sort((a, b) => b[1] - a[1]);
  };

  // 获取标签统计
  const getTagStats = () => {
    const stats: Record<string, number> = {};
    entries.forEach(e => {
      e.tags?.forEach(tag => {
        stats[tag] = (stats[tag] || 0) + 1;
      });
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  };

  // 获取指定日期的日记
  const getDiariesForDate = (dateStr: string) => {
    return entries.filter(e => e.date === dateStr);
  };

  // 计算总记录时长（估算：基于字数，平均每分钟写50字）
  const getTotalWritingTime = () => {
    const totalWords = entries.reduce((sum, e) => sum + (e.wordCount || e.content.length), 0);
    const minutes = Math.ceil(totalWords / 50);
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分` : `${hours}小时`;
  };

  // 获取心情趋势数据（最近7天）
  const getMoodTrend = useMemo(() => {
    const moodScores: Record<string, number> = {
      sunny: 5, sparkle: 4, peaceful: 3, cloudy: 2, rainy: 1, storm: 0
    };

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const labels: string[] = [];
    const data: number[] = [];

    last7Days.forEach((date) => {
      const dayEntries = entries.filter(e => e.date === date);
      if (dayEntries.length > 0) {
        const avgMood = dayEntries.reduce((sum, e) => {
          return sum + (moodScores[e.mood || 'cloudy'] || 2);
        }, 0) / dayEntries.length;
        data.push(Number(avgMood.toFixed(1)));
      } else {
        data.push(0);
      }

      const d = new Date(date);
      labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
    });

    return { labels, data };
  }, [entries]);

  // 获取词云数据（从日记内容中提取关键词）
  const getWordCloudData = useMemo(() => {
    const allText = entries.map(e => e.content).join(' ');
    const words = allText
      .replace(/[^\u4e00-\u9fa5a-zA-Z]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2);

    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
  }, [entries]);

  // 生成年报数据（增强版）
  const getYearlyReport = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const yearEntries = entries.filter(e => new Date(e.date).getFullYear() === currentYear);
    
    if (yearEntries.length === 0) return null;

    const monthlyCount = Array(12).fill(0);
    const monthlyMoodIntensity = Array(12).fill(null).map(() => ({ sum: 0, count: 0 }));
    const hourlyCount = Array(24).fill(0);
    const weekdayCount = Array(7).fill(0);
    
    yearEntries.forEach(e => {
      const date = new Date(e.date);
      const month = date.getMonth();
      const hour = date.getHours();
      const day = date.getDay();
      
      monthlyCount[month]++;
      hourlyCount[hour]++;
      weekdayCount[day]++;
      
      if (e.moodIntensity) {
        monthlyMoodIntensity[month].sum += e.moodIntensity;
        monthlyMoodIntensity[month].count++;
      }
    });

    const moodDist: Record<string, number> = {};
    const tagDist: Record<string, number> = {};
    const moodIntensityByMood: Record<string, { sum: number; count: number }> = {};
    
    yearEntries.forEach(e => {
      const mood = e.mood || 'cloudy';
      moodDist[mood] = (moodDist[mood] || 0) + 1;
      
      if (e.moodIntensity) {
        if (!moodIntensityByMood[mood]) {
          moodIntensityByMood[mood] = { sum: 0, count: 0 };
        }
        moodIntensityByMood[mood].sum += e.moodIntensity;
        moodIntensityByMood[mood].count++;
      }
      
      e.tags?.forEach(tag => {
        tagDist[tag] = (tagDist[tag] || 0) + 1;
      });
    });

    const totalWords = yearEntries.reduce((sum, e) => sum + (e.wordCount || e.content.length), 0);
    const avgWordsPerEntry = Math.round(totalWords / yearEntries.length);
    const favoriteMonth = monthlyCount.indexOf(Math.max(...monthlyCount));
    
    const uniqueDays = new Set(yearEntries.map(e => e.date.split('T')[0]));
    const writingDaysRatio = Math.round((uniqueDays.size / 365) * 100);

    const sortedByWords = [...yearEntries].sort((a, b) => 
      (b.wordCount || b.content.length) - (a.wordCount || a.content.length)
    );
    const longestEntry = sortedByWords[0];

    const sortedByMoodIntensity = yearEntries
      .filter(e => e.moodIntensity && e.mood)
      .sort((a, b) => (b.moodIntensity || 0) - (a.moodIntensity || 0));
    const bestMoodEntry = sortedByMoodIntensity[0];

    let currentStreak = 0;
    let maxStreak = 0;
    const sortedDates = [...uniqueDays].sort();
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      maxStreak = Math.max(maxStreak, currentStreak);
    }

    const weekdayTotal = weekdayCount[1] + weekdayCount[2] + weekdayCount[3] + weekdayCount[4] + weekdayCount[5];
    const weekendTotal = weekdayCount[0] + weekdayCount[6];
    const weekdayAvg = weekdayTotal / 5;
    const weekendAvg = weekendTotal / 2;

    const peakHour = hourlyCount.indexOf(Math.max(...hourlyCount));
    let writingPeriod = '深夜';
    if (peakHour >= 6 && peakHour < 12) writingPeriod = '早晨';
    else if (peakHour >= 12 && peakHour < 18) writingPeriod = '下午';
    else if (peakHour >= 18 && peakHour < 22) writingPeriod = '晚上';

    const firstHalf = monthlyCount.slice(0, 6).reduce((a, b) => a + b, 0);
    const secondHalf = monthlyCount.slice(6).reduce((a, b) => a + b, 0);
    let writingTrend = '稳定';
    if (secondHalf > firstHalf * 1.2) writingTrend = '递增';
    else if (secondHalf < firstHalf * 0.8) writingTrend = '递减';

    const monthlyAvgIntensity = monthlyMoodIntensity.map(m => 
      m.count > 0 ? m.sum / m.count : 0
    );
    const validMonths = monthlyAvgIntensity.filter(v => v > 0);
    const avgIntensity = validMonths.length > 0 
      ? validMonths.reduce((a, b) => a + b, 0) / validMonths.length 
      : 0;
    const intensityVariance = validMonths.length > 1
      ? Math.sqrt(validMonths.reduce((sum, v) => sum + Math.pow(v - avgIntensity, 2), 0) / validMonths.length)
      : 0;
    
    const bestMoodMonth = monthlyAvgIntensity.indexOf(Math.max(...monthlyAvgIntensity));
    const worstMoodMonth = monthlyAvgIntensity.indexOf(Math.min(...monthlyAvgIntensity.filter(v => v > 0)));

    const topTags = Object.entries(tagDist)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      year: currentYear,
      totalEntries: yearEntries.length,
      totalWords,
      avgWordsPerEntry,
      writingDaysRatio,
      monthlyCount,
      moodDist,
      moodIntensityByMood,
      favoriteMonth,
      firstEntry: yearEntries[yearEntries.length - 1]?.date,
      longestEntry: longestEntry ? {
        date: longestEntry.date,
        wordCount: longestEntry.wordCount || longestEntry.content.length,
        preview: longestEntry.content.slice(0, 50),
      } : null,
      bestMoodEntry: bestMoodEntry ? {
        date: bestMoodEntry.date,
        mood: bestMoodEntry.mood,
        moodIntensity: bestMoodEntry.moodIntensity,
      } : null,
      maxStreak,
      writingPeriod,
      peakHour,
      writingTrend,
      weekdayVsWeekend: {
        weekday: weekdayTotal,
        weekend: weekendTotal,
        weekdayAvg: weekdayAvg.toFixed(1),
        weekendAvg: weekendAvg.toFixed(1),
        preference: weekdayAvg > weekendAvg ? '工作日' : weekendAvg > weekdayAvg ? '周末' : '均衡'
      },
      moodTrend: {
        monthlyAvgIntensity,
        bestMonth: bestMoodMonth >= 0 ? bestMoodMonth : null,
        worstMonth: worstMoodMonth >= 0 ? worstMoodMonth : null,
        volatility: intensityVariance.toFixed(2),
      },
      topTags,
    };
  }, [entries]);

  // 渲染时间线
  const renderTimeline = () => {
    const grouped = groupByDate(filteredEntries);
    
    // 骨架屏加载状态
    if (isLoading) {
      return (
        <ScrollView style={styles.timelineContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.skeletonWriteCard} />
          <View style={styles.skeletonFilter} />
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={styles.skeletonDateGroup}>
              <View style={styles.skeletonDateHeader} />
              <SkeletonItem />
            </View>
          ))}
        </ScrollView>
      );
    }
    
    return (
      <ScrollView 
        ref={timelineScrollViewRef}
        style={styles.timelineContainer} 
        showsVerticalScrollIndicator={false}
        onLayout={() => {
          // 如果有跳转目标，滚动到对应位置
          if (jumpTargetDate && timelineScrollViewRef.current) {
            // 这里简化处理，实际应该测量位置后滚动
            // 由于 FlatList/ScrollView 的滚动需要知道具体位置，这里使用一个简单的延迟
            setTimeout(() => {
              setJumpTargetDate(null);
            }, 100);
          }
        }}
      >
        {/* 写日记入口卡片 */}
        <TouchableOpacity style={styles.writeCard} onPress={() => openEditor()}>
          <View style={styles.writeCardIcon}>
            <Ionicons name="create-outline" size={24} color="#fff" />
          </View>
          <View style={styles.writeCardContent}>
            <Text style={styles.writeCardTitle}>记录今天</Text>
            <Text style={styles.writeCardSubtitle}>今天发生了什么值得记录的事？</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        {/* 标签筛选和时间跳转 */}
        <View style={styles.timelineControls}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.tagFilterContainer}
          >
            <TouchableOpacity
              style={[styles.tagFilterBtn, selectedTag === 'all' && styles.tagFilterBtnActive]}
              onPress={() => setSelectedTag('all')}
            >
              <Text style={[styles.tagFilterText, selectedTag === 'all' && styles.tagFilterTextActive]}>
                全部
              </Text>
            </TouchableOpacity>
            {allTags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.tagFilterBtn, selectedTag === tag && styles.tagFilterBtnActive]}
                onPress={() => setSelectedTag(tag)}
              >
                <Text style={[styles.tagFilterText, selectedTag === tag && styles.tagFilterTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* 时间跳转按钮 */}
          <TouchableOpacity 
            style={styles.jumpBtn}
            onPress={() => setShowJumpModal(true)}
          >
            <Ionicons name="calendar-outline" size={18} color="#666" />
            <Text style={styles.jumpBtnText}>跳转</Text>
          </TouchableOpacity>
        </View>

        {/* 日记时间线 */}
        <View style={styles.timelineContainer}>
          {grouped.length === 0 ? (
            <View style={styles.emptyState}>
              <DiaryIcon size={48} color={Colors.gray[400]} />
              <Text style={styles.emptyText}>还没有日记</Text>
              <Text style={styles.emptySubtext}>点击上方卡片开始记录</Text>
            </View>
          ) : (
            grouped.map(([date, dayEntries]) => (
              <View key={date} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateDay}>{new Date(date).getDate()}</Text>
                  <Text style={styles.dateMonth}>{new Date(date).getMonth() + 1}月 · {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(date).getDay()]}</Text>
                </View>
                {dayEntries.map(entry => {
                  const mood = getMoodDisplay(entry.mood);
                  const preview = entry.content.length > 80 
                    ? entry.content.substring(0, 80) + '...' 
                    : entry.content;
                  return (
                    <TouchableOpacity 
                      key={entry.id} 
                      style={styles.entryCard}
                      onPress={() => openDetail(entry)}
                    >
                      <View style={styles.entryHeader}>
                        {React.createElement(mood.iconComponent, { size: 20, color: MOODS.find(m => m.key === entry.mood)?.color || '#000' })}
                        <View style={styles.entryTags}>
                          {entry.tags?.map((tag, i) => (
                            <Text key={i} style={styles.entryTag}>{tag}</Text>
                          ))}
                        </View>
                        {entry.moodIntensity && (
                          <View style={styles.intensityIndicator}>
                            {[...Array(5)].map((_, i) => (
                              <View 
                                key={i} 
                                style={[
                                  styles.intensityDot, 
                                  i < entry.moodIntensity! && styles.intensityDotActive
                                ]} 
                              />
                            ))}
                          </View>
                        )}
                      </View>
                      <Text style={styles.entryPreview}>{preview}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    );
  };

  // 渲染日历
  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const hasDiary = (day: number) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return entries.some(e => e.date === dateStr);
    };

    const getDateStr = (day: number) => {
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const handleDayPress = (day: number) => {
      const dateStr = getDateStr(day);
      setSelectedDate(prev => prev === dateStr ? null : dateStr);
    };

    const selectedDiaries = selectedDate ? getDiariesForDate(selectedDate) : [];

    return (
      <ScrollView style={styles.calendarContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarHeader}>
          <Text style={styles.calendarTitle}>{year}年{month + 1}月</Text>
          <View style={styles.calendarNav}>
            <TouchableOpacity 
              onPress={() => {
                setCalendarMonth(new Date(year, month - 1));
                setSelectedDate(null);
              }}
              style={styles.calendarNavBtn}
            >
              <Ionicons name="chevron-back" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                setCalendarMonth(new Date(year, month + 1));
                setSelectedDate(null);
              }}
              style={styles.calendarNavBtn}
            >
              <Ionicons name="chevron-forward" size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.calendarWeekdays}>
          {['日', '一', '二', '三', '四', '五', '六'].map(d => (
            <Text key={d} style={styles.calendarWeekday}>{d}</Text>
          ))}
        </View>
        
        <View style={styles.calendarGrid}>
          {days.map((day, i) => {
            const dateStr = day ? getDateStr(day) : '';
            const isSelected = dateStr === selectedDate;
            const hasEntry = day ? hasDiary(day) : false;
            
            return (
              <TouchableOpacity 
                key={i} 
                style={styles.calendarDay}
                onPress={() => day && handleDayPress(day)}
                activeOpacity={0.7}
              >
                {day && (
                  <View style={[
                    styles.calendarDayInner,
                    isSelected && styles.calendarDaySelected,
                    hasEntry && !isSelected && styles.calendarDayHasDiary
                  ]}>
                    <Text style={[
                      styles.calendarDayText,
                      isSelected && styles.calendarDayTextSelected
                    ]}>{day}</Text>
                    {hasEntry && <View style={[styles.calendarDot, isSelected && styles.calendarDotSelected]} />}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 选中日期的日记列表 */}
        {selectedDate && (
          <View style={styles.selectedDateSection}>
            <View style={styles.selectedDateHeader}>
              <View>
                <Text style={styles.selectedDateTitle}>{formatDate(selectedDate)}</Text>
                <Text style={styles.selectedDateSubtitle}>
                  {selectedDiaries.length > 0 ? `${selectedDiaries.length} 篇日记` : '暂无日记'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.selectedDateAddBtn}
                onPress={() => {
                  setEditingEntry(null);
                  setEditorContent('');
                  setEditorMood('cloudy');
                  setEditorTags([]);
                  setShowEditor(true);
                }}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedDiaries.length === 0 ? (
              <View style={styles.selectedDateEmpty}>
                <DiaryIcon size={48} color={Colors.gray[400]} />
                <Text style={styles.selectedDateEmptyText}>这一天还没有日记</Text>
                <TouchableOpacity 
                  style={styles.selectedDateEmptyBtn}
                  onPress={() => {
                    setEditingEntry(null);
                    setEditorContent('');
                    setEditorMood('cloudy');
                    setEditorTags([]);
                    setShowEditor(true);
                  }}
                >
                  <Text style={styles.selectedDateEmptyBtnText}>写一篇</Text>
                </TouchableOpacity>
              </View>
            ) : (
              selectedDiaries.map(entry => {
                const mood = getMoodDisplay(entry.mood);
                const preview = entry.content.length > 100 
                  ? entry.content.substring(0, 100) + '...' 
                  : entry.content;
                return (
                  <TouchableOpacity 
                    key={entry.id} 
                    style={styles.selectedDateCard}
                    onPress={() => openDetail(entry)}
                  >
                    <View style={styles.selectedDateCardHeader}>
                      {React.createElement(mood.iconComponent, { size: 18, color: '#000000' })}
                      <View style={styles.selectedDateCardTags}>
                        {entry.tags?.map((tag, i) => (
                          <Text key={i} style={styles.selectedDateCardTag}>{tag}</Text>
                        ))}
                      </View>
                      <TouchableOpacity
                        style={styles.selectedDateCardEdit}
                        onPress={() => openEditor(entry)}
                      >
                        <Ionicons name="create-outline" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.selectedDateCardText}>{preview}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    );
  };

  // 渲染回顾统计
  const renderStats = () => {
    const moodDist = getMoodDistribution();
    const tagStats = getTagStats();
    const moodTrendData = getMoodTrend;
    const wordCloudData = getWordCloudData;
    const yearlyReportData = getYearlyReport;

    return (
      <ScrollView style={styles.statsContainer} showsVerticalScrollIndicator={false}>
        {/* 顶部概览卡片 */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>日记概览</Text>
            <Text style={styles.overviewSubtitle}>
              {stats.firstDate !== '-' ? `始于 ${new Date(stats.firstDate).toLocaleDateString('zh-CN')}` : '开始记录你的生活'}
            </Text>
          </View>
          
          <View style={styles.overviewStats}>
            <View style={styles.overviewStatItem}>
              <Text style={styles.overviewStatNumber}>{stats.total}</Text>
              <Text style={styles.overviewStatLabel}>总篇数</Text>
            </View>
            <View style={styles.overviewStatDivider} />
            <View style={styles.overviewStatItem}>
              <Text style={styles.overviewStatNumber}>{stats.streak}</Text>
              <Text style={styles.overviewStatLabel}>连续天数</Text>
            </View>
            <View style={styles.overviewStatDivider} />
            <View style={styles.overviewStatItem}>
              <Text style={styles.overviewStatNumber}>{getTotalWritingTime()}</Text>
              <Text style={styles.overviewStatLabel}>累计时长</Text>
            </View>
          </View>
        </View>

        {/* 心情趋势图表 */}
        {entries.length >= 1 && (
          <View style={styles.statsSection}>
            <Text style={styles.statsSectionTitle}>心情趋势（近7天）</Text>
            <View style={styles.moodTrendContainer}>
              {/* Y轴标签 */}
              <View style={styles.moodTrendYAxis}>
                <HappyIcon size={16} color={Colors.gray[500]} />
                <NeutralIcon size={16} color={Colors.gray[500]} />
                <SadIcon size={16} color={Colors.gray[500]} />
              </View>
              
              {/* 图表区域 */}
              <View style={styles.moodTrendChart}>
                {/* 网格线 */}
                <View style={styles.moodTrendGrid}>
                  <View style={styles.moodTrendGridLine} />
                  <View style={styles.moodTrendGridLine} />
                  <View style={styles.moodTrendGridLine} />
                </View>
                
                {/* 数据点和连线 */}
                <View style={styles.moodTrendData}>
                  {moodTrendData.data.map((score, index) => {
                    const hasData = score > 0;
                    const heightPercent = hasData ? (score / 5) * 100 : 0;
                    return (
                      <View key={index} style={styles.moodTrendColumn}>
                        {hasData && (
                          <>
                            {/* 数据点 */}
                            <View 
                              style={[
                                styles.moodTrendDot,
                                { bottom: `${heightPercent}%` }
                              ]} 
                            />
                            {/* 连线 */}
                            {index < moodTrendData.data.length - 1 && hasData && moodTrendData.data[index + 1] > 0 && (
                              <View style={[
                                styles.moodTrendLine,
                                {
                                  bottom: `${heightPercent}%`,
                                  transform: [
                                    { rotate: `${Math.atan2(
                                      (moodTrendData.data[index + 1] / 5) * 100 - heightPercent,
                                      100
                                    )}rad` }
                                  ],
                                  width: `${Math.sqrt(
                                    Math.pow(100, 2) + 
                                    Math.pow((moodTrendData.data[index + 1] / 5) * 100 - heightPercent, 2)
                                  )}%`
                                }
                              ]} />
                            )}
                          </>
                        )}
                        {/* X轴标签 */}
                        <Text style={styles.moodTrendXLabel}>{moodTrendData.labels[index]?.split('/')[1]}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
            
            {/* 心情说明 */}
            <View style={styles.moodTrendLegend}>
              <Text style={styles.moodTrendLegendText}>
                记录 {moodTrendData.data.filter(v => v > 0).length} 天 · 平均心情 {moodTrendData.data.filter(v => v > 0).length > 0 ? (moodTrendData.data.reduce((a, b) => a + b, 0) / moodTrendData.data.filter(v => v > 0).length).toFixed(1) : '-'}/5
              </Text>
            </View>
          </View>
        )}

        {/* 心情分布 */}
        {moodDist.length > 0 && (
          <View style={styles.statsSection}>
            <Text style={styles.statsSectionTitle}>心情分布</Text>
            <View style={styles.moodDistContainer}>
              {moodDist.map(([mood, count]) => {
                const moodInfo = getMoodDisplay(mood);
                const percentage = Math.round((count / stats.total) * 100);
                return (
                  <View key={mood} style={styles.moodDistItem}>
                    {React.createElement(moodInfo.iconComponent, { size: 24, color: '#000000' })}
                    <Text style={styles.moodDistLabel}>{moodInfo.label}</Text>
                    <Text style={styles.moodDistPercent}>{percentage}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 常用标签 */}
        {tagStats.length > 0 && (
          <View style={styles.statsSection}>
            <Text style={styles.statsSectionTitle}>常用标签</Text>
            <View style={styles.tagStatsContainer}>
              {tagStats.slice(0, 8).map(([tag, count]) => (
                <View key={tag} style={styles.tagStatItem}>
                  <Text style={styles.tagStatName}>#{tag}</Text>
                  <Text style={styles.tagStatCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 词云展示 */}
        {wordCloudData.length > 0 && (
          <View style={styles.statsSection}>
            <Text style={styles.statsSectionTitle}>常用词汇</Text>
            <View style={styles.wordCloudContainer}>
              {wordCloudData.slice(0, 15).map(([word, count], index) => {
                const fontSize = Math.max(12, 22 - index * 0.6);
                return (
                  <View key={word} style={styles.wordCloudItem}>
                    <Text style={[styles.wordCloudText, { fontSize }]}>
                      {word}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 年度报告 */}
        {yearlyReportData && (
          <View style={styles.yearlyReportSection}>
            <View style={styles.yearlyHero}>
              <Text style={styles.yearlyHeroYear}>{yearlyReportData.year}</Text>
              <Text style={styles.yearlyHeroLabel}>年度回顾</Text>
            </View>
            
            <View style={styles.yearlyStatsGrid}>
              <View style={styles.yearlyStatCard}>
                <Text style={styles.yearlyStatNumber}>{yearlyReportData.totalEntries}</Text>
                <Text style={styles.yearlyStatLabel}>篇日记</Text>
              </View>
              <View style={styles.yearlyStatCard}>
                <Text style={styles.yearlyStatNumber}>
                  {yearlyReportData.totalWords > 1000 
                    ? (yearlyReportData.totalWords / 1000).toFixed(1) + 'k' 
                    : yearlyReportData.totalWords}
                </Text>
                <Text style={styles.yearlyStatLabel}>总字数</Text>
              </View>
              <View style={styles.yearlyStatCard}>
                <Text style={styles.yearlyStatNumber}>{yearlyReportData.avgWordsPerEntry}</Text>
                <Text style={styles.yearlyStatLabel}>字/篇</Text>
              </View>
              <View style={styles.yearlyStatCard}>
                <Text style={styles.yearlyStatNumber}>{yearlyReportData.writingDaysRatio}%</Text>
                <Text style={styles.yearlyStatLabel}>记录天数</Text>
              </View>
            </View>

            <View style={styles.yearlyInsightCard}>
              <Text style={styles.yearlyInsightCardTitle}>写作规律</Text>
              <View style={styles.yearlyInsightGrid}>
                <View style={styles.yearlyInsightItem}>
                  <Ionicons name="time-outline" size={18} color="#666" />
                  <Text style={styles.yearlyInsightText}>最爱在{yearlyReportData.writingPeriod}写作</Text>
                </View>
                <View style={styles.yearlyInsightItem}>
                  <Ionicons name="trending-up-outline" size={18} color={yearlyReportData.writingTrend === '递增' ? '#34C759' : yearlyReportData.writingTrend === '递减' ? '#FF3B30' : '#666'} />
                  <Text style={styles.yearlyInsightText}>写作频率{yearlyReportData.writingTrend}</Text>
                </View>
                <View style={styles.yearlyInsightItem}>
                  <Ionicons name="calendar-outline" size={18} color="#666" />
                  <Text style={styles.yearlyInsightText}>{yearlyReportData.weekdayVsWeekend.preference}更爱记录</Text>
                </View>
                <View style={styles.yearlyInsightItem}>
                  <Ionicons name="flame-outline" size={18} color="#FF9500" />
                  <Text style={styles.yearlyInsightText}>最长连续{yearlyReportData.maxStreak}天</Text>
                </View>
              </View>
            </View>

            {Object.keys(yearlyReportData.moodDist).length > 0 && (
              <View style={styles.yearlyInsightCard}>
                <Text style={styles.yearlyInsightCardTitle}>年度心情</Text>
                <View style={styles.yearlyMoodList}>
                  {Object.entries(yearlyReportData.moodDist)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([mood, count], index) => {
                      const moodInfo = getMoodDisplay(mood);
                      const percentage = Math.round((count / yearlyReportData.totalEntries) * 100);
                      return (
                        <View key={mood} style={styles.yearlyMoodItem}>
                          <View style={styles.yearlyMoodRank}>
                            <Text style={styles.yearlyMoodRankText}>{index + 1}</Text>
                          </View>
                          {React.createElement(moodInfo.iconComponent, { size: 24, color: '#000000' })}
                          <View style={styles.yearlyMoodInfo}>
                            <Text style={styles.yearlyMoodLabel}>{moodInfo.label}</Text>
                            <View style={styles.yearlyMoodBar}>
                              <View style={[styles.yearlyMoodBarFill, { width: `${percentage}%` }]} />
                            </View>
                          </View>
                          <Text style={styles.yearlyMoodPercent}>{percentage}%</Text>
                        </View>
                      );
                    })}
                </View>
              </View>
            )}

            {yearlyReportData.moodTrend && yearlyReportData.moodTrend.bestMonth !== null && (
              <View style={styles.yearlyInsightCard}>
                <Text style={styles.yearlyInsightCardTitle}>情绪趋势</Text>
                <View style={styles.yearlyInsightGrid}>
                  {yearlyReportData.moodTrend.bestMonth !== null && (
                    <View style={styles.yearlyInsightItem}>
                      <Ionicons name="happy-outline" size={18} color="#34C759" />
                      <Text style={styles.yearlyInsightText}>{yearlyReportData.moodTrend.bestMonth + 1}月心情最佳</Text>
                    </View>
                  )}
                  {yearlyReportData.moodTrend.worstMonth !== null && (
                    <View style={styles.yearlyInsightItem}>
                      <Ionicons name="sad-outline" size={18} color="#FF3B30" />
                      <Text style={styles.yearlyInsightText}>{yearlyReportData.moodTrend.worstMonth + 1}月情绪低谷</Text>
                    </View>
                  )}
                  <View style={styles.yearlyInsightItem}>
                    <Ionicons name="analytics-outline" size={18} color="#666" />
                    <Text style={styles.yearlyInsightText}>情绪波动指数 {yearlyReportData.moodTrend.volatility}</Text>
                  </View>
                </View>
              </View>
            )}

            {(yearlyReportData.longestEntry || yearlyReportData.bestMoodEntry) && (
              <View style={styles.yearlyInsightCard}>
                <Text style={styles.yearlyInsightCardTitle}>年度亮点</Text>
                {yearlyReportData.longestEntry && (
                  <View style={styles.yearlyHighlightCard}>
                    <View style={styles.yearlyHighlightHeader}>
                      <Ionicons name="document-text-outline" size={16} color="#000" />
                      <Text style={styles.yearlyHighlightLabel}>最长日记</Text>
                    </View>
                    <Text style={styles.yearlyHighlightDate}>{yearlyReportData.longestEntry.date}</Text>
                    <Text style={styles.yearlyHighlightContent} numberOfLines={2}>
                      {yearlyReportData.longestEntry.preview}...
                    </Text>
                    <Text style={styles.yearlyHighlightMeta}>{yearlyReportData.longestEntry.wordCount} 字</Text>
                  </View>
                )}
                {yearlyReportData.bestMoodEntry && (
                  <View style={styles.yearlyHighlightCard}>
                    <View style={styles.yearlyHighlightHeader}>
                      {React.createElement(getMoodDisplay(yearlyReportData.bestMoodEntry.mood).iconComponent, { size: 16, color: '#000' })}
                      <Text style={styles.yearlyHighlightLabel}>心情最好的一天</Text>
                    </View>
                    <Text style={styles.yearlyHighlightDate}>{yearlyReportData.bestMoodEntry.date}</Text>
                    <Text style={styles.yearlyHighlightMeta}>
                      {getMoodDisplay(yearlyReportData.bestMoodEntry.mood).label} · 强度 {yearlyReportData.bestMoodEntry.moodIntensity}/5
                    </Text>
                  </View>
                )}
              </View>
            )}

            {yearlyReportData.topTags && yearlyReportData.topTags.length > 0 && (
              <View style={styles.yearlyInsightCard}>
                <Text style={styles.yearlyInsightCardTitle}>年度标签</Text>
                <View style={styles.yearlyTagsContainer}>
                  {yearlyReportData.topTags.map(([tag, count]) => (
                    <View key={tag} style={styles.yearlyTagItem}>
                      <Text style={styles.yearlyTagName}>#{tag}</Text>
                      <Text style={styles.yearlyTagCount}>{count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.yearlyInsightCard}>
              <Text style={styles.yearlyInsightCardTitle}>月度写作分布</Text>
              <View style={styles.yearlyMonthChart}>
                {yearlyReportData.monthlyCount.map((count, index) => {
                  const maxCount = Math.max(...yearlyReportData.monthlyCount, 1);
                  const heightPercent = (count / maxCount) * 100;
                  const isActive = count > 0;
                  return (
                    <View key={index} style={styles.yearlyMonthColumn}>
                      <Text style={styles.yearlyMonthCount}>{count || ''}</Text>
                      <View style={styles.yearlyMonthBarBg}>
                        <View style={[styles.yearlyMonthBarFill2, { height: `${heightPercent}%` }]} />
                      </View>
                      <Text style={[styles.yearlyMonthLabel, isActive && styles.yearlyMonthLabelActive]}>{index + 1}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* 子导航 */}
      <View style={styles.subNav}>
        <View style={styles.subNavLeft}>
          {[
            { key: 'timeline', label: '时间线' },
            { key: 'calendar', label: '日历' },
            { key: 'stats', label: '回顾' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.subNavItem, activeTab === tab.key && styles.subNavItemActive]}
              onPress={() => setActiveTab(tab.key as DiaryTab)}
            >
              <Text style={[styles.subNavText, activeTab === tab.key && styles.subNavTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.subNavRight}>
          {/* 新功能入口 */}
          <View style={styles.featureBtns}>
            <TouchableOpacity 
              style={styles.featureBtn}
              onPress={() => navigation.navigate('BookView')}
            >
              <Ionicons name="book-outline" size={18} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.featureBtn}
              onPress={() => navigation.navigate('RandomWalk')}
            >
              <Ionicons name="shuffle-outline" size={18} color="#666" />
            </TouchableOpacity>
          </View>
          
          {activeTab === 'timeline' && (
            <>
              <TextInput
                style={styles.searchInput}
                placeholder="搜索日记..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.addBtn} onPress={() => openEditor()}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* 内容区域 */}
      <PanGestureHandler 
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-15, 15]}
        failOffsetY={[-15, 15]}
      >
        <AnimatedLib.View style={[styles.content, animatedStyle]}>
          {activeTab === 'timeline' && renderTimeline()}
          {activeTab === 'calendar' && renderCalendar()}
          {activeTab === 'stats' && renderStats()}
        </AnimatedLib.View>
      </PanGestureHandler>

      {/* 编辑弹窗 */}
      <Modal
        visible={showEditor}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditor(false)}
      >
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {editingEntry ? '编辑日记' : '写日记'}
                  </Text>
                  <Text style={styles.modalDate}>{formatDate(getTodayString())}</Text>
                </View>
                <View style={styles.modalHeaderRight}>
                  {editingEntry && editHistory.length > 0 && (
                    <TouchableOpacity 
                      style={styles.historyBtn}
                      onPress={() => setShowEditHistory(true)}
                    >
                      <Ionicons name="time-outline" size={22} color="#666" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setShowEditor(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={styles.modalBody}>
                <TextInput
                  style={[styles.modalInput, isMarkdown && styles.markdownInput]}
                  placeholder="今天发生了什么值得记录的事..."
                  value={editorContent}
                  onChangeText={setEditorContent}
                  multiline
                  textAlignVertical="top"
                />

                {/* 图片区域 */}
                {editorImages.length > 0 && (
                  <View style={styles.imageGrid}>
                    {editorImages.map((uri, index) => (
                      <View key={index} style={styles.imageWrapper}>
                        <Image source={{ uri }} style={styles.previewImage} />
                        <TouchableOpacity 
                          style={styles.removeImageBtn}
                          onPress={() => removeImage(index)}
                        >
                          <Ionicons name="close-circle" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* 工具栏 */}
                <View style={styles.editorToolbar}>
                  <TouchableOpacity style={styles.toolbarBtn} onPress={pickImage}>
                    <Ionicons name="images-outline" size={22} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolbarBtn} onPress={takePhoto}>
                    <Ionicons name="camera-outline" size={22} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolbarBtn} onPress={getLocation}>
                    <Ionicons name="location-outline" size={22} color={editorLocation ? '#000' : '#666'} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.toolbarBtn, isFetchingWeather && styles.toolbarBtnLoading]} 
                    onPress={fetchWeather}
                    disabled={isFetchingWeather}
                  >
                    {isFetchingWeather ? (
                      <ActivityIndicator size="small" color="#666" />
                    ) : (
                      <Ionicons name="partly-sunny-outline" size={22} color={editorWeather ? '#000' : '#666'} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.toolbarBtn, isRecording && styles.toolbarBtnActive]} 
                    onPress={startVoiceRecording}
                  >
                    <Ionicons name="mic-outline" size={22} color={isRecording ? '#FF3B30' : '#666'} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.toolbarBtn, isMarkdown && styles.toolbarBtnActive]} 
                    onPress={() => setIsMarkdown(!isMarkdown)}
                  >
                    <Ionicons name="code-outline" size={22} color={isMarkdown ? '#000' : '#666'} />
                  </TouchableOpacity>
                  {editorLocation && (
                    <View style={styles.locationTag}>
                      <Ionicons name="location" size={12} color="#000" />
                      <Text style={styles.locationTagText}>{editorLocation.name}</Text>
                      <TouchableOpacity onPress={() => setEditorLocation(undefined)}>
                        <Ionicons name="close" size={14} color="#666" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* 天气信息显示 */}
                {editorWeather && (
                  <View style={styles.weatherInfo}>
                    <Ionicons 
                      name={
                        editorWeather.icon === 'sunny' ? 'sunny' :
                        editorWeather.icon === 'rain' ? 'rainy' :
                        editorWeather.icon === 'snow' ? 'snow' :
                        editorWeather.icon === 'thunderstorm' ? 'thunderstorm' :
                        'cloudy'
                      } as any
                      size={24} 
                      color="#000" 
                    />
                    <Text style={styles.weatherText}>
                      {editorWeather.description} · {editorWeather.temp}°C
                    </Text>
                    {editorWeather.humidity && (
                      <Text style={styles.weatherDetail}>
                        湿度 {editorWeather.humidity}%
                      </Text>
                    )}
                    <TouchableOpacity onPress={() => setEditorWeather(undefined)}>
                      <Ionicons name="close" size={16} color="#999" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Markdown 工具栏 */}
                {isMarkdown && (
                  <View style={styles.markdownToolbar}>
                    <TouchableOpacity style={styles.mdBtn} onPress={() => insertMarkdown('heading')}>
                      <Text style={styles.mdBtnText}>H</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mdBtn} onPress={() => insertMarkdown('bold')}>
                      <Text style={styles.mdBtnText}>B</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mdBtn} onPress={() => insertMarkdown('italic')}>
                      <Text style={styles.mdBtnText}>I</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mdBtn} onPress={() => insertMarkdown('list')}>
                      <Text style={styles.mdBtnText}>•</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mdBtn} onPress={() => insertMarkdown('quote')}>
                      <Text style={styles.mdBtnText}>"</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mdBtn} onPress={() => insertMarkdown('code')}>
                      <Text style={styles.mdBtnText}>{'</>'}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 心情选择 */}
                <View style={styles.moodSelector}>
                  <View style={styles.moodSelectorHeader}>
                    <Text style={styles.selectorLabel}>心情</Text>
                    <TouchableOpacity onPress={() => setShowCustomMoodModal(true)}>
                      <Text style={styles.addMoodText}>+ 自定义</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.moodOptions}>
                    {MOODS.map(mood => (
                      <TouchableOpacity
                        key={mood.key}
                        style={[
                          styles.moodBtn, 
                          editorMood === mood.key && styles.moodBtnActive,
                          { backgroundColor: editorMood === mood.key ? mood.color : '#F5F5F5' }
                        ]}
                        onPress={() => setEditorMood(mood.key)}
                      >
                        {React.createElement(mood.iconComponent, { size: 24, color: editorMood === mood.key ? '#FFFFFF' : mood.color })}
                      </TouchableOpacity>
                    ))}
                    {/* 自定义心情 */}
                    {customMoods.map(mood => (
                      <TouchableOpacity
                        key={mood.id}
                        style={[
                          styles.moodBtn, 
                          editorMood === mood.id && styles.moodBtnActive,
                          { backgroundColor: editorMood === mood.id ? mood.color : '#F5F5F5' }
                        ]}
                        onPress={() => setEditorMood(mood.id)}
                      >
                        <Text style={{ fontSize: 24 }}>{mood.emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 心情强度 */}
                <View style={styles.intensitySelector}>
                  <Text style={styles.selectorLabel}>心情强度</Text>
                  <View style={styles.intensityOptions}>
                    {[1, 2, 3, 4, 5].map(level => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.intensityBtn,
                          editorMoodIntensity >= level && styles.intensityBtnActive
                        ]}
                        onPress={() => setEditorMoodIntensity(level)}
                      >
                        <View style={[
                          styles.intensityLevelDot,
                          editorMoodIntensity >= level && { 
                            backgroundColor: MOODS.find(m => m.key === editorMood)?.color || '#007AFF' 
                          }
                        ]} />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.intensityLabel}>
                    {editorMoodIntensity === 1 ? '很低' :
                     editorMoodIntensity === 2 ? '较低' :
                     editorMoodIntensity === 3 ? '一般' :
                     editorMoodIntensity === 4 ? '较好' : '很好'}
                  </Text>
                </View>

                {/* 标签选择 */}
                <View style={styles.tagSelector}>
                  <Text style={styles.selectorLabel}>标签</Text>
                  <View style={styles.tagOptions}>
                    {allTags.map(tag => (
                      <View key={tag} style={styles.tagBtnWrapper}>
                        <TouchableOpacity
                          style={[styles.tagBtn, editorTags.includes(tag) && styles.tagBtnActive]}
                          onPress={() => toggleTag(tag)}
                        >
                          <Text style={[styles.tagBtnText, editorTags.includes(tag) && styles.tagBtnTextActive]}>
                            {tag}
                          </Text>
                        </TouchableOpacity>
                        {!DEFAULT_TAGS.includes(tag) && (
                          <TouchableOpacity 
                            style={styles.tagDeleteBtn}
                            onPress={() => deleteTag(tag)}
                          >
                            <Ionicons name="remove-circle" size={16} color="#FF3B30" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                    <TouchableOpacity 
                      style={styles.addTagBtn}
                      onPress={() => setShowTagInput(true)}
                    >
                      <Ionicons name="add" size={16} color="#999" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 自定义标签输入 */}
                {showTagInput && (
                  <View style={styles.customTagInput}>
                    <TextInput
                      style={styles.tagInputField}
                      placeholder="输入新标签..."
                      value={newTagInput}
                      onChangeText={setNewTagInput}
                      autoFocus
                    />
                    <TouchableOpacity style={styles.addTagConfirm} onPress={addCustomTag}>
                      <Text style={styles.addTagConfirmText}>添加</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setShowTagInput(false); setNewTagInput(''); }}>
                      <Ionicons name="close" size={20} color="#999" />
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowEditor(false)}>
                  <Text style={styles.modalCancelText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={saveDiary}>
                  <Text style={styles.modalSaveText}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        visible={showDetail}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailContent}>
            {detailEntry && (
              <>
                <View style={styles.detailHeader}>
                  <View style={styles.detailHeaderLeft}>
                    <View style={styles.detailMood}>
                      {React.createElement(getMoodDisplay(detailEntry.mood).iconComponent, { size: 28, color: '#000000' })}
                    </View>
                    <View>
                      <Text style={styles.detailDate}>{detailEntry.date}</Text>
                      <View style={styles.detailMetaRow}>
                        {detailEntry.location && (
                          <View style={styles.detailMetaItem}>
                            <Ionicons name="location" size={12} color="#999" />
                            <Text style={styles.detailMetaText}>{detailEntry.location.name}</Text>
                          </View>
                        )}
                        <Text style={styles.detailTags}>
                          {detailEntry.tags?.join(' · ') || '无标签'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.detailActions}>
                    <TouchableOpacity 
                      style={styles.detailActionBtn}
                      onPress={() => {
                        setShowDetail(false);
                        navigation.navigate('Share', { entryId: detailEntry.id });
                      }}
                    >
                      <Ionicons name="share-outline" size={20} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.detailActionBtn}
                      onPress={() => {
                        setShowDetail(false);
                        openEditor(detailEntry);
                      }}
                    >
                      <Ionicons name="create-outline" size={20} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.detailActionBtn}
                      onPress={() => deleteDiary(detailEntry.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowDetail(false)}>
                      <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>
                </View>
                <ScrollView style={styles.detailBody}>
                  {detailEntry.images && detailEntry.images.length > 0 && (
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.detailImagesScroll}
                    >
                      {detailEntry.images.map((uri, index) => (
                        <Image 
                          key={index} 
                          source={{ uri }} 
                          style={styles.detailImage} 
                        />
                      ))}
                    </ScrollView>
                  )}
                  {detailEntry.weather && (
                    <View style={styles.detailWeather}>
                      <Ionicons 
                        name={
                          detailEntry.weather.icon === 'sunny' ? 'sunny' :
                          detailEntry.weather.icon === 'rain' ? 'rainy' :
                          detailEntry.weather.icon === 'snow' ? 'snow' :
                          detailEntry.weather.icon === 'thunderstorm' ? 'thunderstorm' :
                          'cloudy'
                        } as any
                        size={18} 
                        color="#666" 
                      />
                      <Text style={styles.detailWeatherText}>
                        {detailEntry.weather.description} · {detailEntry.weather.temp}°C
                      </Text>
                    </View>
                  )}
                  <Text style={styles.detailText}>{detailEntry.content}</Text>
                  {detailEntry.wordCount > 0 && (
                    <Text style={styles.wordCountText}>{detailEntry.wordCount} 字</Text>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 编辑历史弹窗 */}
      <Modal
        visible={showEditHistory}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.historyModal}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>编辑历史</Text>
              <TouchableOpacity onPress={() => setShowEditHistory(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.historyList}>
              {editHistory.map((item, index) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.historyItem}
                  onPress={() => restoreVersion(item)}
                >
                  <View style={styles.historyItemHeader}>
                    <Ionicons name="time-outline" size={16} color="#999" />
                    <Text style={styles.historyTime}>
                      {new Date(item.editedAt).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                  <Text style={styles.historyContent} numberOfLines={3}>
                    {item.content}
                  </Text>
                  <Text style={styles.historyRestore}>点击恢复此版本</Text>
                </TouchableOpacity>
              ))}
              {editHistory.length === 0 && (
                <View style={styles.historyEmpty}>
                  <Text style={styles.historyEmptyText}>暂无编辑历史</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 时间跳转弹窗 */}
      <Modal
        visible={showJumpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJumpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.jumpModal}>
            <View style={styles.jumpHeader}>
              <Text style={styles.jumpTitle}>跳转到</Text>
              <TouchableOpacity onPress={() => setShowJumpModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.jumpContent}>
              <View style={styles.jumpInputRow}>
                <Text style={styles.jumpLabel}>年份</Text>
                <TextInput
                  style={styles.jumpInput}
                  value={String(jumpYear)}
                  onChangeText={(text) => setJumpYear(parseInt(text) || new Date().getFullYear())}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
              <View style={styles.jumpInputRow}>
                <Text style={styles.jumpLabel}>月份</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthSelector}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                    <TouchableOpacity
                      key={month}
                      style={[styles.monthBtn, jumpMonth === month && styles.monthBtnActive]}
                      onPress={() => setJumpMonth(month)}
                    >
                      <Text style={[styles.monthBtnText, jumpMonth === month && styles.monthBtnTextActive]}>
                        {month}月
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <TouchableOpacity style={styles.jumpConfirmBtn} onPress={jumpToDate}>
                <Text style={styles.jumpConfirmText}>跳转</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 自定义心情弹窗 */}
      <Modal
        visible={showCustomMoodModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomMoodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customMoodModal}>
            <View style={styles.customMoodHeader}>
              <Text style={styles.customMoodTitle}>自定义心情</Text>
              <TouchableOpacity onPress={() => setShowCustomMoodModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.customMoodContent}>
              {customMoods.map(mood => (
                <View key={mood.id} style={styles.customMoodItem}>
                  <Text style={{ fontSize: 24 }}>{mood.emoji}</Text>
                  <Text style={styles.customMoodName}>{mood.name}</Text>
                  <View style={[styles.customMoodColor, { backgroundColor: mood.color }]} />
                </View>
              ))}
              <View style={styles.addCustomMoodForm}>
                <Text style={styles.addCustomMoodTitle}>添加新心情</Text>
                <TextInput
                  style={styles.customMoodInput}
                  placeholder="心情名称"
                  onChangeText={() => {}}
                />
                <TextInput
                  style={styles.customMoodInput}
                  placeholder="图标名称 (如: happy, sunny, cloudy)"
                  onChangeText={() => {}}
                />
                <TouchableOpacity style={styles.addCustomMoodBtn}>
                  <Text style={styles.addCustomMoodBtnText}>添加</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  subNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  subNavLeft: {
    flexDirection: 'row',
    gap: 4,
  },
  subNavItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  subNavItemActive: {
    backgroundColor: '#000000',
  },
  subNavText: {
    fontSize: 14,
    color: '#999999',
  },
  subNavTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  subNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    width: 100,
    fontSize: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingVertical: 4,
    color: '#000000',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  writeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#000000',
    borderRadius: 16,
  },
  writeCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  writeCardContent: {
    flex: 1,
    marginLeft: 16,
  },
  writeCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  writeCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  tagFilterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tagFilterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginRight: 8,
  },
  tagFilterBtnActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  tagFilterText: {
    fontSize: 13,
    color: '#666666',
  },
  tagFilterTextActive: {
    color: '#FFFFFF',
  },
  timelineContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dateGroup: {
    marginBottom: 32,
  },
  dateHeader: {
    marginBottom: 16,
  },
  dateDay: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -2,
  },
  dateMonth: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  dateWeekday: {
    fontSize: 14,
    color: '#666666',
  },
  entryCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryMood: {
    fontSize: 24,
    marginRight: 12,
  },
  entryTags: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  entryTag: {
    fontSize: 11,
    color: '#999999',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  entryPreview: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  calendarTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  calendarNav: {
    flexDirection: 'row',
    gap: 8,
  },
  calendarNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarWeekdays: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  calendarWeekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  calendarDayText: {
    fontSize: 15,
    color: '#000000',
  },
  calendarDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#000000',
    marginTop: 4,
  },
  statsHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  // 概览卡片新样式
  overviewCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    padding: 24,
    backgroundColor: '#000000',
    borderRadius: 20,
  },
  overviewHeader: {
    marginBottom: 20,
  },
  overviewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overviewSubtitle: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  overviewStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#333333',
  },
  overviewStatNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overviewStatLabel: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  // 旧样式保留兼容
  statsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  statsSubtitle: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '23.5%',
    aspectRatio: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  statLabel: {
    fontSize: 11,
    color: '#999999',
    marginTop: 4,
  },
  statsSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
  },
  statsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  statsEmpty: {
    fontSize: 14,
    color: '#999999',
  },
  moodDistContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  moodDistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  moodDistEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodDistLabel: {
    fontSize: 13,
    color: '#666666',
  },
  moodDistPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  moodDistCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  tagStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagStatName: {
    fontSize: 13,
    color: '#000000',
  },
  tagStatCount: {
    fontSize: 12,
    color: '#666666',
  },
  writingTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
  },
  writingTimeContent: {
    marginLeft: 16,
  },
  writingTimeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  writingTimeLabel: {
    fontSize: 13,
    color: '#999999',
    marginTop: 4,
  },
  // 心情趋势图表新样式
  moodTrendContainer: {
    flexDirection: 'row',
    height: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  moodTrendYAxis: {
    width: 30,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  moodTrendYLabel: {
    fontSize: 16,
  },
  moodTrendChart: {
    flex: 1,
    position: 'relative',
  },
  moodTrendGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 24,
    justifyContent: 'space-between',
  },
  moodTrendGridLine: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  moodTrendData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingBottom: 24,
  },
  moodTrendColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  moodTrendDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000000',
    marginBottom: -6,
    zIndex: 2,
  },
  moodTrendLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#000000',
    left: '50%',
    zIndex: 1,
  },
  moodTrendXLabel: {
    position: 'absolute',
    bottom: 0,
    fontSize: 11,
    color: '#999999',
  },
  moodTrendLegend: {
    alignItems: 'center',
    marginTop: 12,
  },
  moodTrendLegendText: {
    fontSize: 13,
    color: '#666666',
  },
  // 旧样式保留兼容
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
  },
  chart: {
    borderRadius: 12,
  },
  moodLegend: {
    alignItems: 'center',
    marginTop: 8,
  },
  moodLegendText: {
    fontSize: 12,
    color: '#999999',
  },
  wordCloudContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  wordCloudItem: {
    alignItems: 'center',
  },
  wordCloudText: {
    color: '#000000',
    fontWeight: '500',
  },
  wordCloudCount: {
    fontSize: 10,
    color: '#999999',
    marginTop: 2,
  },
  yearlyReportSection: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  yearlyHero: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#000000',
    borderRadius: 20,
    marginBottom: 16,
  },
  yearlyHeroYear: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  yearlyHeroLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    letterSpacing: 4,
  },
  yearlyStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  yearlyStatCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  yearlyStatNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
  },
  yearlyStatLabel: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  yearlyInsightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  yearlyInsightCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  yearlyInsightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearlyInsightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  yearlyInsightText: {
    fontSize: 13,
    color: '#333333',
  },
  yearlyMoodList: {
    gap: 12,
  },
  yearlyMoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  yearlyMoodRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearlyMoodRankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  yearlyMoodInfo: {
    flex: 1,
    gap: 4,
  },
  yearlyMoodLabel: {
    fontSize: 14,
    color: '#333333',
  },
  yearlyMoodBar: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  yearlyMoodBarFill: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  yearlyMoodPercent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    minWidth: 48,
    textAlign: 'right',
  },
  yearlyHighlightCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  yearlyHighlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  yearlyHighlightLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  yearlyHighlightDate: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 6,
  },
  yearlyHighlightContent: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 6,
  },
  yearlyHighlightMeta: {
    fontSize: 12,
    color: '#666666',
  },
  yearlyTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearlyTagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  yearlyTagName: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  yearlyTagCount: {
    fontSize: 12,
    color: '#999999',
  },
  yearlyMonthChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 20,
  },
  yearlyMonthColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  yearlyMonthCount: {
    fontSize: 11,
    color: '#999999',
    marginBottom: 4,
  },
  yearlyMonthBarBg: {
    width: 20,
    height: 60,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  yearlyMonthBarFill2: {
    width: '100%',
    backgroundColor: '#000000',
    borderRadius: 4,
  },
  yearlyMonthLabel: {
    fontSize: 11,
    color: '#CCCCCC',
    marginTop: 6,
  },
  yearlyMonthLabelActive: {
    color: '#000000',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  modalDate: {
    fontSize: 13,
    color: '#999999',
    marginTop: 4,
  },
  modalBody: {
    padding: 24,
  },
  modalInput: {
    fontSize: 16,
    lineHeight: 26,
    minHeight: 180,
    textAlignVertical: 'top',
    color: '#000000',
  },
  moodSelector: {
    marginTop: 20,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999999',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  moodOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  moodBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodBtnActive: {
    backgroundColor: '#000000',
  },
  moodBtnEmoji: {
    fontSize: 22,
  },
  tagSelector: {
    marginTop: 24,
  },
  tagOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBtnWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  tagBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  tagDeleteBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  tagBtnActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  tagBtnText: {
    fontSize: 13,
    color: '#666666',
  },
  tagBtnTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  detailContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    margin: 20,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailMood: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailDate: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  detailTags: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  detailActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureBtns: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  featureBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailBody: {
    padding: 24,
  },
  detailText: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333333',
  },
  calendarDayInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDaySelected: {
    backgroundColor: '#000000',
  },
  calendarDayHasDiary: {
    backgroundColor: '#F5F5F5',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  calendarDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  selectedDateSection: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 32,
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    overflow: 'hidden',
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  selectedDateSubtitle: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  selectedDateAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDateEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  selectedDateEmptyIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  selectedDateEmptyText: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 20,
  },
  selectedDateEmptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderRadius: 24,
  },
  selectedDateEmptyBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  selectedDateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  selectedDateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedDateCardMood: {
    fontSize: 22,
    marginRight: 12,
  },
  selectedDateCardTags: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  selectedDateCardTag: {
    fontSize: 11,
    color: '#999999',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  selectedDateCardEdit: {
    padding: 4,
  },
  selectedDateCardText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 22,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  editorToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 16,
  },
  toolbarBtn: {
    padding: 4,
  },
  toolbarBtnActive: {
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 'auto',
  },
  locationTagText: {
    fontSize: 12,
    color: '#000000',
  },
  addTagBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customTagInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  tagInputField: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    paddingVertical: 4,
  },
  addTagConfirm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#000000',
    borderRadius: 12,
  },
  addTagConfirmText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  detailMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailMetaText: {
    fontSize: 12,
    color: '#999999',
  },
  detailImagesScroll: {
    marginBottom: 16,
  },
  detailImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginRight: 12,
  },
  wordCountText: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 16,
    textAlign: 'right',
  },
  statsContainer: {
    flex: 1,
  },
  calendarContainer: {
    flex: 1,
  },
  // 新增样式
  modalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyBtn: {
    padding: 4,
  },
  markdownInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },
  toolbarBtnLoading: {
    opacity: 0.6,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginTop: 12,
  },
  weatherText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  weatherDetail: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  markdownToolbar: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  mdBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mdBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  detailWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  detailWeatherText: {
    fontSize: 13,
    color: '#666',
  },
  // 编辑历史弹窗样式
  historyModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    minHeight: '50%',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  historyList: {
    padding: 20,
  },
  historyItem: {
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    marginBottom: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  historyTime: {
    fontSize: 12,
    color: '#999',
  },
  historyContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  historyRestore: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
  },
  historyEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  historyEmptyText: {
    fontSize: 14,
    color: '#999',
  },
  // 骨架屏样式
  skeletonCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  skeletonMood: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  skeletonTag: {
    width: 60,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
  },
  skeletonContent: {
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonContentShort: {
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    width: '60%',
  },
  skeletonWriteCard: {
    height: 80,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  skeletonFilter: {
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  skeletonDateGroup: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  skeletonDateHeader: {
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 12,
  },
  // 时间跳转样式
  timelineControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  jumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    gap: 4,
  },
  jumpBtnText: {
    fontSize: 12,
    color: '#666',
  },
  jumpModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '80%',
    maxWidth: 360,
  },
  jumpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  jumpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  jumpContent: {
    gap: 20,
  },
  jumpInputRow: {
    gap: 12,
  },
  jumpLabel: {
    fontSize: 14,
    color: '#666',
  },
  jumpInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E5E5',
    paddingVertical: 8,
  },
  monthSelector: {
    flexDirection: 'row',
  },
  monthBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  monthBtnActive: {
    backgroundColor: '#000',
  },
  monthBtnText: {
    fontSize: 14,
    color: '#666',
  },
  monthBtnTextActive: {
    color: '#FFF',
    fontWeight: '500',
  },
  jumpConfirmBtn: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  jumpConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  // 心情选择器样式
  moodSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addMoodText: {
    fontSize: 14,
    color: '#007AFF',
  },
  intensitySelector: {
    marginTop: 16,
  },
  intensityOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  intensityBtn: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityBtnActive: {
    // 激活状态通过子元素样式控制
  },
  intensityLevelDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E5E5',
  },
  intensityLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  intensityIndicator: {
    flexDirection: 'row',
    gap: 2,
    marginLeft: 'auto',
  },
  intensityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E5E5',
  },
  intensityDotActive: {
    backgroundColor: '#007AFF',
  },
  // 自定义心情弹窗样式
  customMoodModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    minHeight: '50%',
  },
  customMoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  customMoodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  customMoodContent: {
    padding: 20,
  },
  customMoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  customMoodName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  customMoodColor: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  addCustomMoodForm: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  addCustomMoodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  customMoodInput: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  addCustomMoodBtn: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addCustomMoodBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
