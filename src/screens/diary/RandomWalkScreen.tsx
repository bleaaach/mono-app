import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DiaryEntry } from '../../types';
import { diaryStorage } from '../../utils/storage';
import {
  SunnyMoodIcon,
  CloudyMoodIcon,
  RainyMoodIcon,
  StormMoodIcon,
  PeacefulMoodIcon,
  SparkleIcon,
  DiaryIcon,
  SparkleIcon as SparkleIconAlt,
  RestIcon,
} from '../../components/Icons';

const { width, height } = Dimensions.get('window');

const MOODS: Record<string, { label: string; iconComponent: React.ComponentType<{ size: number; color: string }>; color: string }> = {
  sunny: { label: '晴朗', iconComponent: SunnyMoodIcon, color: '#FFB800' },
  cloudy: { label: '多云', iconComponent: CloudyMoodIcon, color: '#8E8E93' },
  rainy: { label: '下雨', iconComponent: RainyMoodIcon, color: '#007AFF' },
  storm: { label: '雷雨', iconComponent: StormMoodIcon, color: '#5856D6' },
  peaceful: { label: '宁静', iconComponent: PeacefulMoodIcon, color: '#FF9500' },
  sparkle: { label: '美好', iconComponent: SparkleIcon, color: '#FF2D55' },
};

interface RandomWalkConfig {
  timeRange?: {
    start?: string;
    end?: string;
  };
  tags?: string[];
  moods?: string[];
  excludeRecent?: number;
}

export default function RandomWalkScreen({ navigation }: { navigation: any }) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<DiaryEntry | null>(null);
  const [history, setHistory] = useState<DiaryEntry[]>([]);
  const [config, setConfig] = useState<RandomWalkConfig>({});
  const [showConfig, setShowConfig] = useState(false);
  const [specialMode, setSpecialMode] = useState<'normal' | 'today' | 'mood' | 'capsule'>('normal');
  
  const pan = useState(new Animated.ValueXY())[0];
  const fadeAnim = useState(new Animated.Value(1))[0];
  const scaleAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const data = await diaryStorage.get();
    if (data && data.length > 0) {
      setEntries(data);
      // 初始随机一篇
      getRandomEntry(data, config);
    }
  };

  const getRandomEntry = (allEntries: DiaryEntry[], cfg: RandomWalkConfig, mode: 'normal' | 'today' | 'mood' | 'capsule' = 'normal') => {
    let candidates = [...allEntries];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 应用筛选
    if (cfg.timeRange?.start) {
      candidates = candidates.filter(e => e.date >= cfg.timeRange!.start!);
    }
    if (cfg.timeRange?.end) {
      candidates = candidates.filter(e => e.date <= cfg.timeRange!.end!);
    }
    if (cfg.tags && cfg.tags.length > 0) {
      candidates = candidates.filter(e => e.tags?.some(t => cfg.tags!.includes(t)));
    }
    if (cfg.moods && cfg.moods.length > 0) {
      candidates = candidates.filter(e => cfg.moods!.includes(e.mood || 'cloudy'));
    }
    if (cfg.excludeRecent) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - cfg.excludeRecent);
      const cutoffStr = cutoffDate.toISOString().split('T')[0];
      candidates = candidates.filter(e => e.date < cutoffStr);
    }

    // 排除当前和历史
    const historyIds = new Set(history.map(h => h.id));
    if (currentEntry) historyIds.add(currentEntry.id);
    candidates = candidates.filter(e => !historyIds.has(e.id));

    // 如果没有候选，重置历史
    if (candidates.length === 0) {
      if (history.length > 0) {
        setHistory([]);
        candidates = allEntries.filter(e => e.id !== currentEntry?.id);
      } else {
        return;
      }
    }

    let selected: DiaryEntry;

    switch (mode) {
      case 'today':
        // 历史上的今天
        const todayMonth = today.getMonth() + 1;
        const todayDate = today.getDate();
        const sameDayEntries = candidates.filter(e => {
          const d = new Date(e.date);
          return d.getMonth() + 1 === todayMonth && d.getDate() === todayDate && e.date !== todayStr;
        });
        if (sameDayEntries.length > 0) {
          selected = sameDayEntries[Math.floor(Math.random() * sameDayEntries.length)];
          break;
        }
        // 如果没有，降级为普通随机
        setSpecialMode('normal');
        selected = candidates[Math.floor(Math.random() * candidates.length)];
        break;

      case 'mood':
        // 相似心情
        if (currentEntry?.mood) {
          const sameMoodEntries = candidates.filter(e => e.mood === currentEntry.mood);
          if (sameMoodEntries.length > 0) {
            selected = sameMoodEntries[Math.floor(Math.random() * sameMoodEntries.length)];
            break;
          }
        }
        setSpecialMode('normal');
        selected = candidates[Math.floor(Math.random() * candidates.length)];
        break;

      case 'capsule':
        // 时光胶囊 - 很久以前的
        const sortedByDate = candidates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const oldEntries = sortedByDate.slice(0, Math.ceil(sortedByDate.length * 0.3));
        if (oldEntries.length > 0) {
          selected = oldEntries[Math.floor(Math.random() * oldEntries.length)];
          break;
        }
        setSpecialMode('normal');
        selected = candidates[Math.floor(Math.random() * candidates.length)];
        break;

      default:
        // 加权随机 - 旧日记权重更高
        const weights = candidates.map(e => {
          const daysAgo = Math.floor((new Date().getTime() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24));
          return Math.min(daysAgo + 1, 365); // 最多365权重
        });
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        selected = candidates[0];
        for (let i = 0; i < candidates.length; i++) {
          random -= weights[i];
          if (random <= 0) {
            selected = candidates[i];
            break;
          }
        }
    }

    if (currentEntry) {
      setHistory(prev => [...prev, currentEntry]);
    }
    setCurrentEntry(selected);
    
    // 重置动画
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
    pan.setValue({ x: 0, y: 0 });
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (_, gestureState) => {
      pan.setValue({ x: gestureState.dx, y: 0 });
      const scale = 1 - Math.abs(gestureState.dx) / (width * 2);
      scaleAnim.setValue(Math.max(scale, 0.9));
    },
    onPanResponderRelease: (_, gestureState) => {
      if (Math.abs(gestureState.dx) > width * 0.3) {
        // 滑动超过阈值，切换
        const direction = gestureState.dx > 0 ? 'right' : 'left';
        Animated.parallel([
          Animated.timing(pan, {
            toValue: { x: direction === 'right' ? width : -width, y: 0 },
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          getRandomEntry(entries, config, specialMode);
        });
      } else {
        // 回弹
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
  });

  const getDaysAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSpecialModeText = () => {
    switch (specialMode) {
      case 'today':
        return '历史上的今天';
      case 'mood':
        return '相似心情';
      case 'capsule':
        return '时光胶囊';
      default:
        return '';
    }
  };

  if (entries.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>随机漫游</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <DiaryIcon size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>还没有日记</Text>
          <Text style={styles.emptySubtext}>先写几篇日记再来漫游吧</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentEntry) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>随机漫游</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const mood = MOODS[currentEntry.mood || 'cloudy'];
  const daysAgo = getDaysAgo(currentEntry.date);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>随机漫游</Text>
        <TouchableOpacity onPress={() => setShowConfig(!showConfig)}>
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 特殊模式提示 */}
      {specialMode !== 'normal' && (
        <View style={styles.specialModeBanner}>
          <Text style={styles.specialModeText}>{getSpecialModeText()}</Text>
        </View>
      )}

      {/* 时间提示 */}
      <View style={styles.timeHint}>
        <Text style={styles.timeHintText}>
          这是 {daysAgo} 天前的日记
        </Text>
      </View>

      {/* 卡片区域 */}
      <View style={styles.cardContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            // 点击卡片切换另一篇日记
            Animated.sequence([
              Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
              }),
            ]).start(() => {
              getRandomEntry(entries, config, specialMode);
            });
          }}
        >
          <Animated.View
            style={[
              styles.card,
              {
                transform: [
                  { translateX: pan.x },
                  { scale: scaleAnim },
                ],
                opacity: fadeAnim,
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardDate}>
                <Text style={styles.cardDateText}>{currentEntry.date}</Text>
                {React.createElement(mood.iconComponent, { size: 28, color: mood.color })}
              </View>
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardText} numberOfLines={8}>{currentEntry.content}</Text>
            </View>

            {currentEntry.tags && currentEntry.tags.length > 0 && (
              <View style={styles.cardTags}>
                {currentEntry.tags.slice(0, 4).map((tag, i) => (
                  <View key={i} style={styles.cardTag}>
                    <Text style={styles.cardTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* 点击提示 */}
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>点击切换下一篇</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* 滑动提示 */}
        <Text style={styles.swipeHint}>← 左右滑动查看更多 →</Text>
      </View>

      {/* 底部操作 */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerBtn}
          onPress={() => {
            // 收藏功能
            Alert.alert('成功', '已收藏这篇日记');
          }}
        >
          <Ionicons name="heart-outline" size={22} color="#333" />
          <Text style={styles.footerBtnText}>收藏</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.footerBtn}
          onPress={() => navigation.navigate('Share', { entryId: currentEntry.id })}
        >
          <Ionicons name="share-outline" size={22} color="#333" />
          <Text style={styles.footerBtnText}>分享</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.footerBtn}
          onPress={() => {
            // 编辑
            navigation.navigate('Diary', { 
              screen: 'Timeline',
              params: { editEntryId: currentEntry.id }
            });
          }}
        >
          <Ionicons name="create-outline" size={22} color="#333" />
          <Text style={styles.footerBtnText}>编辑</Text>
        </TouchableOpacity>
      </View>

      {/* 特殊模式选择 */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeBtn, specialMode === 'today' && styles.modeBtnActive]}
          onPress={() => {
            setSpecialMode('today');
            getRandomEntry(entries, config, 'today');
          }}
        >
          <RestIcon size={20} color={specialMode === 'today' ? '#FFFFFF' : '#333333'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, specialMode === 'mood' && styles.modeBtnActive]}
          onPress={() => {
            setSpecialMode('mood');
            getRandomEntry(entries, config, 'mood');
          }}
        >
          <SparkleIconAlt size={20} color={specialMode === 'mood' ? '#FFFFFF' : '#333333'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, specialMode === 'capsule' && styles.modeBtnActive]}
          onPress={() => {
            setSpecialMode('capsule');
            getRandomEntry(entries, config, 'capsule');
          }}
        >
          <RestIcon size={20} color={specialMode === 'capsule' ? '#FFFFFF' : '#333333'} />
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  specialModeBanner: {
    backgroundColor: '#000',
    paddingVertical: 8,
    alignItems: 'center',
  },
  specialModeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  timeHint: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  timeHintText: {
    fontSize: 14,
    color: '#666',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: width - 40,
    minHeight: 300,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardDate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDateText: {
    fontSize: 15,
    color: '#666',
  },
  cardContent: {
    minHeight: 150,
  },
  cardText: {
    fontSize: 18,
    lineHeight: 30,
    color: '#333',
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
  },
  cardTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cardTagText: {
    fontSize: 12,
    color: '#666',
  },
  swipeHint: {
    fontSize: 13,
    color: '#999',
    marginTop: 24,
  },
  tapHint: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  tapHintText: {
    fontSize: 12,
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingVertical: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  footerBtn: {
    alignItems: 'center',
    gap: 6,
  },
  footerBtnText: {
    fontSize: 12,
    color: '#666',
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
  },
  modeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#000',
  },
  modeBtnText: {
    fontSize: 20,
  },
});
