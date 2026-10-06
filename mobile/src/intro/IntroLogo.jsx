import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, interpolate, Extrapolation, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Polygon } from 'react-native-svg';

/**
 * Animation de lancement : les douze triangles du logo HESTIM arrivent des bords en tournant et
 * se rejoignent sur la tuile blanche pour former le logo, puis le nom apparaît et l'écran s'efface
 * sur l'application. Rien si le téléphone demande de réduire les animations.
 */

// Couleurs du logo (mobile/assets/logo.png)
const MARINE = '#001861';
const ROUGE = '#DB1F26';
const ORANGE = '#F26322';
const VERT = '#137D3F';

// Grille de 3 × 3 cases ; chaque pièce est un demi-carré (sommets en unités de case)
const PIECES = [
  { couleur: MARINE, points: [[0, 0], [1, 0], [1, 1]] },
  { couleur: ROUGE, points: [[0, 0], [0, 1], [1, 1]] },
  { couleur: MARINE, points: [[1, 0], [1, 1], [2, 1]] },
  { couleur: ORANGE, points: [[2, 0], [3, 0], [2, 1]] },
  { couleur: MARINE, points: [[3, 0], [3, 1], [2, 1]] },
  { couleur: MARINE, points: [[2, 1], [3, 1], [2, 2]] },
  { couleur: VERT, points: [[2, 2], [3, 2], [3, 3]] },
  { couleur: ORANGE, points: [[2, 2], [2, 3], [3, 3]] },
  { couleur: ROUGE, points: [[1, 2], [2, 2], [2, 3]] },
  { couleur: VERT, points: [[1, 2], [1, 3], [0, 3]] },
  { couleur: MARINE, points: [[0, 2], [1, 2], [0, 3]] },
  { couleur: MARINE, points: [[1, 1], [1, 2], [0, 2]] },
].map((p, i) => {
  const cx = p.points.reduce((s, [x]) => s + x, 0) / 3;
  const cy = p.points.reduce((s, [, y]) => s + y, 0) / 3;
  const dx = cx - 1.5;
  const dy = cy - 1.5;
  const norme = Math.hypot(dx, dy) || 1;
  // Ordre des pièces : un tour autour du centre, dans le sens des aiguilles d'une montre
  return { ...p, cx, cy, ux: dx / norme, uy: dy / norme, rotation: (i % 2 ? 1 : -1) * (120 + (i % 3) * 40), retard: 120 + i * 50 };
});

const FOND = '#0B0B0D'; // celui de l'écran de démarrage (app.json)
const TUILE = 128;
const LOGO = 100;
const CASE = LOGO / 3;
const DUREE_TOTALE = 2150;

function Piece({ piece }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(piece.retard, withSpring(1, { damping: 15, stiffness: 150, mass: 0.9 }));
  }, [p, piece.retard]);

  const distance = LOGO * 2.4;
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.35], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateX: (1 - p.value) * piece.ux * distance },
      { translateY: (1 - p.value) * piece.uy * distance },
      { rotate: `${(1 - p.value) * piece.rotation}deg` },
      { scale: interpolate(p.value, [0, 1], [0.4, 1], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: [piece.cx * CASE, piece.cy * CASE, 0] }, style]}>
      <Svg width={LOGO} height={LOGO} viewBox="0 0 3 3">
        <Polygon points={piece.points.map((pt) => pt.join(',')).join(' ')} fill={piece.couleur} stroke={piece.couleur} strokeWidth={0.015} strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}

export default function IntroLogo({ titre, police, onFin }) {
  const reduire = useReducedMotion();
  const tuile = useSharedValue(0);
  const nom = useSharedValue(0);
  const sortie = useSharedValue(0);

  useEffect(() => {
    if (reduire) {
      onFin();
      return undefined;
    }
    tuile.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    nom.value = withDelay(1000, withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }));
    sortie.value = withDelay(1780, withTiming(1, { duration: 340, easing: Easing.in(Easing.quad) }));
    const fin = setTimeout(onFin, DUREE_TOTALE);
    return () => clearTimeout(fin);
  }, [reduire, onFin, tuile, nom, sortie]);

  const styleEcran = useAnimatedStyle(() => ({ opacity: 1 - sortie.value }));
  const styleTuile = useAnimatedStyle(() => ({
    opacity: tuile.value,
    transform: [{ scale: interpolate(tuile.value, [0, 1], [0.82, 1]) + sortie.value * 0.06 }],
  }));
  const styleNom = useAnimatedStyle(() => ({ opacity: nom.value, transform: [{ translateY: (1 - nom.value) * 10 }] }));

  if (reduire) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.ecran, styleEcran]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.tuile, styleTuile]}>
        <View style={styles.logo}>
          {PIECES.map((piece, i) => (
            <Piece key={i} piece={piece} />
          ))}
        </View>
      </Animated.View>
      <Animated.View style={styleNom}>
        <Text style={[styles.nom, police ? { fontFamily: police } : null]}>{titre}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ecran: { backgroundColor: FOND, alignItems: 'center', justifyContent: 'center', gap: 28, zIndex: 10 },
  tuile: { width: TUILE, height: TUILE, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  logo: { width: LOGO, height: LOGO },
  nom: { color: '#FFFFFF', fontSize: 30, letterSpacing: 3, textTransform: 'uppercase' },
});
