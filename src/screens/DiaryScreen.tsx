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
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { DiaryEntry } from '../types';
import { Colors } from '../constants/colors';
import { diaryStorage } from '../utils/storage';
import { getTodayString, formatDate, generateId } from '../utils/date';

const MOODS = [
  { key: 'sunny', label: '晴朗', emoji: '☀️' },
  { key: 'cloudy', label: '多云', emoji: '☁️' },
  { key: 'rainy', label: '下雨', emoji: '🌧️' },
  { key: 'storm', label: '雷雨', emoji: '⚡' },
  { key: 'moon', label: '宁静', emoji: '🌙' },
  { key: 'star', label: '美好', emoji: '✨' },
] as const;

const DEFAULT_TAGS = ['工作', '生活', '思考', '旅行', '阅读', '运动'];

type DiaryTab = 'timeline' | 'calendar' | 'stats';

export default function DiaryScreen() {
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
  const [editorWeather, setEditorWeather] = useState<{type: string; temp: number; description: string} | null>(null);
  const [editorLocation, setEditorLocation] = useState<{name: string} | null>(null);
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
      setEditorWeather(entry.weather || null);
      setEditorLocation(entry.location || null);
    } else {
      setEditingEntry(null);
      setEditorContent('');
      setEditorMood('cloudy');
      setEditorTags([]);
      setEditorImages([]);
      setEditorWeather(null);
      setEditorLocation(null);
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

  // 渲染时间线
  const renderTimeline = () => {
    const grouped = groupByDate(filteredEntries);
    
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
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
                        <Text style={styles.entryMood}>{mood.emoji}</Text>
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
      <ScrollView showsVerticalScrollIndicator={false}>
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
                      <Text style={styles.selectedDateCardMood}>{mood.emoji}</Text>
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

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>日记回顾</Text>
          <Text style={styles.statsSubtitle}>记录生活的轨迹</Text>
        </View>

        {/* 统计卡片 */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>篇日记</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.streak}</Text>
            <Text style={styles.statLabel}>连续记录</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {stats.firstDate !== '-' ? new Date(stats.firstDate).getMonth() + 1 + '/' + new Date(stats.firstDate).getDate() : '-'}
            </Text>
            <Text style={styles.statLabel}>开始记录</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.thisMonth}</Text>
            <Text style={styles.statLabel}>本月记录</Text>
          </View>
        </View>

        {/* 心情分布 */}
        <View style={styles.statsSection}>
          <Text style={styles.statsSectionTitle}>心情分布</Text>
          <View style={styles.moodDistContainer}>
            {moodDist.length === 0 ? (
              <Text style={styles.statsEmpty}>暂无数据</Text>
            ) : (
              moodDist.map(([mood, count]) => {
                const moodInfo = getMoodDisplay(mood);
                return (
                  <View key={mood} style={styles.moodDistItem}>
                    <Text style={styles.moodDistEmoji}>{moodInfo.emoji}</Text>
                    <Text style={styles.moodDistCount}>{count}</Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* 常用标签 */}
        <View style={styles.statsSection}>
          <Text style={styles.statsSectionTitle}>常用标签</Text>
          <View style={styles.tagStatsContainer}>
            {tagStats.length === 0 ? (
              <Text style={styles.statsEmpty}>暂无数据</Text>
            ) : (
              tagStats.map(([tag, count]) => (
                <View key={tag} style={styles.tagStatItem}>
                  <Text style={styles.tagStatName}>{tag}</Text>
                  <Text style={styles.tagStatCount}>{count}</Text>
                </View>
              ))
            )}
          </View>
        </View>
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
        
        {activeTab === 'timeline' && (
          <View style={styles.subNavRight}>
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
          </View>
        )}
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
                      <TouchableOpacity onPress={() => setEditorLocation(null)}>
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
                        <Text style={styles.moodBtnEmoji}>{mood.emoji}</Text>
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
                    <Text style={styles.detailMood}>
                      {getMoodDisplay(detailEntry.mood).emoji}
                    </Text>
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
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '22%',
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
    gap: 20,
  },
  moodDistItem: {
    alignItems: 'center',
  },
  moodDistEmoji: {
    fontSize: 32,
    marginBottom: 8,
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
    fontSize: 32,
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
});
