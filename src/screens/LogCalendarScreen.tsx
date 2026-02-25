import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  subMonths,
  addMonths,
  getDay,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { LifeLogCategory, LifeLogEntry } from '../types';
import { lifeLogCategoryStorage, lifeLogEntryStorage } from '../utils/storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LogStackParamList } from '../navigation/LogNavigator';

const screenWidth = Dimensions.get('window').width;
const dayWidth = (screenWidth - 40) / 7;

export default function LogCalendarScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LogStackParamList>>();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [categories, setCategories] = useState<LifeLogCategory[]>([]);
  const [entries, setEntries] = useState<LifeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getEntriesForDate = (date: Date) => {
    return entries.filter(entry => isSameDay(new Date(entry.createdAt), date));
  };

  const getEntryCountForDate = (date: Date) => {
    return getEntriesForDate(date).length;
  };

  const getCategoryColorsForDate = (date: Date): string[] => {
    const dayEntries = getEntriesForDate(date);
    const colors = dayEntries.map(entry => {
      const cat = getCategoryById(entry.categoryId);
      return cat?.color || '#000';
    });
    return [...new Set(colors)].slice(0, 3);
  };

  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const selectedDateEntries = selectedDate ? getEntriesForDate(selectedDate) : [];

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

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
        <Text style={styles.headerTitle}>日历</Text>
        <TouchableOpacity onPress={goToToday}>
          <Text style={styles.todayButton}>今天</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Month Navigation */}
        <View style={styles.monthNavigation}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {format(currentDate, 'yyyy年MM月', { locale: zhCN })}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Week Days Header */}
        <View style={styles.weekDaysHeader}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDayCell}>
              <Text style={[styles.weekDayText, index === 0 || index === 6 ? styles.weekendText : null]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const entryCount = getEntryCountForDate(day);
            const categoryColors = getCategoryColorsForDate(day);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  !isCurrentMonth && styles.otherMonthDay,
                  isToday && styles.todayCell,
                  isSelected && styles.selectedCell,
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text
                  style={[
                    styles.dayText,
                    !isCurrentMonth && styles.otherMonthText,
                    isToday && styles.todayText,
                    isSelected && styles.selectedText,
                    (getDay(day) === 0 || getDay(day) === 6) && styles.weekendText,
                  ]}
                >
                  {format(day, 'd')}
                </Text>
                {entryCount > 0 && (
                  <View style={styles.dotsContainer}>
                    {categoryColors.map((color, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          { backgroundColor: color },
                          categoryColors.length === 1 && styles.singleDot,
                        ]}
                      />
                    ))}
                    {entryCount > 3 && (
                      <Text style={styles.moreIndicator}>+</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Date Entries */}
        {selectedDate && (
          <View style={styles.entriesSection}>
            <View style={styles.entriesHeader}>
              <Text style={styles.entriesDate}>
                {format(selectedDate, 'MM月dd日', { locale: zhCN })} 的记录
              </Text>
              <Text style={styles.entriesCount}>{selectedDateEntries.length} 条</Text>
            </View>

            {selectedDateEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>这一天没有记录</Text>
              </View>
            ) : (
              selectedDateEntries.map(entry => {
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
                    {entry.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {entry.tags.slice(0, 3).map((tag, i) => (
                          <View key={i} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  todayButton: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  weekDayCell: {
    width: dayWidth,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  weekendText: {
    color: '#ff3b30',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  dayCell: {
    width: dayWidth,
    height: dayWidth * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  todayCell: {
    backgroundColor: '#f0f0f0',
  },
  selectedCell: {
    backgroundColor: '#000',
  },
  dayText: {
    fontSize: 15,
    color: '#000',
  },
  otherMonthText: {
    color: '#999',
  },
  todayText: {
    fontWeight: '600',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2,
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  singleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreIndicator: {
    fontSize: 9,
    color: '#999',
    marginLeft: 1,
  },
  entriesSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  entriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  entriesDate: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  entriesCount: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  entryCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
  },
  bottomPadding: {
    height: 40,
  },
});
