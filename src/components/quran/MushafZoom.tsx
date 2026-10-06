import { useEffect, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const MAX_SCALE = 3;

/**
 * Pinch to zoom a Mushaf page (x1 to x3), then move around it with one finger.
 * Taps on the words still open the verse. Zoomed, the page turn is paused (onZoomChange).
 */
export function MushafZoom({ width, height, resetKey, zoomed, focusY, onZoomChange, children }: {
  width: number;
  height: number;
  /** Changing it (page turned, button) brings the page back to normal size. */
  resetKey: number;
  /** One-finger moves only while zoomed: otherwise the swipe turns the page. */
  zoomed: boolean;
  /** Centre of the recited line: a zoomed page glides to keep it in view. */
  focusY: number | null;
  onZoomChange: (zoomed: boolean) => void;
  children: ReactNode;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  useEffect(() => {
    scale.set(withTiming(1));
    savedScale.set(1);
    x.set(withTiming(0));
    y.set(withTiming(0));
    savedX.set(0);
    savedY.set(0);
  }, [resetKey, savedScale, savedX, savedY, scale, x, y]);

  useEffect(() => {
    const zoom = savedScale.get();
    if (focusY === null || zoom <= 1.02) return;
    const limitY = ((zoom - 1) * height) / 2;
    const target = Math.min(limitY, Math.max(-limitY, -(focusY - height / 2) * zoom));
    y.set(withTiming(target, { duration: 450 }));
    savedY.set(target);
  }, [focusY, height, savedScale, savedY, y]);

  const clamp = (value: number, limit: number) => {
    'worklet';
    return Math.min(limit, Math.max(-limit, value));
  };

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.set(Math.min(MAX_SCALE, Math.max(1, savedScale.get() * event.scale)));
    })
    .onEnd(() => {
      savedScale.set(scale.get());
      const limitX = ((scale.get() - 1) * width) / 2;
      const limitY = ((scale.get() - 1) * height) / 2;
      x.set(withTiming(clamp(x.get(), limitX)));
      y.set(withTiming(clamp(y.get(), limitY)));
      savedX.set(clamp(x.get(), limitX));
      savedY.set(clamp(y.get(), limitY));
      scheduleOnRN(onZoomChange, scale.get() > 1.02);
    });

  const pan = Gesture.Pan()
    .enabled(zoomed)
    .minDistance(8)
    .onUpdate((event) => {
      if (savedScale.get() <= 1.02) return;
      const limitX = ((savedScale.get() - 1) * width) / 2;
      const limitY = ((savedScale.get() - 1) * height) / 2;
      x.set(clamp(savedX.get() + event.translationX, limitX));
      y.set(clamp(savedY.get() + event.translationY, limitY));
    })
    .onEnd(() => {
      savedX.set(x.get());
      savedY.set(y.get());
    });

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: scale.get() }],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, pan)}>
      <Animated.View style={[styles.fill, animated]}>{children}</Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
