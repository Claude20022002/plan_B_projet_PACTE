import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { creerStyles } from '../theme';
import { FondFlou, Verre } from './Verre';

/**
 * Feuille glissée du bas, commune aux fenêtres de l'application (Espaces, détail d'une séance,
 * choix du personnage) : le fond se floute et s'assombrit, la feuille en verre monte par-dessus.
 * Toucher le fond ferme la feuille.
 */
export default function Feuille({ visible = true, fermer, style, children }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const marges = useSafeAreaInsets();
  const reduire = useReducedMotion();
  // 1 = fermée (sous l'écran), 0 = ouverte. Animation maison : SlideInDown de Reanimated reste
  // décalée dans une fenêtre Modal sur Android.
  const position = useSharedValue(reduire ? 0 : 1);
  const fond = useSharedValue(reduire ? 1 : 0);
  useEffect(() => {
    if (!visible || reduire) return;
    position.value = 1;
    fond.value = 0;
    position.value = withSpring(0, { damping: 20, stiffness: 180 });
    fond.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
  }, [visible, reduire, position, fond]);
  const styleFond = useAnimatedStyle(() => ({ opacity: fond.value }));
  const styleFeuille = useAnimatedStyle(() => ({ transform: [{ translateY: position.value * 700 }] }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={fermer} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.cadre}>
        <Animated.View style={[StyleSheet.absoluteFill, styleFond]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={fermer} accessibilityRole="button" accessibilityLabel={t('app.commun.fermer')}>
            <FondFlou style={StyleSheet.absoluteFill} />
          </Pressable>
        </Animated.View>
        <Animated.View style={[styles.feuille, { paddingBottom: marges.bottom + 16 }, style, styleFeuille]}>
          <Verre style={StyleSheet.absoluteFill} opacite={0.82} />
          <View style={styles.poignee} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const useStyles = creerStyles((t) => ({
  cadre: { flex: 1, justifyContent: 'flex-end' },
  feuille: {
    overflow: 'hidden',
    borderTopLeftRadius: t.rayons.lg + 10,
    borderTopRightRadius: t.rayons.lg + 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: t.verre.bord,
  },
  poignee: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.couleurs.filet, marginTop: 8 },
}));
