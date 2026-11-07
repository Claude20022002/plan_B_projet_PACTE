import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Message } from '../board/Ecran';
import { CIBLE_TACTILE, creerStyles } from '../theme';

/**
 * Écran ouvert par une alerte ou un QR alors que les quiz en direct ne sont pas ouverts pour l'école
 * (lot ME-0c, règles C-5 et C-6) : un message clair et le chemin des activités, jamais une erreur.
 */
export default function QuizFerme() {
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useStyles();
  return (
    <View>
      <Message>{t('app.jeux.quizFerme')}</Message>
      <Message discret>{t('app.jeux.quizFermeAide')}</Message>
      <Pressable onPress={() => router.replace('/jeux')} style={styles.bouton} accessibilityRole="button">
        <Text style={styles.texte}>{t('app.activites.titre')}</Text>
      </Pressable>
    </View>
  );
}

const useStyles = creerStyles((t) => ({
  bouton: { minHeight: CIBLE_TACTILE, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 8, backgroundColor: t.couleurs.accent, marginTop: 8 },
  texte: { color: t.couleurs.surAccent, fontFamily: t.polices.texteGras, fontSize: 15 },
}));
