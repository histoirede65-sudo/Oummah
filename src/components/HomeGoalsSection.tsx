import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { isGoalComplete } from '../features/daily-goals/domain/DailyGoal';
import { useDailyGoalsViewModel } from '../features/daily-goals/presentation/useDailyGoalsViewModel';
import HadithCard from './home/HadithCard';
import VerseOfDayCard from './home/VerseOfDayCard';
import { getValidSession } from '../features/auth/SupabaseAuthService';
import { useI18n } from '../i18n';

export default function HomeGoalsSection() {
  const { t } = useI18n();
  const goalsModel = useDailyGoalsViewModel();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getValidSession()
        .then((session) => {
          if (active) setIsAuthenticated(Boolean(session));
        })
        .catch(() => {
          if (active) setIsAuthenticated(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );
  const allGoals = goalsModel.plan?.goals ?? [];
  const visibleGoals = allGoals.slice(0, 6);
  const dailyProgress = Math.max(0, Math.min(1, goalsModel.summary?.progress ?? 0));
  return (
    <View style={styles.section}>
      <View style={styles.dailyRow}>
        <HadithCard />
        <VerseOfDayCard />
      </View>

      <Pressable
        onPress={() => router.push(isAuthenticated ? '/daily-goals' : '/profile')}
        style={({ pressed }) => [
          styles.card,
          styles.goalsCard,
          visibleGoals.length > 3 && styles.goalsCardExpanded,
          isAuthenticated && styles.authenticatedGoalsCard,
          !isAuthenticated && styles.signupCard,
          pressed && styles.pressed,
        ]}
      >
        {!isAuthenticated ? (
          <View style={styles.signupContent}>
            <View style={styles.signupIcon}>
              <Ionicons name="person-add-outline" size={21} color="#16111B" />
            </View>
            <Text style={styles.signupTitle}>{t('home.createGoals')}</Text>
            <Text style={styles.signupText}>
              {t('home.createGoalsDescription')}
            </Text>
            <Text style={styles.signupLink}>{t('home.createProfileArrow')}</Text>
          </View>
        ) : (
        <View style={styles.authenticatedContent}>
        <View
          pointerEvents="none"
          style={[
            styles.progressBackgroundFill,
            dailyProgress >= 1
              ? { right: 0 }
              : { width: `${dailyProgress * 100}%` },
          ]}
        >
          <LinearGradient
            colors={['rgba(98,197,139,0.18)', 'rgba(98,197,139,0.30)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <View style={styles.heading}>
          <Text style={styles.title}>{t('home.goalsToday')}</Text>
          <Text style={styles.counter}>
            {goalsModel.summary?.completed ?? 0} / {goalsModel.summary?.total ?? 0}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={['#F5A927', '#FFE68D']}
            style={[
              styles.progress,
              { width: `${(goalsModel.summary?.progress ?? 0) * 100}%` },
            ]}
          />
        </View>
        {visibleGoals.map((goal) => {
          const done = isGoalComplete(goal);
          return (
          <View
            key={goal.id}
            style={[styles.goal, visibleGoals.length > 3 && styles.goalCompact]}
          >
            <Ionicons
              name={done ? 'checkmark-circle' : 'ellipse-outline'}
              size={visibleGoals.length > 3 ? 14 : 16}
              color="#F2B535"
            />
            <Text numberOfLines={1} style={styles.goalText}>
              {goal.title}
            </Text>
          </View>
        )})}
        </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  dailyRow: {
    height: 134,
    marginBottom: 7,
    flexDirection: 'row',
    gap: 7,
  },
  card: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#141923',
  },
  dalilCard: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookCircle: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(227,181,90,0.28)',
    backgroundColor: 'rgba(21,25,33,0.76)',
  },
  dalilContent: { flex: 1, minWidth: 0, marginLeft: 9 },
  title: {
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 15,
  },
  quote: {
    marginTop: 5,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 9.5,
    lineHeight: 14,
  },
  reference: {
    marginTop: 6,
    color: '#E7AB38',
    fontFamily: typography.sans,
    fontSize: 9,
  },
  arrow: {
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: 'rgba(17,21,29,0.8)',
  },
  goalsCard: { flex: 0, height: 134, padding: 11 },
  goalsCardExpanded: { height: 150 },
  authenticatedGoalsCard: { padding: 0 },
  authenticatedContent: {
    flex: 1,
    padding: 11,
    overflow: 'hidden',
  },
  progressBackgroundFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    borderTopLeftRadius: 17,
    borderBottomLeftRadius: 17,
  },
  signupCard: {
    justifyContent: 'center',
    borderColor: 'rgba(227,181,90,0.28)',
    backgroundColor: '#171620',
  },
  signupContent: { alignItems: 'center', paddingHorizontal: 5 },
  signupIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: colors.goldLight,
  },
  signupTitle: {
    marginTop: 6,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 13,
  },
  signupText: {
    marginTop: 3,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 8.4,
    lineHeight: 11.5,
    textAlign: 'center',
  },
  signupLink: {
    marginTop: 4,
    color: '#F5B735',
    fontFamily: typography.sans,
    fontSize: 8.5,
    fontWeight: '700',
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counter: {
    color: '#F5B735',
    fontFamily: typography.sans,
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 5,
    marginTop: 7,
    marginBottom: 7,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: '#3A3F48',
  },
  progress: { width: '33%', height: '100%', borderRadius: 4 },
  goal: {
    height: 21,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalCompact: {
    height: 15,
  },
  goalText: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 10.5,
    lineHeight: 12,
  },
  pressed: { opacity: 0.72 },
});
