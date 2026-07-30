export type DeclaredLevel =
  | "beginner"
  | "foundations"
  | "intermediate"
  | "advanced"
  | "adaptive";

export type CurrentRegularity =
  | "not_regular"
  | "occasionally"
  | "weekly"
  | "almost_daily"
  | "daily";

export type AgeRange =
  | "under_18"
  | "18_24"
  | "25_34"
  | "35_44"
  | "45_54"
  | "55_plus"
  | "prefer_not_to_say";

export type LearningPreference =
  | "short_sessions"
  | "structured_program"
  | "audio"
  | "reading"
  | "memorization"
  | "revision"
  | "questions_with_wasil";

export type ProgressDomain =
  | "prayer"
  | "quran_reading"
  | "quran_memorization"
  | "arabic"
  | "hadith"
  | "dua"
  | "aqida"
  | "fiqh"
  | "character"
  | "regularity";

export type UserProfile = {
  userId: string;
  displayName: string | null;
  ageRange: AgeRange | null;
  declaredLevel: DeclaredLevel | null;
  adaptiveLevelEnabled: boolean;
  currentRegularity: CurrentRegularity | null;
  dailyTimeMinutes: number | null;
  weeklyTimeMinutes: number | null;
  primaryGoals: ProgressDomain[];
  learningPreferences: LearningPreference[];
  progressDomains: ProgressDomain[];
  onboardingStep: number;
  profileCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserProfileDraft = {
  userId: string;
  displayName?: string | null;
  ageRange?: AgeRange | null;
  declaredLevel?: DeclaredLevel | null;
  adaptiveLevelEnabled?: boolean;
  currentRegularity?: CurrentRegularity | null;
  dailyTimeMinutes?: number | null;
  weeklyTimeMinutes?: number | null;
  primaryGoals?: ProgressDomain[];
  learningPreferences?: LearningPreference[];
  progressDomains?: ProgressDomain[];
  onboardingStep?: number;
  profileCompleted?: boolean;
  completedAt?: string | null;
};

export type UserProfileUpdate = Partial<
  Omit<UserProfileDraft, "userId">
>;

export interface UserRepository {
  getCurrentUser(): Promise<UserProfile | null>;
  saveProfile(profile: UserProfileDraft): Promise<UserProfile>;
}
