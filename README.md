# MONO App - React Native

一款极简风格的生产力应用，复刻自 HTML 版本的 MONO — 专注当下。

## 功能模块

### 1. 待办 (Todo)
- Things 风格的待办管理
- 四个分类：今天 / 计划 / 随时 / 某天
- 快速添加待办事项
- 完成状态切换
- 已完成任务折叠展示

### 2. 习惯 (Habit)
- 概览页：统计数据卡片、年度热力图、今日待完成
- 习惯列表：展示所有习惯及本周打卡情况
- 洞察页：最佳习惯、习惯对比、周期性分析
- 支持添加自定义习惯

### 3. 日记 (Diary)
- 记录每日心情和想法
- 五种心情选择：开心、兴奋、平静、疲惫、难过
- 按日期展示日记列表
- 支持删除日记

### 4. 收纳 (Inventory)
- 物品管理功能
- 分类筛选：电子产品、衣物、书籍、食品、药品、其他
- 记录物品名称、分类、位置、数量、备注
- 数量增减控制

### 5. 时间 (Time)
- 时间追踪功能
- 实时计时器
- 活动分类统计（工作、学习、运动、休息、娱乐）
- 今日时间分配可视化

## 技术栈

- **React Native** - 跨平台移动应用框架
- **Expo** - React Native 开发工具链
- **TypeScript** - 类型安全的 JavaScript
- **React Navigation** - 导航管理
- **AsyncStorage** - 本地数据持久化
- **date-fns** - 日期处理库

## 项目结构

```
mono-app/
├── src/
│   ├── components/     # 可复用组件
│   ├── screens/        # 页面组件
│   │   ├── TodoScreen.tsx
│   │   ├── HabitScreen.tsx
│   │   ├── DiaryScreen.tsx
│   │   ├── InventoryScreen.tsx
│   │   └── TimeScreen.tsx
│   ├── navigation/     # 导航配置
│   │   ├── AppNavigator.tsx
│   │   └── BottomTabs.tsx
│   ├── hooks/          # 自定义 Hooks
│   ├── types/          # TypeScript 类型定义
│   ├── utils/          # 工具函数
│   │   ├── storage.ts  # 本地存储
│   │   └── date.ts     # 日期处理
│   └── constants/      # 常量定义
│       └── colors.ts   # 配色方案
├── App.tsx             # 应用入口
└── package.json
```

## 设计特点

- **极简黑白风格** - 采用黑白灰配色，简约优雅
- **原生体验** - 底部标签导航，符合移动端交互习惯
- **数据持久化** - 使用 AsyncStorage 本地存储数据
- **响应式布局** - 适配不同屏幕尺寸
- **流畅动画** - 使用 React Native 内置动画

## 运行项目

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 运行 Android
npm run android

# 运行 iOS (需要 macOS)
pm run ios

# 运行 Web 版本
npm run web
```

## 与原版的差异

| 特性 | HTML 版本 | React Native 版本 |
|------|-----------|-------------------|
| 平台 | Web 浏览器 | iOS / Android |
| 导航 | 侧边栏 | 底部标签栏 |
| 存储 | LocalStorage | AsyncStorage |
| 布局 | 响应式 Web | 移动端原生布局 |
| 交互 | 鼠标/键盘 | 触摸手势 |

## 未来优化方向

- [ ] 添加数据同步功能（云备份）
- [ ] 支持习惯提醒通知
- [ ] 添加图表数据可视化
- [ ] 支持暗黑模式
- [ ] 添加数据导出功能
- [ ] 支持多语言

## License

MIT
