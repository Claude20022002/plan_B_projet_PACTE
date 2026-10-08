import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { SvgXml } from 'react-native-svg';
import Ecran, { Message } from '../board/Ecran';
import { chargerConfigQuiz } from '../api/donnees';
import { FORMES_KAHOOT } from '../quiz/formes';
import { lireLienPartie, ordreAffichage, reponseCases, texteSimple, usePartie } from '../quiz/partie';
import { CIBLE_TACTILE, creerStyles, espace, useTheme } from '../theme';

// Couleurs des quatre réponses : celles de ClassQuiz (lignes de filière de Planner), comme au projecteur
const COULEURS_REPONSES = ['#3B63E0', '#0F8A7E', '#7048C9', '#B03A8C'];

/**
 * Partie ClassQuiz jouée dans l'application, sans page web : l'étudiant rejoint la partie que son
 * enseignant a lancée (onglet Activités), répond aux questions et voit son résultat. Les captures
 * d'écran sont bloquées pendant la partie et chaque passage de l'application en arrière-plan
 * pendant une question est signalé à l'enseignant (quiz/partie.js).
 */
export default function Quiz() {
  const { t } = useTranslation();
  const router = useRouter();
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { url, id, titre } = useLocalSearchParams();
  const [origine, setOrigine] = useState(undefined);

  useEffect(() => {
    chargerConfigQuiz()
      // Origine calculée à la main : URL de React Native n'implémente pas toutes ses propriétés
      .then((c) => setOrigine(c?.actif ? (/^(https:\/\/[^/?#]+)/.exec(c.url ?? '')?.[1] ?? null) : null))
      .catch(() => setOrigine(null));
  }, []);

  const lien = useMemo(() => (origine ? lireLienPartie(typeof url === 'string' ? url : '', origine) : null), [origine, url]);
  const sortir = () => (router.canGoBack() ? router.back() : router.replace('/jeux'));
  const fermer = (
    <Pressable
      onPress={() =>
        Alert.alert(t('app.quiz.quitter'), t('app.quiz.quitterAide'), [
          { text: t('app.quiz.rester'), style: 'cancel' },
          { text: t('app.commun.fermer'), style: 'destructive', onPress: sortir },
        ])
      }
      style={styles.icone}
      accessibilityRole="button"
      accessibilityLabel={t('app.commun.fermer')}
    >
      <MaterialCommunityIcons name="close" size={24} color={couleurs.surCadre} />
    </Pressable>
  );

  return (
    <Ecran titre={typeof titre === 'string' && titre ? titre : t('app.jeux.quiz')} droite={fermer} espaces={false}>
      {origine === undefined ? <ActivityIndicator style={styles.attente} color={couleurs.lettre} size="large" /> : null}
      {origine !== undefined && !lien ? <Message>{t('app.jeux.quizIndisponible')}</Message> : null}
      {lien ? <Partie origine={origine} lien={lien} idPartie={typeof id === 'string' ? id : null} /> : null}
    </Ecran>
  );
}

function Partie({ origine, lien, idPartie }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { couleurs } = useTheme();
  const styles = useStyles();
  // Pas de capture ni d'enregistrement de l'écran pendant la partie
  usePreventScreenCapture();
  const partie = usePartie({ origine, ...lien });
  const { etape } = partie;

  const panneau = (texte, detail, icone, couleur) => (
    <View style={styles.panneau}>
      {icone ? <MaterialCommunityIcons name={icone} size={56} color={couleur ?? couleurs.lettre} /> : null}
      <Text style={[styles.grand, couleur && { color: couleur }]}>{texte}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {!partie.connecte && !['connexion', 'fin', 'erreur'].includes(etape) ? <Text style={styles.coupure}>{t('app.quiz.reconnexion')}</Text> : null}
      {etape === 'connexion' ? (
        <View style={styles.panneau}>
          <ActivityIndicator color={couleurs.lettre} size="large" />
          <Text style={styles.detail}>{t('app.quiz.connexion')}</Text>
        </View>
      ) : null}
      {etape === 'erreur' ? panneau(t(`app.quiz.erreurs.${partie.erreur}`), null, 'alert-circle-outline') : null}
      {etape === 'attente'
        ? panneau(t('app.quiz.inscrit', { pseudo: partie.pseudo }), t(partie.commencee ? 'app.quiz.regardezEcran' : 'app.quiz.attenteEnseignant'), 'account-check-outline')
        : null}
      {etape === 'diapo' ? panneau(t('app.quiz.regardezEcran'), null, 'projector-screen-outline') : null}
      {etape === 'question' ? <Question key={partie.question.index} question={partie.question} mode={partie.mode} finLe={partie.finLe} repondre={partie.repondre} tempsEcoule={partie.tempsEcoule} /> : null}
      {etape === 'envoyee' ? panneau(t(partie.tard ? 'app.quiz.tempsEcoule' : 'app.quiz.envoyee'), t('app.quiz.attenteResultats'), partie.tard ? 'timer-sand-complete' : 'send-check-outline') : null}
      {etape === 'resultat'
        ? !partie.resultat
          ? panneau(t('app.quiz.pasDeReponse'), null, 'minus-circle-outline')
          : partie.resultat.juste
            ? panneau(t('app.quiz.juste'), t('app.quiz.points', { points: partie.resultat.points }), 'check-circle', couleurs.enCours)
            : panneau(t('app.quiz.faux'), null, 'close-circle', couleurs.annule)
        : null}
      {etape === 'fin' ? (
        <View style={styles.panneau}>
          <MaterialCommunityIcons name="flag-checkered" size={56} color={couleurs.lettre} />
          <Text style={styles.grand}>{t('app.quiz.fin')}</Text>
          <Text style={styles.detail}>{t('app.quiz.bilan', { points: partie.bilan.points, count: partie.bilan.bonnes })}</Text>
          {idPartie ? (
            <Pressable onPress={() => router.replace({ pathname: '/resultats/[id]', params: { id: idPartie } })} style={styles.bouton} accessibilityRole="button">
              <Text style={styles.boutonTexte}>{t('app.quiz.classement')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Une question : compte à rebours et saisie selon le type (QCM, cases, texte, curseur, ordre). */
function Question({ question: q, mode, finLe, repondre, tempsEcoule }) {
  const { t } = useTranslation();
  const { couleurs } = useTheme();
  const styles = useStyles();
  const [restant, setRestant] = useState(() => Math.max(0, Math.ceil((finLe - Date.now()) / 1000)));
  const [cochees, setCochees] = useState([]);
  const [texte, setTexte] = useState('');
  const bornes = q.type === 'RANGE' ? { min: Number(q.answers?.min ?? 0), max: Number(q.answers?.max ?? 100) } : null;
  const [valeur, setValeur] = useState(() => (bornes ? Math.round((bornes.min + bornes.max) / 2) : 0));
  const [ordre, setOrdre] = useState(() => (q.type === 'ORDER' && Array.isArray(q.answers) ? q.answers.map((a) => a.answer) : []));
  const reponses = Array.isArray(q.answers) ? q.answers : [];
  // QCM et cases : ordre propre à ce téléphone en mode « normal » (un sondage n'a pas de bonne réponse)
  const affichage = useMemo(() => ordreAffichage(reponses.length, ['ABCD', 'CHECK'].includes(q.type) ? mode : 'kahoot'), [reponses.length, q.type, mode]);
  const kahoot = mode === 'kahoot';

  useEffect(() => {
    const minuterie = setInterval(() => {
      const s = Math.max(0, Math.ceil((finLe - Date.now()) / 1000));
      setRestant(s);
      if (s === 0) {
        clearInterval(minuterie);
        tempsEcoule();
      }
    }, 250);
    return () => clearInterval(minuterie);
  }, [finLe, tempsEcoule]);

  const tuile = (origine, position, { actif = false, onPress }) => {
    const reponse = reponses[origine];
    return (
      <Pressable
        key={origine}
        onPress={onPress}
        style={[styles.tuile, { backgroundColor: reponse?.color ?? COULEURS_REPONSES[position % 4] }, actif && styles.tuileActive]}
        accessibilityRole={q.type === 'CHECK' ? 'checkbox' : 'button'}
        accessibilityState={q.type === 'CHECK' ? { checked: actif } : undefined}
        accessibilityLabel={kahoot ? t('app.quiz.reponse', { n: position + 1 }) : texteSimple(reponse?.answer)}
      >
        {kahoot ? <SvgXml xml={FORMES_KAHOOT[origine % 4]} width={64} height={64} color="#FFFFFF" /> : <Text style={styles.tuileTexte}>{texteSimple(reponse?.answer)}</Text>}
        {q.type === 'CHECK' ? <MaterialCommunityIcons name={actif ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color="#FFFFFF" style={styles.coche} /> : null}
      </Pressable>
    );
  };

  const valider = (envoi, desactive = false) => (
    <Pressable onPress={envoi} disabled={desactive} style={[styles.bouton, desactive && { opacity: 0.5 }]} accessibilityRole="button">
      <Text style={styles.boutonTexte}>{t('app.quiz.valider')}</Text>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.question} keyboardShouldPersistTaps="handled">
        <View style={styles.entete}>
          <Text style={styles.chrono} accessibilityLabel={t('app.quiz.secondes', { n: restant })}>
            {restant}
          </Text>
          <Text style={styles.enonce}>{kahoot && ['ABCD', 'CHECK', 'VOTING'].includes(q.type) ? t('app.quiz.regardezEcran') : texteSimple(q.question)}</Text>
        </View>

        {['ABCD', 'VOTING'].includes(q.type) ? <View style={styles.grille}>{affichage.map((o, i) => tuile(o, i, { onPress: () => repondre(reponses[o]?.answer) }))}</View> : null}

        {q.type === 'CHECK' ? (
          <>
            <View style={styles.grille}>
              {affichage.map((o, i) => tuile(o, i, { actif: cochees.includes(o), onPress: () => setCochees((c) => (c.includes(o) ? c.filter((x) => x !== o) : [...c, o])) }))}
            </View>
            {valider(() => repondre(reponseCases(cochees)), cochees.length === 0)}
          </>
        ) : null}

        {q.type === 'TEXT' ? (
          <>
            <TextInput value={texte} onChangeText={setTexte} maxLength={200} autoFocus placeholder={t('app.quiz.votreReponse')} placeholderTextColor={couleurs.lettreAttenuee} style={styles.champ} accessibilityLabel={t('app.quiz.votreReponse')} onSubmitEditing={() => texte.trim() && repondre(texte.trim())} />
            {valider(() => repondre(texte.trim()), !texte.trim())}
          </>
        ) : null}

        {q.type === 'RANGE' && bornes ? (
          <>
            <View style={styles.plage} accessibilityRole="adjustable" accessibilityValue={{ min: bornes.min, max: bornes.max, now: valeur }}>
              {[-10, -1].map((pas) => (
                <Pressable key={pas} onPress={() => setValeur((v) => Math.max(bornes.min, v + pas))} style={styles.pas} accessibilityRole="button" accessibilityLabel={String(pas)}>
                  <Text style={styles.pasTexte}>{pas}</Text>
                </Pressable>
              ))}
              <Text style={styles.plageValeur}>{valeur}</Text>
              {[1, 10].map((pas) => (
                <Pressable key={pas} onPress={() => setValeur((v) => Math.min(bornes.max, v + pas))} style={styles.pas} accessibilityRole="button" accessibilityLabel={`+${pas}`}>
                  <Text style={styles.pasTexte}>+{pas}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.detail}>{`${bornes.min} - ${bornes.max}`}</Text>
            {valider(() => repondre(valeur))}
          </>
        ) : null}

        {q.type === 'ORDER' ? (
          <>
            {ordre.map((choix, i) => (
              <View key={choix} style={styles.ordre}>
                <Text style={styles.ordreRang}>{i + 1}</Text>
                <Text style={[styles.tuileTexte, { flex: 1, color: couleurs.lettre }]}>{texteSimple(choix)}</Text>
                {[-1, 1].map((sens) => (
                  <Pressable
                    key={sens}
                    disabled={i + sens < 0 || i + sens >= ordre.length}
                    onPress={() => setOrdre((liste) => { const copie = [...liste]; [copie[i], copie[i + sens]] = [copie[i + sens], copie[i]]; return copie; })}
                    style={[styles.pas, (i + sens < 0 || i + sens >= ordre.length) && { opacity: 0.3 }]}
                    accessibilityRole="button"
                    accessibilityLabel={t(sens < 0 ? 'app.quiz.monter' : 'app.quiz.descendre', { choix: texteSimple(choix) })}
                  >
                    <MaterialCommunityIcons name={sens < 0 ? 'chevron-up' : 'chevron-down'} size={24} color={couleurs.lettre} />
                  </Pressable>
                ))}
              </View>
            ))}
            {valider(() => repondre(null, ordre))}
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = creerStyles((t) => ({
  icone: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  attente: { marginTop: 48 },
  coupure: { backgroundColor: t.couleurs.reporte, color: '#FFFFFF', textAlign: 'center', paddingVertical: 6, fontFamily: t.polices.panneau, fontSize: 14 },
  panneau: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  grand: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 26, textAlign: 'center', textTransform: t.capitales, letterSpacing: espace(t, 1) },
  detail: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 16, textAlign: 'center', lineHeight: 22 },
  question: { padding: 16, gap: 16, flexGrow: 1 },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  chrono: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: t.couleurs.annule, textAlign: 'center', textAlignVertical: 'center', lineHeight: 50, color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 24 },
  enonce: { flex: 1, color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 20, lineHeight: 26 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tuile: { width: '48%', flexGrow: 1, minHeight: 120, borderRadius: t.rayons.sm, alignItems: 'center', justifyContent: 'center', padding: 12 },
  tuileActive: { borderWidth: 4, borderColor: t.couleurs.lettre },
  tuileTexte: { color: '#FFFFFF', fontFamily: t.polices.panneau, fontSize: 18, textAlign: 'center' },
  coche: { position: 'absolute', top: 8, right: 8 },
  champ: { minHeight: CIBLE_TACTILE, paddingHorizontal: 12, borderRadius: t.rayons.sm, borderWidth: 1, borderColor: t.couleurs.filet, color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 18 },
  plage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pas: { minWidth: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center', borderRadius: t.rayons.sm, borderWidth: 1, borderColor: t.couleurs.filet },
  pasTexte: { color: t.couleurs.lettre, fontFamily: t.polices.panneau, fontSize: 16 },
  plageValeur: { minWidth: 80, textAlign: 'center', color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 32 },
  ordre: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: CIBLE_TACTILE, paddingLeft: 12, borderRadius: t.rayons.sm, borderWidth: 1, borderColor: t.couleurs.filet },
  ordreRang: { width: 20, color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauGras, fontSize: 18 },
  bouton: { marginTop: 8, minHeight: CIBLE_TACTILE + 4, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', borderRadius: t.rayons.sm, backgroundColor: t.couleurs.accent, paddingHorizontal: 16 },
  boutonTexte: { color: t.couleurs.surAccent, fontFamily: t.polices.panneauGras, fontSize: 18, textTransform: t.capitales, letterSpacing: espace(t, 1.2) },
}));
