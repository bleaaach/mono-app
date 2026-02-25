import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { LifeLogCategory, LifeLogEntry } from '../types';
import { lifeLogCategoryStorage, lifeLogEntryStorage } from '../utils/storage';
import { format, startOfWeek, addDays, isSameDay, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const screenWidth = Dimensions.get('window').width;

interface StatsData {
  totalEntries: number;
  todayEntries: number;
  weekEntries: number;
  monthEntries: number;
  categoryStats: { name: string; count: number; color: string }[];
  dailyStats: { date: string; count: number }[];
  tagStats: { name: string; count: number }[];
  entriesByHour: number[];
}

export default function LogStatsScreen() {
  const [categories, setCategories] = useState<LifeLogCategory[]>([]);
  const [entries, setEntries] = useState<LifeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

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

  const calculateStats = (): StatsData => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = subDays(today, 7);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const todayEntries = entries.filter(e => 
      isSameDay(new Date(e.createdAt), today)
    ).length;

    const weekEntries = entries.filter(e => 
      new Date(e.createdAt) >= weekAgo
    ).length;

    const monthEntries = entries.filter(e => {
      const date = new Date(e.createdAt);
      return date >= monthStart && date <= monthEnd;
    }).length;

    // 分类统计
    const categoryStats = categories.map(cat => {
      const count = entries.filter(e => e.categoryId === cat.id).length;
      return {
        name: cat.name,
        count,
        color: cat.color || '#000000',
      };
    }).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

    // 每日统计（最近7天或30天）
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 30;
    const dailyStats = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const count = entries.filter(e => 
        isSameDay(new Date(e.createdAt), date)
      ).length;
      dailyStats.push({
        date: format(date, 'MM/dd'),
        count,
      });
    }

    // 标签统计
    const tagMap = new Map<string, number>();
    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    const tagStats = Array.from(tagMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 时段统计（24小时）
    const entriesByHour = new Array(24).fill(0);
    entries.forEach(entry => {
      const hour = new Date(entry.createdAt).getHours();
      entriesByHour[hour]++;
    });

    return {
      totalEntries: entries.length,
      todayEntries,
      weekEntries,
      monthEntries,
      categoryStats,
      dailyStats,
      tagStats,
      entriesByHour,
    };
  };

  const stats = calculateStats();

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(128, 128, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#000',
    },
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>统计</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 概览卡片 */}
        <View style={styles.overviewSection}>
          <View style={styles.overviewCard}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewNumber}>{stats.totalEntries}</Text>
              <Text style={styles.overviewLabel}>总记录</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Text style={styles.overviewNumber}>{stats.todayEntries}</Text>
              <Text style={styles.overviewLabel}>今日</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Text style={styles.overviewNumber}>{stats.weekEntries}</Text>
              <Text style={styles.overviewLabel}>本周</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Text style={styles.overviewNumber}>{stats.monthEntries}</Text>
              <Text style={styles.overviewLabel}>本月</Text>
            </View>
          </View>
        </View>

        {/* 时间范围选择 */}
        <View style={styles.timeRangeSection}>
          <View style={styles.timeRangeButtons}>
            {(['week', 'month', 'all'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeRangeButton,
                  timeRange === range && styles.timeRangeButtonActive,
                ]}
                onPress={() => setTimeRange(range)}
              >
                <Text
                  style={[
                    styles.timeRangeButtonText,
                    timeRange === range && styles.timeRangeButtonTextActive,
                  ]}
                >
                  {range === 'week' ? '近7天' : range === 'month' ? '近30天' : '全部'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 分类分布饼图 */}
        {stats.categoryStats.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>分类分布</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={stats.categoryStats.map((cat, index) => ({
                  name: cat.name,
                  population: cat.count,
                  color: cat.color,
                  legendFontColor: '#666',
                  legendFontSize: 12,
                }))}
                width={screenWidth - 40}
                height={200}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </View>
        )}

        {/* 每日记录趋势 */}
        {stats.dailyStats.some(d => d.count > 0) && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>记录趋势</Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: stats.dailyStats.filter((_, i) => i % 3 === 0).map(d => d.date),
                  datasets: [{
                    data: stats.dailyStats.map(d => d.count),
                  }],
                }}
                width={screenWidth - 40}
                height={180}
                chartConfig={chartConfig}
                bezier
                style={styles.lineChart}
                withDots={false}
                withInnerLines={false}
              />
            </View>
          </View>
        )}

        {/* 活跃时段 */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>活跃时段</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={{
                labels: ['0', '4', '8', '12', '16', '20'],
                datasets: [{
                  data: [
                    stats.entriesByHour.slice(0, 4).reduce((a, b) => a + b, 0),
                    stats.entriesByHour.slice(4, 8).reduce((a, b) => a + b, 0),
                    stats.entriesByHour.slice(8, 12).reduce((a, b) => a + b, 0),
                    stats.entriesByHour.slice(12, 16).reduce((a, b) => a + b, 0),
                    stats.entriesByHour.slice(16, 20).reduce((a, b) => a + b, 0),
                    stats.entriesByHour.slice(20, 24).reduce((a, b) => a + b, 0),
                  ],
                }],
              }}
              width={screenWidth - 40}
              height={150}
              chartConfig={chartConfig}
              style={styles.barChart}
              showValuesOnTopOfBars
              withInnerLines={false}
              fromZero
              yAxisLabel=""
              yAxisSuffix=""
            />
          </View>
        </View>

        {/* 热门标签 */}
        {stats.tagStats.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>热门标签</Text>
            <View style={styles.tagsContainer}>
              {stats.tagStats.map((tag, index) => (
                <View key={tag.name} style={styles.tagItem}>
                  <Text style={styles.tagRank}>#{index + 1}</Text>
                  <Text style={styles.tagName}>{tag.name}</Text>
                  <Text style={styles.tagCount}>{tag.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 分类详情列表 */}
        <View style={styles.categoryListSection}>
          <Text style={styles.sectionTitle}>分类详情</Text>
          {stats.categoryStats.map((cat) => (
            <View key={cat.name} style={styles.categoryListItem}>
              <View style={[styles.categoryColorDot, { backgroundColor: cat.color }]} />
              <Text style={styles.categoryListName}>{cat.name}</Text>
              <Text style={styles.categoryListCount}>{cat.count} 条记录</Text>
            </View>
          ))}
        </View>

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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  overviewSection: {
    padding: 20,
  },
  overviewCard: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderRadius: 16,
    padding: 20,
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  overviewNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  overviewLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeRangeSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  timeRangeButtonActive: {
    backgroundColor: '#fff',
  },
  timeRangeButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  timeRangeButtonTextActive: {
    color: '#000',
  },
  chartSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  chartContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  lineChart: {
    borderRadius: 16,
  },
  barChart: {
    borderRadius: 16,
  },
  tagsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tagsContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 16,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tagRank: {
    width: 30,
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  tagName: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  tagCount: {
    fontSize: 13,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryListSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categoryListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryListName: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  categoryListCount: {
    fontSize: 13,
    color: '#666',
  },
  bottomPadding: {
    height: 40,
  },
});
