import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../../board/Ecran';
import { analyserOffre, analyserTexteOffre, iaOffresDisponible, publierOffre } from '../../api/donnees';
import FormulaireOffre from '../../bibliotheque/FormulaireOffre';
import { dateLisible, lienHttps, offreValide, versDateIso } from '../../stage/offre';
import { CIBLE_TACTILE, creerStyles, espace, useTheme } from '../../theme';

const TEXTE_MIN = 80;
const VIERGE = { title: '', company_name: '', city: '', type: 'stage', deadline: '', salary: '', apply_url: '', description: '' };

/** Champs rendus par l'analyse → valeurs du formulaire (texte vide plutôt que null, date lisible) */
const versFormulaire = (champs, url) => ({
  ...VIERGE,
  ...Object.fromEntries(Object.entries(champs ?? {}).map(([cle, v]) => [cle, v ?? ''])),
  type: champs?.type || 'stage',
  deadline: dateLisible(champs?.deadline),
  apply_url: url,
});

/**
 * « Partager une offre » en trois temps :
 *  1. le lien de l'offre : le serveur lit la page (données JobPosting, sinon l'aperçu) ;
 *  2. si le site refuse la lecture (LinkedIn, Indeed…) : coller le texte de l'offre, mis en forme
 *     par l'IA quand elle est disponible, ou tout remplir soi-même ;
 *  3. le formulaire pré-rempli, vérifié puis publié. Les offres des étudiants sont vérifiées par
 *     l'administration avant d'apparaître dans « Offres ».
 */
export default function PartagerOffre() {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const [etape, setEtape] = useState('lien'); // lien | texte | formulaire | fini
  const [url, setUrl] = useState('');
  const [texte, setTexte] = useState('');
  const [champs, setChamps] = useState(VIERGE);
  const [source, setSource] = useState('manuel');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [attente, setAttente] = useState(false);
  const [ia, setIa] = useState(false);
  const [statut, setStatut] = useState(null);

  useEffect(() => {
    iaOffresDisponible().then(setIa, () => setIa(false));
  }, []);

  const lienValide = lienHttps(url);
  const versFormulaireDe = (nouvelleSource, donnees, explication) => {
    setChamps(versFormulaire(donnees, url.trim()));
    setSource(nouvelleSource);
    setNote(explication);
    setMessage('');
    setEtape('formulaire');
  };

  const lire = async () => {
    setAttente(true);
    setMessage('');
    try {
      const r = await analyserOffre(url.trim());
      if (r.source === 'jobposting') versFormulaireDe('page', r.champs, t('app.offres.lue'));
      else if (r.source === 'apercu') versFormulaireDe('page', r.champs, t('app.offres.apercu'));
      else {
        setNote(r.source === 'refuse' ? t('app.offres.refuse') : t('app.offres.illisible'));
        setEtape('texte');
      }
    } catch (e) {
      // 422 : lien refusé ou page illisible (message du serveur) ; autre : réseau
      if (e?.statut === 422) {
        setNote(e.message);
        setEtape('texte');
      } else setMessage(t('app.offres.erreur'));
    } finally {
      setAttente(false);
    }
  };

  const mettreEnForme = async () => {
    setAttente(true);
    setMessage('');
    try {
      const r = await analyserTexteOffre(texte.trim());
      versFormulaireDe('texte', r.champs, t('app.offres.miseEnForme'));
    } catch (e) {
      setMessage(e?.statut === 503 ? t('app.offres.iaIndisponible') : t('app.offres.erreur'));
    } finally {
      setAttente(false);
    }
  };

  const publier = async () => {
    setAttente(true);
    setMessage('');
    try {
      const r = await publierOffre({ ...champs, deadline: versDateIso(champs.deadline), apply_url: champs.apply_url.trim(), source });
      setStatut(r.statut);
      setEtape('fini');
    } catch (e) {
      setMessage(e?.statut === 422 && e.message ? e.message : t('app.offres.erreur'));
    } finally {
      setAttente(false);
    }
  };

  const bouton = (libelle, onPress, actif = true) => (
    <Pressable onPress={onPress} disabled={!actif || attente} style={[styles.bouton, (!actif || attente) && styles.inactif]} accessibilityRole="button" accessibilityState={{ disabled: !actif || attente }}>
      {attente ? <ActivityIndicator color={couleurs.surAccent} /> : <Text style={styles.boutonTexte}>{libelle}</Text>}
    </Pressable>
  );
  const lienSecondaire = (libelle, onPress) => (
    <Pressable onPress={onPress} style={styles.lien} accessibilityRole="button">
      <Text style={styles.lienTexte}>{libelle}</Text>
    </Pressable>
  );
  const manuel = () => versFormulaireDe('manuel', { type: 'stage' }, '');

  const retour = (
    <Pressable onPress={() => (etape === 'texte' || etape === 'formulaire' ? setEtape('lien') : router.back())} style={styles.icone} accessibilityRole="button" accessibilityLabel={t('app.commun.retour')}>
      <MaterialCommunityIcons name="arrow-left" size={24} color={couleurs.surCadre} />
    </Pressable>
  );

  return (
    <Ecran titre={t('app.offres.partager')} droite={retour} espaces={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
          {etape === 'lien' ? (
            <>
              <Text style={styles.texte}>{t('app.offres.explication')}</Text>
              <Text style={styles.libelle}>{t('app.offres.champs.lien')}</Text>
              <TextInput style={styles.champ} value={url} onChangeText={setUrl} placeholder="https://" placeholderTextColor={couleurs.lettreAttenuee} autoCapitalize="none" autoCorrect={false} keyboardType="url" maxLength={2048} accessibilityLabel={t('app.offres.champs.lien')} onSubmitEditing={() => lienValide && lire()} />
              {bouton(t('app.offres.lire'), lire, lienValide)}
              {lienSecondaire(t('app.offres.manuel'), manuel)}
            </>
          ) : null}

          {etape === 'texte' ? (
            <>
              <Message>{note}</Message>
              {ia ? (
                <>
                  <Text style={styles.texte}>{t('app.offres.collerExplication')}</Text>
                  <TextInput style={[styles.champ, styles.multi]} value={texte} onChangeText={setTexte} multiline textAlignVertical="top" maxLength={8000} placeholder={t('app.offres.collerIci')} placeholderTextColor={couleurs.lettreAttenuee} accessibilityLabel={t('app.offres.collerIci')} />
                  {bouton(t('app.offres.mettreEnForme'), mettreEnForme, texte.trim().length >= TEXTE_MIN)}
                  {lienSecondaire(t('app.offres.manuel'), manuel)}
                </>
              ) : (
                bouton(t('app.offres.manuel'), manuel)
              )}
            </>
          ) : null}

          {etape === 'formulaire' ? (
            <>
              <FormulaireOffre champs={champs} onChange={setChamps} note={note} />
              <Text style={styles.aide}>{t('app.offres.verification')}</Text>
              {bouton(t('app.offres.publier'), publier, offreValide(champs))}
            </>
          ) : null}

          {etape === 'fini' ? (
            <>
              <Message>{t(statut === 'approved' ? 'app.offres.publiee' : 'app.offres.enVerification')}</Message>
              {bouton(t('app.commun.retour'), () => router.back())}
            </>
          ) : null}

          {message ? <Message>{message}</Message> : null}
          {etape !== 'fini' ? <View style={{ height: 8 }} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Ecran>
  );
}

const useStyles = creerStyles((t) => ({
  contenu: { padding: 16, gap: 8, paddingBottom: 40 },
  icone: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  libelle: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneau, fontSize: 14, textTransform: t.capitales, letterSpacing: espace(t, 1), marginTop: 8 },
  champ: { minHeight: CIBLE_TACTILE, backgroundColor: t.couleurs.cellule, borderRadius: t.rayons.sm, borderWidth: t.sombre ? 0 : 1, borderColor: t.couleurs.filet, color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 16, paddingHorizontal: 14 },
  multi: { minHeight: 220, paddingTop: 12 },
  texte: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 15, lineHeight: 22 },
  aide: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13, lineHeight: 18, marginTop: 4 },
  bouton: { marginTop: 12, minHeight: CIBLE_TACTILE + 4, backgroundColor: t.couleurs.accent, borderRadius: t.rayons.sm, alignItems: 'center', justifyContent: 'center' },
  inactif: { opacity: 0.4 },
  boutonTexte: { color: t.couleurs.surAccent, fontFamily: t.polices.panneauGras, fontSize: 18, textTransform: t.capitales, letterSpacing: espace(t, 1.2) },
  lien: { minHeight: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  lienTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 14, textDecorationLine: 'underline' },
}));
