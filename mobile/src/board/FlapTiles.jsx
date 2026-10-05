import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { creerStyles, DECALAGE_VOLET_MS } from '../theme';

/**
 * Tuiles à volets : réservées à l'heure de la prochaine séance. Un caractère ne bascule que
 * lorsqu'il change (cascade de gauche à droite) ; rien ne bouge si le téléphone demande de
 * réduire les animations.
 */
function Volet({ caractere, rang, taille }) {
  const reduire = useReducedMotion();
  const precedent = useRef(caractere);
  const rotation = useSharedValue(0);
  const styles = useStyles();

  useEffect(() => {
    if (precedent.current === caractere) return;
    precedent.current = caractere;
    if (reduire) return;
    rotation.value = -90;
    rotation.value = withDelay(rang * DECALAGE_VOLET_MS, withTiming(0, { duration: 180 }));
  }, [caractere, rang, reduire, rotation]);

  const style = useAnimatedStyle(() => ({ transform: [{ perspective: 400 }, { rotateX: `${rotation.value}deg` }] }));

  return (
    <Animated.View style={[styles.volet, { width: taille * 0.72, height: taille * 1.2 }, style]}>
      <Text style={[styles.lettre, { fontSize: taille }]} maxFontSizeMultiplier={1.4}>
        {caractere}
      </Text>
      {/* Charnière horizontale au milieu du volet */}
      <View style={styles.charniere} />
    </Animated.View>
  );
}

export default function FlapTiles({ valeur, taille = 40, accessibilityLabel }) {
  const styles = useStyles();
  return (
    <View style={styles.rangee} accessible accessibilityLabel={accessibilityLabel ?? valeur}>
      {String(valeur)
        .split('')
        .map((c, i) => (
          <Volet key={i} caractere={c} rang={i} taille={taille} />
        ))}
    </View>
  );
}

const useStyles = creerStyles((t) => ({
  rangee: { flexDirection: 'row', gap: 3 },
  volet: {
    backgroundColor: t.volet.fond,
    borderRadius: t.rayons.xs,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lettre: { color: t.volet.lettre, fontFamily: t.polices.panneauGras, fontVariant: ['tabular-nums'] },
  charniere: { position: 'absolute', left: 0, right: 0, top: '50%', height: 1, backgroundColor: t.volet.charniere },
}));
