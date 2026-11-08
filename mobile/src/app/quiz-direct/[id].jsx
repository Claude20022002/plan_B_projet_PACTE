import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../../board/Ecran';
import ReponseDirect from '../../quiz/ReponseDirect';
import useDirect from '../../quiz/useDirect';
import { ENVOI_IMMEDIAT, cleResultat, reponseVide } from '../../quiz/direct';
import { sourceMediaDirect } from '../../api/donnees';
import { CIBLE_TACTILE, creerStyles, espace, useTheme } from '../../theme';

/**
 * Quiz en direct du Studio, sur le téléphone de l'étudiant (lot SC-1c) : attendre le lancement,
 * répondre pendant le chrono (un choix unique ou un vrai-faux part au toucher), voir son résultat
 * et son rang à la correction, puis le podium. Même déroulé que le joueur web (SC-1b) ; seul le
 * serveur corrige, compte les points et ferme la question.
 */
export default function QuizDirect() {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { vue, restant, valeur, changer, envoyer, envoi, erreur, termine } = useDirect(id, t('app.direct.erreur'));

  const quitter = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const fermer = (
    <Pressable onPress={quitter} style={styles.icone} accessibilityRole="button" accessibilityLabel={t('app.commun.fermer')}>
      <MaterialCommunityIcons name="close" size={24} color={couleurs.surCadre} />
    </Pressable>
  );

  const enQuestion = vue?.etape === 'question';
  const question = vue?.question;
  const figee = !enQuestion || vue.repondu || envoi || restant === 0;
  const choisir = (r) => {
    changer(r);
    if (ENVOI_IMMEDIAT.includes(question.type) && !figee) envoyer(r);
  };

  let contenu;
  if (termine) contenu = <Message>{t('app.direct.termine')}</Message>;
  else if (!vue) contenu = <Message discret={!erreur}>{erreur ?? t('app.commun.chargement')}</Message>;
  else if (vue.etape === 'attente') {
    contenu = (
      <View style={styles.centre}>
        <MaterialCommunityIcons name="timer-sand" size={56} color={couleurs.lettre} />
        <Text style={styles.texteGrand}>{t('app.direct.pret')}</Text>
      </View>
    );
  } else if (vue.etape === 'termine') {
    contenu = (
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.titre} accessibilityRole="header">{t('app.direct.finTitre')}</Text>
        {vue.mon_rang ? <Text style={styles.texteGrand}>{t(vue.mon_rang === 1 ? 'app.direct.monRang_un' : 'app.direct.monRang', { rang: vue.mon_rang, joueurs: vue.joueurs, points: vue.mon_total })}</Text> : null}
        {(vue.podium ?? []).map((j) => (
          <View key={`${j.rang}-${j.prenom}-${j.nom}`} style={styles.marche}>
            <Text style={styles.rang}>{j.rang}</Text>
            <Text style={[styles.texte, { flex: 1 }]}>{[j.prenom, j.nom].filter(Boolean).join(' ')}</Text>
            <Text style={styles.points}>{t('app.direct.points', { count: j.points })}</Text>
          </View>
        ))}
        <Pressable onPress={quitter} style={({ pressed }) => [styles.bouton, pressed && { opacity: 0.7 }]} accessibilityRole="button">
          <Text style={styles.boutonTexte}>{t('app.commun.fermer')}</Text>
        </Pressable>
      </ScrollView>
    );
  } else if (question) {
    const statut = vue.ma_reponse?.statut ?? 'sans_reponse';
    contenu = (
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.entete}>
          <Text style={styles.niveau}>{t('app.direct.question', { n: vue.index + 1, total: vue.total })}</Text>
          {enQuestion && restant !== null ? (
            <Text style={[styles.chrono, restant <= 5 && { color: couleurs.reporte }]} accessibilityLabel={t('app.direct.restant', { count: restant })}>
              {restant}
            </Text>
          ) : null}
        </View>
        {!enQuestion ? (
          <View style={[styles.resultat, { borderColor: statut === 'juste' ? couleurs.enCours : couleurs.reporte }]} accessibilityLiveRegion="polite">
            <Text style={styles.texteGrand}>{t(`app.direct.resultat.${cleResultat(statut)}`)}</Text>
            {vue.ma_reponse?.points > 0 ? <Text style={styles.texte}>{t('app.direct.gagnes', { count: vue.ma_reponse.points })}</Text> : null}
            <Text style={styles.texte}>{t(vue.mon_rang === 1 ? 'app.direct.total_un' : 'app.direct.total', { points: vue.mon_total, rang: vue.mon_rang ?? '–', joueurs: vue.joueurs })}</Text>
          </View>
        ) : null}
        <Text style={styles.enonce} accessibilityRole="header">{question.enonce}</Text>
        {vue.media?.type === 'image' ? (
          <Image source={sourceMediaDirect(id, vue.media.id_media)} style={styles.image} resizeMode="contain" accessibilityLabel={vue.media.description || t('app.direct.image')} />
        ) : vue.media ? (
          <Text style={styles.texte}>{t('app.direct.mediaEcran')}</Text>
        ) : null}
        <ReponseDirect
          question={question}
          valeur={enQuestion ? valeur : vue.ma_reponse?.reponse ?? null}
          onChange={choisir}
          desactive={figee}
          bonneReponse={enQuestion ? undefined : vue.bonne_reponse}
        />
        {enQuestion && !vue.repondu && !ENVOI_IMMEDIAT.includes(question.type) ? (
          <Pressable
            onPress={() => envoyer(valeur)}
            disabled={figee || reponseVide(valeur)}
            style={({ pressed }) => [styles.bouton, (pressed || figee || reponseVide(valeur)) && { opacity: 0.6 }]}
            accessibilityRole="button"
          >
            <Text style={styles.boutonTexte}>{t('app.direct.valider')}</Text>
          </Pressable>
        ) : null}
        {enQuestion && vue.repondu ? <Text style={styles.bandeau} accessibilityLiveRegion="polite">{t('app.direct.envoyee')}</Text> : null}
        {vue.etape === 'classement' ? <Text style={styles.texte}>{t('app.direct.attenteSuite')}</Text> : null}
        {erreur ? <Text style={styles.texte} accessibilityLiveRegion="polite">{erreur}</Text> : null}
      </ScrollView>
    );
  } else contenu = <Message>{t('app.direct.pret')}</Message>;

  return (
    <Ecran titre={vue?.titre ?? t('app.direct.titre')} droite={fermer} espaces={false}>
      {contenu}
    </Ecran>
  );
}

const useStyles = creerStyles((t) => ({
  icone: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  page: { padding: 16, gap: 14 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  niveau: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauGras, fontSize: 12, letterSpacing: espace(t, 1.6), textTransform: t.capitales },
  chrono: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 28, fontVariant: ['tabular-nums'] },
  titre: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 26, textAlign: 'center', letterSpacing: espace(t, 0.6), textTransform: t.capitales },
  enonce: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 19, lineHeight: 26 },
  texte: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 15, lineHeight: 22 },
  texteGrand: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 18, textAlign: 'center' },
  resultat: { borderWidth: 2, borderRadius: t.rayons.md, padding: 14, gap: 4, backgroundColor: t.couleurs.cellule },
  image: { width: '100%', height: 200, borderRadius: t.rayons.sm },
  bandeau: { color: t.scene.texte, backgroundColor: t.scene.ciel, fontFamily: t.polices.texteGras, fontSize: 15, padding: 12, borderRadius: t.rayons.md, overflow: 'hidden' },
  bouton: { minHeight: CIBLE_TACTILE + 8, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', borderRadius: t.rayons.sm, backgroundColor: t.couleurs.accent },
  boutonTexte: { color: t.couleurs.surAccent, fontFamily: t.polices.panneauGras, fontSize: 16, letterSpacing: espace(t, 1), textTransform: t.capitales },
  marche: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: t.rayons.md, backgroundColor: t.couleurs.cellule },
  rang: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 22, width: 28, textAlign: 'center' },
  points: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 15, fontVariant: ['tabular-nums'] },
}));
