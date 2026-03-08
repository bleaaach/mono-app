## 问题
Android 上 Modal 窗口中的输入框，当键盘弹出时，Modal 会被键盘遮挡，用户看不见窗口内容。

## 解决方案
使用 `KeyboardAvoidingView` 组件包裹 Modal 内容，让 Modal 随键盘自动上移。

## 需要修改的文件

### 1. TodoScreen.tsx
- 导入 `KeyboardAvoidingView`
- 在"新建任务" Modal 中添加 `KeyboardAvoidingView` 包裹

### 2. HabitScreen.tsx
- 导入 `KeyboardAvoidingView`
- 在以下 Modal 中添加包裹：
  - 新建/编辑习惯 Modal
  - 补打卡 Modal
  - 打卡备注 Modal
  - 删除确认 Modal
  - 补打卡备注 Modal
  - 习惯详情 Modal
  - 分类管理 Modal

### 3. 其他屏幕（如有需要）
- InventoryScreen.tsx
- TimeScreen.tsx
- SettingsScreen.tsx
- 等其他包含输入框 Modal 的屏幕

## 实现方式
参考 DiaryScreen.tsx 的实现：
```typescript
<Modal ...>
  <KeyboardAvoidingView 
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  >
    <View style={styles.modalOverlay}>
      {/* Modal 内容 */}
    </View>
  </KeyboardAvoidingView>
</Modal>
```

## 验证方式
在 Android 设备上测试：
1. 打开任意 Modal（如新建任务）
2. 点击输入框
3. 键盘弹出时，Modal 应该自动上移到键盘上方