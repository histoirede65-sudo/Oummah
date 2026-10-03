import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import type { CommunityAvatar } from '../../features/tahajjud/tahajjudCommunity';
import { night } from './theme';

export const AVATAR_ICONS: Record<CommunityAvatar, keyof typeof Ionicons.glyphMap> = {
  moon: 'moon', star: 'star', sparkles: 'sparkles', leaf: 'leaf', water: 'water', flame: 'flame', sunny: 'sunny', heart: 'heart',
};

/** Round gold avatar of a community member. */
export function MemberAvatar({ avatar, size = 44, dim = false }: { avatar: CommunityAvatar; size?: number; dim?: boolean }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, dim && styles.dim]}>
      <Ionicons name={AVATAR_ICONS[avatar]} size={Math.round(size * 0.48)} color={dim ? night.goldSoft : night.sky0} />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { backgroundColor: night.goldSoft, alignItems: 'center', justifyContent: 'center' },
  dim: { backgroundColor: night.glass, borderWidth: 1, borderColor: night.goldLine },
});
