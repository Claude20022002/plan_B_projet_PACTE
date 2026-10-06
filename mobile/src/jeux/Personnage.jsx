import { Image, View } from 'react-native';
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

/** Personnage du joueur, statique */
export default function Personnage({ avatar, idUser, taille = 48 }) {
  return (
    <View style={{ width: taille, height: taille }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Image source={IMAGES[avatarDe(idUser, avatar)]} style={{ width: taille, height: taille }} resizeMode="contain" />
    </View>
  );
}
