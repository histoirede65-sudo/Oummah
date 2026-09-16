import type { ReactNode } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

import { useReciterTransition, type ReciterTransitionData } from './ReciterTransition';

export default function ReciterInfo({ style, children }: {
  style?: StyleProp<ViewStyle>;
  children: (reciter: ReciterTransitionData) => ReactNode;
}) {
  const { reciter, infoOpacity } = useReciterTransition();
  return (
    <Animated.View
      accessibilityLabel={`${reciter.name}, ${reciter.country}, ${reciter.style}, ${reciter.recitationCount}`}
      style={[style, { opacity: infoOpacity }]}
    >
      {children(reciter)}
    </Animated.View>
  );
}
