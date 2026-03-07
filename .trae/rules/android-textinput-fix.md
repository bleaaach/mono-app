# Android TextInput 文字显示修复指南

## 问题描述
Android 系统上的 TextInput 组件默认会包含额外的字体内边距（font padding），导致文字被裁剪，需要手动拖拽才能完整显示。特别是在输入时，文字显示不完整。

## 解决方案

### 1. 使用平台专用样式工具

创建 `src/utils/platformStyles.ts`：

```typescript
import { Platform } from 'react-native';

/**
 * 获取 Android 平台专用的 TextInput 样式
 * 解决 Android 上 TextInput 文字显示不全的问题
 */
export const getAndroidInputStyle = () => {
  if (Platform.OS !== 'android') {
    return {};
  }

  return {
    // 移除 Android 默认的字体内边距
    includeFontPadding: false,
    // 垂直居中对齐
    textAlignVertical: 'center',
    // 重置内边距，让高度控制文字位置
    paddingVertical: 0,
  };
};

/**
 * Android 专用的多行输入框样式
 */
export const getAndroidMultilineInputStyle = () => {
  if (Platform.OS !== 'android') {
    return {};
  }

  return {
    includeFontPadding: false,
    textAlignVertical: 'top',
    paddingTop: 12,
    paddingBottom: 12,
  };
};
```

### 2. 样式定义中的修复

对于每个 TextInput 样式，添加 Android 专用修复：

```typescript
// 单行输入框样式示例
inputStyle: {
  fontSize: FontSizes.lg,
  color: '#000000',
  // Android 增加高度避免文字裁剪
  height: Platform.OS === 'android' ? 48 : 44,
  ...(Platform.OS === 'android' && {
    includeFontPadding: false,
    textAlignVertical: 'center',
    paddingVertical: 0,
  }),
},

// 多行输入框样式示例
multilineInput: {
  fontSize: FontSizes.lg,
  minHeight: 100,
  textAlignVertical: 'top',
  ...(Platform.OS === 'android' && {
    includeFontPadding: false,
    paddingTop: 12,
    paddingBottom: 12,
  }),
},
```

### 3. 使用辅助函数

在 TextInput 组件中使用：

```typescript
import { getAndroidInputStyle } from '../utils/platformStyles';

<TextInput
  style={[styles.input, Platform.OS === 'android' && getAndroidInputStyle()]}
  // ...其他属性
/>
```

## 关键要点

1. **includeFontPadding: false** - 必须设置，移除 Android 默认的字体内边距
2. **textAlignVertical** - 单行用 'center'，多行用 'top'
3. **paddingVertical: 0** - 重置内边距，让 height 控制文字位置
4. **增加 height** - Android 上适当增加输入框高度（如 44→48）
5. **不要设置 lineHeight** - 在 Android 上可能导致文字渲染问题

## 已修复的文件清单

- [x] DiaryScreen.tsx - searchInput, modalInput, jumpInput
- [x] HabitScreen.tsx - modalInput, intervalInput, targetValueInput, checkinNoteInput
- [x] TodoScreen.tsx - modalInput
- [x] TimeScreen.tsx - modalInput
- [x] InventoryScreen.tsx - searchInput, modalInput
- [x] LogEntryFormScreen.tsx - textInput, multilineInput, tagInput
- [x] SettingsScreen.tsx - importInput
- [x] ShareScreen.tsx - captionInput
- [x] LifeLogEntriesScreen.tsx - input, textArea
- [x] LogEntryListScreen.tsx - searchInput

## 测试验证

修复后需要在 Android 设备上测试：
1. 输入框初始显示时文字完整
2. 输入文字时文字不裁剪
3. 多行输入框自动高度调整正常
4. 数字输入框（如习惯频率、目标值）显示正常
