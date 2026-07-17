export interface UserProfile {
  id: string;
  displayName?: string;
  preferredLanguage: string;
}

export interface UserRepository {
  getCurrentUser(): Promise<UserProfile | null>;
  saveProfile(profile: UserProfile): Promise<void>;
}
