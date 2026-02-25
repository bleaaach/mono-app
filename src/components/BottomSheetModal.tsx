import React, { useEffect, useCallback } from 'react';
import { StyleSheet, Dimensions, View, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { Colors } from '../constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number;
  enableGesture?: boolean;
}

export default function BottomSheetModal({
  visible,
  onClose,
  children,
  height = SCREEN_HEIGHT * 0.7,
  enableGesture = true,
}: BottomSheetModalProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const openModal = useCallback(() => {
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withSpring(0, {
      damping: 20,
      stiffness: 200,
    });
  }, [opacity, translateY]);

  const closeModal = useCallback(() => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withSpring(SCREEN_HEIGHT, {
      damping: 20,
      stiffness: 200,
    }, () => {
      runOnJS(onClose)();
    });
  }, [opacity, translateY, onClose]);

  useEffect(() => {
    if (visible) {
      openModal();
    } else {
      closeModal();
    }
  }, [visible, openModal, closeModal]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      const newY = context.value.y + event.translationY;
      translateY.value = Math.max(0, newY);
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        runOnJS(closeModal)();
      } else {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
        });
      }
    });

  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const rBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const rContentStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      translateY.value,
      [0, 50],
      [20, 0],
      Extrapolation.CLAMP
    );
    return {
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
    };
  });

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={closeModal}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View style={[styles.backdrop, rBackdropStyle]} />
      </TouchableOpacity>
      <GestureDetector gesture={enableGesture ? gesture : Gesture.Pan()}>
        <Animated.View
          style={[
            styles.bottomSheet,
            { height },
            rBottomSheetStyle,
            rContentStyle,
          ]}
        >
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray[300],
    borderRadius: 2,
  },
});
