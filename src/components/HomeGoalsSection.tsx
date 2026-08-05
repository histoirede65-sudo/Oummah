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
import { getValidSession } from '../features/auth/SupabaseAuthService';

export default function HomeGoalsSection() {
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
  const visibleGoals = goalsModel.plan?.goals.slice(0, 3) ?? [];
  const nextGoal = goalsModel.plan?.goals.find((goal) => !isGoalComplete(goal));
  return (
    <View style={styles.row}>
      <HadithCard />

      <Pressable
        onPress={() => router.push(isAuthenticated ? '/daily-goals' : '/profile')}
        style={({ pressed }) => [
          styles.card,
          styles.goalsCard,
          !isAuthenticated && styles.signupCard,
          pressed && styles.pressed,
        ]}
      >
        {!isAuthenticated ? (
          <View style={styles.signupContent}>
            <View style={styles.signupIcon}>
              <Ionicons name="person-add-outline" size={21} color="#16111B" />
            </View>
            <Text style={styles.signupTitle}>Créez vos objectifs</Text>
            <Text style={styles.signupText}>
              Inscrivez-vous gratuitement pour créer vos objectifs et suivre votre progression.
            </Text>
            <Text style={styles.signupLink}>Créer mon profil →</Text>
          </View>
        ) : (
        <>
        <View style={styles.heading}>
          <Text style={styles.title}>Objectifs du jour</Text>
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
          <View key={goal.id} style={styles.goal}>
            <Ionicons
              name={done ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color="#F2B535"
            />
            <Text numberOfLines={1} style={styles.goalText}>
              {goal.title}
            </Text>
            <View style={[styles.check, done && styles.checkDone]}>
              {done ? (
                <Ionicons name="checkmark" size={12} color="#11131A" />
              ) : null}
            </View>
          </View>
        )})}
        {nextGoal ? (
          <Text numberOfLines={1} style={styles.nextGoal}>
            Prochain : {nextGoal.title}
          </Text>
        ) : null}
        </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 134,
    marginBottom: 16,
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
  goalsCard: { padding: 11 },
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
  goalText: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 9.5,
  },
  check: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#9197A0',
  },
  checkDone: { borderColor: '#F3B52F', backgroundColor: '#F3B52F' },
  nextGoal: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7.8,
  },
  pressed: { opacity: 0.72 },
});
