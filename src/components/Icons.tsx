import React from 'react';
import Svg, { Circle, Path, Rect, Line, G, Polygon, Ellipse } from 'react-native-svg';

import { ViewStyle } from 'react-native';

type IconProps = {
  size?: number;
  color?: string;
  style?: ViewStyle;
};

export const HealthIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill={color}
    />
  </Svg>
);

export const StudyIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="8" y1="7" x2="16" y2="7" stroke={color} strokeWidth={1.5} />
    <Line x1="8" y1="11" x2="14" y2="11" stroke={color} strokeWidth={1.5} />
  </Svg>
);

export const WorkIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="2"
      y="7"
      width="20"
      height="14"
      rx="2"
      stroke={color}
      strokeWidth={2}
    />
    <Path
      d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export const HomeIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 22V12h6v10"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SportIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="5" r="3" stroke={color} strokeWidth={2} />
    <Path
      d="M12 8v4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M8 20l4-8 4 8"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="6" y1="12" x2="18" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const ReadIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const MeditationIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="6" r="3" stroke={color} strokeWidth={2} />
    <Path
      d="M12 9c-4 0-7 3-7 6v3h14v-3c0-3-3-6-7-6z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5 21c0-2 3-3 7-3s7 1 7 3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export const OtherIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="6" cy="12" r="2" fill={color} />
    <Circle cx="12" cy="12" r="2" fill={color} />
    <Circle cx="18" cy="12" r="2" fill={color} />
  </Svg>
);

export const CheckIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const StarIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill={color}
    />
  </Svg>
);

export const SunIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth={2} />
    <Line x1="12" y1="1" x2="12" y2="3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="21" x2="12" y2="23" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="1" y1="12" x2="3" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="21" y1="12" x2="23" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const MoonIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const FireIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22c-4.97 0-9-4.03-9-9 0-3.53 2.04-6.58 5-8.05 0 0-.5 3.05 2 5.05 2-2 2-5 2-5 2.96 1.47 5 4.52 5 8.05 0 4.97-4.03 9-9 9z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 18c-1.66 0-3-1.34-3-3 0-1.5 1-2.5 2-3.5.5.5 1 1.5 1 2.5 1-.5 2-1.5 2-2.5 1 1 1.5 2 1.5 3.5 0 1.66-1.34 3-3 3z"
      fill={color}
    />
  </Svg>
);

export const MuscleIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6.5 6.5c-2 0-3.5 1.5-3.5 3.5s1.5 3.5 3.5 3.5c0 2 1.5 4 4 4h3c2.5 0 4-2 4-4 2 0 3.5-1.5 3.5-3.5s-1.5-3.5-3.5-3.5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M8 10h8"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export const YogaIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="4" r="2.5" stroke={color} strokeWidth={2} />
    <Path
      d="M12 6.5v5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M5 12h14"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M8 12l-3 8"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M16 12l3 8"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export const MusicIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18V5l12-2v13"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="6" cy="18" r="3" stroke={color} strokeWidth={2} />
    <Circle cx="18" cy="16" r="3" stroke={color} strokeWidth={2} />
  </Svg>
);

export const ArtIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 19l7-7 3 3-7 7-3-3z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2 2l7.586 7.586"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Circle cx="11" cy="11" r="2" stroke={color} strokeWidth={2} />
  </Svg>
);

export const BulbIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18h6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M10 22h4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CoffeeIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8h1a4 4 0 0 1 0 8h-1"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="6" y1="1" x2="6" y2="4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="10" y1="1" x2="10" y2="4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="14" y1="1" x2="14" y2="4" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const AppleIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2c-1 0-2 .5-2.5 1.5-.5-1-1.5-1.5-2.5-1.5-2 0-4 2-4 5 0 6 4 12 9 12s9-6 9-12c0-3-2-5-4-5-1 0-2 .5-2.5 1.5C14 2.5 13 2 12 2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 2c0-1 1-2 2-2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export const RunIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="14" cy="4" r="2.5" stroke={color} strokeWidth={2} />
    <Path
      d="M17 8l-4 1-3-3-3 4 4 4v6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 20l4-6 3 3 4-1"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ==================== 心情图标 ====================

export const SunnyMoodIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="5" fill={color} />
    <Line x1="12" y1="1" x2="12" y2="4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="20" x2="12" y2="23" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="1" y1="12" x2="4" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="20" y1="12" x2="23" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const CloudyMoodIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const RainyMoodIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 13V5a4 4 0 0 0-8 0v8"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M8 19l.5 2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M12 17l.5 4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M16 19l.5 2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export const StormMoodIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M13 11l-4 6h6l-4 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PeacefulMoodIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SparkleIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"
      fill={color}
    />
    <Path
      d="M5 16l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z"
      fill={color}
    />
    <Path
      d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z"
      fill={color}
    />
  </Svg>
);

export const CrownIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 17L12 22L22 17V12L12 17L2 12V17Z"
      fill={color}
    />
    <Path
      d="M12 2L17 12H7L12 2Z"
      fill={color}
    />
  </Svg>
);

// ==================== 活动图标 ====================

export const CodeIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 18l6-6-6-6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 6l-6 6 6 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const GameIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth={2} />
    <Line x1="6" y1="12" x2="10" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="8" y1="10" x2="8" y2="14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx="16" cy="10" r="1" fill={color} />
    <Circle cx="18" cy="13" r="1" fill={color} />
  </Svg>
);

export const CookIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="6" y1="17" x2="18" y2="17" stroke={color} strokeWidth={2} />
  </Svg>
);

export const SleepIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M17 4h4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M19 2v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const WriteIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 19l7-7 3 3-7 7-3-3z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ==================== 日志分类图标 ====================

export const MovieIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="20" height="20" rx="2" stroke={color} strokeWidth={2} />
    <Line x1="7" y1="2" x2="7" y2="22" stroke={color} strokeWidth={2} />
    <Line x1="17" y1="2" x2="17" y2="22" stroke={color} strokeWidth={2} />
    <Line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth={2} />
    <Line x1="2" y1="7" x2="7" y2="7" stroke={color} strokeWidth={2} />
    <Line x1="2" y1="17" x2="7" y2="17" stroke={color} strokeWidth={2} />
    <Line x1="17" y1="7" x2="22" y2="7" stroke={color} strokeWidth={2} />
    <Line x1="17" y1="17" x2="22" y2="17" stroke={color} strokeWidth={2} />
  </Svg>
);

export const RestaurantIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M7 2v20"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const RestIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path
      d="M12 6v6l4 2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const TravelIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ==================== 空间图标 ====================

export const HomeSpaceIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M9 22V12h6v10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const SofaIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"
      stroke={color}
      strokeWidth={2}
    />
    <Path d="M4 18v2M20 18v2" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const BedIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M2 4v16" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M22 4v16" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M2 8h20" stroke={color} strokeWidth={2} />
    <Path d="M2 16h20" stroke={color} strokeWidth={2} />
    <Path d="M6 8v8" stroke={color} strokeWidth={2} />
  </Svg>
);

export const KitchenIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth={2} />
    <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth={2} />
    <Line x1="9" y1="3" x2="9" y2="9" stroke={color} strokeWidth={2} />
    <Circle cx="6" cy="6" r="1" fill={color} />
    <Circle cx="15" cy="6" r="1" fill={color} />
    <Circle cx="18" cy="6" r="1" fill={color} />
  </Svg>
);

export const BathroomIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 12h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z"
      stroke={color}
      strokeWidth={2}
    />
    <Path d="M6 12V6a2 2 0 0 1 2-2h2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M4 20v2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M20 20v2" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const BalconyIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2v8" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M8 10c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke={color} strokeWidth={2} />
    <Path d="M4 10h16v10H4z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="4" y1="14" x2="20" y2="14" stroke={color} strokeWidth={2} />
    <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth={2} />
  </Svg>
);

export const BoxIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M3.27 6.96L12 12.01l8.73-5.05" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="22.08" x2="12" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const WardrobeIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="2" width="18" height="20" rx="2" stroke={color} strokeWidth={2} />
    <Line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth={2} />
    <Line x1="8" y1="10" x2="10" y2="10" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="14" y1="10" x2="16" y2="10" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const FridgeIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth={2} />
    <Line x1="4" y1="10" x2="20" y2="10" stroke={color} strokeWidth={2} />
    <Line x1="8" y1="6" x2="10" y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="8" y1="14" x2="10" y2="14" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const BookshelfIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" stroke={color} strokeWidth={2} />
    <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth={2} />
    <Line x1="3" y1="15" x2="21" y2="15" stroke={color} strokeWidth={2} />
    <Line x1="9" y1="3" x2="9" y2="9" stroke={color} strokeWidth={2} />
    <Line x1="15" y1="9" x2="15" y2="15" stroke={color} strokeWidth={2} />
  </Svg>
);

export const TVIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="7" width="20" height="14" rx="2" stroke={color} strokeWidth={2} />
    <Line x1="17" y1="2" x2="12" y2="7" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="7" y1="2" x2="12" y2="7" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const DrawerIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth={2} />
    <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth={2} />
    <Line x1="3" y1="15" x2="21" y2="15" stroke={color} strokeWidth={2} />
    <Line x1="10" y1="6" x2="14" y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="10" y1="12" x2="14" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="10" y1="18" x2="14" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const SearchIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const ChartIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="20" x2="18" y2="10" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="6" y1="20" x2="6" y2="14" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const CloseIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// ==================== 收纳分类图标 ====================

export const ClothingIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2v10M9 5l3-3 3 3M6 12h12"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20 6l-4-2v4l4 2M4 6l4-2v4l-4 2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const FoodIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path
      d="M8 12v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path d="M10 10V8a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" stroke={color} strokeWidth={2} />
  </Svg>
);

export const BeautyIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="8" width="14" height="12" rx="2" stroke={color} strokeWidth={2} />
    <Path
      d="M9 8V6a3 3 0 0 1 6 0v2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path d="M12 12v4M10 14h4" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const MedicineIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.5 20.5L3.5 13.5a4.95 4.95 0 1 1 7-7l7 7a4.95 4.95 0 1 1-7 7z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M8.5 8.5l7 7" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const ElectronicsIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="3" width="20" height="14" rx="2" stroke={color} strokeWidth={2} />
    <Line x1="8" y1="21" x2="16" y2="21" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="17" x2="12" y2="21" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx="12" cy="10" r="2" stroke={color} strokeWidth={2} />
  </Svg>
);

export const BooksIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const HomeGoodsIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M9 22V12h6v10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="18" cy="6" r="2" stroke={color} strokeWidth={2} />
  </Svg>
);

export const SportsIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6.5 6.5a4.95 4.95 0 0 1 7 7l5-5a4.95 4.95 0 0 1-7 7l-5-5z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17.5 17.5a4.95 4.95 0 0 1-7-7l5 5a4.95 4.95 0 0 1 7 7l-5-5z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ToysIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="5" stroke={color} strokeWidth={2} />
    <Path
      d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Circle cx="8" cy="6" r="1" fill={color} />
    <Circle cx="16" cy="6" r="1" fill={color} />
  </Svg>
);

export const CollectionsIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L2 7l10 5 10-5-10-5z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2 17l10 5 10-5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2 12l10 5 10-5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ToolsIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PackageIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ==================== 日记相关图标 ====================

export const DiaryIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M14 2v6h6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="8" y1="17" x2="13" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// 心情图标 - 开心
export const HappyIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Circle cx="9" cy="10" r="1.5" fill={color} />
    <Circle cx="15" cy="10" r="1.5" fill={color} />
    <Path
      d="M8 14c.5 2 2 3 4 3s3.5-1 4-3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// 心情图标 - 平静
export const NeutralIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Circle cx="9" cy="10" r="1.5" fill={color} />
    <Circle cx="15" cy="10" r="1.5" fill={color} />
    <Line x1="9" y1="15" x2="15" y2="15" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// 心情图标 - 难过
export const SadIcon = ({ size = 24, color = "#000000" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Circle cx="9" cy="10" r="1.5" fill={color} />
    <Circle cx="15" cy="10" r="1.5" fill={color} />
    <Path
      d="M8 16c.5-2 2-3 4-3s3.5 1 4 3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const IconMap: { [key: string]: React.FC<IconProps> } = {
  'health': HealthIcon,
  'study': StudyIcon,
  'work': WorkIcon,
  'life': HomeIcon,
  'sport': SportIcon,
  'read': ReadIcon,
  'meditation': MeditationIcon,
  'other': OtherIcon,
  'check': CheckIcon,
  'star': StarIcon,
  'sun': SunIcon,
  'moon': MoonIcon,
  'fire': FireIcon,
  'muscle': MuscleIcon,
  'yoga': YogaIcon,
  'music': MusicIcon,
  'art': ArtIcon,
  'bulb': BulbIcon,
  'coffee': CoffeeIcon,
  'apple': AppleIcon,
  'run': RunIcon,
  'sunny': SunnyMoodIcon,
  'cloudy': CloudyMoodIcon,
  'rainy': RainyMoodIcon,
  'storm': StormMoodIcon,
  'peaceful': PeacefulMoodIcon,
  'sparkle': SparkleIcon,
  'crown': CrownIcon,
  'code': CodeIcon,
  'game': GameIcon,
  'cook': CookIcon,
  'sleep': SleepIcon,
  'write': WriteIcon,
  'movie': MovieIcon,
  'restaurant': RestaurantIcon,
  'rest': RestIcon,
  'travel': TravelIcon,
  'homeSpace': HomeSpaceIcon,
  'sofa': SofaIcon,
  'bed': BedIcon,
  'kitchen': KitchenIcon,
  'bathroom': BathroomIcon,
  'balcony': BalconyIcon,
  'box': BoxIcon,
  'wardrobe': WardrobeIcon,
  'fridge': FridgeIcon,
  'bookshelf': BookshelfIcon,
  'tv': TVIcon,
  'drawer': DrawerIcon,
  'search': SearchIcon,
  'chart': ChartIcon,
  'close': CloseIcon,
  'clothing': ClothingIcon,
  'food': FoodIcon,
  'beauty': BeautyIcon,
  'medicine': MedicineIcon,
  'electronics': ElectronicsIcon,
  'books': BooksIcon,
  'homeGoods': HomeGoodsIcon,
  'sports': SportsIcon,
  'toys': ToysIcon,
  'collections': CollectionsIcon,
  'tools': ToolsIcon,
  'package': PackageIcon,
  'diary': DiaryIcon,
  'happy': HappyIcon,
  'neutral': NeutralIcon,
  'sad': SadIcon,
};

export const getIconComponent = (iconName: string): React.FC<IconProps> | null => {
  return IconMap[iconName.toLowerCase()] || null;
};
