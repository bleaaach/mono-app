## 问题分析

### 1. 页面切换不流畅的原因
- **导航配置问题**: AppNavigator 和 BottomTabs 使用默认配置，没有自定义转场动画
- **屏幕组件太重**: 每个页面渲染时执行大量计算和过滤
- **缺少原生动画**: Modal 使用 `animationType="slide"` 但没有 `useNativeDriver`

### 2. 当前手势支持情况
- ✅ 已支持: 长按删除（InventoryScreen、HabitScreen）
- ✅ 已支持: 习惯拖拽排序（HabitScreen）
- ❌ 缺失: 列表项左滑操作（编辑/删除）
- ❌ 缺失: 下拉刷新
- ❌ 缺失: 手势返回

---

## 优化方案

### 阶段 1: 导航转场动画优化

**1.1 配置 Native Stack Navigator 动画**
```typescript
// AppNavigator.tsx
<Stack.Navigator 
  screenOptions={{
    headerShown: false,
    animation: 'slide_from_right', // iOS/Android 原生动画
    animationDuration: 200,
    gestureEnabled: true, // 启用手势返回
    gestureDirection: 'horizontal',
  }}
>
```

**1.2 底部 Tab 切换动画**
```typescript
// BottomTabs.tsx
<Tab.Navigator
  screenOptions={{
    tabBarStyle: { 
      // 添加过渡动画
      transform: [{ translateY: animatedValue }]
    }
  }}
>
```

### 阶段 2: 列表手势增强

**2.1 添加左滑操作（Swipeable）**
```typescript
import { Swipeable } from 'react-native-gesture-handler';

<Swipeable
  renderRightActions={() => (
    <View style={styles.swipeActions}>
      <TouchableOpacity onPress={handleEdit}><Text>编辑</Text></TouchableOpacity>
      <TouchableOpacity onPress={handleDelete}><Text>删除</Text></TouchableOpacity>
    </View>
  )}
>
  <ItemCard />
</Swipeable>
```

**2.2 下拉刷新**
```typescript
<FlatList
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
/>
```

**2.3 长按菜单优化**
- 使用 `react-native-reanimated` 实现长按放大效果
- 添加触觉反馈（Haptic Feedback）

### 阶段 3: Modal 动画重构

**3.1 使用 Reanimated 自定义底部弹出 Modal**
```typescript
// 可手势关闭的底部 Sheet
const translateY = useSharedValue(SCREEN_HEIGHT);

const gesture = Gesture.Pan()
  .onUpdate((e) => {
    translateY.value = Math.max(0, e.translationY);
  })
  .onEnd((e) => {
    if (e.translationY > 100) {
      runOnJS(closeModal)();
    } else {
      translateY.value = withSpring(0);
    }
  });
```

### 阶段 4: 性能优化（配合动画流畅）

**4.1 使用 useCallback 包裹所有事件处理**
**4.2 使用 useMemo 缓存计算结果**
**4.3 FlatList 添加优化配置**
```typescript
<FlatList
  getItemLayout={(data, index) => ({ 
    length: ITEM_HEIGHT, 
    offset: ITEM_HEIGHT * index, 
    index 
  })}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
/>
```

---

## 具体实施步骤

### 第一步: 导航动画配置（1-2小时）
1. 修改 AppNavigator.tsx 添加转场动画配置
2. 优化 BottomTabs.tsx 切换效果

### 第二步: InventoryScreen 手势增强（3-4小时）
1. 物品列表添加左滑编辑/删除
2. 空间列表添加长按拖拽排序
3. 添加下拉刷新
4. 优化 Modal 为手势可关闭

### 第三步: 性能优化（2-3小时）
1. 所有页面添加 useCallback/useMemo
2. FlatList 优化配置
3. 减少重渲染

### 第四步: 其他页面同步（2-3小时）
1. HabitScreen 优化
2. TodoScreen 添加手势
3. DiaryScreen 优化

---

## 预期效果

- 页面切换: 原生级流畅度（60fps）
- 手势响应: 即时反馈，无延迟
- 列表滚动: 流畅无卡顿
- Modal: 可手势关闭，自然交互

是否开始实施？建议先从导航配置开始。