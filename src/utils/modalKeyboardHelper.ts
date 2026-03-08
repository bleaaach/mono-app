// src/utils/modalKeyboardHelper.ts
import { useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
} from 'react-native-reanimated';

export const useModalKeyboardAvoiding = () => {
  const modalTranslateY = useSharedValue(0);

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: modalTranslateY.value }],
    };
  });

  useEffect(() => {
    const showEvent = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow';
    const hideEvent = Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide';
    
    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      modalTranslateY.value = withTiming(-e.endCoordinates.height, { duration: 200 });
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      modalTranslateY.value = withTiming(0, { duration: 200 });
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
};
