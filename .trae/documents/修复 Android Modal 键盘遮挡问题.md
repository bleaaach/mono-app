## 问题

Android 上 Modal 窗口中的输入框，当键盘弹出时，Modal 会被键盘遮挡，用户看不见窗口内容。

## 原因分析

1. **TodoScreen.tsx 的 Modal 缺少 KeyboardAvoidingView**
   - 当前代码使用手动动画 (`modalTranslateY`) 来响应键盘高度变化
   - 这种方式在 Android 上不可靠，Modal 内容仍然会被键盘遮挡

2. **对比 HabitScreen.tsx 的正确实现**
   - HabitScreen 使用了 `KeyboardAvoidingView` 包裹 Modal 内容
   - 这是 React Native 处理键盘遮挡的标准方案

## 修复方案

将 TodoScreen.tsx 中的 Modal 修改为使用 `KeyboardAvoidingView` 包裹：

```tsx
<Modal
  visible={showAddModal}
  transparent
  animationType="slide"
  onRequestClose={() => setShowAddModal(false)}
>
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

同时可以移除原有的手动键盘监听动画逻辑（`modalTranslateY` 相关代码），因为 `KeyboardAvoidingView` 会自动处理。

## 需要修改的文件

- `src/screens/TodoScreen.tsx`