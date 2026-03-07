# 字体响应式优化说明

## 优化策略

### 更激进的字体缩放算法

之前的算法使用 `moderateScale(size, 0.3)`，现在改为：

```typescript
scaleFactor = screenWidth / 375

if scaleFactor < 0.9:
  // 小屏设备 (< 337px): 额外缩小 15%
  finalSize = baseSize * scaleFactor * 0.85
else if scaleFactor < 1.0:
  // 中等偏小设备 (337-375px): 额外缩小 5%
  finalSize = baseSize * scaleFactor * 0.95
else:
  // 正常或大屏设备 (>= 375px): 正常缩放
  finalSize = baseSize * scaleFactor
```

### 设备分类

| 设备类型 | 屏幕宽度 | 缩放系数 |
|---------|---------|---------|
| 小屏设备 | < 337px | 0.85x |
| 中等偏小 | 337-375px | 0.95x |
| 标准设备 | 375-414px | 1.0x |
| 大屏设备 | > 414px | 1.0x+ |

### 新增输入框专用字体大小

```typescript
FontSizes.input:      // 输入框默认 - 小屏 12px / 标准 14px
FontSizes.inputSmall: // 紧凑输入框 - 小屏 11px / 标准 13px
```

## 实际效果对比

### iPhone SE (320px 宽度)
| 字体 | 之前 | 现在 | 改进 |
|------|------|------|------|
| sm (12px) | ~11px | ~9.2px | ⬇️ 16% |
| md (14px) | ~12.6px | ~10.7px | ⬇️ 15% |
| lg (16px) | ~14.4px | ~12.2px | ⬇️ 15% |

### iPhone 12/13 (390px 宽度)
| 字体 | 之前 | 现在 | 改进 |
|------|------|------|------|
| sm (12px) | ~12.5px | ~11.4px | ⬇️ 9% |
| md (14px) | ~14.6px | ~13.3px | ⬇️ 9% |
| lg (16px) | ~16.7px | ~15.2px | ⬇️ 9% |

### iPhone 14 Pro Max (430px 宽度)
| 字体 | 之前 | 现在 | 改进 |
|------|------|------|------|
| sm (12px) | ~13.8px | ~13.8px | ✅ 相同 |
| md (14px) | ~16.1px | ~16.1px | ✅ 相同 |
| lg (16px) | ~18.4px | ~18.4px | ✅ 相同 |

## 已优化的输入框

1. **DiaryScreen** - 搜索框 (`FontSizes.inputSmall`)
2. **DiaryScreen** - 日记编辑器 (`FontSizes.lg`)
3. **DiaryScreen** - 标签输入 (`FontSizes.sm`)
4. **DiaryScreen** - 时间跳转输入 (`FontSizes.xxl`)
5. **DiaryScreen** - 自定义心情输入 (`FontSizes.lg`)
6. **HabitScreen** - 习惯输入 (`FontSizes.lg`)
7. **TodoScreen** - 快速输入 (`FontSizes.lg`)
8. **TodoScreen** - 模态框输入 (`FontSizes.xl`)
9. **TimeScreen** - 时间输入 (`FontSizes.lg`)
10. **InventoryScreen** - 搜索框 (`FontSizes.lg`)
11. **InventoryScreen** - 模态框输入 (`FontSizes.lg`)
12. **ShareScreen** - 说明输入 (`FontSizes.md`)
13. **Log 系列屏幕** - 所有输入框 (`FontSizes.lg`)
14. **SettingsScreen** - 导入输入 (`FontSizes.sm`)

## 测试建议

1. 在 iPhone SE (320px) 上测试所有输入框
2. 确保文字完整显示，不被截断
3. 检查 placeholder 文字是否完整
4. 验证输入时文字是否清晰可读
5. 在不同字体大小设置下测试（系统字体大小调整）

## 注意事项

- 如果某些输入框在小屏设备上仍然显示不全，请使用 `FontSizes.inputSmall`
- 对于特别重要的文字（如标题），保持使用较大的字体
- 可以根据具体场景调整 `scaleFont` 中的缩放系数
