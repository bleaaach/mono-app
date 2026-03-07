import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const [shortDimension, longDimension] = SCREEN_WIDTH < SCREEN_HEIGHT
  ? [SCREEN_WIDTH, SCREEN_HEIGHT]
  : [SCREEN_HEIGHT, SCREEN_WIDTH];

export const scale = (size: number): number => {
  return (shortDimension / BASE_WIDTH) * size;
};

export const verticalScale = (size: number): number => {
  return (longDimension / BASE_HEIGHT) * size;
};

export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

export const scaleFont = (size: number): number => {
  // 更激进的字体缩放策略
  const scaleFactor = shortDimension / BASE_WIDTH;
  
  // 对于小屏设备，使用更激进的缩放
  let finalSize: number;
  if (scaleFactor < 0.9) {
    // 小屏设备：额外缩小 15%
    finalSize = size * scaleFactor * 0.85;
  } else if (scaleFactor < 1.0) {
    // 中等偏小设备：额外缩小 5%
    finalSize = size * scaleFactor * 0.95;
  } else {
    // 正常或大屏设备：正常缩放
    finalSize = size * scaleFactor;
  }
  
  return Math.round(PixelRatio.roundToNearestPixel(finalSize));
};

export const isSmallDevice = SCREEN_WIDTH < 375;
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeDevice = SCREEN_WIDTH >= 414;

export const getResponsiveFontSize = (baseSize: number): number => {
  if (isSmallDevice) {
    return scaleFont(baseSize * 0.9);
  } else if (isLargeDevice) {
    return scaleFont(baseSize * 1.05);
  }
  return scaleFont(baseSize);
};

export const FontSizes = {
  xs: getResponsiveFontSize(10),
  sm: getResponsiveFontSize(12),
  md: getResponsiveFontSize(14),
  lg: getResponsiveFontSize(16),
  xl: getResponsiveFontSize(18),
  xxl: getResponsiveFontSize(20),
  xxxl: getResponsiveFontSize(24),
  title: getResponsiveFontSize(28),
  hero: getResponsiveFontSize(32),
  // 输入框专用 - 更小的字体
  input: isSmallDevice ? scaleFont(12) : scaleFont(14),
  inputSmall: isSmallDevice ? scaleFont(11) : scaleFont(13),
};

export const Spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  xxl: scale(24),
  xxxl: scale(32),
};

export const BorderRadius = {
  sm: scale(4),
  md: scale(8),
  lg: scale(12),
  xl: scale(16),
  xxl: scale(20),
  full: scale(999),
};

export const ResponsiveDimensions = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  pixelRatio: PixelRatio.get(),
};
