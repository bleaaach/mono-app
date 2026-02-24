import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { PieChart } from 'react-native-chart-kit';
import { DiaryEntry } from '../types';
import { Colors } from '../constants/colors';
import { diaryStorage } from '../utils/storage';
import { getTodayString, formatDate, generateId } from '../utils/date';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  SunnyMoodIcon,
  CloudyMoodIcon,
  RainyMoodIcon,
  StormMoodIcon,
  PeacefulMoodIcon,
  SparkleIcon,
} from '../components/Icons';

const MOODS = [
  { key: 'sunny', label: '晴朗', iconComponent: SunnyMoodIcon },
  { key: 'cloudy', label: '多云', iconComponent: CloudyMoodIcon },
  { key: 'rainy', label: '下雨', iconComponent: RainyMoodIcon },
  { key: 'storm', label: '雷雨', iconComponent: StormMoodIcon },
  { key: 'peaceful', label: '宁静', iconComponent: PeacefulMoodIcon },
  { key: 'sparkle', label: '美好', iconComponent: SparkleIcon },
] as const;

const DEFAULT_TAGS = ['工作', '生活', '思考', '旅行', '阅读', '运动'];

type DiaryTab = 'timeline' | 'calendar' | 'stats';

export default function DiaryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<DiaryTab>('timeline');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorMood, setEditorMood] = useState<string>('cloudy');
  const [editorTags, setEditorTags] = useState<string[]>([]);
  const [editorImages, setEditorImages] = useState<string[]>([]);
  const [editorWeather, setEditorWeather] = useState<{type: string; temp: number; description: string} | undefined>(undefined);
  const [editorLocation, setEditorLocation] = useState<{name: string} | undefined>(undefined);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  
  const [showDetail, setShowDetail] = useState(false);
  const [detailEntry, setDetailEntry] = useState<DiaryEntry | null>(null);
  
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const allTags = [...DEFAULT_TAGS, ...customTags];

  // 加载数据
  const loadEntries = async () => {
    const data = await diaryStorage.get();
    if (data) {
      setEntries(data.sort((a: DiaryEntry, b: DiaryEntry) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [])
  );

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
      setEditorMood(entry.mood || 'cloudy');
      setEditorTags(entry.tags || []);
      setEditorImages(entry.images || []);
      setEditorWeather(entry.weather);
      setEditorLocation(entry.location);
    } else {
      setEditingEntry(null);
      setEditorContent('');
      setEditorMood('cloudy');
      setEditorTags([]);
      setEditorImages([]);
      setEditorWeather(undefined);
      setEditorLocation(undefined);
    }
    setShowEditor(true);
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

  const saveDiary = () => {
    if (!editorContent.trim() && editorImages.length === 0) {
      Alert.alert('提示', '请输入日记内容或添加图片');
      return;
    }

    const now = new Date().toISOString();
    const wordCount = editorContent.trim().length;

    if (editingEntry) {
      const updated = entries.map(e => 
        e.id === editingEntry.id 
          ? { 
              ...e, 
              content: editorContent, 
              mood: editorMood as any, 
              tags: editorTags,
              images: editorImages,
              weather: editorWeather,
              location: editorLocation,
              wordCount,
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
        mood: editorMood as any,
        tags: editorTags,
        images: editorImages,
        weather: editorWeather,
        location: editorLocation,
        wordCount,
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

  // 生成年报数据
  const getYearlyReport = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const yearEntries = entries.filter(e => new Date(e.date).getFullYear() === currentYear);
    
    if (yearEntries.length === 0) return null;

    const monthlyCount = Array(12).fill(0);
    yearEntries.forEach(e => {
      const month = new Date(e.date).getMonth();
      monthlyCount[month]++;
    });

    const moodDist: Record<string, number> = {};
    yearEntries.forEach(e => {
      const mood = e.mood || 'cloudy';
      moodDist[mood] = (moodDist[mood] || 0) + 1;
    });

    const totalWords = yearEntries.reduce((sum, e) => sum + (e.wordCount || e.content.length), 0);
    const favoriteMonth = monthlyCount.indexOf(Math.max(...monthlyCount));

    return {
      year: currentYear,
      totalEntries: yearEntries.length,
      totalWords,
      monthlyCount,
      moodDist,
      favoriteMonth,
      firstEntry: yearEntries[yearEntries.length - 1]?.date,
    };
  }, [entries]);

  // 渲染时间线
  const renderTimeline = () => {
    const grouped = groupByDate(filteredEntries);
    
    return (
      <ScrollView style={styles.timelineContainer} showsVerticalScrollIndicator={false}>
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

        {/* 标签筛选 */}
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

        {/* 日记时间线 */}
        <View style={styles.timelineContainer}>
          {grouped.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
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
                        {React.createElement(mood.iconComponent, { size: 20, color: '#000000' })}
                        <View style={styles.entryTags}>
                          {entry.tags?.map((tag, i) => (
                            <Text key={i} style={styles.entryTag}>{tag}</Text>
                          ))}
                        </View>
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
                <Text style={styles.selectedDateEmptyIcon}>📝</Text>
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
    const moodTrend = getMoodTrend;
    const wordCloud = getWordCloudData;
    const yearlyReport = getYearlyReport;

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
                <Text style={styles.moodTrendYLabel}>😊</Text>
                <Text style={styles.moodTrendYLabel}>😐</Text>
                <Text style={styles.moodTrendYLabel}>😔</Text>
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
                  {moodTrend.data.map((score, index) => {
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
                            {index < moodTrend.data.length - 1 && hasData && moodTrend.data[index + 1] > 0 && (
                              <View style={[
                                styles.moodTrendLine,
                                {
                                  bottom: `${heightPercent}%`,
                                  transform: [
                                    { rotate: `${Math.atan2(
                                      (moodTrend.data[index + 1] / 5) * 100 - heightPercent,
                                      100
                                    )}rad` }
                                  ],
                                  width: `${Math.sqrt(
                                    Math.pow(100, 2) + 
                                    Math.pow((moodTrend.data[index + 1] / 5) * 100 - heightPercent, 2)
                                  )}%`
                                }
                              ]} />
                            )}
                          </>
                        )}
                        {/* X轴标签 */}
                        <Text style={styles.moodTrendXLabel}>{moodTrend.labels[index]?.split('/')[1]}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
            
            {/* 心情说明 */}
            <View style={styles.moodTrendLegend}>
              <Text style={styles.moodTrendLegendText}>
                记录 {moodTrend.data.filter(v => v > 0).length} 天 · 平均心情 {moodTrend.data.filter(v => v > 0).length > 0 ? (moodTrend.data.reduce((a, b) => a + b, 0) / moodTrend.data.filter(v => v > 0).length).toFixed(1) : '-'}/5
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
        {wordCloud.length > 0 && (
          <View style={styles.statsSection}>
            <Text style={styles.statsSectionTitle}>常用词汇</Text>
            <View style={styles.wordCloudContainer}>
              {wordCloud.slice(0, 15).map(([word, count], index) => {
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
        {yearlyReport && (
          <View style={styles.statsSection}>
            <Text style={styles.statsSectionTitle}>{yearlyReport.year}年度回顾</Text>
            <View style={styles.yearlyReportCard}>
              <View style={styles.yearlyReportStats}>
                <View style={styles.yearlyReportStat}>
                  <Text style={styles.yearlyReportNumber}>{yearlyReport.totalEntries}</Text>
                  <Text style={styles.yearlyReportLabel}>篇日记</Text>
                </View>
                <View style={styles.yearlyReportStat}>
                  <Text style={styles.yearlyReportNumber}>
                    {yearlyReport.totalWords > 1000 
                      ? (yearlyReport.totalWords / 1000).toFixed(1) + 'k' 
                      : yearlyReport.totalWords}
                  </Text>
                  <Text style={styles.yearlyReportLabel}>字数</Text>
                </View>
                <View style={styles.yearlyReportStat}>
                  <Text style={styles.yearlyReportNumber}>{yearlyReport.favoriteMonth + 1}月</Text>
                  <Text style={styles.yearlyReportLabel}>最活跃</Text>
                </View>
              </View>

              {Object.keys(yearlyReport.moodDist).length > 0 && (
                <View style={styles.yearlyReportMoods}>
                  <Text style={styles.yearlyReportMoodTitle}>年度心情 TOP3</Text>
                  <View style={styles.yearlyReportMoodList}>
                    {Object.entries(yearlyReport.moodDist)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([mood, count]) => {
                        const moodInfo = getMoodDisplay(mood);
                        const percentage = Math.round((count / yearlyReport.totalEntries) * 100);
                        return (
                          <View key={mood} style={styles.yearlyReportMoodItem}>
                            {React.createElement(moodInfo.iconComponent, { size: 20, color: '#000000' })}
                            <Text style={styles.yearlyReportMoodLabel}>{moodInfo.label}</Text>
                            <Text style={styles.yearlyReportMoodPercent}>{percentage}%</Text>
                          </View>
                        );
                      })}
                  </View>
                </View>
              )}
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
      <View style={styles.content}>
        {activeTab === 'timeline' && renderTimeline()}
        {activeTab === 'calendar' && renderCalendar()}
        {activeTab === 'stats' && renderStats()}
      </View>

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
                <TouchableOpacity onPress={() => setShowEditor(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <TextInput
                  style={styles.modalInput}
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

                {/* 心情选择 */}
                <View style={styles.moodSelector}>
                  <Text style={styles.selectorLabel}>心情</Text>
                  <View style={styles.moodOptions}>
                    {MOODS.map(mood => (
                      <TouchableOpacity
                        key={mood.key}
                        style={[styles.moodBtn, editorMood === mood.key && styles.moodBtnActive]}
                        onPress={() => setEditorMood(mood.key)}
                      >
                        {React.createElement(mood.iconComponent, { size: 24, color: editorMood === mood.key ? '#FFFFFF' : '#000000' })}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 标签选择 */}
                <View style={styles.tagSelector}>
                  <Text style={styles.selectorLabel}>标签</Text>
                  <View style={styles.tagOptions}>
                    {allTags.map(tag => (
                      <TouchableOpacity
                        key={tag}
                        style={[styles.tagBtn, editorTags.includes(tag) && styles.tagBtnActive]}
                        onPress={() => toggleTag(tag)}
                      >
                        <Text style={[styles.tagBtnText, editorTags.includes(tag) && styles.tagBtnTextActive]}>
                          {tag}
                        </Text>
                      </TouchableOpacity>
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
    transformOrigin: 'left center',
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
  yearlyReportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  yearlyReportHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  yearlyReportYear: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000000',
  },
  yearlyReportSubtitle: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  yearlyReportStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  yearlyReportStat: {
    alignItems: 'center',
  },
  yearlyReportNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  yearlyReportLabel: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  yearlyReportMoods: {
    marginBottom: 16,
  },
  yearlyReportMoodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  yearlyReportMoodList: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  yearlyReportMoodItem: {
    alignItems: 'center',
  },
  yearlyReportMoodEmoji: {
    fontSize: 32,
  },
  yearlyReportMoodLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  yearlyReportMoodPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginTop: 2,
  },
  yearlyReportFirst: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
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
  tagBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
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
});
