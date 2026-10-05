import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran from '../board/Ecran';
import { useAuth } from '../auth/AuthContext';
import { chargerAccueilJeux, chargerProgressionJeu, enregistrerReussite } from '../api/donnees';
import Personnage from '../jeux/Personnage';
import { INDICES_MAX, NIVEAU_REPONSE, PartieTerminal, defisLinux, pointsPour } from '../../../shared/terminal/jeu.js';
import { CIBLE_TACTILE, creerStyles, espace, THEMES, useTheme } from '../theme';

const CODE = 'terminal-linux';
const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

/** Touches de raccourci sous le terminal : Tab, caractères difficiles à taper, dernière commande */
const TOUCHES = [
  { libelle: 'Tab', action: 'tab' },
  { libelle: '|', texte: ' | ' },
  { libelle: '>', texte: ' > ' },
  { libelle: '~', texte: '~' },
  { libelle: '/', texte: '/' },
  { libelle: '↑', action: 'derniere' },
];

/** État d'une partie : remis à zéro quand le défi ou l'essai change (clé de la partie) */
const partieNeuve = (cle) => ({ cle, lignes: [], saisie: '', indices: 0, retour: null });

/**
 * Jeu « Terminal Linux » sur téléphone : le défi en haut, le terminal simulé dessous (même moteur
 * que le web, shared/terminal). L'objectif est vérifié après chaque commande ; Planner rejoue la
 * partie avant d'enregistrer la réussite. Raccourcis en bas du terminal pour Tab et les
 * caractères difficiles à taper sur un clavier de téléphone (| > ~ /). Le terminal reste sombre
 * dans tous les thèmes ; une réussite fait sauter le personnage du joueur (sans son).
 */
export default function Terminal() {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { utilisateur } = useAuth();
  const { defi: demande } = useLocalSearchParams();
  const langue = i18n.language;
  const defis = useMemo(() => defisLinux(langue), [langue]);
  const [reussis, setReussis] = useState(() => new Map());
  const [avatar, setAvatar] = useState(null);
  const [choisi, setChoisi] = useState(typeof demande === 'string' ? demande : null);
  const courantId = defis.some((d) => d.id === choisi) ? choisi : (defis.find((d) => !reussis.has(d.id)) ?? defis[0]).id;
  const index = defis.findIndex((d) => d.id === courantId);
  const defi = defis[index];
  const [essai, setEssai] = useState(0);
  const cle = `${courantId}#${essai}`;
  const partie = useMemo(
    () => new PartieTerminal(courantId, { joueur: utilisateur?.prenom || 'etudiant', langue }),
    // essai : nouvelle partie à « Recommencer »
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [courantId, essai, utilisateur?.prenom]
  );
  const [etatPartie, setEtatPartie] = useState(() => partieNeuve(cle));
  const { lignes, saisie, indices, retour } = etatPartie.cle === cle ? etatPartie : partieNeuve(cle);
  const majPartie = (modif) => setEtatPartie((e) => ({ ...(e.cle === cle ? e : partieNeuve(cle)), ...(typeof modif === 'function' ? modif(e.cle === cle ? e : partieNeuve(cle)) : modif) }));
  const ecran = useRef(null);
  const champ = useRef(null);

  useEffect(() => {
    chargerProgressionJeu(CODE)
      .then((p) => setReussis(new Map((p?.defis ?? []).map((d) => [d.id, d]))))
      .catch(() => {});
    chargerAccueilJeux()
      .then((a) => setAvatar(a?.profil?.avatar ?? null))
      .catch(() => {});
  }, []);

  const executer = async () => {
    const ligne = saisie;
    if (!ligne.trim()) return majPartie({ saisie: '' });
    const r = partie.executer(ligne);
    const sorties = [];
    if (r.erreur) sorties.push({ type: 'erreur', texte: r.erreur.replace(/\n$/, '') });
    if (r.sortie) sorties.push({ type: 'sortie', texte: r.sortie.replace(/\n$/, '') });
    majPartie((e) => ({ saisie: '', lignes: r.effacer ? sorties : [...e.lignes, { type: 'commande', invite: partie.invite, texte: ligne }, ...sorties].slice(-300) }));
    if (retour?.ok || !partie.verifier().ok) return undefined;
    return reussir();
  };

  /**
   * Objectif atteint à l'écran : Planner rejoue la partie et enregistre la réussite. S'il répond
   * par une erreur (objectif non atteint de son côté, session expirée…), la réussite n'est pas
   * affichée ; seule une coupure réseau (statut 0) la laisse à l'écran, marquée non enregistrée.
   */
  const reussir = async () => {
    if (reussis.has(defi.id)) return majPartie({ retour: { ok: true, points: reussis.get(defi.id).points } });
    try {
      const { points } = await enregistrerReussite(CODE, defi.id, indices, [...partie.historique]);
      setReussis((m) => new Map(m).set(defi.id, { id: defi.id, points }));
      return majPartie({ retour: { ok: true, points } });
    } catch (erreur) {
      if (erreur?.statut) {
        return majPartie({ retour: { ok: false, message: erreur.statut === 422 ? t('app.terminal.refus') : erreur.message } });
      }
      return majPartie({ retour: { ok: true, points: pointsPour(defi.xp, indices), horsLigne: true } });
    }
  };

  const verifier = () => {
    const v = partie.verifier();
    if (v.ok) return reussir();
    return majPartie({ retour: { ok: false, message: v.message } });
  };

  const toucher = (touche) => {
    if (touche.action === 'tab') {
      const r = partie.completer(saisie);
      majPartie((e) => ({ saisie: r.valeur, lignes: r.suggestions.length > 1 ? [...e.lignes, { type: 'erreur', texte: r.suggestions.join('   ') }] : e.lignes }));
    } else if (touche.action === 'derniere') {
      majPartie({ saisie: partie.historique.at(-1) ?? '' });
    } else {
      majPartie((e) => ({ saisie: e.saisie + touche.texte }));
    }
    champ.current?.focus();
  };

  const suivant = defis[index + 1];
  const fermer = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/jeux'))} style={styles.icone} accessibilityRole="button" accessibilityLabel={t('app.commun.retour')}>
      <MaterialCommunityIcons name="arrow-left" size={24} color={couleurs.surCadre} />
    </Pressable>
  );

  return (
    <Ecran titre={t('app.terminal.titre')} droite={fermer} espaces={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Parcours : un défi par pastille, réussis marqués d'une lampe */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.parcours} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
          {defis.map((d, i) => {
            const actif = d.id === courantId;
            return (
              <Pressable key={d.id} onPress={() => setChoisi(d.id)} style={[styles.pastille, actif && styles.pastilleActive]} accessibilityRole="button" accessibilityState={{ selected: actif }} accessibilityLabel={`${i + 1}. ${d.titre}${reussis.has(d.id) ? `, ${t('app.terminal.reussi')}` : ''}`}>
                <View style={[styles.lampe, reussis.has(d.id) && { backgroundColor: couleurs.enCours, borderColor: couleurs.enCours }]} />
                <Text style={[styles.pastilleTexte, actif && styles.pastilleTexteActif]}>{i + 1}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView style={styles.defi} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.niveau}>
            {t('app.terminal.niveau', { n: defi.niveau })} · {defi.niveauNom}
            {defi.boss ? ` · ${t('app.terminal.boss')}` : ''}
          </Text>
          <Text style={styles.titre} accessibilityRole="header">{defi.titre}</Text>
          <Text style={styles.texte}>{defi.explication}</Text>
          <Text style={styles.objectif}>{defi.objectif}</Text>
          {defi.indices.slice(0, Math.min(indices, INDICES_MAX)).map((indice, i) => (
            <Text key={i} style={styles.indice}>{`${i + 1}. ${indice}`}</Text>
          ))}
          {indices >= NIVEAU_REPONSE ? <Text style={styles.solution}>{defi.solution}</Text> : null}

          {/* Réussite : le personnage du joueur saute, les points s'affichent */}
          {retour?.ok ? (
            <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.victoire} accessibilityLiveRegion="polite" accessible accessibilityLabel={t('app.terminal.reussite', { points: retour.points })}>
              <Personnage avatar={avatar} idUser={utilisateur?.id_user} taille={56} anime />
              <View style={{ flex: 1 }}>
                <Text style={styles.victoireTitre}>{t('app.terminal.bravo')}</Text>
                <Text style={styles.victoirePoints}>{t('app.terminal.plusPoints', { points: retour.points })}</Text>
                {retour.horsLigne ? <Text style={styles.indice}>{t('app.terminal.nonEnregistre')}</Text> : null}
              </View>
            </Animated.View>
          ) : null}
          {retour && !retour.ok ? <Text style={styles.echec}>{retour.message}</Text> : null}

          <View style={styles.actions}>
            {retour?.ok && suivant ? (
              <Bouton plein onPress={() => setChoisi(suivant.id)}>{t('app.terminal.suivant')}</Bouton>
            ) : (
              <Bouton plein onPress={verifier}>{t('app.terminal.verifier')}</Bouton>
            )}
            {!retour?.ok && indices < INDICES_MAX ? <Bouton onPress={() => majPartie((e) => ({ indices: e.indices + 1 }))}>{t('app.terminal.indice', { n: indices + 1, total: INDICES_MAX })}</Bouton> : null}
            {!retour?.ok && indices === INDICES_MAX ? <Bouton onPress={() => majPartie({ indices: NIVEAU_REPONSE })}>{t('app.terminal.reponse')}</Bouton> : null}
            <Bouton onPress={() => setEssai((n) => n + 1)}>{t('app.terminal.recommencer')}</Bouton>
          </View>
        </ScrollView>

        {/* Terminal */}
        <View style={styles.cadre}>
          <ScrollView ref={ecran} style={styles.terminal} onContentSizeChange={() => ecran.current?.scrollToEnd({ animated: false })} keyboardShouldPersistTaps="handled" accessibilityLiveRegion="polite">
            {lignes.map((l, i) => (
              <Text key={i} style={[styles.mono, l.type === 'erreur' && styles.monoErreur]} selectable>
                {l.type === 'commande' ? <Text style={styles.monoInvite}>{`${l.invite} `}</Text> : null}
                {l.texte}
              </Text>
            ))}
            <View style={styles.saisie}>
              <Text style={[styles.mono, styles.monoInvite]} numberOfLines={1}>{partie.invite}</Text>
              <TextInput
                ref={champ}
                value={saisie}
                onChangeText={(valeur) => majPartie({ saisie: valeur })}
                onSubmitEditing={executer}
                submitBehavior="submit"
                returnKeyType="send"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                style={[styles.mono, styles.champ]}
                selectionColor={couleurs.reporte}
                accessibilityLabel={t('app.terminal.saisie')}
              />
            </View>
          </ScrollView>
          <View style={styles.touches}>
            {TOUCHES.map((touche) => (
              <Pressable key={touche.libelle} onPress={() => toucher(touche)} style={styles.touche} accessibilityRole="button" accessibilityLabel={touche.action === 'derniere' ? t('app.terminal.derniere') : touche.libelle}>
                <Text style={styles.toucheTexte}>{touche.libelle}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Ecran>
  );
}

function Bouton({ plein = false, onPress, children }) {
  const styles = useStyles();
  return (
    <Pressable onPress={onPress} style={plein ? styles.plein : styles.contour} accessibilityRole="button">
      <Text style={plein ? styles.pleinTexte : styles.contourTexte}>{children}</Text>
    </Pressable>
  );
}

const useStyles = creerStyles((t) => {
  // Le terminal garde les couleurs sombres de la famille, quel que soit le mode
  const nuit = THEMES[`${t.famille}-sombre`].couleurs;
  return {
    icone: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
    parcours: { flexGrow: 0, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.couleurs.filet },
    pastille: { minWidth: CIBLE_TACTILE, height: 40, borderRadius: t.rayons.sm, borderWidth: 1, borderColor: t.couleurs.filet, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8 },
    pastilleActive: { borderColor: t.famille === 'planner' ? t.couleurs.lettre : t.couleurs.accent, backgroundColor: t.couleurs.cellule },
    pastilleTexte: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauGras, fontSize: 15 },
    pastilleTexteActif: { color: t.couleurs.lettre },
    lampe: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: t.couleurs.filet },
    defi: { flex: 1 },
    niveau: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauGras, fontSize: 12, letterSpacing: espace(t, 1.6), textTransform: t.capitales },
    titre: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: t.famille === 'planner' ? 24 : 20, letterSpacing: espace(t, 0.6), textTransform: t.capitales, marginTop: 4 },
    texte: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 15, lineHeight: 22, marginTop: 6 },
    objectif: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 15, lineHeight: 22, marginTop: 10, paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: t.famille === 'planner' ? t.couleurs.cadre : t.couleurs.accent },
    indice: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 14, marginTop: 6 },
    solution: { color: nuit.lettre, fontFamily: MONO, fontSize: 14, marginTop: 8, padding: 10, backgroundColor: nuit.cellule, borderRadius: t.rayons.sm },
    echec: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 14, marginTop: 10 },
    victoire: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 14,
      padding: 12,
      borderRadius: t.rayons.md,
      backgroundColor: t.scene.ciel,
    },
    victoireTitre: { color: t.scene.texte, fontFamily: t.polices.panneauGras, fontSize: 20, textTransform: t.capitales, letterSpacing: espace(t, 1) },
    victoirePoints: { color: t.scene.texteAttenue, fontFamily: t.polices.panneau, fontSize: 16, fontVariant: ['tabular-nums'] },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
    plein: { minHeight: CIBLE_TACTILE, paddingHorizontal: 16, justifyContent: 'center', borderRadius: t.rayons.sm, backgroundColor: t.couleurs.accent },
    pleinTexte: { color: t.couleurs.surAccent, fontFamily: t.polices.panneauGras, fontSize: 15, letterSpacing: espace(t, 1), textTransform: t.capitales },
    contour: { minHeight: CIBLE_TACTILE, paddingHorizontal: 12, justifyContent: 'center', borderRadius: t.rayons.sm, borderWidth: 1, borderColor: t.couleurs.filet },
    contourTexte: { color: t.couleurs.lettre, fontFamily: t.polices.panneau, fontSize: 14, letterSpacing: espace(t, 0.8), textTransform: t.capitales },
    cadre: { backgroundColor: t.famille === 'planner' ? t.couleurs.cadre : nuit.cellule, padding: 6 },
    terminal: { height: 220, backgroundColor: nuit.fond, borderRadius: t.rayons.xs + 2, paddingHorizontal: 10, paddingVertical: 8 },
    mono: { color: nuit.lettre, fontFamily: MONO, fontSize: 13, lineHeight: 19 },
    monoInvite: { color: nuit.lettreAttenuee },
    monoErreur: { color: nuit.lettreAttenuee, fontStyle: 'italic' },
    saisie: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    champ: { flex: 1, padding: 0, minHeight: 32 },
    touches: { flexDirection: 'row', gap: 6, paddingTop: 6 },
    touche: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: t.rayons.sm, backgroundColor: nuit.cellule },
    toucheTexte: { color: nuit.lettre, fontFamily: MONO, fontSize: 15 },
  };
});
