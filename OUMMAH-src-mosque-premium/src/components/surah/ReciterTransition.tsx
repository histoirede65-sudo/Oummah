import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Animated } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { animationCurves, animationDurations } from '../../core/animations/AnimationTokens';

export interface ReciterTransitionData {
  id: string;
  name: string;
  country: string;
  style: string;
  recitationCount: number;
  image?: ImageSourcePropType;
}

interface ReciterTransitionContextValue {
  reciter: ReciterTransitionData;
  previousReciter?: ReciterTransitionData;
  nextReciter?: ReciterTransitionData;
  photoOpacity: Animated.Value;
  photoScale: Animated.Value;
  infoOpacity: Animated.Value;
}

const ReciterTransitionContext = createContext<ReciterTransitionContextValue | null>(null);
const TRANSITION_DURATION = animationDurations.normal;

export function useReciterTransition() {
  const context = useContext(ReciterTransitionContext);
  if (!context) throw new Error('Reciter transition components must be rendered inside ReciterTransition.');
  return context;
}

export default function ReciterTransition({ reciter, previousReciter, nextReciter, children }: {
  reciter: ReciterTransitionData;
  previousReciter?: ReciterTransitionData;
  nextReciter?: ReciterTransitionData;
  children: ReactNode;
}) {
  const displayedId = useRef(reciter.id);
  const transitionToken = useRef(0);
  const runningAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const photoOpacity = useRef(new Animated.Value(1)).current;
  const photoScale = useRef(new Animated.Value(1)).current;
  const infoOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (displayedId.current === reciter.id) return;
    ++transitionToken.current;
    runningAnimation.current?.stop();
    displayedId.current = reciter.id;
    photoOpacity.setValue(1);
    photoScale.setValue(0.985);
    infoOpacity.setValue(0.65);
    const transition = Animated.parallel([
      Animated.spring(photoScale, { toValue: 1, damping: 20, stiffness: 220, mass: 0.7, isInteraction: false, useNativeDriver: true }),
      Animated.timing(infoOpacity, { toValue: 1, duration: TRANSITION_DURATION, easing: animationCurves.premium, isInteraction: false, useNativeDriver: true }),
    ]);
    runningAnimation.current = transition;
    transition.start();
    return () => transition.stop();
  }, [infoOpacity, photoOpacity, photoScale, reciter]);

  useEffect(() => () => {
    transitionToken.current += 1;
    runningAnimation.current?.stop();
  }, []);

  const value = useMemo<ReciterTransitionContextValue>(() => ({
    reciter,
    previousReciter,
    nextReciter,
    photoOpacity,
    photoScale,
    infoOpacity,
  }), [infoOpacity, nextReciter, photoOpacity, photoScale, previousReciter, reciter]);

  return <ReciterTransitionContext.Provider value={value}>{children}</ReciterTransitionContext.Provider>;
}
