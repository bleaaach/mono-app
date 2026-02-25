import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { DiaryEntry } from '../../types';
import {
  SunnyMoodIcon,
  CloudyMoodIcon,
  RainyMoodIcon,
  StormMoodIcon,
  PeacefulMoodIcon,
  SparkleIcon,
} from '../Icons';

const { width } = Dimensions.get('window');

export type ShareTemplate = 'minimal' | 'journal' | 'film' | 'nature' | 'geometric' | 'mood';

interface ShareCardProps {
  entry: DiaryEntry;
  template: ShareTemplate;
  caption?: string;
}

const MOODS: Record<string, { label: string; iconComponent: React.ComponentType<{ size: number; color: string }>; color: string }> = {
  sunny: { label: '晴朗', iconComponent: SunnyMoodIcon, color: '#FFB800' },
  cloudy: { label: '多云', iconComponent: CloudyMoodIcon, color: '#8E8E93' },
  rainy: { label: '下雨', iconComponent: RainyMoodIcon, color: '#007AFF' },
  storm: { label: '雷雨', iconComponent: StormMoodIcon, color: '#5856D6' },
  peaceful: { label: '宁静', iconComponent: PeacefulMoodIcon, color: '#FF9500' },
  sparkle: { label: '美好', iconComponent: SparkleIcon, color: '#FF2D55' },
};

export default function ShareCard({ entry, template, caption }: ShareCardProps) {
  const mood = MOODS[entry.mood || 'cloudy'];
  const date = new Date(entry.date);
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

  const renderMinimal = () => (
    <View style={[styles.card, styles.minimalCard]}>
      <View style={styles.minimalHeader}>
        <Text style={styles.minimalDate}>{dateStr}</Text>
        <View style={styles.minimalMood}>
          {React.createElement(mood.iconComponent, { size: 24, color: '#000' })}
        </View>
      </View>
      <Text style={styles.minimalContent}>{entry.content}</Text>
      <View style={styles.minimalFooter}>
        {entry.tags?.map((tag, i) => (
          <Text key={i} style={styles.minimalTag}>#{tag}</Text>
        ))}
      </View>
      {caption && <Text style={styles.minimalCaption}>{caption}</Text>}
    </View>
  );

  const renderJournal = () => (
    <View style={[styles.card, styles.journalCard]}>
      <View style={styles.journalTape} />
      <View style={styles.journalHeader}>
        <Text style={styles.journalDate}>{dateStr}</Text>
        {React.createElement(mood.iconComponent, { size: 28, color: mood.color })}
      </View>
      <View style={styles.journalLine} />
      <Text style={styles.journalContent}>{entry.content}</Text>
      <View style={styles.journalFooter}>
        {entry.tags?.map((tag, i) => (
          <View key={i} style={styles.journalTag}>
            <Text style={styles.journalTagText}>{tag}</Text>
          </View>
        ))}
      </View>
      {caption && <Text style={styles.journalCaption}>{caption}</Text>}
    </View>
  );

  const renderFilm = () => (
    <View style={[styles.card, styles.filmCard]}>
      <View style={styles.filmBorder}>
        <View style={styles.filmHeader}>
          <Text style={styles.filmDate}>{dateStr}</Text>
          <View style={styles.filmPerforations}>
            {[...Array(8)].map((_, i) => (
              <View key={i} style={styles.filmHole} />
            ))}
          </View>
        </View>
        <View style={styles.filmContent}>
          {React.createElement(mood.iconComponent, { size: 32, color: '#FFF' })}
          <Text style={styles.filmText}>{entry.content}</Text>
        </View>
        <View style={styles.filmPerforationsBottom}>
          {[...Array(8)].map((_, i) => (
            <View key={i} style={styles.filmHole} />
          ))}
        </View>
      </View>
      {entry.tags?.map((tag, i) => (
        <Text key={i} style={styles.filmTag}>{tag}</Text>
      ))}
      {caption && <Text style={styles.filmCaption}>{caption}</Text>}
    </View>
  );

  const renderNature = () => (
    <View style={[styles.card, styles.natureCard]}>
      <View style={styles.natureHeader}>
        <View style={styles.natureLeaf}>
          {React.createElement(mood.iconComponent, { size: 32, color: '#2E7D32' })}
        </View>
        <Text style={styles.natureDate}>{dateStr}</Text>
      </View>
      <Text style={styles.natureContent}>{entry.content}</Text>
      <View style={styles.natureFooter}>
        {entry.tags?.map((tag, i) => (
          <View key={i} style={styles.natureTag}>
            <Text style={styles.natureTagText}># {tag}</Text>
          </View>
        ))}
      </View>
      {caption && <Text style={styles.natureCaption}>{caption}</Text>}
    </View>
  );

  const renderGeometric = () => (
    <View style={[styles.card, styles.geometricCard]}>
      <View style={[styles.geoShape, { backgroundColor: mood.color }]} />
      <View style={styles.geometricContent}>
        <Text style={styles.geometricDate}>{dateStr}</Text>
        {React.createElement(mood.iconComponent, { size: 28, color: mood.color })}
        <Text style={styles.geometricText}>{entry.content}</Text>
        <View style={styles.geometricTags}>
          {entry.tags?.map((tag, i) => (
            <View key={i} style={[styles.geometricTag, { borderColor: mood.color }]}>
              <Text style={[styles.geometricTagText, { color: mood.color }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      {caption && <Text style={styles.geometricCaption}>{caption}</Text>}
    </View>
  );

  const renderMood = () => (
    <View style={[styles.card, styles.moodCard, { backgroundColor: `${mood.color}15` }]}>
      <View style={[styles.moodHeader, { backgroundColor: mood.color }]}>
        {React.createElement(mood.iconComponent, { size: 48, color: '#FFF' })}
        <Text style={styles.moodHeaderText}>{mood.label}</Text>
      </View>
      <View style={styles.moodBody}>
        <Text style={[styles.moodDate, { color: mood.color }]}>{dateStr}</Text>
        <Text style={styles.moodContent}>{entry.content}</Text>
        <View style={styles.moodTags}>
          {entry.tags?.map((tag, i) => (
            <View key={i} style={[styles.moodTag, { backgroundColor: `${mood.color}30` }]}>
              <Text style={[styles.moodTagText, { color: mood.color }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      {caption && <Text style={[styles.moodCaption, { color: mood.color }]}>{caption}</Text>}
    </View>
  );

  switch (template) {
    case 'minimal':
      return renderMinimal();
    case 'journal':
      return renderJournal();
    case 'film':
      return renderFilm();
    case 'nature':
      return renderNature();
    case 'geometric':
      return renderGeometric();
    case 'mood':
      return renderMood();
    default:
      return renderMinimal();
  }
}

const styles = StyleSheet.create({
  card: {
    width: width - 80,
    minHeight: 300,
    borderRadius: 16,
    padding: 24,
    marginVertical: 8,
  },
  // Minimal Style
  minimalCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
  },
  minimalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  minimalDate: {
    fontSize: 14,
    color: '#666666',
    letterSpacing: 2,
  },
  minimalMood: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimalContent: {
    fontSize: 18,
    lineHeight: 28,
    color: '#000000',
    marginBottom: 20,
  },
  minimalFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  minimalTag: {
    fontSize: 12,
    color: '#999999',
  },
  minimalCaption: {
    fontSize: 13,
    color: '#666666',
    marginTop: 16,
    fontStyle: 'italic',
  },
  // Journal Style
  journalCard: {
    backgroundColor: '#FFFEF7',
    borderWidth: 1,
    borderColor: '#E8E4DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  journalTape: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 24,
    backgroundColor: '#FFD700',
    opacity: 0.6,
    transform: [{ rotate: '-2deg' }],
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  journalDate: {
    fontSize: 13,
    color: '#8B7355',
    fontWeight: '500',
  },
  journalLine: {
    height: 1,
    backgroundColor: '#E8E4DC',
    marginBottom: 16,
  },
  journalContent: {
    fontSize: 16,
    lineHeight: 26,
    color: '#4A4A4A',
    marginBottom: 20,
  },
  journalFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  journalTag: {
    backgroundColor: '#F5F0E8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  journalTagText: {
    fontSize: 11,
    color: '#8B7355',
  },
  journalCaption: {
    fontSize: 12,
    color: '#999999',
    marginTop: 16,
    textAlign: 'center',
  },
  // Film Style
  filmCard: {
    backgroundColor: '#1A1A1A',
    padding: 0,
    overflow: 'hidden',
  },
  filmBorder: {
    borderWidth: 8,
    borderColor: '#2A2A2A',
  },
  filmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2A2A2A',
  },
  filmDate: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  filmPerforations: {
    flexDirection: 'row',
    gap: 8,
  },
  filmPerforationsBottom: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    backgroundColor: '#2A2A2A',
  },
  filmHole: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#1A1A1A',
  },
  filmContent: {
    padding: 24,
    alignItems: 'center',
    minHeight: 200,
  },
  filmText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
  },
  filmTag: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  filmCaption: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    padding: 16,
  },
  // Nature Style
  natureCard: {
    backgroundColor: '#F1F8E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  natureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  natureLeaf: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  natureDate: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  natureContent: {
    fontSize: 16,
    lineHeight: 26,
    color: '#33691E',
    marginBottom: 20,
  },
  natureFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  natureTag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  natureTagText: {
    fontSize: 12,
    color: '#2E7D32',
  },
  natureCaption: {
    fontSize: 12,
    color: '#81C784',
    marginTop: 16,
  },
  // Geometric Style
  geometricCard: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  geoShape: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.1,
  },
  geometricContent: {
    zIndex: 1,
  },
  geometricDate: {
    fontSize: 13,
    color: '#999999',
    marginBottom: 12,
  },
  geometricText: {
    fontSize: 17,
    lineHeight: 28,
    color: '#000000',
    marginVertical: 16,
  },
  geometricTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  geometricTag: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  geometricTagText: {
    fontSize: 12,
  },
  geometricCaption: {
    fontSize: 13,
    color: '#666666',
    marginTop: 20,
    fontStyle: 'italic',
  },
  // Mood Style
  moodCard: {
    overflow: 'hidden',
    padding: 0,
  },
  moodHeader: {
    padding: 24,
    alignItems: 'center',
  },
  moodHeaderText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 8,
  },
  moodBody: {
    padding: 24,
  },
  moodDate: {
    fontSize: 13,
    marginBottom: 16,
  },
  moodContent: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333333',
    marginBottom: 20,
  },
  moodTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  moodTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moodCaption: {
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
