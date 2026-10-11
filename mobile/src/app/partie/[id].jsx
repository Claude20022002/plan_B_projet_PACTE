import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../../board/Ecran';
import { chargerPartiesQuiz } from '../../api/donnees';
import { ouvrirPartie } from '../../quiz/ouvrir';
import { QUIZ_DANS_L_APPLICATION } from '../../../../shared/fonctions.js';
import { CIBLE_TACTILE, creerStyles, useTheme } from '../../theme';

/**
 * Partie de quiz ouverte par une alerte « Quiz en cours » (lot R-14, lien /jeux?partie=<id>) :
 * l'étudiant arrive directement dans la partie, sans passer par la page Activités. Si elle est
 * terminée ou n'est pas pour lui, un message le dit et la page Activités est à un geste.
 */
export default function PartieDepuisAlerte() {
  const { t } = useTranslation();
  const router = useRouter();
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams();
  const [introuvable, setIntrouvable] = useState(false);
  const ouverte = useRef(false);

  useEffect(() => {
    if (ouverte.current) return;
    ouverte.current = true;
    chargerPartiesQuiz()
      .then(async (parties) => {
        const partie = parties.find((p) => String(p.id) === String(id));
        if (!partie) return setIntrouvable(true);
        await ouvrirPartie({ router, partie, couleurs, remplacer: true });
        // Vue navigateur : l'application reprend sur le Tableau quand l'étudiant la referme
        if (!QUIZ_DANS_L_APPLICATION) router.replace('/');
        return undefined;
      })
      .catch(() => setIntrouvable(true));
  }, [id, router, couleurs]);

  const fermer = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.icone} accessibilityRole="button" accessibilityLabel={t('app.commun.fermer')}>
      <MaterialCommunityIcons name="close" size={24} color={couleurs.surCadre} />
    </Pressable>
  );

  return (
    <Ecran titre={t('app.jeux.enCours')} droite={fermer} espaces={false}>
      {introuvable ? (
        <View>
          <Message>{t('app.jeux.partieTerminee')}</Message>
          <Pressable onPress={() => router.replace('/jeux')} style={styles.bouton} accessibilityRole="button">
            <Message>{t('app.activites.titre')}</Message>
          </Pressable>
        </View>
      ) : (
        <Message discret>{t('app.commun.chargement')}</Message>
      )}
    </Ecran>
  );
}

const useStyles = creerStyles(() => ({
  icone: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  bouton: { minHeight: CIBLE_TACTILE, alignSelf: 'center' },
}));
