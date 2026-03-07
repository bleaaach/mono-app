import { Platform, TextStyle } from 'react-native';

type AndroidInputStyle = {
  paddingVertical?: number;
  includeFontPadding?: boolean;
  textAlignVertical?: 'auto' | 'center' | 'top' | 'bottom';
};

/**
 * 获取 Android 平台专用的 TextInput 样式
 * 解决 Android 上 TextInput 文字显示不全的问题
 */
export const getAndroidInputStyle = (): AndroidInputStyle | {} => {
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
export const getAndroidMultilineInputStyle = (): AndroidInputStyle | {} => {
  if (Platform.OS !== 'android') {
    return {};
  }

  return {
    ...getAndroidInputStyle(),
    // 多行输入需要额外的顶部内边距
    paddingVertical: 16,
    textAlignVertical: 'top',
  };
};
