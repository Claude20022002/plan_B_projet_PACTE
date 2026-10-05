import { useEffect } from 'react';
import { Image } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { avatarDe } from '../../../shared/jeux/avatars.js';

/** Personnages Kenney Mini Characters (CC0, repris de CatéGO) : assets/jeux/LICENCE-kenney.txt */
const IMAGES = {
  'female-a': require('../../assets/jeux/personnages/female-a.png'),
  'female-b': require('../../assets/jeux/personnages/female-b.png'),
  'female-c': require('../../assets/jeux/personnages/female-c.png'),
  'female-d': require('../../assets/jeux/personnages/female-d.png'),
  'female-e': require('../../assets/jeux/personnages/female-e.png'),
  'female-f': require('../../assets/jeux/personnages/female-f.png'),
  'male-a': require('../../assets/jeux/personnages/male-a.png'),
  'male-b': require('../../assets/jeux/personnages/male-b.png'),
  'male-c': require('../../assets/jeux/personnages/male-c.png'),
  'male-d': require('../../assets/jeux/personnages/male-d.png'),
  'male-e': require('../../assets/jeux/personnages/male-e.png'),
  'male-f': require('../../assets/jeux/personnages/male-f.png'),
};

/**
 * Personnage du joueur. `anime` : léger rebond et balancement en boucle (comme les personnages
 * de CatéGO), immobile si le téléphone demande de réduire les animations.
 */
export default function Personnage({ avatar, idUser, taille = 48, anime = false }) {
  const reduire = useReducedMotion();
  const phase = useSharedValue(0);

  useEffect(() => {
    if (!anime || reduire) return undefined;
    phase.value = withRepeat(withSequence(withTiming(1, { duration: 650, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 650, easing: Easing.inOut(Easing.quad) })), -1);
    return () => {
      phase.value = 0;
    };
  }, [anime, reduire, phase]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -phase.value * taille * 0.08 }, { rotate: `${(phase.value - 0.5) * 6}deg` }],
  }));

  return (
    <Animated.View style={[{ width: taille, height: taille }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Image source={IMAGES[avatarDe(idUser, avatar)]} style={{ width: taille, height: taille }} resizeMode="contain" />
    </Animated.View>
  );
}
