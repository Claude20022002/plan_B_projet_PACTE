import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AVATARS } from '../../../shared/jeux/avatars.js';
import { CIBLE_TACTILE, creerStyles, espace, useTheme } from '../theme';
import Feuille from '../verre/Feuille';
import Personnage from './Personnage';

/** Choix du personnage : les douze personnages Kenney, celui du joueur entouré. */
export default function ChoixPersonnage({ visible, actuel, choisir, fermer }) {
  const { t } = useTranslation();
  const { couleurs } = useTheme();
  const styles = useStyles();
  if (!visible) return null;

  return (
    <Feuille fermer={fermer}>
      <View style={styles.entete}>
        <Text style={styles.titre} accessibilityRole="header">
          {t('app.jeux.personnage')}
        </Text>
        <Pressable onPress={fermer} style={styles.fermer} accessibilityRole="button" accessibilityLabel={t('app.commun.fermer')}>
          <MaterialCommunityIcons name="close" size={22} color={couleurs.lettre} />
        </Pressable>
      </View>
      <View style={styles.grille} accessibilityRole="radiogroup">
        {AVATARS.map((avatar, i) => {
          const actif = avatar === actuel;
          return (
            <Pressable
              key={avatar}
              onPress={() => choisir(avatar)}
              style={[styles.case, actif && styles.caseActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: actif }}
              accessibilityLabel={t('app.jeux.personnageN', { n: i + 1 })}
            >
              <Personnage avatar={avatar} taille={52} />
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.credit}>{t('app.jeux.creditKenney')}</Text>
    </Feuille>
  );
}

const useStyles = creerStyles((t) => ({
  entete: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 4, paddingTop: 4 },
  titre: { flex: 1, color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 20, textTransform: t.capitales, letterSpacing: espace(t, 1.2) },
  fermer: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  grille: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 8 },
  case: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.famille === 'planner' ? t.rayons.md : 16,
    backgroundColor: t.couleurs.cellule,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  caseActive: { borderColor: t.famille === 'planner' ? t.couleurs.lettre : t.couleurs.accent },
  credit: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 12, textAlign: 'center', paddingTop: 14, paddingHorizontal: 16 },
}));
