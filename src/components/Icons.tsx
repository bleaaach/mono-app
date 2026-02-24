import React from 'react';
import Svg, { Circle, Path, Rect, Line, G } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
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
    <Line x1="12" y1="12" x2="12" y2="16" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="10" y1="14" x2="14" y2="14" stroke={color} strokeWidth={2} strokeLinecap="round" />
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
};

export const getIconComponent = (iconName: string): React.FC<IconProps> | null => {
  return IconMap[iconName.toLowerCase()] || null;
};
