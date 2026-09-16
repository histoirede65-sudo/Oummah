import {
  getValidSession,
  type SupabaseAuthSession,
} from "../auth/SupabaseAuthService";
import type {
  UserProfile,
  UserProfileDraft,
  UserProfileUpdate,
} from "../../core/repositories/UserRepository";

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  age_range: UserProfile["ageRange"];
  declared_level: UserProfile["declaredLevel"];
  adaptive_level_enabled: boolean;
  current_regularity: UserProfile["currentRegularity"];
  daily_time_minutes: number | null;
  weekly_time_minutes: number | null;
  primary_goals: UserProfile["primaryGoals"];
  learning_preferences: UserProfile["learningPreferences"];
  progress_domains: UserProfile["progressDomains"];
  onboarding_step: number;
  profile_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileRepositoryErrorCode =
  | "not-configured"
  | "authentication-required"
  | "forbidden-user"
  | "invalid-profile"
  | "profile-not-found"
  | "network-error"
  | "request-failed";

export class ProfileRepositoryError extends Error {
  constructor(
    readonly code: ProfileRepositoryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ProfileRepositoryError";
  }
}

function configuration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();
  if (!url || !key) {
    throw new ProfileRepositoryError(
      "not-configured",
      "Le service de profil n’est pas configuré.",
    );
  }
  return { url, key };
}

async function authenticatedSession(expectedUserId?: string) {
  const session = await getValidSession();
  if (!session) {
    throw new ProfileRepositoryError(
      "authentication-required",
      "Une session authentifiée est nécessaire pour accéder au profil.",
    );
  }
  if (expectedUserId && session.user.id !== expectedUserId) {
    throw new ProfileRepositoryError(
      "forbidden-user",
      "Le profil demandé ne correspond pas à l’utilisateur authentifié.",
    );
  }
  return session;
}

async function profileRequest(
  path: string,
  init: RequestInit = {},
  expectedUserId?: string,
) {
  const { url, key } = configuration();
  let session = await authenticatedSession(expectedUserId);
  const send = (activeSession: SupabaseAuthSession) =>
    fetch(`${url}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: key,
        Authorization: `Bearer ${activeSession.accessToken}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

  let response: Response;
  try {
    response = await send(session);
    if (response.status === 401) {
      const refreshed = await getValidSession(true);
      if (!refreshed) {
        throw new ProfileRepositoryError(
          "authentication-required",
          "La session a expiré. Reconnectez-vous pour accéder au profil.",
        );
      }
      if (expectedUserId && refreshed.user.id !== expectedUserId) {
        throw new ProfileRepositoryError(
          "forbidden-user",
          "Le profil demandé ne correspond pas à l’utilisateur authentifié.",
        );
      }
      session = refreshed;
      response = await send(session);
    }
  } catch (error) {
    if (error instanceof ProfileRepositoryError) throw error;
    throw new ProfileRepositoryError(
      "network-error",
      "Le service de profil est momentanément inaccessible.",
    );
  }

  if (!response.ok) {
    throw new ProfileRepositoryError(
      "request-failed",
      `La requête de profil a échoué (${response.status}).`,
    );
  }
  return response;
}

function profileFromRow(row: ProfileRow): UserProfile {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    ageRange: row.age_range,
    declaredLevel: row.declared_level,
    adaptiveLevelEnabled: row.adaptive_level_enabled,
    currentRegularity: row.current_regularity,
    dailyTimeMinutes: row.daily_time_minutes,
    weeklyTimeMinutes: row.weekly_time_minutes,
    primaryGoals: row.primary_goals,
    learningPreferences: row.learning_preferences,
    progressDomains: row.progress_domains,
    onboardingStep: row.onboarding_step,
    profileCompleted: row.profile_completed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateMinutes(value: number | null | undefined, field: string) {
  if (value !== undefined && value !== null && (!Number.isInteger(value) || value < 0)) {
    throw new ProfileRepositoryError(
      "invalid-profile",
      `${field} doit être un nombre entier positif ou nul.`,
    );
  }
}

function validateProfile(value: UserProfileDraft | UserProfileUpdate) {
  validateMinutes(value.dailyTimeMinutes, "Le temps quotidien");
  validateMinutes(value.weeklyTimeMinutes, "Le temps hebdomadaire");
  if (
    value.onboardingStep !== undefined &&
    (!Number.isInteger(value.onboardingStep) || value.onboardingStep < 1)
  ) {
    throw new ProfileRepositoryError(
      "invalid-profile",
      "L’étape d’onboarding doit être supérieure ou égale à 1.",
    );
  }
}

function rowFromProfile(value: UserProfileDraft | UserProfileUpdate) {
  validateProfile(value);
  const row: Record<string, unknown> = {};
  const assign = (key: string, field: keyof typeof value) => {
    if (value[field] !== undefined) row[key] = value[field];
  };
  assign("display_name", "displayName");
  assign("age_range", "ageRange");
  assign("declared_level", "declaredLevel");
  assign("adaptive_level_enabled", "adaptiveLevelEnabled");
  assign("current_regularity", "currentRegularity");
  assign("daily_time_minutes", "dailyTimeMinutes");
  assign("weekly_time_minutes", "weeklyTimeMinutes");
  assign("primary_goals", "primaryGoals");
  assign("learning_preferences", "learningPreferences");
  assign("progress_domains", "progressDomains");
  assign("onboarding_step", "onboardingStep");
  assign("profile_completed", "profileCompleted");
  assign("completed_at", "completedAt");
  return row;
}

async function rowsFromResponse(response: Response) {
  return (await response.json()) as ProfileRow[];
}

export async function getCurrentUserProfile() {
  const session = await authenticatedSession();
  return getProfileByUserId(session.user.id);
}

export async function getProfileByUserId(userId: string) {
  const response = await profileRequest(
    `profiles?user_id=eq.${encodeURIComponent(userId)}&select=*`,
    undefined,
    userId,
  );
  const [row] = await rowsFromResponse(response);
  return row ? profileFromRow(row) : null;
}

export async function createProfileDraft(userId: string) {
  const existing = await getProfileByUserId(userId);
  if (existing) return existing;

  const response = await profileRequest(
    "profiles?on_conflict=user_id&select=*",
    {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify({ user_id: userId }),
    },
    userId,
  );
  const [created] = await rowsFromResponse(response);
  if (created) return profileFromRow(created);

  const concurrent = await getProfileByUserId(userId);
  if (concurrent) return concurrent;
  throw new ProfileRepositoryError(
    "request-failed",
    "Le brouillon de profil n’a pas pu être créé.",
  );
}

export async function upsertProfile(profile: UserProfileDraft) {
  await authenticatedSession(profile.userId);
  const response = await profileRequest(
    "profiles?on_conflict=user_id&select=*",
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        user_id: profile.userId,
        ...rowFromProfile(profile),
      }),
    },
    profile.userId,
  );
  const [row] = await rowsFromResponse(response);
  if (!row) {
    throw new ProfileRepositoryError(
      "request-failed",
      "Le profil n’a pas pu être enregistré.",
    );
  }
  return profileFromRow(row);
}

export async function updateProfile(
  userId: string,
  patch: UserProfileUpdate,
) {
  const values = rowFromProfile(patch);
  if (!Object.keys(values).length) {
    const current = await getProfileByUserId(userId);
    if (current) return current;
    throw new ProfileRepositoryError("profile-not-found", "Le profil est introuvable.");
  }
  const response = await profileRequest(
    `profiles?user_id=eq.${encodeURIComponent(userId)}&select=*`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(values),
    },
    userId,
  );
  const [row] = await rowsFromResponse(response);
  if (!row) {
    throw new ProfileRepositoryError("profile-not-found", "Le profil est introuvable.");
  }
  return profileFromRow(row);
}

export function markProfileCompleted(userId: string) {
  return updateProfile(userId, {
    profileCompleted: true,
    completedAt: new Date().toISOString(),
  });
}

export async function isProfileCompleted(userId: string) {
  return (await getProfileByUserId(userId))?.profileCompleted === true;
}
