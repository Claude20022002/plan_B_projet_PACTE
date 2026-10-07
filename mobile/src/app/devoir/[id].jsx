import { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ouvrirSurLeWeb } from '../../espaces/ouvrir';
import Ecran, { Message } from '../../board/Ecran';
import { chargerDevoir, rendreDevoir } from '../../api/donnees';
import { CIBLE_TACTILE, creerStyles, espace, useTheme } from '../../theme';

const reponseInitiale = (q) => {
  if (q.type === 'CHECK') return [];
  if (q.type === 'TEXT') return '';
  if (q.type === 'RANGE') return q.min ?? 0;
  if (q.type === 'ORDER') return [...(q.choix ?? [])];
  return null;
};

const texteAttendu = (q) => {
  if (q.attendue === null || q.attendue === undefined) return null;
  if (q.type === 'ABCD' || q.type === 'CHECK') return q.attendue.map((i) => q.choix?.[i]).join(' · ');
  if (q.type === 'RANGE') return q.attendue.min === q.attendue.max ? String(q.attendue.min) : `${q.attendue.min} – ${q.attendue.max}`;
  if (q.type === 'ORDER') return q.attendue.join(' → ');
  return q.attendue.join(' / ');
};

/** Choix (une ou plusieurs réponses) en grandes cibles tactiles */
function Choix({ libelle, actif, multiple, fige, onPress }) {
  const { couleurs } = useTheme();
  const styles = useStyles();
  return (
    <Pressable onPress={onPress} disabled={fige} style={[styles.choix, actif && styles.choixActif]} accessibilityRole={multiple ? 'checkbox' : 'radio'} accessibilityState={{ checked: actif, disabled: fige }}>
      <MaterialCommunityIcons
        name={multiple ? (actif ? 'checkbox-marked' : 'checkbox-blank-outline') : actif ? 'radiobox-marked' : 'radiobox-blank'}
        size={22}
        color={actif ? couleurs.accent : couleurs.lettreAttenuee}
      />
      <Text style={styles.choixTexte}>{libelle}</Text>
    </Pressable>
  );
}

function Saisie({ question: q, valeur, changer, fige }) {
  const { t } = useTranslation();
  const { couleurs } = useTheme();
  const styles = useStyles();
  if (q.type === 'ABCD' || q.type === 'VOTING') {
    return q.choix.map((c, i) => <Choix key={i} libelle={c} actif={valeur === i} fige={fige} onPress={() => changer(i)} />);
  }
  if (q.type === 'CHECK') {
    return q.choix.map((c, i) => <Choix key={i} libelle={c} multiple actif={valeur.includes(i)} fige={fige} onPress={() => changer(valeur.includes(i) ? valeur.filter((x) => x !== i) : [...valeur, i])} />);
  }
  if (q.type === 'TEXT') {
    return <TextInput value={valeur} onChangeText={changer} editable={!fige} maxLength={200} placeholder={t('app.devoirs.votreReponse')} placeholderTextColor={couleurs.lettreAttenuee} style={styles.champ} accessibilityLabel={t('app.devoirs.votreReponse')} />;
  }
  if (q.type === 'RANGE') {
    const borne = (n) => Math.max(q.min, Math.min(q.max, n));
    return (
      <View style={styles.plage} accessibilityRole="adjustable" accessibilityValue={{ min: q.min, max: q.max, now: Number(valeur) }}>
        <Pressable onPress={() => changer(borne(Number(valeur) - 1))} disabled={fige} style={styles.pas} accessibilityRole="button" accessibilityLabel="−1">
          <MaterialCommunityIcons name="minus" size={24} color={couleurs.lettre} />
        </Pressable>
        <Text style={styles.plageValeur}>{valeur}</Text>
        <Pressable onPress={() => changer(borne(Number(valeur) + 1))} disabled={fige} style={styles.pas} accessibilityRole="button" accessibilityLabel="+1">
          <MaterialCommunityIcons name="plus" size={24} color={couleurs.lettre} />
        </Pressable>
        <Text style={styles.plageBornes}>{`${q.min} – ${q.max}`}</Text>
      </View>
    );
  }
  if (q.type === 'ORDER') {
    const deplacer = (i, sens) => {
      const liste = [...valeur];
      [liste[i], liste[i + sens]] = [liste[i + sens], liste[i]];
      changer(liste);
    };
    return valeur.map((c, i) => (
      <View key={c} style={styles.ordre}>
        <Text style={styles.ordreRang}>{i + 1}</Text>
        <Text style={[styles.choixTexte, { flex: 1 }]}>{c}</Text>
        <Pressable onPress={() => deplacer(i, -1)} disabled={fige || i === 0} style={styles.pas} accessibilityRole="button" accessibilityLabel={t('app.devoirs.monter', { choix: c })}>
          <MaterialCommunityIcons name="arrow-up" size={20} color={i === 0 ? couleurs.filet : couleurs.lettre} />
        </Pressable>
        <Pressable onPress={() => deplacer(i, 1)} disabled={fige || i === valeur.length - 1} style={styles.pas} accessibilityRole="button" accessibilityLabel={t('app.devoirs.descendre', { choix: c })}>
          <MaterialCommunityIcons name="arrow-down" size={20} color={i === valeur.length - 1 ? couleurs.filet : couleurs.lettre} />
        </Pressable>
      </View>
    ));
  }
  return null;
}

/** Devoir « fichier » : consignes, copie rendue (retard, correction), note et commentaire, lien vers le site. */
function DevoirFichier({ donnees, date, ouvrir }) {
  const { t, i18n } = useTranslation();
  const styles = useStyles();
  const { devoir: d, rendu } = donnees;
  const corrige = rendu && rendu.note !== null;
  const etat = rendu
    ? [t('app.devoirs.renduLe', { date: date(rendu.rendu_le) }), rendu.en_retard ? t('app.devoirs.enRetard') : null, corrige ? null : t('app.devoirs.enCorrection')].filter(Boolean).join(' · ')
    : t(d.ouvert ? 'app.devoirs.pasRendu' : 'app.devoirs.pasRenduRetard');
  return (
    <View>
      {corrige ? (
        <View style={styles.note} accessible accessibilityLabel={t('app.devoirs.noteSeule', { note: rendu.note })}>
          <Text style={styles.noteValeur}>{rendu.note.toLocaleString(i18n.language === 'en' ? 'en-GB' : 'fr-FR')}</Text>
          <Text style={styles.noteSur}>/20</Text>
        </View>
      ) : null}
      {corrige && rendu.commentaire ? (
        <View style={styles.question}>
          <Text style={styles.questionNumero}>{t('app.devoirs.commentaire')}</Text>
          <Text style={styles.questionTexte} selectable>{rendu.commentaire}</Text>
        </View>
      ) : null}
      <View style={styles.question}>
        <Text style={styles.questionNumero}>{t('app.devoirs.consignes')}</Text>
        <Text style={styles.questionTexte} selectable>{d.consignes || t('app.devoirs.sansConsignes')}</Text>
        {d.enonce ? <Text style={styles.attendue}>{t('app.devoirs.enonce', { nom: d.enonce.nom })}</Text> : null}
      </View>
      <View style={styles.question}>
        <Text style={styles.questionNumero}>{t('app.devoirs.maCopie')}</Text>
        <Text style={styles.questionTexte}>{etat}</Text>
        {rendu?.fichier ? <Text style={styles.attendue}>{rendu.fichier.nom}</Text> : null}
      </View>
      <Pressable onPress={ouvrir} style={styles.bouton} accessibilityRole="button" accessibilityHint={t('app.devoirs.aideSite')}>
        <Text style={styles.boutonTexte}>{t(corrige ? 'app.devoirs.voirSurSite' : rendu ? 'app.devoirs.remplacerSurSite' : 'app.devoirs.rendreSurSite')}</Text>
      </Pressable>
      <Message discret>{t('app.devoirs.aideSite')}</Message>
    </View>
  );
}

/**
 * Devoir noté sur téléphone : les questions du quiz (sans les réponses), une copie rendue avant
 * la date limite et notée sur 20 par Planner ; la correction s'affiche après la date limite.
 * Devoir « fichier » (R3) : consignes, état de la copie, note et commentaire ; l'énoncé et le dépôt
 * s'ouvrent sur le site, déjà connecté (sélecteur de fichiers et appareil photo du téléphone).
 */
export default function Devoir() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams();
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState(false);
  const [reponses, setReponses] = useState([]);
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(
    () =>
      chargerDevoir(id).then(
        (d) => {
          setDonnees(d);
          setReponses((d.questions ?? []).map((q) => (d.rendu ? q.ma_reponse : reponseInitiale(q))));
        },
        () => setErreur(true)
      ),
    [id]
  );
  useEffect(() => {
    if (/^\d{1,10}$/.test(String(id ?? ''))) charger();
  }, [id, charger]);

  const d = donnees?.devoir;
  const fichier = d?.type === 'fichier';
  const fige = Boolean(donnees?.rendu) || (d && !d.ouvert);
  const date = (iso) => new Date(iso).toLocaleString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

  const rendre = () =>
    Alert.alert(t('app.devoirs.rendre'), t('app.devoirs.confirmation'), [
      { text: t('app.commun.annuler'), style: 'cancel' },
      {
        text: t('app.devoirs.rendreDefinitif'),
        onPress: async () => {
          setEnvoi(true);
          try {
            await rendreDevoir(id, reponses);
            await charger();
          } catch {
            setErreur(true);
          } finally {
            setEnvoi(false);
          }
        },
      },
    ]);

  const retour = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/jeux'))} style={styles.icone} accessibilityRole="button" accessibilityLabel={t('app.commun.retour')}>
      <MaterialCommunityIcons name="arrow-left" size={24} color={couleurs.surCadre} />
    </Pressable>
  );

  return (
    <Ecran titre={t('app.devoirs.titre')} droite={retour} espaces={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {erreur ? <Message>{t('app.devoirs.erreur')}</Message> : null}
          {!donnees && !erreur ? <Message discret>{t('app.commun.chargement')}</Message> : null}
          {d ? (
            <View style={styles.entete}>
              <Text style={styles.titre} accessibilityRole="header">{d.titre}</Text>
              <Text style={styles.detail}>{[d.module?.nom, t(d.ouvert ? 'app.devoirs.avant' : 'app.devoirs.clos', { date: date(d.date_limite) })].filter(Boolean).join(' · ')}</Text>
            </View>
          ) : null}
          {fichier ? <DevoirFichier donnees={donnees} date={date} ouvrir={() => ouvrirSurLeWeb(`/jeux/devoirs/${d.id}`, couleurs)} /> : null}
          {donnees?.rendu && !fichier ? (
            <View style={styles.note} accessible accessibilityLabel={t('app.devoirs.noteLue', { note: donnees.rendu.note, bonnes: donnees.rendu.bonnes, total: donnees.rendu.notees })}>
              <Text style={styles.noteValeur}>{donnees.rendu.note.toLocaleString(i18n.language === 'en' ? 'en-GB' : 'fr-FR')}</Text>
              <Text style={styles.noteSur}>/20</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.noteDetail}>{t('app.devoirs.bonnes', { bonnes: donnees.rendu.bonnes, total: donnees.rendu.notees })}</Text>
            </View>
          ) : null}
          {donnees?.rendu && !fichier && d.ouvert ? <Message discret>{t('app.devoirs.correctionApres', { date: date(d.date_limite) })}</Message> : null}

          {(donnees?.questions ?? []).map((q, i) => (
            <View key={q.index} style={styles.question}>
              <View style={styles.questionEntete}>
                <Text style={styles.questionNumero}>{i + 1}</Text>
                <Text style={styles.questionTexte}>{q.question}</Text>
                {q.juste === true ? <MaterialCommunityIcons name="check-circle" size={22} color={couleurs.enCours} accessibilityLabel={t('app.devoirs.juste')} /> : null}
                {q.juste === false && q.attendue !== null ? <MaterialCommunityIcons name="close-circle" size={22} color={couleurs.annule} accessibilityLabel={t('app.devoirs.faux')} /> : null}
              </View>
              <Saisie question={q} valeur={reponses[i] ?? reponseInitiale(q)} fige={fige} changer={(v) => setReponses((r) => r.map((x, j) => (j === i ? v : x)))} />
              {q.attendue !== undefined && texteAttendu(q) ? <Text style={styles.attendue}>{t('app.devoirs.attendue', { reponse: texteAttendu(q) })}</Text> : null}
            </View>
          ))}

          {donnees && !fige && !fichier ? (
            <Pressable onPress={rendre} disabled={envoi} style={[styles.bouton, envoi && { opacity: 0.6 }]} accessibilityRole="button">
              <Text style={styles.boutonTexte}>{t('app.devoirs.rendre')}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Ecran>
  );
}

const useStyles = creerStyles((t) => ({
  icone: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  entete: { paddingHorizontal: 16, paddingTop: 16, gap: 4 },
  titre: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 24, textTransform: t.capitales, letterSpacing: espace(t, 0.6) },
  detail: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 14 },
  note: { flexDirection: 'row', alignItems: 'baseline', gap: 4, margin: 16, padding: 16, borderRadius: t.rayons.md, backgroundColor: t.scene.ciel },
  noteValeur: { color: t.scene.texte, fontFamily: t.polices.panneauGras, fontSize: 44, fontVariant: ['tabular-nums'] },
  noteSur: { color: t.scene.texteAttenue, fontFamily: t.polices.panneau, fontSize: 20 },
  noteDetail: { color: t.scene.texteAttenue, fontFamily: t.polices.texte, fontSize: 13 },
  question: { marginHorizontal: 16, marginTop: 14, padding: 14, gap: 8, borderRadius: t.rayons.md, backgroundColor: t.couleurs.cellule, borderWidth: t.sombre ? 0 : 1, borderColor: t.couleurs.filet },
  questionEntete: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  questionNumero: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauGras, fontSize: 18 },
  questionTexte: { flex: 1, color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 16, lineHeight: 22 },
  choix: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: CIBLE_TACTILE, paddingHorizontal: 10, borderRadius: t.rayons.sm, borderWidth: 1, borderColor: t.couleurs.filet },
  choixActif: { borderColor: t.couleurs.accent, borderWidth: 2 },
  choixTexte: { flexShrink: 1, color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 15 },
  champ: { minHeight: CIBLE_TACTILE, paddingHorizontal: 12, borderRadius: t.rayons.sm, borderWidth: 1, borderColor: t.couleurs.filet, color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 16 },
  plage: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pas: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center', borderRadius: t.rayons.sm, borderWidth: 1, borderColor: t.couleurs.filet },
  plageValeur: { minWidth: 56, textAlign: 'center', color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 28 },
  plageBornes: { marginLeft: 'auto', color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13 },
  ordre: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: CIBLE_TACTILE, paddingLeft: 10, borderRadius: t.rayons.sm, borderWidth: 1, borderColor: t.couleurs.filet },
  ordreRang: { width: 18, color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauGras, fontSize: 16 },
  attendue: { color: t.couleurs.enCours, fontFamily: t.polices.texteGras, fontSize: 14 },
  bouton: { margin: 16, marginTop: 24, minHeight: CIBLE_TACTILE + 4, alignItems: 'center', justifyContent: 'center', borderRadius: t.rayons.sm, backgroundColor: t.couleurs.accent },
  boutonTexte: { color: t.couleurs.surAccent, fontFamily: t.polices.panneauGras, fontSize: 18, textTransform: t.capitales, letterSpacing: espace(t, 1.2) },
}));
