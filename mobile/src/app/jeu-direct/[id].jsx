import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../../board/Ecran';
import { chargerTableauJeu, proposerAuTableau } from '../../api/donnees';
import { defisLinux } from '../../../../shared/terminal/jeu.js';
import { ecranDuTableau } from '../../../../shared/terminal/tableau.js';
import { CIBLE_TACTILE, creerStyles, espace, THEMES, useTheme } from '../../theme';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const RAFRAICHIR_MS = 3000;

/**
 * Jeu joué au tableau avec la classe (session collective), sur le téléphone de l'étudiant : le
 * défi projeté, la réponse qu'il envoie à l'enseignant, et le terminal de la classe rejoué avec
 * le même moteur que le tableau (shared/terminal/tableau.js). Relu toutes les 3 secondes.
 */
export default function JeuDirect() {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const langue = i18n.language;
  const defis = useMemo(() => defisLinux(langue), [langue]);
  const [tableau, setTableau] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [saisie, setSaisie] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState(null);
  const terminal = useRef(null);

  useEffect(() => {
    let actif = true;
    const lire = () =>
      chargerTableauJeu(id)
        .then((v) => {
          if (!actif) return;
          setTableau(v);
          setErreur(null);
        })
        .catch((e) => actif && setErreur(e?.message || t('app.sessionJeu.erreur')));
    lire();
    const minuterie = setInterval(lire, RAFRAICHIR_MS);
    return () => {
      actif = false;
      clearInterval(minuterie);
    };
  }, [id, t]);

  const defi = tableau ? defis.find((d) => d.id === tableau.id_defi) : null;
  const ecran = useMemo(() => (defi ? ecranDuTableau(defi.id, tableau.commandes, { langue }) : null), [defi, tableau, langue]);
  const ouverte = tableau?.statut === 'ouverte';
  const mienne = tableau?.ma_proposition;

  const envoyer = async () => {
    const texte = saisie.trim();
    if (!texte || envoi) return;
    setEnvoi(true);
    try {
      setTableau(await proposerAuTableau(id, texte));
      setSaisie('');
      setMessage(t('app.sessionJeu.envoyee'));
    } catch (e) {
      setMessage(e?.message || t('app.sessionJeu.erreur'));
    } finally {
      setEnvoi(false);
    }
  };

  const fermer = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.icone} accessibilityRole="button" accessibilityLabel={t('app.commun.retour')}>
      <MaterialCommunityIcons name="arrow-left" size={24} color={couleurs.surCadre} />
    </Pressable>
  );

  let contenu;
  if (!tableau) contenu = <Message discret={!erreur}>{erreur ?? t('app.commun.chargement')}</Message>;
  else if (!defi) contenu = <Message>{t('app.sessionJeu.erreur')}</Message>;
  else {
    contenu = (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 10 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.niveau}>{tableau.module?.code ?? ''}</Text>
          <Text style={styles.titre} accessibilityRole="header">{defi.titre}</Text>
          <Text style={styles.objectif}>{defi.objectif}</Text>
          {tableau.reussi ? <Text style={styles.bandeau} accessibilityLiveRegion="polite">{t('app.sessionJeu.reussi')}</Text> : null}
          {!ouverte ? <Text style={styles.bandeau}>{t('app.sessionJeu.terminee')}</Text> : null}
          {ouverte ? (
            <View style={styles.formulaire}>
              <TextInput
                value={saisie}
                onChangeText={setSaisie}
                onSubmitEditing={envoyer}
                placeholder={t('app.sessionJeu.reponse')}
                placeholderTextColor={couleurs.lettreAttenuee}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                maxLength={300}
                returnKeyType="send"
                style={styles.champ}
                accessibilityLabel={t('app.sessionJeu.reponse')}
              />
              <Pressable onPress={envoyer} disabled={envoi || !saisie.trim()} style={({ pressed }) => [styles.bouton, (pressed || envoi || !saisie.trim()) && { opacity: 0.6 }]} accessibilityRole="button">
                <Text style={styles.boutonTexte}>{t('app.sessionJeu.envoyer')}</Text>
              </Pressable>
            </View>
          ) : null}
          {message ? <Text style={styles.texte} accessibilityLiveRegion="polite">{message}</Text> : null}
          {mienne ? (
            <Text style={styles.texte}>
              {t(`app.sessionJeu.${mienne.statut}`)} <Text style={styles.code}>{mienne.texte}</Text>
            </Text>
          ) : null}
          <Text style={styles.niveau}>{t('app.sessionJeu.terminal')}</Text>
          <ScrollView ref={terminal} style={styles.terminal} nestedScrollEnabled onContentSizeChange={() => terminal.current?.scrollToEnd({ animated: false })}>
            {ecran.lignes.map((l, i) => (
              <Text key={i} style={[styles.mono, l.type === 'erreur' && styles.monoErreur]} selectable>
                {l.type === 'commande' ? <Text style={styles.monoInvite}>{`${l.invite} `}</Text> : null}
                {l.texte}
              </Text>
            ))}
            <Text style={[styles.mono, styles.monoInvite]}>{ecran.invite}</Text>
          </ScrollView>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <Ecran titre={t('app.sessionJeu.titre')} droite={fermer} espaces={false}>
      {contenu}
    </Ecran>
  );
}

const useStyles = creerStyles((t) => {
  // Le terminal garde les couleurs sombres de la famille, quel que soit le mode (comme terminal.jsx)
  const nuit = THEMES[`${t.famille}-sombre`].couleurs;
  return {
    icone: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
    niveau: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauGras, fontSize: 12, letterSpacing: espace(t, 1.6), textTransform: t.capitales },
    titre: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: t.famille === 'planner' ? 24 : 20, letterSpacing: espace(t, 0.6), textTransform: t.capitales },
    objectif: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 15, lineHeight: 22, paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: t.famille === 'planner' ? t.couleurs.cadre : t.couleurs.accent },
    bandeau: { color: t.scene.texte, backgroundColor: t.scene.ciel, fontFamily: t.polices.texteGras, fontSize: 15, padding: 12, borderRadius: t.rayons.md, overflow: 'hidden' },
    texte: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 14, lineHeight: 20 },
    code: { color: t.couleurs.lettre, fontFamily: MONO },
    formulaire: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    champ: { flex: 1, minHeight: CIBLE_TACTILE, paddingHorizontal: 12, borderWidth: 1, borderColor: t.couleurs.filet, borderRadius: t.rayons.sm, color: t.couleurs.lettre, fontFamily: MONO, fontSize: 15 },
    bouton: { minHeight: CIBLE_TACTILE, paddingHorizontal: 16, justifyContent: 'center', borderRadius: t.rayons.sm, backgroundColor: t.couleurs.accent },
    boutonTexte: { color: t.couleurs.surAccent, fontFamily: t.polices.panneauGras, fontSize: 15, letterSpacing: espace(t, 1), textTransform: t.capitales },
    terminal: { height: 260, backgroundColor: nuit.fond, borderRadius: t.rayons.sm, paddingHorizontal: 10, paddingVertical: 8 },
    mono: { color: nuit.lettre, fontFamily: MONO, fontSize: 13, lineHeight: 19 },
    monoInvite: { color: nuit.lettreAttenuee },
    monoErreur: { color: nuit.lettreAttenuee, fontStyle: 'italic' },
  };
});
