import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type CardPose = 'idle' | 'blink' | 'thinking' | 'reading-quran' | 'wave';

const cardPoseSources = {
  idle: require('../assets/images/home/wasil-idle.png'),
  blink: require('../assets/images/home/wasil-blink.png'),
  thinking: require('../assets/images/home/wasil-thinking.png'),
  'reading-quran-1': require('../assets/images/home/wasil-reading-quran-1.png'),
  'reading-quran-2': require('../assets/images/home/wasil-reading-quran-2.png'),
  'wave-1': require('../assets/images/home/wasil-wave-1.png'),
  'wave-2': require('../assets/images/home/wasil-wave-2.png'),
  'wave-3': require('../assets/images/home/wasil-wave-3.png'),
} as const;

const suggestions = [
  {
    label: 'Explique ce verset',
    icon: 'book-outline',
    route: '/dalil',
  },
  {
    label: 'Quel dhikr aujourd’hui ?',
    icon: 'repeat-outline',
    route: '/dalil',
  },
  {
    label: 'Mosquée la plus proche',
    icon: 'business-outline',
    route: '/mosques',
  },
] as const;

export default function DalilCard() {
  const [question, setQuestion] = useState('');
  const [pose, setPose] = useState<CardPose>('idle');
  const float = useRef(new Animated.Value(0)).current;
  const gestureX = useRef(new Animated.Value(0)).current;
  const gestureY = useRef(new Animated.Value(0)).current;
  const gestureTilt = useRef(new Animated.Value(0)).current;
  const gestureScale = useRef(new Animated.Value(1)).current;
  const glowPulse = useRef(new Animated.Value(0.28)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const poseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poseSafetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recentPoses = useRef<CardPose[]>(['idle']);
  const specialAnimationInProgress = useRef(false);
  const idleCooldownUntil = useRef(0);

  useEffect(() => {
    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: -6,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const move = (
      value: Animated.Value,
      toValue: number,
      duration: number,
    ) =>
      Animated.timing(value, {
        toValue,
        duration,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });

    const gestureAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(2200),
        // Petit coucou : Wasil se balance doucement trois fois.
        move(gestureTilt, -1, 150),
        move(gestureTilt, 1, 190),
        move(gestureTilt, -1, 190),
        move(gestureTilt, 1, 190),
        move(gestureTilt, 0, 180),
        Animated.delay(3600),
        // Réflexion / gratte-tête : la main levée se rapproche de la tête.
        Animated.parallel([
          move(gestureX, -7, 380),
          move(gestureY, -3, 380),
          move(gestureTilt, -0.72, 380),
          move(gestureScale, 1.025, 380),
        ]),
        move(gestureTilt, -0.45, 170),
        move(gestureTilt, -0.82, 170),
        move(gestureTilt, -0.5, 170),
        Animated.delay(420),
        Animated.parallel([
          move(gestureX, 0, 420),
          move(gestureY, 0, 420),
          move(gestureTilt, 0, 420),
          move(gestureScale, 1, 420),
        ]),
        Animated.delay(4300),
        // Petit salut vers l’utilisateur.
        Animated.parallel([
          move(gestureY, -5, 230),
          move(gestureScale, 1.045, 230),
        ]),
        move(gestureTilt, 0.7, 160),
        move(gestureTilt, -0.55, 160),
        move(gestureTilt, 0.7, 160),
        move(gestureTilt, 0, 190),
        Animated.parallel([
          move(gestureY, 0, 260),
          move(gestureScale, 1, 260),
        ]),
      ]),
    );

    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.72,
          duration: 1350,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.28,
          duration: 1350,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    floatingAnimation.start();
    gestureAnimation.start();
    glowAnimation.start();
    return () => {
      floatingAnimation.stop();
      gestureAnimation.stop();
      glowAnimation.stop();
    };
  }, [float, gestureScale, gestureTilt, gestureX, gestureY, glowPulse]);

  useEffect(() => {
    const clearTimers = () => {
      if (poseTimer.current) clearTimeout(poseTimer.current);
      if (poseSafetyTimer.current) clearTimeout(poseSafetyTimer.current);
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
      poseTimer.current = null;
      blinkTimer.current = null;
    };
    const scheduleNext = (minimum: number, maximum: number) => {
      poseTimer.current = setTimeout(() => {
        if (
          specialAnimationInProgress.current ||
          Date.now() < idleCooldownUntil.current
        ) {
          scheduleNext(6000, 10000);
          return;
        }
        specialAnimationInProgress.current = true;
        const options: CardPose[] = ['thinking', 'reading-quran', 'wave'];
        const available = options.filter((next) => !recentPoses.current.includes(next));
        const pool = available.length
          ? available
          : options.filter((next) => next !== recentPoses.current[recentPoses.current.length - 1]);
        const weighted = Math.random();
        const weightedIndex = weighted < 0.45 ? 0 : weighted < 0.80 ? 1 : 2;
        const next = pool.length
          ? pool[Math.min(weightedIndex, pool.length - 1)]
          : 'idle';
        recentPoses.current = [...recentPoses.current, next].slice(-2);
        setPose(next);
        const finishSpecialPose = () => {
          if (poseSafetyTimer.current) clearTimeout(poseSafetyTimer.current);
          poseSafetyTimer.current = null;
          setPose('idle');
          recentPoses.current = [...recentPoses.current, 'idle' as CardPose].slice(-2);
          specialAnimationInProgress.current = false;
          idleCooldownUntil.current = Date.now() + 5000;
          scheduleNext(8000, 13000);
        };
        if (next === 'idle') {
          specialAnimationInProgress.current = false;
          idleCooldownUntil.current = Date.now() + 6000;
          scheduleNext(8000, 13000);
          return;
        }
        if (next === 'reading-quran') {
          poseTimer.current = setTimeout(() => {
            finishSpecialPose();
          }, 4600);
          poseSafetyTimer.current = setTimeout(finishSpecialPose, 5100);
        } else if (next === 'wave') {
          poseTimer.current = setTimeout(() => {
            finishSpecialPose();
          }, 2600);
          poseSafetyTimer.current = setTimeout(finishSpecialPose, 3100);
        } else if (next === 'thinking') {
          poseTimer.current = setTimeout(() => {
            finishSpecialPose();
          }, 3800);
          poseSafetyTimer.current = setTimeout(finishSpecialPose, 4300);
        } else {
          scheduleNext(8000, 13000);
        }
      }, minimum + Math.floor(Math.random() * (maximum - minimum + 1)));
    };
    const scheduleBlink = () => {
      blinkTimer.current = setTimeout(() => {
        if (recentPoses.current[recentPoses.current.length - 1] === 'idle') {
          setPose('blink');
          poseTimer.current = setTimeout(() => {
            setPose('idle');
            recentPoses.current = [...recentPoses.current, 'idle' as CardPose].slice(-2);
            specialAnimationInProgress.current = false;
            idleCooldownUntil.current = Date.now() + 5000;
            scheduleNext(8000, 13000);
          }, 160);
        }
        scheduleBlink();
      }, 5000 + Math.floor(Math.random() * 5001));
    };

    scheduleNext(5000, 8000);
    scheduleBlink();
    return clearTimers;
  }, []);

  const cardPoseSource =
    pose === 'blink'
      ? cardPoseSources.blink
      : pose === 'thinking'
        ? cardPoseSources.thinking
      : pose === 'reading-quran'
          ? cardPoseSources['reading-quran-1']
      : pose === 'wave'
        ? cardPoseSources['wave-2']
        : cardPoseSources.idle;

  const mascotRotation = gestureTilt.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg'],
  });

  const openWasilWithQuestion = () => {
    const prompt = question.trim();
    if (!prompt) return;
    router.push({
      pathname: '/dalil',
      params: { prompt, autoSubmit: '1', requestKey: String(Date.now()) },
    });
  };

  return (
    <Pressable
      accessibilityLabel="Ouvrir Wasil"
      onPress={() => router.push('/dalil')}
      onPressIn={() => {
        Animated.timing(pressScale, {
          toValue: 0.97,
          duration: 80,
          useNativeDriver: true,
        }).start();
      }}
      onPressOut={() => {
        Animated.timing(pressScale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }).start();
      }}
      style={styles.card}
    >
      <LinearGradient
        colors={[
          'rgba(78,63,70,0.74)',
          'rgba(31,28,38,0.88)',
          'rgba(13,17,25,0.96)',
        ]}
        locations={[0, 0.42, 1]}
        style={[StyleSheet.absoluteFill, styles.cardGradient]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, { opacity: glowPulse }]}
      />

      <View style={styles.askRow}>
        <Animated.Image
          source={cardPoseSource}
          resizeMode="contain"
          style={[
            styles.mascot,
            {
              transform: [
                { translateY: Animated.add(float, gestureY) },
                { translateX: gestureX },
                { rotate: mascotRotation },
                {
                  scale:
                    pose === 'reading-quran'
                      ? 1
                      : Animated.multiply(gestureScale, pressScale),
                },
              ],
            },
          ]}
        />
        <View style={styles.prompt}>
          <TextInput
            accessibilityLabel="Écrire une question à Wasil"
            autoCapitalize="sentences"
            onChangeText={setQuestion}
            onPressIn={(event) => event.stopPropagation()}
            onSubmitEditing={openWasilWithQuestion}
            placeholder="Demandez quelque chose à Wasil…"
            placeholderTextColor="#A9A2AA"
            returnKeyType="send"
            style={styles.promptInput}
            value={question}
          />
          <Pressable
            accessibilityLabel="Envoyer à Wasil"
            disabled={!question.trim()}
            onPress={openWasilWithQuestion}
            style={({ pressed }) => [
              styles.send,
              !question.trim() && styles.sendDisabled,
              pressed && question.trim() && styles.sendPressed,
            ]}
          >
            <Ionicons name="navigate" size={22} color="#14131A" />
          </Pressable>
        </View>
      </View>

      <View style={styles.suggestions}>
        {suggestions.map((suggestion) => (
          <Pressable
            key={suggestion.label}
            onPress={() => router.push(suggestion.route)}
            style={({ pressed }) => [
              styles.suggestion,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={suggestion.icon}
              size={20}
              color={colors.goldLight}
            />
            <Text
              numberOfLines={2}
              adjustsFontSizeToFit
              style={styles.suggestionText}
            >
              {suggestion.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 166,
    marginBottom: 10,
    overflow: 'visible',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,235,210,0.24)',
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  cardGradient: { borderRadius: 25 },
  glow: {
    position: 'absolute',
    top: -1,
    right: 35,
    left: 35,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.52)',
    shadowColor: '#F6C967',
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  askRow: {
    height: 99,
    paddingTop: 19,
    paddingRight: 18,
    paddingLeft: 112,
    justifyContent: 'center',
  },
  mascot: {
    position: 'absolute',
    zIndex: 3,
    left: 7,
    bottom: -2,
    width: 114,
    height: 132,
  },
  prompt: {
    height: 58,
    paddingLeft: 12,
    paddingRight: 7,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: 'rgba(22,22,28,0.66)',
  },
  promptInput: {
    flex: 1,
    height: '100%',
    color: '#D8D2D7',
    fontFamily: typography.sans,
    fontSize: 13,
  },
  send: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: '#E8B447',
    shadowColor: '#F6B83B',
    shadowOpacity: 0.85,
    shadowRadius: 11,
  },
  sendDisabled: { opacity: 0.42 },
  sendPressed: { opacity: 0.72, transform: [{ scale: 0.94 }] },
  suggestions: {
    height: 55,
    paddingHorizontal: 10,
    flexDirection: 'row',
    gap: 7,
  },
  suggestion: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(23,25,31,0.86)',
  },
  suggestionText: {
    flexShrink: 1,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 10.5,
    lineHeight: 14,
  },
  pressed: { opacity: 0.68, transform: [{ scale: 0.985 }] },
});
