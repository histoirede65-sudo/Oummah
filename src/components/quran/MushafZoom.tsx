import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDecay, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const MAX_SCALE = 3;
const SPRING = { damping: 22, stiffness: 220, mass: 0.6 };
/** After the reader moves the page by hand, the automatic follow of the recitation waits this long. */
const FOLLOW_PAUSE_MS = 4000;

/**
 * Pinch to zoom a Mushaf page (x1 to x3) where the fingers are, and glide around it with inertia. Taps on the words still open the verse. Zoomed, the page turn waits (onZoomChange).
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
  const startScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  // After a hand move, the automatic follow of the recitation pauses for a moment.
  const [followPaused, setFollowPaused] = useState(false);
  useEffect(() => {
    if (!followPaused) return;
    const timer = setTimeout(() => setFollowPaused(false), FOLLOW_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [followPaused]);

  useEffect(() => {
    scale.set(withTiming(1));
    x.set(withTiming(0));
    y.set(withTiming(0));
  }, [resetKey, scale, x, y]);

  useEffect(() => {
    const zoom = scale.get();
    if (focusY === null || zoom <= 1.02 || followPaused) return;
    const limitY = ((zoom - 1) * height) / 2;
    y.set(withTiming(Math.min(limitY, Math.max(-limitY, -(focusY - height / 2) * zoom)), { duration: 450 }));
  }, [focusY, followPaused, height, scale, y]);

  const gesture = useMemo(() => {
    const limit = (zoom: number, size: number) => {
      'worklet';
      return Math.max(0, ((zoom - 1) * size) / 2);
    };
    const clamp = (value: number, max: number) => {
      'worklet';
      return Math.min(max, Math.max(-max, value));
    };

    const pinch = Gesture.Pinch()
      .onStart(() => {
        cancelAnimation(x);
        cancelAnimation(y);
        startScale.set(scale.get());
        startX.set(x.get());
        startY.set(y.get());
        scheduleOnRN(setFollowPaused, true);
      })
      .onUpdate((event) => {
        const next = Math.min(MAX_SCALE + 0.4, Math.max(0.85, startScale.get() * event.scale));
        // The point under the fingers stays in place while zooming.
        const ratio = next / startScale.get();
        const fx = event.focalX - width / 2;
        const fy = event.focalY - height / 2;
        scale.set(next);
        x.set(fx - (fx - startX.get()) * ratio);
        y.set(fy - (fy - startY.get()) * ratio);
      })
      .onEnd(() => {
        const zoom = Math.min(MAX_SCALE, Math.max(1, scale.get()));
        scale.set(withSpring(zoom, SPRING));
        if (zoom <= 1.02) {
          x.set(withSpring(0, SPRING));
          y.set(withSpring(0, SPRING));
        } else {
          x.set(withSpring(clamp(x.get(), limit(zoom, width)), SPRING));
          y.set(withSpring(clamp(y.get(), limit(zoom, height)), SPRING));
        }
        scheduleOnRN(onZoomChange, zoom > 1.02);
      });

    const pan = Gesture.Pan()
      .enabled(zoomed)
      .averageTouches(true)
      .onStart(() => {
        cancelAnimation(x);
        cancelAnimation(y);
        startX.set(x.get());
        startY.set(y.get());
        scheduleOnRN(setFollowPaused, true);
      })
      .onUpdate((event) => {
        const zoom = scale.get();
        x.set(clamp(startX.get() + event.translationX, limit(zoom, width)));
        y.set(clamp(startY.get() + event.translationY, limit(zoom, height)));
      })
      .onEnd((event) => {
        const zoom = scale.get();
        const maxX = limit(zoom, width);
        const maxY = limit(zoom, height);
        x.set(withDecay({ velocity: event.velocityX, clamp: [-maxX, maxX] }));
        y.set(withDecay({ velocity: event.velocityY, clamp: [-maxY, maxY] }));
        scheduleOnRN(setFollowPaused, true);
      });

    return Gesture.Simultaneous(pinch, pan);
  }, [height, onZoomChange, scale, startScale, startX, startY, width, x, y, zoomed]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: scale.get() }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.fill, animated]}>{children}</Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
