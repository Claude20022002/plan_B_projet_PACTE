import { Image, View } from 'react-native';
import { useTheme } from '../theme';

/** Décor Kenney Background Elements (CC0) : silhouettes blanches teintées aux couleurs du thème */
const DECOR = {
  collines: require('../../assets/jeux/decor/hills1.png'),
  nuage1: require('../../assets/jeux/decor/cloud1.png'),
  nuage2: require('../../assets/jeux/decor/cloud4.png'),
  nuage3: require('../../assets/jeux/decor/cloud7.png'),
  sapin: require('../../assets/jeux/decor/tree03.png'),
  arbre: require('../../assets/jeux/decor/tree08.png'),
};

const RATIO_COLLINES = 1001 / 128;

/**
 * Scène des jeux (reprise de CatéGO) : ciel, nuages, arbres et collines derrière le contenu. Le
 * décor est purement visuel : ignoré par les lecteurs d'écran.
 */
export default function Scene({ hauteur = 156, children }) {
  const { scene } = useTheme();
  const teinte = (couleur) => ({ tintColor: couleur });
  return (
    <View style={{ height: hauteur, backgroundColor: scene.ciel, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none">
        <Image source={DECOR.nuage1} style={[{ position: 'absolute', top: 14, right: 28, width: 74, height: 50 }, teinte(scene.nuages)]} resizeMode="contain" />
        <Image source={DECOR.nuage2} style={[{ position: 'absolute', top: 44, right: 118, width: 50, height: 32 }, teinte(scene.nuages)]} resizeMode="contain" />
        <Image source={DECOR.nuage3} style={[{ position: 'absolute', top: 8, left: '42%', width: 44, height: 26 }, teinte(scene.nuages)]} resizeMode="contain" />
        <Image source={DECOR.sapin} style={[{ position: 'absolute', bottom: 26, right: 26, width: 30, height: 58 }, teinte(scene.arbres)]} resizeMode="contain" />
        <Image source={DECOR.arbre} style={[{ position: 'absolute', bottom: 22, right: 58, width: 22, height: 40 }, teinte(scene.arbres)]} resizeMode="contain" />
        <Image source={DECOR.collines} style={[{ position: 'absolute', bottom: 0, left: 0, width: '100%', aspectRatio: RATIO_COLLINES }, teinte(scene.collines)]} resizeMode="stretch" />
      </View>
      {children}
    </View>
  );
}
