import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type AudioProgressProps = { progress?: number; elapsed?: string; duration?: string; onSeek?: (progress: number) => void };

export default function AudioProgress({ progress = 0, elapsed = '00:00', duration = '00:00', onSeek }: AudioProgressProps) {
  const { t } = useI18n();
  const [trackWidth, setTrackWidth] = useState(0);
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const animatedProgress = useSharedValue(clampedProgress);
  const seek = (event: GestureResponderEvent) => {
    if (trackWidth > 0) onSeek?.(Math.max(0, Math.min(1, event.nativeEvent.locationX / trackWidth)));
  };
  const measure = (event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    left: `${animatedProgress.value * 100}%`,
  }));

  useEffect(() => {
    animatedProgress.value = withTiming(clampedProgress, { duration: 220 });
  }, [animatedProgress, clampedProgress]);

  return (
    <View>
      <Pressable accessibilityRole="adjustable" accessibilityLabel={t('audio.seek')} onLayout={measure} onPress={seek} style={styles.seekArea}>
        <View style={styles.track}>
          <Reanimated.View style={[styles.progress, progressStyle]}>
            <LinearGradient
              colors={[colors.goldDark, colors.goldLight, colors.goldMuted]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Reanimated.View>
          <Reanimated.View style={[styles.thumb, thumbStyle]}>
            <View style={styles.thumbCore} />
          </Reanimated.View>
        </View>
      </Pressable>
      <View style={styles.times}><Text style={styles.time}>{elapsed}</Text><Text style={styles.time}>{duration}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  seekArea: { height: 28, justifyContent: 'center', marginHorizontal: 2 },
  track: { height: 7, borderRadius: 4, backgroundColor: 'rgba(248,244,238,0.12)' },
  progress: { height: '100%', overflow: 'hidden', borderRadius: 4 },
  thumb: { position: 'absolute', top: -6, width: 19, height: 19, marginLeft: -9, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: 'rgba(227,181,90,0.18)', shadowColor: colors.goldMuted, shadowOpacity: 0.82, shadowRadius: 10, elevation: 8 },
  thumbCore: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.goldLight },
  times: { marginTop: 3, marginHorizontal: 6, flexDirection: 'row', justifyContent: 'space-between' },
  time: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 10, fontWeight: '600' },
});
