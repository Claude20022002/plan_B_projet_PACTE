import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

/**
 * Verre dépoli aux couleurs du thème : Liquid Glass sur iOS 26, flou natif sur les iOS plus
 * anciens, voile presque opaque sur Android (le flou y exigerait d'envelopper chaque écran).
 * Un voile de la couleur du fond garde le texte lisible quel que soit le contenu dessous.
 */

const verreLiquide = (() => {
  try {
    return Platform.OS === 'ios' && isLiquidGlassAvailable();
  } catch {
    return false;
  }
})();
const flouNatif = Platform.OS === 'ios';

/** @param {{ opacite?: number }} opacite part du voile de couleur posé sur le flou (0 à 1) */
export function Verre({ style, opacite = 0.6, children }) {
  const { verre, sombre } = useTheme();
  if (verreLiquide) {
    return (
      <GlassView style={style} glassEffectStyle="regular" colorScheme={sombre ? 'dark' : 'light'} tintColor={`rgba(${verre.rgb}, ${opacite * 0.5})`}>
        {children}
      </GlassView>
    );
  }
  // Sans flou, un voile transparent laisserait lire le texte du dessous : presque opaque
  const voile = { backgroundColor: `rgba(${verre.rgb}, ${flouNatif ? opacite : Math.min(1, opacite + 0.36)})` };
  if (flouNatif) {
    return (
      <BlurView style={style} intensity={60} tint={verre.teinte}>
        <View style={[StyleSheet.absoluteFill, voile]} />
        {children}
      </BlurView>
    );
  }
  return <View style={[style, voile]}>{children}</View>;
}

/** Fond flouté et assombri derrière une feuille (iOS) ; assombri seulement ailleurs */
export function FondFlou({ style }) {
  if (!flouNatif) return <View style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.55)' }]} />;
  return (
    <BlurView style={style} intensity={24} tint="dark">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]} />
    </BlurView>
  );
}

/** Hauteur de la barre d'onglets, sans la zone sûre du bas */
export const HAUTEUR_ONGLETS = 62;

/** Marge à laisser sous le contenu d'un onglet : la barre d'onglets, en verre, passe par-dessus */
export const useMargeOnglets = (supplement = 16) => HAUTEUR_ONGLETS + useSafeAreaInsets().bottom + supplement;
