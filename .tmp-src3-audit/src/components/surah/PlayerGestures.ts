import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, PanResponder, type GestureResponderHandlers, type ViewStyle } from 'react-native';

export type PlayerGestureDirection = 'up' | 'down' | 'left' | 'right' | null;
export type PlayerGestureSurface = 'full' | 'mini';

const CLAIM_DISTANCE = 12;
const COMPLETE_DISTANCE = 48;
const COMPLETE_VELOCITY = 0.55;
const DOUBLE_TAP_DELAY = 280;

export function resolvePlayerGesture(dx: number, dy: number): PlayerGestureDirection {
  const horizontal = Math.abs(dx) > Math.abs(dy) * 1.25;
  const vertical = Math.abs(dy) > Math.abs(dx) * 1.25;
  if (horizontal && Math.abs(dx) >= CLAIM_DISTANCE) return dx > 0 ? 'right' : 'left';
  if (vertical && Math.abs(dy) >= CLAIM_DISTANCE) return dy > 0 ? 'down' : 'up';
  return null;
}

interface PlayerSwipeGestureOptions {
  surface: PlayerGestureSurface;
  active?: boolean;
  canCollapse?: () => boolean;
  onCollapse?: () => void;
  onExpand?: () => void;
  onDismiss?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export interface PlayerSwipeGestureResult {
  panHandlers: GestureResponderHandlers;
  animatedStyle: Animated.WithAnimatedValue<ViewStyle>;
  dismiss(): void;
}

export function usePlayerSwipeGestures(options: PlayerSwipeGestureOptions): PlayerSwipeGestureResult {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);

  const reset = useCallback(() => {
    animation.current?.stop();
    const restoring = Animated.parallel([
      Animated.spring(translateX, { toValue: 0, damping: 20, stiffness: 230, mass: 0.7, useNativeDriver: true, isInteraction: false }),
      Animated.spring(translateY, { toValue: 0, damping: 20, stiffness: 230, mass: 0.7, useNativeDriver: true, isInteraction: false }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true, isInteraction: false }),
    ]);
    animation.current = restoring;
    restoring.start();
  }, [opacity, translateX, translateY]);

  const complete = useCallback((direction: Exclude<PlayerGestureDirection, null>) => {
    animation.current?.stop();
    const horizontal = direction === 'left' || direction === 'right';
    const targetX = direction === 'left' ? -56 : direction === 'right' ? 56 : 0;
    const targetY = direction === 'up' ? -72 : direction === 'down' ? 78 : 0;
    const outgoing = Animated.parallel([
      Animated.timing(translateX, { toValue: targetX, duration: 150, easing: Easing.inOut(Easing.cubic), useNativeDriver: true, isInteraction: false }),
      Animated.timing(translateY, { toValue: targetY, duration: 150, easing: Easing.inOut(Easing.cubic), useNativeDriver: true, isInteraction: false }),
      Animated.timing(opacity, { toValue: horizontal ? 0.72 : 0.45, duration: 150, useNativeDriver: true, isInteraction: false }),
    ]);
    animation.current = outgoing;
    outgoing.start(({ finished }) => {
      if (!finished) return;
      if (direction === 'down' && options.surface === 'full') options.onCollapse?.();
      if (direction === 'up' && options.surface === 'mini') options.onExpand?.();
      if (direction === 'down' && options.surface === 'mini') options.onDismiss?.();
      if (direction === 'right' && options.surface === 'full') options.onPrevious?.();
      if (direction === 'left' && options.surface === 'full') options.onNext?.();
      if (horizontal) {
        translateX.setValue(direction === 'left' ? 24 : -24);
        translateY.setValue(0);
        reset();
      }
    });
  }, [opacity, options, reset, translateX, translateY]);

  useEffect(() => {
    if (options.surface === 'mini' && options.active) {
      translateY.setValue(12);
      opacity.setValue(0);
      reset();
    }
  }, [opacity, options.active, options.surface, reset, translateY]);

  useEffect(() => () => animation.current?.stop(), []);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => {
      const direction = resolvePlayerGesture(gesture.dx, gesture.dy);
      if (options.surface === 'full') {
        if (direction === 'left' || direction === 'right') return true;
        return direction === 'down' && (options.canCollapse?.() ?? true);
      }
      return direction === 'up' || direction === 'down';
    },
    onPanResponderMove: (_, gesture) => {
      const direction = resolvePlayerGesture(gesture.dx, gesture.dy);
      if (direction === 'left' || direction === 'right') translateX.setValue(Math.max(-72, Math.min(72, gesture.dx)));
      if (direction === 'up' || direction === 'down') translateY.setValue(Math.max(-82, Math.min(82, gesture.dy)));
      opacity.setValue(1 - Math.min(0.35, Math.max(Math.abs(gesture.dx), Math.abs(gesture.dy)) / 240));
    },
    onPanResponderRelease: (_, gesture) => {
      const direction = resolvePlayerGesture(gesture.dx, gesture.dy);
      const distance = direction === 'left' || direction === 'right' ? Math.abs(gesture.dx) : Math.abs(gesture.dy);
      const velocity = direction === 'left' || direction === 'right' ? Math.abs(gesture.vx) : Math.abs(gesture.vy);
      if (direction && (distance >= COMPLETE_DISTANCE || velocity >= COMPLETE_VELOCITY)) complete(direction);
      else reset();
    },
    onPanResponderTerminate: reset,
  }), [complete, opacity, options, reset, translateX, translateY]);

  return {
    panHandlers: panResponder.panHandlers,
    animatedStyle: { opacity, transform: [{ translateX }, { translateY }] },
    dismiss: () => complete('down'),
  };
}

export function useLongPressGesture(onPress: () => void, onLongPress?: () => void) {
  const longPressTriggered = useRef(false);
  return {
    onPressIn: () => { longPressTriggered.current = false; },
    onLongPress: () => { longPressTriggered.current = true; onLongPress?.(); },
    onPress: () => { if (!longPressTriggered.current) onPress(); },
  };
}

export function useDoubleTapGesture(onDoubleTap: () => void) {
  const lastTap = useRef(0);
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0.7)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);

  const onPress = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current > DOUBLE_TAP_DELAY) {
      lastTap.current = now;
      return;
    }
    lastTap.current = 0;
    onDoubleTap();
    animation.current?.stop();
    heartOpacity.setValue(0);
    heartScale.setValue(0.7);
    const feedback = Animated.sequence([
      Animated.parallel([
        Animated.timing(heartOpacity, { toValue: 1, duration: 140, useNativeDriver: true, isInteraction: false }),
        Animated.spring(heartScale, { toValue: 1.12, damping: 12, stiffness: 250, mass: 0.6, useNativeDriver: true, isInteraction: false }),
      ]),
      Animated.parallel([
        Animated.timing(heartOpacity, { toValue: 0, duration: 260, useNativeDriver: true, isInteraction: false }),
        Animated.timing(heartScale, { toValue: 1, duration: 260, useNativeDriver: true, isInteraction: false }),
      ]),
    ]);
    animation.current = feedback;
    feedback.start();
  }, [heartOpacity, heartScale, onDoubleTap]);

  useEffect(() => () => animation.current?.stop(), []);
  return { onPress, heartStyle: { opacity: heartOpacity, transform: [{ scale: heartScale }] } };
}
