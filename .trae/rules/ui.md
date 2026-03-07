# UI 设计规范

> 基于 MONO 应用现有代码抽象的设计规范
> **重要**: 进行任何 UI 设计或开发时，必须先调用相关 Skills 指导设计过程

## 🎯 设计流程规范 (强制)

### 任何 UI 工作前必须执行：

1. **设计新界面/组件前**

   - 调用 `frontend-design` Skill - 获取设计指导
   - 调用 `ui-ux-pro-max` Skill - 获取设计系统建议
   - 参考本规范的颜色、间距、组件规范
2. **设计 Logo/图标/视觉资产前**

   - 调用 `canvas-design` Skill - 获取视觉设计指导
   - 遵循黑白极简风格
   - 确保可扩展性（16px - 1600px）
3. **添加交互动画前**

   - 调用 `interaction-design` Skill - 获取动画规范
   - 参考本规范的动画时长和缓动函数
4. **React 组件开发前**

   - 调用 `react-best-practices` Skill - 获取性能优化建议
   - 调用 `composition-patterns` Skill - 获取组件架构指导
   - 遵循本规范的组件规范
5. **代码审查时**

   - 调用 `web-design-guidelines` Skill - 检查设计合规性
   - 对照本规范的禁止事项检查

---

## 设计原则

### 1. 黑白极简风格 (已实施 ✅)

- **主色调**: 纯黑 (#000000) + 纯白 (#FFFFFF)
- **灰度系统** (来自 `colors.ts`):
  - 50: #FAFAFA (最浅背景)
  - 100: #F5F5F5 (hover背景)
  - 200: #E5E5E5 (分割线、边框)
  - 300: #D4D4D4
  - 400: #A3A3A3 (未选中状态)
  - 500: #737373 (次要文字)
  - 600: #525252
  - 700: #404040
  - 800: #262626
  - 900: #171717

### 2. 图标系统 (已实施 ✅)

- **风格**: 极简线条图标，统一 24x24px
- **实现**: 使用 `react-native-svg` 自定义 SVG 图标
- **颜色**: 默认黑色，支持传入 color 属性
- **无 emoji**: 所有图标使用 SVG 实现
- **生成新图标**: 使用 `canvas-design` Skill

### 3. 底部导航设计 (已实施 ✅)

- **高度**: 90px (含安全区域)
- **图标**: 32x32px 容器，20x20px 图标
- **选中状态**: 黑色背景 + 白色图标
- **未选中**: 透明背景 + 灰色图标
- **标签**: 12px，选中黑色/未选中灰色

### 4. 手势操作

- **触摸目标**: 最小 44x44px (符合现有实现)
- **滑动操作**:
  - 左滑删除 (已实现于习惯列表)
  - 下拉刷新
- **长按**: 弹出操作菜单
- **手势反馈**:
  - 按下: opacity 0.7 或背景色变化
  - 过渡动画: 150ms ease-out
- **设计手势**: 调用 `interaction-design` Skill

### 5. 数据可视化

- **热力图颜色** (来自 `HeatmapColors`):
  - #F5F5F5 (0次)
  - #D4D4D4 (1次)
  - #737373 (2次)
  - #404040 (3次)
  - #000000 (4+次)
- **图表风格**: 极简线条，单色填充
- **习惯颜色**: 支持9种预设颜色，默认黑白灰

---

## 组件规范

### 按钮

```typescript
// 主按钮
{
  backgroundColor: Colors.primary, // #000000
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 8,
  minHeight: 44,
}

// 次按钮
{
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: Colors.primary,
  borderRadius: 8,
}

// 文字按钮
{
  backgroundColor: 'transparent',
  // hover 时显示下划线
}
```

### 卡片

```typescript
{
  backgroundColor: Colors.background, // #FFFFFF
  borderWidth: 1,
  borderColor: Colors.border, // #E5E5E5
  borderRadius: 8,
  padding: 16,
}
```

### 输入框

#### 基础样式

```typescript
{
  backgroundColor: Colors.background,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 8,
  height: 44,
  paddingHorizontal: 16,
  // focus: borderColor = Colors.primary
}
```

#### Android 文字显示修复 (重要 ⚠️)

Android 系统上的 TextInput 默认会包含额外的字体内边距，导致文字被裁剪。必须在所有 TextInput 样式中添加以下修复：

```typescript
// 单行输入框
inputStyle: {
  fontSize: FontSizes.lg,
  color: '#000000',
  // Android 增加高度避免文字裁剪
  height: Platform.OS === 'android' ? 48 : 44,
  ...(Platform.OS === 'android' && {
    includeFontPadding: false,    // 移除默认字体内边距
    textAlignVertical: 'center',  // 垂直居中
    paddingVertical: 0,           // 重置内边距
  }),
},

// 多行输入框
multilineInput: {
  fontSize: FontSizes.lg,
  minHeight: 100,
  textAlignVertical: 'top',
  ...(Platform.OS === 'android' && {
    includeFontPadding: false,
    paddingTop: 12,
    paddingBottom: 12,
  }),
}
```

**关键要点：**

1. `includeFontPadding: false` - 必须设置，移除 Android 默认字体内边距
2. `textAlignVertical` - 单行用 'center'，多行用 'top'
3. `paddingVertical: 0` - 重置内边距，让 height 控制文字位置
4. 增加 `height` - Android 上适当增加输入框高度（如 44→48）
5. **不要设置 lineHeight** - 在 Android 上可能导致文字渲染问题

**辅助函数**（推荐）：

```typescript
// src/utils/platformStyles.ts
export const getAndroidInputStyle = () => {
  if (Platform.OS !== 'android') return {};
  return {
    includeFontPadding: false,
    textAlignVertical: 'center',
    paddingVertical: 0,
  };
};

// 使用
<TextInput
  style={[styles.input, Platform.OS === 'android' && getAndroidInputStyle()]}
/>
```

### 列表项

```typescript
{
  minHeight: 56,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
  // hover: backgroundColor = Colors.gray[100]
  // 选中: backgroundColor = Colors.primary, color = #FFFFFF
}
```

---

## 交互动画

### 页面过渡

- **类型**: 从右向左滑入
- **时长**: 300ms
- **缓动**: ease-out
- **设计动画**: 调用 `interaction-design` Skill

### 元素动画

- **列表加载**: 从上到下依次淡入，间隔 50ms
- **按钮点击**: scale(0.98), 100ms
- **卡片展开**: height 动画, 300ms ease-out
- **数据更新**: 数字滚动动画

### 加载状态

- **骨架屏**: 灰色脉冲 (#E5E5E5 → #F5F5F5)
- **加载图标**: 极简旋转线条
- **无数据**: 空状态插画 (黑白线条风格)

---

## Skills 使用指南

### 已安装的 Skills

| Skill                     | 用途           | 调用时机            |
| ------------------------- | -------------- | ------------------- |
| `frontend-design`       | 前端界面设计   | 设计新页面/组件     |
| `ui-ux-pro-max`         | UI/UX 设计系统 | 需要设计系统建议    |
| `interaction-design`    | 交互动画设计   | 添加动画/手势       |
| `canvas-design`         | 视觉设计/Logo  | 设计 Logo/图标/海报 |
| `react-best-practices`  | React 最佳实践 | 组件开发/性能优化   |
| `composition-patterns`  | 组件架构模式   | 设计组件 API        |
| `web-design-guidelines` | 设计规范审查   | 代码审查时          |

### 使用示例

**设计新页面时：**

```
用户: "帮我设计一个统计页面"
→ 调用 frontend-design Skill
→ 调用 ui-ux-pro-max Skill  
→ 结合本规范进行设计
→ 输出设计代码
```

**设计 Logo 时：**

```
用户: "设计一个 App Logo"
→ 调用 canvas-design Skill
→ 遵循黑白极简风格
→ 生成 SVG/PNG 设计
```

**开发组件时：**

```
用户: "创建一个按钮组件"
→ 调用 react-best-practices Skill
→ 调用 composition-patterns Skill
→ 按照本规范样式实现
```

---

## 响应式设计

### 断点

```typescript
// 移动端优先
const breakpoints = {
  mobile: '< 768px',    // 默认
  tablet: '768px - 1024px',
  desktop: '> 1024px',
};
```

### 布局原则

- 使用 Flexbox 布局
- 列表单列显示
- 卡片全宽或双列网格

---

## 无障碍设计

- **对比度**: 文字与背景至少 4.5:1
- **焦点状态**: 2px outline #000000
- **减少动画**: 支持 prefers-reduced-motion
- **屏幕阅读器**: 所有图标添加 aria-label

---

## 开发规范

### 文件命名

```
组件: PascalCase (Button.tsx, DataCard.tsx)
样式: camelCase (buttonStyles.ts, theme.ts)
页面: PascalCase + Screen (HabitScreen.tsx)
工具: camelCase (formatDate.ts)
```

### 颜色使用

```typescript
// 始终使用 Colors 常量
import { Colors } from '../constants/colors';

// 主色
Colors.primary      // #000000
Colors.background   // #FFFFFF
Colors.text         // #000000
Colors.textSecondary // #737373
Colors.border       // #E5E5E5

// 灰度
Colors.gray[100]    // #F5F5F5
Colors.gray[500]    // #737373
```

### 图标使用

```typescript
// 使用自定义 SVG 图标
import { CheckIcon, StarIcon } from '../components/Icons';

<CheckIcon size={24} color={Colors.primary} />
```

---

## 开发优先级

1. ✅ **已完成**: 颜色系统、图标系统、底部导航
2. 🔄 **进行中**: 手势操作优化、数据可视化
3. ⏳ **待处理**:
   - 统一所有页面的卡片样式
   - 优化列表动画
   - 完善空状态设计
   - 添加页面过渡动画

---

## 禁止事项

- ❌ 不使用 emoji (已遵守 ✅)
- ❌ 不使用彩色渐变
- ❌ 不使用复杂阴影
- ❌ 不使用圆角大于 12px
- ❌ 不使用超过 3 种字体大小

## 参考实现

- **颜色定义**: `src/constants/colors.ts`
- **图标组件**: `src/components/Icons.tsx`
- **底部导航**: `src/navigation/BottomTabs.tsx`
- **习惯页面**: `src/screens/HabitScreen.tsx` (手势操作参考)
- **Skills 目录**: `.trae/skills/`
