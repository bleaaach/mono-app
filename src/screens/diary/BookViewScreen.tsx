import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DiaryEntry } from '../../types';
import { diaryStorage } from '../../utils/storage';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375 || height < 700;
const BOOK_WIDTH = width - (isSmallScreen ? 24 : 48);
const PAGE_WIDTH = (BOOK_WIDTH - 32) / 2;
const PAGE_HEIGHT = height * (isSmallScreen ? 0.55 : 0.58);
const CONTENT_FONT_SIZE = isSmallScreen ? 12 : 13;
const CONTENT_LINE_HEIGHT = isSmallScreen ? 18 : 20;
const PAGE_PADDING = isSmallScreen ? 12 : 16;
const HEADER_MARGIN = isSmallScreen ? 8 : 12;
const FOOTER_MARGIN = isSmallScreen ? 8 : 12;

// 极简心情符号
const MOOD_SYMBOLS: Record<string, string> = {
  sunny: '○',
  cloudy: '◐',
  rainy: '◑',
  storm: '●',
  peaceful: '◇',
  sparkle: '*',
};

interface Bookmark {
  entryId: string;
  pageNumber: number;
}

export default function BookViewScreen({ navigation }: { navigation: any }) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [currentSpread, setCurrentSpread] = useState(0);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showToc, setShowToc] = useState(false);

  const [opacityAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadEntries();
    loadBookmarks();
  }, []);

  const loadEntries = async () => {
    const data = await diaryStorage.get();
    if (data) {
      const sorted = data.sort((a: DiaryEntry, b: DiaryEntry) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setEntries(sorted);
    }
  };

  const loadBookmarks = async () => {
    const saved = await diaryStorage.getBookmarks?.();
    if (saved) setBookmarks(saved);
  };

  const saveBookmarks = async (newBookmarks: Bookmark[]) => {
    setBookmarks(newBookmarks);
    await diaryStorage.setBookmarks?.(newBookmarks);
  };

  const toggleBookmark = (entryId: string) => {
    const existingIndex = bookmarks.findIndex(b => b.entryId === entryId);
    if (existingIndex >= 0) {
      saveBookmarks(bookmarks.filter(b => b.entryId !== entryId));
    } else {
      const pageNum = entries.findIndex(e => e.id === entryId);
      saveBookmarks([...bookmarks, { entryId, pageNumber: pageNum }]);
    }
  };

  const isBookmarked = (entryId: string) => bookmarks.some(b => b.entryId === entryId);

  const goToSpread = (spreadIndex: number) => {
    if (spreadIndex < 0 || spreadIndex > Math.ceil(entries.length / 2)) return;

    Animated.sequence([
      Animated.timing(opacityAnim, { toValue: 0.5, duration: 120, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start(() => setCurrentSpread(spreadIndex));
  };

  const goNext = () => goToSpread(currentSpread + 1);
  const goPrev = () => goToSpread(currentSpread - 1);

  const getCurrentEntries = () => {
    const leftIndex = currentSpread * 2;
    const rightIndex = leftIndex + 1;
    return {
      left: entries[leftIndex] || null,
      right: entries[rightIndex] || null,
      leftIndex,
      rightIndex,
    };
  };

  const { left, right, leftIndex, rightIndex } = getCurrentEntries();
  const totalSpreads = Math.ceil(entries.length / 2);

  if (entries.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>日记本</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>□</Text>
          <Text style={styles.emptyText}>日记本还是空的</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>日记本</Text>
        <TouchableOpacity onPress={() => setShowToc(!showToc)} style={styles.headerBtn}>
          <Ionicons name="list-outline" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      {/* 目录弹窗 */}
      {showToc && (
        <View style={styles.tocOverlay}>
          <TouchableOpacity style={styles.tocBackdrop} onPress={() => setShowToc(false)} />
          <View style={styles.tocPanel}>
            <View style={styles.tocHeader}>
              <Text style={styles.tocTitle}>目录</Text>
              <TouchableOpacity onPress={() => setShowToc(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {entries.map((entry, index) => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.tocItem}
                  onPress={() => {
                    goToSpread(Math.floor(index / 2));
                    setShowToc(false);
                  }}
                >
                  <Text style={styles.tocItemText}>{entry.date}</Text>
                  {isBookmarked(entry.id) && <Text style={styles.tocBookmark}>●</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* 书本主体 */}
      <View style={styles.bookWrapper}>
        {/* 书本外壳 - 极简黑色 */}
        <View style={styles.bookCover}>
          {/* 书脊 */}
          <View style={styles.bookSpine}>
            <View style={styles.spineLine} />
          </View>

          {/* 左页 */}
          <Animated.View style={[styles.page, styles.leftPage, { opacity: opacityAnim }]}>
            {left ? (
              <>
                <View style={styles.pageHeader}>
                  <Text style={styles.pageDate}>{left.date}</Text>
                  <TouchableOpacity onPress={() => toggleBookmark(left.id)}>
                    <Text style={[styles.bookmarkIcon, isBookmarked(left.id) && styles.bookmarkActive]}>
                      {isBookmarked(left.id) ? '●' : '○'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.pageContent}>
                  <Text style={styles.diaryText} numberOfLines={14}>
                    {left.content}
                  </Text>
                </ScrollView>

                <View style={styles.pageFooter}>
                  <Text style={styles.moodSymbol}>{MOOD_SYMBOLS[left.mood || 'cloudy']}</Text>
                  <Text style={styles.pageNumber}>{leftIndex + 1}</Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyPage}>
                <Text style={styles.emptyPageText}>—</Text>
              </View>
            )}
          </Animated.View>

          {/* 中间装订线 */}
          <View style={styles.bookBinding} />

          {/* 右页 */}
          <Animated.View style={[styles.page, styles.rightPage, { opacity: opacityAnim }]}>
            {right ? (
              <>
                <View style={styles.pageHeader}>
                  <Text style={styles.pageDate}>{right.date}</Text>
                  <TouchableOpacity onPress={() => toggleBookmark(right.id)}>
                    <Text style={[styles.bookmarkIcon, isBookmarked(right.id) && styles.bookmarkActive]}>
                      {isBookmarked(right.id) ? '●' : '○'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.pageContent}>
                  <Text style={styles.diaryText} numberOfLines={14}>
                    {right.content}
                  </Text>
                </ScrollView>

                <View style={styles.pageFooter}>
                  <Text style={styles.moodSymbol}>{MOOD_SYMBOLS[right.mood || 'cloudy']}</Text>
                  <Text style={styles.pageNumber}>{rightIndex + 1}</Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyPage}>
                <Text style={styles.emptyPageText}>—</Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* 书页边缘层次 */}
        <View style={styles.pageLayers}>
          {[...Array(4)].map((_, i) => (
            <View key={i} style={[styles.pageLayer, { right: -6 - i * 3 }]} />
          ))}
        </View>
      </View>

      {/* 导航控制 - 极简风格 */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navBtn, currentSpread === 0 && styles.navBtnDisabled]}
          onPress={goPrev}
          disabled={currentSpread === 0}
        >
          <Text style={[styles.navArrow, currentSpread === 0 && styles.navArrowDisabled]}>←</Text>
        </TouchableOpacity>

        <View style={styles.pageIndicator}>
          <Text style={styles.pageIndicatorText}>
            {currentSpread + 1} / {totalSpreads}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.navBtn, currentSpread >= totalSpreads - 1 && styles.navBtnDisabled]}
          onPress={goNext}
          disabled={currentSpread >= totalSpreads - 1}
        >
          <Text style={[styles.navArrow, currentSpread >= totalSpreads - 1 && styles.navArrowDisabled]}>→</Text>
        </TouchableOpacity>
      </View>

      {/* 点击翻页区域 */}
      <TouchableOpacity style={styles.leftTouchArea} onPress={goPrev} disabled={currentSpread === 0} />
      <TouchableOpacity style={styles.rightTouchArea} onPress={goNext} disabled={currentSpread >= totalSpreads - 1} />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 1,
  },
  headerBtn: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    color: '#CCC',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    letterSpacing: 0.5,
  },

  // 书本样式 - 极简黑白
  bookWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? 12 : 24,
  },
  bookCover: {
    width: BOOK_WIDTH,
    height: PAGE_HEIGHT + 32,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    flexDirection: 'row',
    padding: isSmallScreen ? 8 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  bookSpine: {
    width: isSmallScreen ? 16 : 20,
    backgroundColor: '#0A0A0A',
    borderRadius: 2,
    marginRight: isSmallScreen ? 4 : 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spineLine: {
    width: 1,
    height: '70%',
    backgroundColor: '#333',
  },
  page: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: PAGE_PADDING,
  },
  leftPage: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
  },
  rightPage: {
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E5E5',
  },
  bookBinding: {
    width: isSmallScreen ? 4 : 6,
    backgroundColor: '#E5E5E5',
  },
  pageLayers: {
    position: 'absolute',
    right: 20,
    top: 16,
    bottom: 16,
    width: 12,
  },
  pageLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#E8E8E8',
    borderRadius: 1,
  },

  // 页面内容
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: HEADER_MARGIN,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  pageDate: {
    fontSize: isSmallScreen ? 10 : 11,
    color: '#666',
    letterSpacing: 0.5,
  },
  bookmarkIcon: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#CCC',
  },
  bookmarkActive: {
    color: '#000',
  },
  pageContent: {
    flex: 1,
  },
  diaryText: {
    fontSize: CONTENT_FONT_SIZE,
    lineHeight: CONTENT_LINE_HEIGHT,
    color: '#333',
    letterSpacing: 0.3,
  },
  pageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: FOOTER_MARGIN,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#E0E0E0',
  },
  moodSymbol: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#666',
  },
  pageNumber: {
    fontSize: isSmallScreen ? 9 : 10,
    color: '#999',
  },
  emptyPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPageText: {
    fontSize: 20,
    color: '#DDD',
  },

  // 导航
  navigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: isSmallScreen ? 20 : 32,
    paddingVertical: isSmallScreen ? 16 : 24,
  },
  navBtn: {
    width: isSmallScreen ? 40 : 44,
    height: isSmallScreen ? 40 : 44,
    borderRadius: isSmallScreen ? 20 : 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnDisabled: {
    backgroundColor: '#F0F0F0',
  },
  navArrow: {
    fontSize: 18,
    color: '#000',
    fontWeight: '300',
  },
  navArrowDisabled: {
    color: '#CCC',
  },
  pageIndicator: {
    paddingHorizontal: isSmallScreen ? 14 : 20,
    paddingVertical: isSmallScreen ? 6 : 8,
    backgroundColor: '#F5F5F5',
    borderRadius: isSmallScreen ? 12 : 16,
  },
  pageIndicatorText: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#666',
    letterSpacing: 1,
  },
  leftTouchArea: {
    position: 'absolute',
    left: 0,
    top: isSmallScreen ? 60 : 80,
    bottom: isSmallScreen ? 80 : 100,
    width: width * 0.2,
    zIndex: 1,
  },
  rightTouchArea: {
    position: 'absolute',
    right: 0,
    top: isSmallScreen ? 60 : 80,
    bottom: isSmallScreen ? 80 : 100,
    width: width * 0.2,
    zIndex: 1,
  },

  // 目录
  tocOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    flexDirection: 'row',
  },
  tocBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  tocPanel: {
    width: width * 0.7,
    backgroundColor: '#FFF',
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  tocHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tocTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 1,
  },
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F5',
  },
  tocItemText: {
    fontSize: 13,
    color: '#333',
  },
  tocBookmark: {
    fontSize: 10,
    color: '#000',
  },
});
