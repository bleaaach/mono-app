# 修复 TextInput Web 渲染问题

## 问题分析
在 Web 浏览器上，所有 TextInput 组件初始渲染时文字显示不全，需要手动拖拽才能看清完整文字。这是 React Native Web 的已知问题 - TextInput 的初始高度计算不正确。

## 解决方案

### 1. 创建 Web 平台专用样式文件
**文件**: `src/utils/platformStyles.ts`
- 导出 `getWebInputStyle()` 函数
- 返回 Web 专用的 TextInput 样式：
  ```typescript
  {
    minHeight: 44,  // 确保最小高度
    paddingTop: 10,
    paddingBottom: 10,
    lineHeight: scaleFont(20),  // 明确设置行高
  }
  ```

### 2. 修复所有 TextInput 组件
为以下屏幕的所有 TextInput 添加 Web 平台检测：

**需要修复的文件**:
- `DiaryScreen.tsx` - 搜索框、编辑器、标签输入、心情输入等
- `HabitScreen.tsx` - 习惯输入框
- `TodoScreen.tsx` - 待办输入框
- `TimeScreen.tsx` - 时间输入框
- `InventoryScreen.tsx` - 搜索框和输入框
- `ShareScreen.tsx` - 说明输入框
- `LogTemplateDesignerScreen.tsx` - 模板输入框
- `LogEntryFormScreen.tsx` - 日志输入框
- `LogTemplateHomeScreen.tsx` - 输入框
- `LifeLogHomeScreen.tsx` - 输入框
- `LifeLogEntriesScreen.tsx` - 输入框
- `SettingsScreen.tsx` - 导入输入框

**修复方式**:
```typescript
import { Platform } from 'react-native';
import { getWebInputStyle } from '../utils/platformStyles';

<TextInput
  style={[
    styles.input,
    Platform.OS === 'web' && getWebInputStyle()
  ]}
  // ...其他属性
/>
```

### 3. 添加 lineHeight 到所有输入框样式
更新 `DiaryScreen.tsx` 中的样式定义：
```typescript
modalInput: {
  fontSize: FontSizes.lg,
  lineHeight: scaleFont(26),  // 明确设置行高
  minHeight: 180,
  // ...其他样式
}
```

### 4. 测试验证
- 在浏览器中打开 http://localhost:8081
- 测试所有输入框：
  - ✅ 搜索框文字完整显示
  - ✅ 多行编辑器文字不裁剪
  - ✅ 单行输入框 placeholder 完整显示
  - ✅ 输入文字后高度自动调整

## 预期效果
- Web 端所有 TextInput 初始渲染时文字完整显示
- 不需要手动拖拽调整
- 保持与移动端一致的视觉体验