import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { StorageSpace, StorageItem, StorageCategory, StorageTag, ItemFilters, StorageStatistics } from '../types';
import {
  storageSpaceStorage,
  storageItemStorage,
  storageCategoryStorage,
  storageTagStorage,
  storageStatistics,
} from '../utils/storage';
import { Colors } from '../constants/colors';
import * as ImagePicker from 'expo-image-picker';
import {
  HomeSpaceIcon,
  SofaIcon,
  BedIcon,
  KitchenIcon,
  BathroomIcon,
  BalconyIcon,
  BoxIcon,
  WardrobeIcon,
  FridgeIcon,
  BookshelfIcon,
  TVIcon,
  DrawerIcon,
  SearchIcon,
  ChartIcon,
  CloseIcon,
  OtherIcon,
  ClothingIcon,
  FoodIcon,
  BeautyIcon,
  MedicineIcon,
  ElectronicsIcon,
  BooksIcon,
  HomeGoodsIcon,
  SportsIcon,
  ToysIcon,
  CollectionsIcon,
  ToolsIcon,
  PackageIcon,
  getIconComponent,
} from '../components/Icons';

const CATEGORY_ICON_MAP: Record<string, React.FC<{ size?: number; color?: string }>> = {
  'clothing': ClothingIcon,
  'food': FoodIcon,
  'beauty': BeautyIcon,
  'medicine': MedicineIcon,
  'electronics': ElectronicsIcon,
  'books': BooksIcon,
  'home': HomeGoodsIcon,
  'homeGoods': HomeGoodsIcon,
  'sports': SportsIcon,
  'toys': ToysIcon,
  'collections': CollectionsIcon,
  'tools': ToolsIcon,
  'others': PackageIcon,
  'package': PackageIcon,
};

const LEGACY_CATEGORY_EMOJI_MAP: Record<string, string> = {
  '👔': 'clothing', '🍔': 'food', '💄': 'beauty', '💊': 'medicine',
  '📱': 'electronics', '📚': 'books', '🏠': 'homeGoods', '⚽': 'sports',
  '🧸': 'toys', '🎨': 'collections', '🔨': 'tools', '📦': 'package',
};

const getCategoryIconComponent = (iconName: string): React.FC<{ size?: number; color?: string }> => {
  const mappedName = LEGACY_CATEGORY_EMOJI_MAP[iconName] || iconName;
  return CATEGORY_ICON_MAP[mappedName] || getIconComponent(mappedName) || PackageIcon;
};

const SPACE_ICON_MAP: Record<string, React.FC<{ size?: number; color?: string }>> = {
  '家': HomeSpaceIcon, '客厅': SofaIcon, '卧室': BedIcon, '厨房': KitchenIcon, '书房': BookshelfIcon,
  '卫生间': BathroomIcon, '阳台': BalconyIcon, '储藏室': BoxIcon, '衣柜': WardrobeIcon, '冰箱': FridgeIcon,
  '书架': BookshelfIcon, '电视柜': TVIcon, '床头柜': BedIcon, '抽屉': DrawerIcon, '默认': BoxIcon,
  'homeSpace': HomeSpaceIcon, 'sofa': SofaIcon, 'bed': BedIcon, 'kitchen': KitchenIcon, 'bookshelf': BookshelfIcon,
  'bathroom': BathroomIcon, 'balcony': BalconyIcon, 'box': BoxIcon, 'wardrobe': WardrobeIcon, 'fridge': FridgeIcon,
  'tv': TVIcon, 'drawer': DrawerIcon,
};

const LEGACY_SPACE_EMOJI_MAP: Record<string, string> = {
  '🏠': 'homeSpace', '🛋️': 'sofa', '🛏️': 'bed', '🍳': 'kitchen', '📚': 'bookshelf',
  '🚿': 'bathroom', '🌱': 'balcony', '📦': 'box', '🚪': 'wardrobe', '❄️': 'fridge',
  '📖': 'bookshelf', '📺': 'tv', '🗄️': 'drawer',
};

const getSpaceIconComponent = (name: string): React.FC<{ size?: number; color?: string }> => {
  const mappedName = LEGACY_SPACE_EMOJI_MAP[name] || name;
  return SPACE_ICON_MAP[mappedName] || SPACE_ICON_MAP['默认'];
};

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 计算剩余天数
const getDaysUntilExpiry = (expiryDate: string): number => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function InventoryScreen() {
  // 数据状态
  const [spaces, setSpaces] = useState<StorageSpace[]>([]);
  const [items, setItems] = useState<StorageItem[]>([]);
  const [categories, setCategories] = useState<StorageCategory[]>([]);
  const [tags, setTags] = useState<StorageTag[]>([]);
  const [statistics, setStatistics] = useState<StorageStatistics | null>(null);
  
  // UI状态
  const [currentView, setCurrentView] = useState<'home' | 'space' | 'category' | 'search' | 'stats' | 'categoryManage' | 'tagManage' | 'expiring' | 'settings'>('home');
  const [selectedSpace, setSelectedSpace] = useState<StorageSpace | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<StorageCategory | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSpaceModal, setShowSpaceModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showItemDetail, setShowItemDetail] = useState<StorageItem | null>(null);
  const [editingItem, setEditingItem] = useState<StorageItem | null>(null);
  const [expiringItems, setExpiringItems] = useState<StorageItem[]>([]);
  const [expiredItems, setExpiredItems] = useState<StorageItem[]>([]);
  
  // 筛选状态
  const [filters, setFilters] = useState<ItemFilters>({});
  
  // 表单状态
  const [formData, setFormData] = useState<Partial<StorageItem>>({
    name: '',
    spaceId: '',
    categoryId: '',
    quantity: 1,
    unit: '个',
    price: undefined,
    currency: 'CNY',
    tags: [],
    status: 'normal',
    note: '',
    brand: '',
    model: '',
    purchaseDate: '',
    expiryDate: '',
    images: [],
  });
  
  // 空间表单
  const [spaceForm, setSpaceForm] = useState({
    name: '',
    parentId: null as string | null,
    note: '',
  });

  // 分类管理表单
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon: 'package',
    color: '#FF6B6B',
  });
  const [editingCategory, setEditingCategory] = useState<StorageCategory | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // 标签管理表单
  const [tagForm, setTagForm] = useState({
    name: '',
    color: '#2563EB',
  });
  const [editingTag, setEditingTag] = useState<StorageTag | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);

  // 提醒设置
  const [reminderSettings, setReminderSettings] = useState({
    expiringSoonDays: 7,
    enableExpiringAlert: true,
    enableExpiredAlert: true,
  });
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  
  // 刷新状态
  const [refreshing, setRefreshing] = useState(false);

  // 加载所有数据
  const loadData = useCallback(async () => {
    const [spacesData, itemsData, categoriesData, tagsData, statsData] = await Promise.all([
      storageSpaceStorage.get(),
      storageItemStorage.get(),
      storageCategoryStorage.get(),
      storageTagStorage.get(),
      storageStatistics.get(),
    ]);
    setSpaces(spacesData);
    setItems(itemsData);
    setCategories(categoriesData);
    setTags(tagsData);
    setStatistics(statsData);

    // 加载过期物品
    const expiring = await storageItemStorage.getExpiringSoon(reminderSettings.expiringSoonDays);
    const expired = await storageItemStorage.getExpired();
    setExpiringItems(expiring);
    setExpiredItems(expired);
  }, [reminderSettings.expiringSoonDays]);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // 使用 useMemo 缓存计算结果
  const displayedItems = useMemo(() => {
    let filtered = items;
    
    if (currentView === 'space' && selectedSpace) {
      filtered = items.filter(i => i.spaceId === selectedSpace.id);
    } else if (currentView === 'category' && selectedCategory) {
      filtered = items.filter(i => i.categoryId === selectedCategory.id);
    } else if (currentView === 'search' && searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = items.filter(i =>
        i.name.toLowerCase().includes(keyword) ||
        (i.brand && i.brand.toLowerCase().includes(keyword)) ||
        (i.note && i.note.toLowerCase().includes(keyword))
      );
    }
    
    // 应用额外筛选
    if (filters.status) {
      filtered = filtered.filter(i => i.status === filters.status);
    }
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(i => filters.tags!.some(tag => i.tags.includes(tag)));
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [items, currentView, selectedSpace, selectedCategory, searchKeyword, filters]);

  // 获取子空间
  const getChildSpaces = useCallback((parentId: string | null): StorageSpace[] => {
    return spaces
      .filter(s => s.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [spaces]);

  // 获取空间路径
  const getSpacePath = useCallback((spaceId: string): string => {
    const space = spaces.find(s => s.id === spaceId);
    return space?.path || '';
  }, [spaces]);

  // 获取分类
  const getCategory = useCallback((categoryId: string): StorageCategory | undefined => {
    return categories.find(c => c.id === categoryId);
  }, [categories]);

  // 缓存分类数量统计
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach(item => {
      counts.set(item.categoryId, (counts.get(item.categoryId) || 0) + 1);
    });
    return counts;
  }, [items]);

  // 缓存空间物品数量统计
  const spaceItemCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach(item => {
      counts.set(item.spaceId, (counts.get(item.spaceId) || 0) + 1);
    });
    return counts;
  }, [items]);

  // 创建空间
  const handleCreateSpace = async () => {
    if (!spaceForm.name.trim()) return;
    
    const parentSpace = spaceForm.parentId ? spaces.find(s => s.id === spaceForm.parentId) : null;
    const level = parentSpace ? parentSpace.level + 1 : 0;
    const path = parentSpace ? `${parentSpace.path}/${spaceForm.name.trim()}` : spaceForm.name.trim();
    
    await storageSpaceStorage.create({
      name: spaceForm.name.trim(),
      parentId: spaceForm.parentId,
      level,
      path,
      icon: spaceForm.name.trim() in Object.keys(SPACE_ICON_MAP) ? spaceForm.name.trim() : 'box',
      sortOrder: spaces.filter(s => s.parentId === spaceForm.parentId).length,
    });
    
    setSpaceForm({ name: '', parentId: null, note: '' });
    setShowSpaceModal(false);
    loadData();
  };

  // 删除空间
  const handleDeleteSpace = async (space: StorageSpace) => {
    Alert.alert(
      '删除空间',
      `确定要删除"${space.name}"吗？该空间下的所有物品也将被删除。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await storageSpaceStorage.delete(space.id);
            if (selectedSpace?.id === space.id) {
              setSelectedSpace(null);
              setCurrentView('home');
            }
            loadData();
          },
        },
      ]
    );
  };

  // ========== 分类管理 ==========
  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      Alert.alert('提示', '请输入分类名称');
      return;
    }

    if (editingCategory) {
      await storageCategoryStorage.update(editingCategory.id, {
        name: categoryForm.name.trim(),
        icon: categoryForm.icon,
        color: categoryForm.color,
      });
    } else {
      await storageCategoryStorage.create({
        name: categoryForm.name.trim(),
        icon: categoryForm.icon,
        color: categoryForm.color,
        sortOrder: categories.length,
      });
    }

    setCategoryForm({ name: '', icon: 'package', color: '#FF6B6B' });
    setEditingCategory(null);
    setShowCategoryModal(false);
    loadData();
  };

  const handleEditCategory = (category: StorageCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      icon: category.icon,
      color: category.color,
    });
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (category: StorageCategory) => {
    const itemsUsingCategory = items.filter(i => i.categoryId === category.id);
    if (itemsUsingCategory.length > 0) {
      Alert.alert(
        '无法删除',
        `该分类下有 ${itemsUsingCategory.length} 个物品，请先删除或移动这些物品。`
      );
      return;
    }

    Alert.alert(
      '删除分类',
      `确定要删除分类"${category.name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await storageCategoryStorage.delete(category.id);
            loadData();
          },
        },
      ]
    );
  };

  // ========== 标签管理 ==========
  const handleSaveTag = async () => {
    if (!tagForm.name.trim()) {
      Alert.alert('提示', '请输入标签名称');
      return;
    }

    if (editingTag) {
      await storageTagStorage.update(editingTag.id, {
        name: tagForm.name.trim(),
        color: tagForm.color,
      });
    } else {
      await storageTagStorage.create({
        name: tagForm.name.trim(),
        color: tagForm.color,
      });
    }

    setTagForm({ name: '', color: '#2563EB' });
    setEditingTag(null);
    setShowTagModal(false);
    loadData();
  };

  const handleEditTag = (tag: StorageTag) => {
    setEditingTag(tag);
    setTagForm({
      name: tag.name,
      color: tag.color || '#2563EB',
    });
    setShowTagModal(true);
  };

  const handleDeleteTag = async (tag: StorageTag) => {
    Alert.alert(
      '删除标签',
      `确定要删除标签"${tag.name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await storageTagStorage.delete(tag.id);
            loadData();
          },
        },
      ]
    );
  };

  // 保存物品
  const handleSaveItem = async () => {
    if (!formData.name?.trim() || !formData.spaceId || !formData.categoryId) {
      Alert.alert('提示', '请填写物品名称、选择空间和分类');
      return;
    }

    const itemData = {
      ...formData,
      name: formData.name.trim(),
      quantity: formData.quantity || 1,
      currency: formData.currency || 'CNY',
      tags: formData.tags || [],
      status: formData.status || 'normal',
    } as Omit<StorageItem, 'id' | 'createdAt' | 'updatedAt'>;

    if (editingItem) {
      await storageItemStorage.update(editingItem.id, itemData);
    } else {
      await storageItemStorage.create(itemData);
    }

    resetForm();
    setShowAddModal(false);
    setEditingItem(null);
    loadData();
  };

  // 删除物品
  const handleDeleteItem = async (item: StorageItem) => {
    Alert.alert(
      '删除物品',
      `确定要删除"${item.name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await storageItemStorage.delete(item.id);
            setShowItemDetail(null);
            loadData();
          },
        },
      ]
    );
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      spaceId: selectedSpace?.id || spaces[0]?.id || '',
      categoryId: categories[0]?.id || '',
      quantity: 1,
      unit: '个',
      price: undefined,
      currency: 'CNY',
      tags: [],
      status: 'normal',
      note: '',
      brand: '',
      model: '',
      purchaseDate: '',
      expiryDate: '',
      images: [],
    });
  };

  // 编辑物品
  const handleEditItem = (item: StorageItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      spaceId: item.spaceId,
      categoryId: item.categoryId,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      currency: item.currency,
      tags: item.tags,
      status: item.status,
      note: item.note,
      brand: item.brand,
      model: item.model,
      purchaseDate: item.purchaseDate,
      expiryDate: item.expiryDate,
      images: item.images,
    });
    setShowItemDetail(null);
    setShowAddModal(true);
  };

  // 选择图片
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newImages = [...(formData.images || []), result.assets[0].uri];
      setFormData({ ...formData, images: newImages });
    }
  };

  // 渲染统计卡片
  const renderStatsCard = () => (
    <TouchableOpacity
      style={styles.statsCard}
      onPress={() => setCurrentView('stats')}
      activeOpacity={0.8}
    >
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{statistics?.totalItems || 0}</Text>
          <Text style={styles.statLabel}>物品总数</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>¥{(statistics?.totalValue || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>总价值</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{statistics?.newThisMonth || 0}</Text>
          <Text style={styles.statLabel}>本月新增</Text>
        </View>
        <TouchableOpacity
          style={styles.statItem}
          onPress={() => setCurrentView('expiring')}
        >
          <Text style={[styles.statValue, (statistics?.expiringSoon || 0) > 0 ? styles.statAlert : null]}>
            {statistics?.expiringSoon || 0}
          </Text>
          <Text style={styles.statLabel}>即将过期</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // 渲染空间树
  const renderSpaceTree = (parentId: string | null = null, level: number = 0) => {
    const childSpaces = getChildSpaces(parentId);
    
    return childSpaces.map(space => {
      const itemCount = items.filter(i => i.spaceId === space.id).length;
      const hasChildren = spaces.some(s => s.parentId === space.id);
      
      return (
        <View key={space.id}>
          <TouchableOpacity
            style={[styles.spaceItem, { paddingLeft: 20 + level * 20 }]}
            onPress={() => {
              setSelectedSpace(space);
              setCurrentView('space');
            }}
            onLongPress={() => handleDeleteSpace(space)}
          >
            <View style={styles.spaceIcon}>
              {React.createElement(getSpaceIconComponent(space.icon || space.name), { size: 24, color: '#000000' })}
            </View>
            <View style={styles.spaceInfo}>
              <Text style={styles.spaceName}>{space.name}</Text>
              <Text style={styles.spaceCount}>{itemCount} 件物品</Text>
            </View>
            <Text style={styles.spaceArrow}>›</Text>
          </TouchableOpacity>
          {hasChildren && renderSpaceTree(space.id, level + 1)}
        </View>
      );
    });
  };

  // 渲染分类快捷入口
  const renderCategoryShortcuts = () => (
    <View style={styles.categorySection}>
      <Text style={styles.sectionTitle}>分类</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.categoryList}>
          {categories.slice(0, 8).map(category => {
            const count = items.filter(i => i.categoryId === category.id).length;
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryChip}
                onPress={() => {
                  setSelectedCategory(category);
                  setCurrentView('category');
                }}
              >
                <View style={styles.categoryIcon}>
                  {React.createElement(getCategoryIconComponent(category.icon), { size: 24, color: category.color || '#000000' })}
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>{count}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  // 左滑操作按钮
  const renderRightActions = useCallback((item: StorageItem) => {
    return (
      <View style={styles.swipeActions}>
        <TouchableOpacity 
          style={[styles.swipeAction, styles.swipeActionEdit]}
          onPress={() => handleEditItem(item)}
        >
          <Text style={styles.swipeActionText}>编辑</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.swipeAction, styles.swipeActionDelete]}
          onPress={() => handleDeleteItem(item)}
        >
          <Text style={styles.swipeActionText}>删除</Text>
        </TouchableOpacity>
      </View>
    );
  }, [handleEditItem, handleDeleteItem]);

  // 渲染物品项 - 使用 memo 优化
  const ItemCard = memo(({ item, index }: { item: StorageItem; index: number }) => {
    const category = getCategory(item.categoryId);
    const space = spaces.find(s => s.id === item.spaceId);
    const daysUntilExpiry = item.expiryDate ? getDaysUntilExpiry(item.expiryDate) : null;
    
    const handlePress = useCallback(() => {
      setShowItemDetail(item);
    }, [item]);
    
    return (
      <Animated.View 
        entering={FadeIn.delay(index * 30)}
        layout={Layout}
      >
        <Swipeable
          renderRightActions={() => renderRightActions(item)}
          friction={2}
          rightThreshold={40}
        >
          <TouchableOpacity
            style={styles.itemCard}
            onPress={handlePress}
            activeOpacity={0.7}
          >
            <View style={styles.itemHeader}>
              {item.images && item.images.length > 0 ? (
                <Image source={{ uri: item.images[0] }} style={styles.itemImage} resizeMode="cover" />
              ) : (
                <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                  <BoxIcon size={24} color="#999999" />
                </View>
              )}
              <View style={styles.itemMain}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemCategory}>{category?.name}</Text>
                  <Text style={styles.itemDot}>·</Text>
                  <Text style={styles.itemLocation}>{space?.name}</Text>
                </View>
                {item.price !== undefined && (
                  <Text style={styles.itemPrice}>¥{item.price.toLocaleString()}</Text>
                )}
              </View>
            </View>
            
            {daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry >= 0 && (
              <View style={styles.expiryWarning}>
                <Text style={styles.expiryWarningText}>
                  ! {daysUntilExpiry === 0 ? '今天过期' : `${daysUntilExpiry}天后过期`}
                </Text>
              </View>
            )}
            
            {item.tags.length > 0 && (
              <View style={styles.itemTags}>
                {item.tags.slice(0, 3).map((tag, index) => (
                  <View key={index} style={styles.tagChip}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        </Swipeable>
      </Animated.View>
    );
  });

  // 列表渲染函数
  const renderItem = useCallback(({ item, index }: { item: StorageItem; index: number }) => {
    return <ItemCard item={item} index={index} />;
  }, [spaces, getCategory, renderRightActions]);

  // 渲染首页
  const renderHome = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {renderStatsCard()}
      
      {/* 空间导航 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>空间</Text>
          <TouchableOpacity onPress={() => setShowSpaceModal(true)}>
            <Text style={styles.sectionAction}>+ 添加</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.spaceList}>
          {renderSpaceTree()}
        </View>
      </View>
      
      {renderCategoryShortcuts()}

      {/* 管理入口 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>管理</Text>
        <View style={styles.manageGrid}>
          <TouchableOpacity
            style={styles.manageCard}
            onPress={() => setCurrentView('categoryManage')}
          >
            <View style={[styles.manageCardIcon, { backgroundColor: '#4ECDC420' }]}>
              <ClothingIcon size={24} color="#4ECDC4" />
            </View>
            <Text style={styles.manageCardTitle}>分类管理</Text>
            <Text style={styles.manageCardCount}>{categories.length} 个分类</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manageCard}
            onPress={() => setCurrentView('tagManage')}
          >
            <View style={[styles.manageCardIcon, { backgroundColor: '#AA96DA20' }]}>
              <Text style={[styles.manageCardIconText, { color: '#AA96DA' }]}>#</Text>
            </View>
            <Text style={styles.manageCardTitle}>标签管理</Text>
            <Text style={styles.manageCardCount}>{tags.length} 个标签</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 最近添加 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>最近添加</Text>
        <View style={styles.itemsList}>
          {items.slice(0, 5).map((item, index) => (
            <ItemCard key={item.id} item={item} index={index} />
          ))}
        </View>
        {items.length === 0 && (
          <View style={styles.emptyState}>
            <BoxIcon size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>还没有物品</Text>
            <Text style={styles.emptySubtext}>点击右上角添加</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  // 渲染空间详情
  const renderSpaceDetail = () => {
    if (!selectedSpace) return null;
    const childSpaces = getChildSpaces(selectedSpace.id);
    
    return (
      <View style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setCurrentView('home')}>
            <Text style={styles.backButton}>← 返回</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>{selectedSpace.name}</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <Text style={styles.breadcrumb}>{getSpacePath(selectedSpace.id)}</Text>
        
        {childSpaces.length > 0 && (
          <View style={styles.childSpacesSection}>
            <Text style={styles.subSectionTitle}>子空间</Text>
            <View style={styles.childSpacesGrid}>
              {childSpaces.map(space => {
                const count = items.filter(i => i.spaceId === space.id).length;
                return (
                  <TouchableOpacity
                    key={space.id}
                    style={styles.childSpaceCard}
                    onPress={() => setSelectedSpace(space)}
                  >
                    <View style={styles.childSpaceIcon}>
                      {React.createElement(getSpaceIconComponent(space.icon || space.name), { size: 20, color: '#000000' })}
                    </View>
                    <Text style={styles.childSpaceName}>{space.name}</Text>
                    <Text style={styles.childSpaceCount}>{count} 件</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
        
        <View style={styles.detailContent}>
          <Text style={styles.subSectionTitle}>物品 ({displayedItems.length})</Text>
          <FlatList
            data={displayedItems}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            getItemLayout={(data, index) => ({ length: 120, offset: 120 * index, index })}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={5}
            removeClippedSubviews={true}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <BoxIcon size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>该空间还没有物品</Text>
              </View>
            }
          />
        </View>
      </View>
    );
  };

  // 渲染分类详情
  const renderCategoryDetail = () => {
    if (!selectedCategory) return null;
    
    return (
      <View style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setCurrentView('home')}>
            <Text style={styles.backButton}>← 返回</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>{selectedCategory.icon} {selectedCategory.name}</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <FlatList
          data={displayedItems}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          getItemLayout={(data, index) => ({ length: 120, offset: 120 * index, index })}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <BoxIcon size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>该分类还没有物品</Text>
            </View>
          }
        />
      </View>
    );
  };

  // 渲染搜索结果
  const renderSearchResults = () => {
    return (
      <View style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => { setCurrentView('home'); setSearchKeyword(''); }}>
            <Text style={styles.backButton}>← 返回</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>搜索结果</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <Text style={styles.searchResultText}>找到 {displayedItems.length} 个物品</Text>
        
        <FlatList
          data={displayedItems}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          getItemLayout={(data, index) => ({ length: 120, offset: 120 * index, index })}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <SearchIcon size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>没有找到相关物品</Text>
            </View>
          }
        />
      </View>
    );
  };

  // 渲染统计页面
  const renderStats = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={() => setCurrentView('home')}>
          <Text style={styles.backButton}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.detailTitle}>统计</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderStatsCard()}

      {/* 价值分析 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>价值分析</Text>
        {statistics?.categoryDistribution.map(cat => {
          const category = getCategory(cat.categoryId);
          if (!category || cat.value === 0) return null;
          const totalValue = statistics?.totalValue || 1;
          return (
            <View key={cat.categoryId} style={styles.distributionItem}>
              <View style={styles.distributionInfo}>
                <View style={styles.distributionIcon}>
                  {React.createElement(getCategoryIconComponent(category.icon), { size: 20, color: category.color || '#000000' })}
                </View>
                <Text style={styles.distributionName}>{category.name}</Text>
              </View>
              <View style={styles.distributionBar}>
                <View
                  style={[
                    styles.distributionFill,
                    {
                      width: `${(cat.value / totalValue) * 100}%`,
                      backgroundColor: category.color,
                    }
                  ]}
                />
              </View>
              <Text style={styles.distributionCount}>¥{cat.value.toLocaleString()}</Text>
            </View>
          );
        })}
      </View>

      {/* 分类分布 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>分类分布</Text>
        {statistics?.categoryDistribution.map(cat => {
          const category = getCategory(cat.categoryId);
          if (!category) return null;
          return (
            <View key={cat.categoryId} style={styles.distributionItem}>
              <View style={styles.distributionInfo}>
                <View style={styles.distributionIcon}>
                  {React.createElement(getCategoryIconComponent(category.icon), { size: 20, color: category.color || '#000000' })}
                </View>
                <Text style={styles.distributionName}>{category.name}</Text>
              </View>
              <View style={styles.distributionBar}>
                <View
                  style={[
                    styles.distributionFill,
                    {
                      width: `${statistics.totalItems > 0 ? (cat.count / statistics.totalItems) * 100 : 0}%`,
                      backgroundColor: category.color,
                    }
                  ]}
                />
              </View>
              <Text style={styles.distributionCount}>{cat.count}</Text>
            </View>
          );
        })}
      </View>

      {/* 空间分布 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>空间分布</Text>
        {statistics?.spaceDistribution.map(space => {
          const spaceData = spaces.find(s => s.id === space.spaceId);
          if (!spaceData) return null;
          return (
            <View key={space.spaceId} style={styles.distributionItem}>
              <View style={styles.distributionInfo}>
                <View style={styles.distributionIcon}>
                  {React.createElement(getSpaceIconComponent(spaceData.icon || spaceData.name), { size: 20, color: '#000000' })}
                </View>
                <Text style={styles.distributionName}>{spaceData.name}</Text>
              </View>
              <View style={styles.distributionBar}>
                <View
                  style={[
                    styles.distributionFill,
                    {
                      width: `${statistics.totalItems > 0 ? (space.count / statistics.totalItems) * 100 : 0}%`,
                      backgroundColor: Colors.gray[400],
                    }
                  ]}
                />
              </View>
              <Text style={styles.distributionCount}>{space.count}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  // 渲染分类管理页面
  const renderCategoryManage = () => (
    <View style={styles.detailContainer}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={() => setCurrentView('home')}>
          <Text style={styles.backButton}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.detailTitle}>分类管理</Text>
        <TouchableOpacity onPress={() => {
          setEditingCategory(null);
          setCategoryForm({ name: '', icon: 'package', color: '#FF6B6B' });
          setShowCategoryModal(true);
        }}>
          <Text style={styles.actionButton}>+ 添加</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={item => item.id}
        renderItem={({ item: category }) => {
          const count = items.filter(i => i.categoryId === category.id).length;
          return (
            <View style={styles.manageItemCard}>
              <View style={styles.manageItemLeft}>
                <View style={[styles.manageItemIcon, { backgroundColor: category.color + '20' }]}>
                  {React.createElement(getCategoryIconComponent(category.icon), { size: 24, color: category.color })}
                </View>
                <View>
                  <Text style={styles.manageItemName}>{category.name}</Text>
                  <Text style={styles.manageItemCount}>{count} 个物品</Text>
                </View>
              </View>
              <View style={styles.manageItemActions}>
                <TouchableOpacity
                  style={styles.manageItemButton}
                  onPress={() => handleEditCategory(category)}
                >
                  <Text style={styles.manageItemButtonText}>编辑</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.manageItemButton, styles.manageItemButtonDanger]}
                  onPress={() => handleDeleteCategory(category)}
                >
                  <Text style={[styles.manageItemButtonText, styles.manageItemButtonTextDanger]}>删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>暂无分类</Text>
          </View>
        }
      />
    </View>
  );

  // 渲染标签管理页面
  const renderTagManage = () => (
    <View style={styles.detailContainer}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={() => setCurrentView('home')}>
          <Text style={styles.backButton}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.detailTitle}>标签管理</Text>
        <TouchableOpacity onPress={() => {
          setEditingTag(null);
          setTagForm({ name: '', color: '#2563EB' });
          setShowTagModal(true);
        }}>
          <Text style={styles.actionButton}>+ 添加</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tags}
        keyExtractor={item => item.id}
        renderItem={({ item: tag }) => (
          <View style={styles.manageItemCard}>
            <View style={styles.manageItemLeft}>
              <View style={[styles.tagChip, { backgroundColor: tag.color + '20', borderColor: tag.color }]}>
                <Text style={[styles.tagText, { color: tag.color }]}>{tag.name}</Text>
              </View>
              <Text style={styles.manageItemCount}>{tag.usageCount} 次使用</Text>
            </View>
            <View style={styles.manageItemActions}>
              <TouchableOpacity
                style={styles.manageItemButton}
                onPress={() => handleEditTag(tag)}
              >
                <Text style={styles.manageItemButtonText}>编辑</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.manageItemButton, styles.manageItemButtonDanger]}
                onPress={() => handleDeleteTag(tag)}
              >
                <Text style={[styles.manageItemButtonText, styles.manageItemButtonTextDanger]}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>暂无标签</Text>
          </View>
        }
      />
    </View>
  );

  // 渲染过期预警列表
  const renderExpiringList = () => {
    const allExpiring = [...expiredItems, ...expiringItems];

    return (
      <View style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setCurrentView('home')}>
            <Text style={styles.backButton}>← 返回</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>过期预警</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.expiringSummary}>
          <View style={[styles.expiringSummaryItem, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.expiringSummaryNumber, { color: '#DC2626' }]}>{expiredItems.length}</Text>
            <Text style={styles.expiringSummaryLabel}>已过期</Text>
          </View>
          <View style={[styles.expiringSummaryItem, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.expiringSummaryNumber, { color: '#D97706' }]}>{expiringItems.length}</Text>
            <Text style={styles.expiringSummaryLabel}>即将过期</Text>
          </View>
        </View>

        <FlatList
          data={allExpiring}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const category = getCategory(item.categoryId);
            const space = spaces.find(s => s.id === item.spaceId);
            const daysUntilExpiry = item.expiryDate ? getDaysUntilExpiry(item.expiryDate) : null;
            const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

            return (
              <TouchableOpacity
                style={[styles.expiringItemCard, isExpired && styles.expiringItemCardExpired]}
                onPress={() => setShowItemDetail(item)}
              >
                <View style={styles.expiringItemHeader}>
                  <View style={styles.expiringItemInfo}>
                    <Text style={styles.expiringItemName}>{item.name}</Text>
                    <Text style={styles.expiringItemMeta}>
                      {category?.name} · {space?.name}
                    </Text>
                  </View>
                  <View style={[styles.expiringBadge, isExpired ? styles.expiringBadgeExpired : styles.expiringBadgeWarning]}>
                    <Text style={styles.expiringBadgeText}>
                      {isExpired ? `已过期 ${Math.abs(daysUntilExpiry!)} 天` : `${daysUntilExpiry} 天后过期`}
                    </Text>
                  </View>
                </View>
                {item.expiryDate && (
                  <Text style={styles.expiringItemDate}>
                    保质期至: {formatDate(item.expiryDate)}
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>暂无过期或即将过期物品</Text>
              <Text style={styles.emptySubtext}>所有物品都在保质期内</Text>
            </View>
          }
        />
      </View>
    );
  };

  // 渲染添加/编辑物品模态框
  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      transparent
      animationType="slide"
      onRequestClose={() => { setShowAddModal(false); setEditingItem(null); resetForm(); }}
    >
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.modalScroll}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingItem ? '编辑物品' : '添加物品'}</Text>
            
            {/* 图片选择 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>照片</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.imageList}>
                  {formData.images?.map((uri, index) => (
                    <View key={index} style={styles.selectedImage}>
                      <Image source={{ uri }} style={styles.selectedImageThumb} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => {
                          const newImages = formData.images?.filter((_, i) => i !== index);
                          setFormData({ ...formData, images: newImages });
                        }}
                      >
                        <Text style={styles.removeImageText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                    <Text style={styles.addImageText}>+</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>

            {/* 名称 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>名称 *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="物品名称"
                value={formData.name}
                onChangeText={text => setFormData({ ...formData, name: text })}
              />
            </View>

            {/* 空间 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>空间 *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionList}>
                  {spaces.map(space => (
                    <TouchableOpacity
                      key={space.id}
                      style={[
                        styles.optionChip,
                        formData.spaceId === space.id && styles.optionChipActive,
                      ]}
                      onPress={() => setFormData({ ...formData, spaceId: space.id })}
                    >
                      <View style={styles.optionChipIcon}>
                        {React.createElement(getSpaceIconComponent(space.icon || space.name), { size: 16, color: formData.spaceId === space.id ? '#FFFFFF' : '#000000' })}
                      </View>
                      <Text style={[
                        styles.optionChipText,
                        formData.spaceId === space.id && styles.optionChipTextActive,
                      ]}>
                        {space.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* 分类 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>分类 *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionList}>
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.optionChip,
                        formData.categoryId === category.id && styles.optionChipActive,
                      ]}
                      onPress={() => setFormData({ ...formData, categoryId: category.id })}
                    >
                      <View style={styles.optionChipIcon}>
                        {React.createElement(getCategoryIconComponent(category.icon), { size: 16, color: formData.categoryId === category.id ? '#FFFFFF' : '#000000' })}
                      </View>
                      <Text style={[
                        styles.optionChipText,
                        formData.categoryId === category.id && styles.optionChipTextActive,
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* 数量和单位 */}
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>数量</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="1"
                  value={String(formData.quantity || 1)}
                  onChangeText={text => setFormData({ ...formData, quantity: parseInt(text) || 1 })}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>单位</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="个"
                  value={formData.unit}
                  onChangeText={text => setFormData({ ...formData, unit: text })}
                />
              </View>
            </View>

            {/* 品牌 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>品牌</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="品牌（可选）"
                value={formData.brand}
                onChangeText={text => setFormData({ ...formData, brand: text })}
              />
            </View>

            {/* 价格 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>价格</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="价格（可选）"
                value={formData.price !== undefined ? String(formData.price) : ''}
                onChangeText={text => setFormData({ ...formData, price: text ? parseFloat(text) : undefined })}
                keyboardType="decimal-pad"
              />
            </View>

            {/* 保质期 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>保质期</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="YYYY-MM-DD（可选）"
                value={formData.expiryDate}
                onChangeText={text => setFormData({ ...formData, expiryDate: text })}
              />
            </View>

            {/* 标签 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>标签</Text>
              <View style={styles.tagSelection}>
                {tags.map(tag => (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.tagOption,
                      formData.tags?.includes(tag.name) && styles.tagOptionActive,
                    ]}
                    onPress={() => {
                      const currentTags = formData.tags || [];
                      const newTags = currentTags.includes(tag.name)
                        ? currentTags.filter(t => t !== tag.name)
                        : [...currentTags, tag.name];
                      setFormData({ ...formData, tags: newTags });
                    }}
                  >
                    <Text style={[
                      styles.tagOptionText,
                      formData.tags?.includes(tag.name) && styles.tagOptionTextActive,
                    ]}>
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 备注 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>备注</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputMultiline]}
                placeholder="备注（可选）"
                value={formData.note}
                onChangeText={text => setFormData({ ...formData, note: text })}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => { setShowAddModal(false); setEditingItem(null); resetForm(); }}
              >
                <Text style={styles.modalButtonCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={handleSaveItem}>
                <Text style={styles.modalButtonConfirmText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  // 渲染添加空间模态框
  const renderSpaceModal = () => (
    <Modal
      visible={showSpaceModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSpaceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>添加空间</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>名称 *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="空间名称"
              value={spaceForm.name}
              onChangeText={text => setSpaceForm({ ...spaceForm, name: text })}
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>父级空间</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.optionList}>
                <TouchableOpacity
                  style={[
                    styles.optionChip,
                    spaceForm.parentId === null && styles.optionChipActive,
                  ]}
                  onPress={() => setSpaceForm({ ...spaceForm, parentId: null })}
                >
                  <Text style={[
                    styles.optionChipText,
                    spaceForm.parentId === null && styles.optionChipTextActive,
                  ]}>
                    根目录
                  </Text>
                </TouchableOpacity>
                {spaces.map(space => (
                  <TouchableOpacity
                    key={space.id}
                    style={[
                      styles.optionChip,
                      spaceForm.parentId === space.id && styles.optionChipActive,
                    ]}
                    onPress={() => setSpaceForm({ ...spaceForm, parentId: space.id })}
                  >
                    <Text style={[
                      styles.optionChipText,
                      spaceForm.parentId === space.id && styles.optionChipTextActive,
                    ]}>
                      {space.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>备注</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              placeholder="备注（可选）"
              value={spaceForm.note}
              onChangeText={text => setSpaceForm({ ...spaceForm, note: text })}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalButtonCancel}
              onPress={() => setShowSpaceModal(false)}
            >
              <Text style={styles.modalButtonCancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButtonConfirm} onPress={handleCreateSpace}>
              <Text style={styles.modalButtonConfirmText}>添加</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // 渲染分类管理模态框
  const renderCategoryModal = () => {
    const colorOptions = ['#FF6B6B', '#F38181', '#FCBAD3', '#AA96DA', '#4ECDC4', '#95E1D3', '#FFE66D', '#FF8B94', '#C7CEEA', '#B4A7D6', '#A8D8EA', '#CCCCCC'];
    const iconOptions = ['clothing', 'food', 'beauty', 'medicine', 'electronics', 'books', 'homeGoods', 'sports', 'toys', 'collections', 'tools', 'package'];

    return (
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingCategory ? '编辑分类' : '添加分类'}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>名称 *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="分类名称"
                value={categoryForm.name}
                onChangeText={text => setCategoryForm({ ...categoryForm, name: text })}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>图标</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionList}>
                  {iconOptions.map(icon => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconOption,
                        categoryForm.icon === icon && styles.iconOptionActive,
                      ]}
                      onPress={() => setCategoryForm({ ...categoryForm, icon })}
                    >
                      {React.createElement(getCategoryIconComponent(icon), { size: 24, color: categoryForm.color })}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>颜色</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionList}>
                  {colorOptions.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        categoryForm.color === color && styles.colorOptionActive,
                      ]}
                      onPress={() => setCategoryForm({ ...categoryForm, color })}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => { setShowCategoryModal(false); setEditingCategory(null); }}
              >
                <Text style={styles.modalButtonCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={handleSaveCategory}>
                <Text style={styles.modalButtonConfirmText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // 渲染标签管理模态框
  const renderTagModal = () => {
    const colorOptions = ['#DC2626', '#2563EB', '#059669', '#737373', '#000000', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#65A30D'];

    return (
      <Modal
        visible={showTagModal}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowTagModal(false); setEditingTag(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingTag ? '编辑标签' : '添加标签'}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>名称 *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="标签名称"
                value={tagForm.name}
                onChangeText={text => setTagForm({ ...tagForm, name: text })}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>颜色</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionList}>
                  {colorOptions.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        tagForm.color === color && styles.colorOptionActive,
                      ]}
                      onPress={() => setTagForm({ ...tagForm, color })}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => { setShowTagModal(false); setEditingTag(null); }}
              >
                <Text style={styles.modalButtonCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={handleSaveTag}>
                <Text style={styles.modalButtonConfirmText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // 渲染物品详情模态框
  const renderItemDetailModal = () => {
    if (!showItemDetail) return null;
    const category = getCategory(showItemDetail.categoryId);
    const space = spaces.find(s => s.id === showItemDetail.spaceId);
    const daysUntilExpiry = showItemDetail.expiryDate ? getDaysUntilExpiry(showItemDetail.expiryDate) : null;
    
    return (
      <Modal
        visible={!!showItemDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowItemDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <View style={styles.detailModalHeader}>
                <TouchableOpacity onPress={() => setShowItemDetail(null)}>
                  <Text style={styles.backButton}>← 返回</Text>
                </TouchableOpacity>
                <View style={styles.detailModalActions}>
                  <TouchableOpacity onPress={() => handleEditItem(showItemDetail)}>
                    <Text style={styles.actionButton}>编辑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteItem(showItemDetail)}>
                    <Text style={[styles.actionButton, styles.actionButtonDanger]}>删除</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 图片轮播 */}
              {showItemDetail.images && showItemDetail.images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.detailImageScroll}>
                  {showItemDetail.images.map((uri, index) => (
                    <Image key={index} source={{ uri }} style={styles.detailImage} />
                  ))}
                </ScrollView>
              )}

              <Text style={styles.detailItemName}>{showItemDetail.name}</Text>
              
              <View style={styles.detailItemMeta}>
                <Text style={styles.detailItemCategory}>{category?.name}</Text>
                <Text style={styles.detailItemDot}>·</Text>
                <View style={styles.detailItemSpace}>
                  {React.createElement(getSpaceIconComponent(space?.icon || space?.name || ''), { size: 16, color: '#000000' })}
                  <Text style={styles.detailItemSpaceText}>{space?.name}</Text>
                </View>
              </View>

              {daysUntilExpiry !== null && (
                <View style={[
                  styles.expiryBadge,
                  daysUntilExpiry <= 0 ? styles.expiryBadgeExpired : 
                  daysUntilExpiry <= 7 ? styles.expiryBadgeWarning : styles.expiryBadgeNormal
                ]}>
                  <Text style={styles.expiryBadgeText}>
                    {daysUntilExpiry < 0 ? `已过期 ${Math.abs(daysUntilExpiry)} 天` :
                     daysUntilExpiry === 0 ? '今天过期' :
                     `还有 ${daysUntilExpiry} 天过期`}
                  </Text>
                </View>
              )}

              <View style={styles.detailInfoSection}>
                <Text style={styles.detailSectionTitle}>基本信息</Text>
                <View style={styles.detailInfoGrid}>
                  <View style={styles.detailInfoItem}>
                    <Text style={styles.detailInfoLabel}>数量</Text>
                    <Text style={styles.detailInfoValue}>{showItemDetail.quantity} {showItemDetail.unit || '个'}</Text>
                  </View>
                  {showItemDetail.brand && (
                    <View style={styles.detailInfoItem}>
                      <Text style={styles.detailInfoLabel}>品牌</Text>
                      <Text style={styles.detailInfoValue}>{showItemDetail.brand}</Text>
                    </View>
                  )}
                  {showItemDetail.model && (
                    <View style={styles.detailInfoItem}>
                      <Text style={styles.detailInfoLabel}>型号</Text>
                      <Text style={styles.detailInfoValue}>{showItemDetail.model}</Text>
                    </View>
                  )}
                  {showItemDetail.price !== undefined && (
                    <View style={styles.detailInfoItem}>
                      <Text style={styles.detailInfoLabel}>价格</Text>
                      <Text style={styles.detailInfoValue}>¥{showItemDetail.price.toLocaleString()}</Text>
                    </View>
                  )}
                  {showItemDetail.purchaseDate && (
                    <View style={styles.detailInfoItem}>
                      <Text style={styles.detailInfoLabel}>购买日期</Text>
                      <Text style={styles.detailInfoValue}>{formatDate(showItemDetail.purchaseDate)}</Text>
                    </View>
                  )}
                  {showItemDetail.expiryDate && (
                    <View style={styles.detailInfoItem}>
                      <Text style={styles.detailInfoLabel}>保质期</Text>
                      <Text style={styles.detailInfoValue}>{formatDate(showItemDetail.expiryDate)}</Text>
                    </View>
                  )}
                </View>
              </View>

              {showItemDetail.tags.length > 0 && (
                <View style={styles.detailInfoSection}>
                  <Text style={styles.detailSectionTitle}>标签</Text>
                  <View style={styles.detailTags}>
                    {showItemDetail.tags.map((tag, index) => (
                      <View key={index} style={styles.detailTag}>
                        <Text style={styles.detailTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {showItemDetail.note && (
                <View style={styles.detailInfoSection}>
                  <Text style={styles.detailSectionTitle}>备注</Text>
                  <Text style={styles.detailNote}>{showItemDetail.note}</Text>
                </View>
              )}

              <View style={styles.detailInfoSection}>
                <Text style={styles.detailInfoLabel}>添加时间</Text>
                <Text style={styles.detailInfoValue}>{formatDate(showItemDetail.createdAt)}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* 头部 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {currentView === 'home' ? (
            <>
              <Text style={styles.headerTitle}>收纳</Text>
              <Text style={styles.headerSubtitle}>管理你的物品</Text>
            </>
          ) : (
            <TouchableOpacity onPress={() => setCurrentView('home')}>
              <Text style={styles.backButton}>← 返回</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.headerActions}>
          {/* 搜索按钮 */}
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => {
              if (currentView === 'search') {
                setCurrentView('home');
                setSearchKeyword('');
              } else {
                setCurrentView('search');
              }
            }}
          >
            {React.createElement(currentView === 'search' ? CloseIcon : SearchIcon, { size: 20, color: '#000000' })}
          </TouchableOpacity>
          
          {/* 统计按钮 */}
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setCurrentView(currentView === 'stats' ? 'home' : 'stats')}
          >
            {React.createElement(currentView === 'stats' ? CloseIcon : ChartIcon, { size: 20, color: '#000000' })}
          </TouchableOpacity>
          
          {/* 添加按钮 */}
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              resetForm();
              setEditingItem(null);
              setShowAddModal(true);
            }}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 搜索栏 */}
      {currentView === 'search' && (
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索物品名称、品牌..."
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            autoFocus
          />
        </View>
      )}

      {/* 主内容 */}
      <View style={styles.content}>
        {currentView === 'home' && renderHome()}
        {currentView === 'space' && renderSpaceDetail()}
        {currentView === 'category' && renderCategoryDetail()}
        {currentView === 'search' && renderSearchResults()}
        {currentView === 'stats' && renderStats()}
        {currentView === 'categoryManage' && renderCategoryManage()}
        {currentView === 'tagManage' && renderTagManage()}
        {currentView === 'expiring' && renderExpiringList()}
      </View>

      {/* 模态框 */}
      {renderAddModal()}
      {renderSpaceModal()}
      {renderCategoryModal()}
      {renderTagModal()}
      {renderItemDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 18,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.background,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
  searchBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
  },
  content: {
    flex: 1,
  },
  
  // 统计卡片
  statsCard: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  statAlert: {
    color: Colors.error,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  
  // 区块
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  sectionAction: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  
  // 空间列表
  spaceList: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    overflow: 'hidden',
  },
  spaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  spaceIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  spaceInfo: {
    flex: 1,
  },
  spaceName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  spaceCount: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  spaceArrow: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  
  // 分类
categorySection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  categoryList: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryChip: {
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    minWidth: 70,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  categoryCount: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  
  // 物品列表
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  itemImagePlaceholder: {
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImagePlaceholderText: {
    fontSize: 24,
  },
  itemMain: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  itemDot: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 6,
  },
  itemLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  itemPrice: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  itemTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.background,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  expiryWarning: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  expiryWarningText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
  },

  // 左滑操作
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  swipeAction: {
    width: 70,
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginLeft: 8,
  },
  swipeActionEdit: {
    backgroundColor: Colors.primary,
  },
  swipeActionDelete: {
    backgroundColor: Colors.error,
  },
  swipeActionText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // 空状态
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  
  // 详情页
  detailContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButton: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  breadcrumb: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  childSpacesSection: {
    marginBottom: 20,
  },
  childSpacesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  childSpaceCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  childSpaceIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  childSpaceName: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  childSpaceCount: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  searchResultText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  
  // 分布统计
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distributionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  distributionIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  distributionName: {
    fontSize: 13,
    color: Colors.text,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray[100],
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    borderRadius: 4,
  },
  distributionCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    width: 30,
    textAlign: 'right',
  },
  
  // 模态框
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    marginTop: 60,
    minHeight: 600,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    color: Colors.text,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  modalInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    color: Colors.text,
  },
  modalInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  optionList: {
    flexDirection: 'row',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionChipIcon: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  optionChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  optionChipTextActive: {
    color: Colors.background,
  },
  tagSelection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagOptionText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  tagOptionTextActive: {
    color: Colors.background,
  },
  imageList: {
    flexDirection: 'row',
    gap: 10,
  },
  selectedImage: {
    position: 'relative',
  },
  selectedImageThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.gray[50],
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 32,
    color: Colors.textMuted,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 24,
  },
  modalButtonCancel: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalButtonCancelText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalButtonConfirm: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  modalButtonConfirmText: {
    fontSize: 16,
    color: Colors.background,
    fontWeight: '500',
  },
  
  // 详情模态框
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailModalActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
  },
  actionButtonDanger: {
    color: Colors.error,
  },
  detailImageScroll: {
    marginHorizontal: -24,
    marginBottom: 20,
  },
  detailImage: {
    width: 280,
    height: 200,
    borderRadius: 16,
    marginLeft: 24,
  },
  detailItemName: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  detailItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailItemCategory: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailItemDot: {
    fontSize: 14,
    color: Colors.textMuted,
    marginHorizontal: 8,
  },
  detailItemSpace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailItemSpaceText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  expiryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  expiryBadgeExpired: {
    backgroundColor: '#FEE2E2',
  },
  expiryBadgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  expiryBadgeNormal: {
    backgroundColor: '#D1FAE5',
  },
  expiryBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailInfoSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  detailInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailInfoItem: {
    width: '45%',
  },
  detailInfoLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  detailInfoValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  detailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.gray[100],
    borderRadius: 6,
  },
  detailTagText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  detailNote: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },

  // 管理卡片
  manageGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  manageCard: {
    flex: 1,
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  manageCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  manageCardIconText: {
    fontSize: 24,
    fontWeight: '600',
  },
  manageCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  manageCardCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },

  // 管理列表项
  manageItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  manageItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  manageItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  manageItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  manageItemCount: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  manageItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  manageItemButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.background,
    borderRadius: 6,
  },
  manageItemButtonDanger: {
    backgroundColor: '#FEE2E2',
  },
  manageItemButtonText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  manageItemButtonTextDanger: {
    color: Colors.error,
  },

  // 图标和颜色选项
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionActive: {
    borderColor: Colors.text,
    transform: [{ scale: 1.1 }],
  },

  // 过期预警
  expiringSummary: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  expiringSummaryItem: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  expiringSummaryNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  expiringSummaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  expiringItemCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  expiringItemCardExpired: {
    borderLeftColor: '#DC2626',
  },
  expiringItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  expiringItemInfo: {
    flex: 1,
  },
  expiringItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  expiringItemMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  expiringBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  expiringBadgeExpired: {
    backgroundColor: '#FEE2E2',
  },
  expiringBadgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  expiringBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  expiringItemDate: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
