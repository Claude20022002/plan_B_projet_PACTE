import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Feuille from '../verre/Feuille';
import { etatAutorisation, inscrireAuxNotifications } from '../push';
import { CIBLE_TACTILE, creerStyles, useTheme } from '../theme';
import { doitProposer, propositionFaite, retenirProposition } from './proposition';

/**
 * Au premier lancement, une feuille propose les alertes des reports, annulations et changements
 * de salle, et dit pourquoi, avant la fenêtre d'autorisation du système : un refus sec dans cette
 * fenêtre ne se rattrape plus que dans les réglages du téléphone. « Plus tard » ne redemande pas.
 */

// Après l'animation du logo (2,15 s), pour ne pas la recouvrir
const DELAI_MS = 2500;

export default function PropositionAlertes() {
  const { t } = useTranslation();
  const { couleurs } = useTheme();
  const styles = useStyles();
  const [visible, setVisible] = useState(false);
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    let actif = true;
    const minuteur = setTimeout(async () => {
      const [autorisation, faite] = await Promise.all([etatAutorisation().catch(() => null), propositionFaite()]);
      if (actif && doitProposer(autorisation, faite)) setVisible(true);
    }, DELAI_MS);
    return () => {
      actif = false;
      clearTimeout(minuteur);
    };
  }, []);

  const fermer = () => {
    retenirProposition();
    setVisible(false);
  };

  const activer = async () => {
    setOccupe(true);
    await retenirProposition();
    // La fenêtre du système s'ouvre ici ; refusée, l'interrupteur de Compte reste éteint
    await inscrireAuxNotifications().catch(() => null);
    setOccupe(false);
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <Feuille fermer={fermer}>
      <View style={styles.contenu}>
        <MaterialCommunityIcons name="bell-ring-outline" size={40} color={couleurs.lettre} />
        <Text style={styles.titre} accessibilityRole="header">
          {t('app.propositionAlertes.titre')}
        </Text>
        <Text style={styles.texte}>{t('app.propositionAlertes.texte')}</Text>
        <Pressable onPress={activer} disabled={occupe} style={({ pressed }) => [styles.bouton, (pressed || occupe) && { opacity: 0.7 }]} accessibilityRole="button">
          <Text style={styles.boutonTexte}>{t('app.propositionAlertes.activer')}</Text>
        </Pressable>
        <Pressable onPress={fermer} disabled={occupe} style={({ pressed }) => [styles.lien, pressed && { opacity: 0.7 }]} accessibilityRole="button">
          <Text style={styles.lienTexte}>{t('app.propositionAlertes.plusTard')}</Text>
        </Pressable>
        <Text style={styles.aide}>{t('app.propositionAlertes.aide')}</Text>
      </View>
    </Feuille>
  );
}

const useStyles = creerStyles((t) => ({
  contenu: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, gap: 12 },
  titre: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 20, textAlign: 'center' },
  texte: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  bouton: { alignSelf: 'stretch', minHeight: CIBLE_TACTILE + 8, marginTop: 8, justifyContent: 'center', alignItems: 'center', borderRadius: t.rayons.sm, backgroundColor: t.couleurs.cadre },
  boutonTexte: { color: t.couleurs.surCadre, fontFamily: t.polices.texteGras, fontSize: 16 },
  lien: { minHeight: CIBLE_TACTILE, paddingHorizontal: 16, justifyContent: 'center' },
  lienTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 15 },
  aide: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13, textAlign: 'center' },
}));
