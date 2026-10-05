import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../board/Ecran';
import { useAuth } from '../auth/AuthContext';
import { chargerProgressionJeu, enregistrerReussite } from '../api/donnees';
import { INDICES_MAX, NIVEAU_REPONSE, PartieTerminal, defisLinux, pointsPour } from '../../../shared/terminal/jeu.js';
import { CIBLE_TACTILE, couleurs, polices } from '../theme';

const CODE = 'terminal-linux';
const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

/**
 * Jeu « Terminal Linux » sur téléphone : le défi en haut, le terminal simulé dessous (même moteur
 * que le web, shared/terminal). L'objectif est vérifié après chaque commande ; la réussite est
 * enregistrée par Planner. Raccourcis en bas du terminal pour Tab et les caractères difficiles
 * à taper sur un clavier de téléphone (| > ~ /).
 */
export default function Terminal() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { utilisateur } = useAuth();
  const { defi: demande } = useLocalSearchParams();
  const langue = i18n.language;
  const defis = useMemo(() => defisLinux(langue), [langue]);
  const [reussis, setReussis] = useState(() => new Map());
  const [choisi, setChoisi] = useState(typeof demande === 'string' ? demande : null);
  const courantId = defis.some((d) => d.id === choisi) ? choisi : (defis.find((d) => !reussis.has(d.id)) ?? defis[0]).id;
  const index = defis.findIndex((d) => d.id === courantId);
  const defi = defis[index];
  const [essai, setEssai] = useState(0);
  const partie = useMemo(
    () => new PartieTerminal(courantId, { joueur: utilisateur?.prenom || 'etudiant', langue }),
    // essai : nouvelle partie à « Recommencer »
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [courantId, essai, utilisateur?.prenom]
  );
  const [lignes, setLignes] = useState([]);
  const [saisie, setSaisie] = useState('');
  const [indices, setIndices] = useState(0);
  const [retour, setRetour] = useState(null);
  const ecran = useRef(null);
  const champ = useRef(null);

  useEffect(() => {
    chargerProgressionJeu(CODE)
      .then((p) => setReussis(new Map((p?.defis ?? []).map((d) => [d.id, d]))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLignes([]);
    setSaisie('');
    setIndices(0);
    setRetour(null);
  }, [partie]);

  const executer = async () => {
    const ligne = saisie;
    setSaisie('');
    if (!ligne.trim()) return;
    const r = partie.executer(ligne);
    const sorties = [];
    if (r.erreur) sorties.push({ type: 'erreur', texte: r.erreur.replace(/\n$/, '') });
    if (r.sortie) sorties.push({ type: 'sortie', texte: r.sortie.replace(/\n$/, '') });
    setLignes((l) => (r.effacer ? sorties : [...l, { type: 'commande', invite: partie.invite, texte: ligne }, ...sorties].slice(-300)));
    if (retour?.ok || !partie.verifier().ok) return;
    let points = reussis.get(defi.id)?.points ?? pointsPour(defi.xp, indices);
    if (!reussis.has(defi.id)) {
      try {
        points = (await enregistrerReussite(CODE, defi.id, indices)).points;
        setReussis((m) => new Map(m).set(defi.id, { id: defi.id, points }));
      } catch {
        // Hors ligne : la réussite est affichée, elle sera enregistrée en rejouant le défi
      }
    }
    setRetour({ ok: true, points });
  };

  const verifier = () => {
    const v = partie.verifier();
    setRetour(v.ok ? { ok: true, points: reussis.get(defi.id)?.points ?? pointsPour(defi.xp, indices) } : { ok: false, message: v.message });
  };

  const tab = () => {
    const r = partie.completer(saisie);
    setSaisie(r.valeur);
    if (r.suggestions.length > 1) setLignes((l) => [...l, { type: 'erreur', texte: r.suggestions.join('   ') }]);
    champ.current?.focus();
  };
  const inserer = (texte) => {
    setSaisie((s) => s + texte);
    champ.current?.focus();
  };

  const suivant = defis[index + 1];
  const fermer = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/jeux'))} style={styles.icone} accessibilityRole="button" accessibilityLabel={t('app.commun.retour')}>
      <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
    </Pressable>
  );

  return (
    <Ecran titre={t('app.terminal.titre')} droite={fermer}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Parcours : un défi par pastille, réussis marqués d'une lampe */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.parcours} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
          {defis.map((d, i) => {
            const actif = d.id === courantId;
            return (
              <Pressable key={d.id} onPress={() => setChoisi(d.id)} style={[styles.pastille, actif && styles.pastilleActive]} accessibilityRole="button" accessibilityState={{ selected: actif }} accessibilityLabel={`${i + 1}. ${d.titre}${reussis.has(d.id) ? `, ${t('app.terminal.reussi')}` : ''}`}>
                <View style={[styles.lampe, reussis.has(d.id) && { backgroundColor: couleurs.enCours, borderColor: couleurs.enCours }]} />
                <Text style={[styles.pastilleTexte, actif && { color: couleurs.lettre }]}>{i + 1}</Text>
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

          {retour?.ok ? <Message>{t('app.terminal.reussite', { points: retour.points })}</Message> : null}
          {retour && !retour.ok ? <Text style={styles.echec}>{retour.message}</Text> : null}

          <View style={styles.actions}>
            {retour?.ok && suivant ? (
              <Bouton plein onPress={() => setChoisi(suivant.id)}>{t('app.terminal.suivant')}</Bouton>
            ) : (
              <Bouton plein onPress={verifier}>{t('app.terminal.verifier')}</Bouton>
            )}
            {!retour?.ok && indices < INDICES_MAX ? <Bouton onPress={() => setIndices((n) => n + 1)}>{t('app.terminal.indice', { n: indices + 1, total: INDICES_MAX })}</Bouton> : null}
            {!retour?.ok && indices === INDICES_MAX ? <Bouton onPress={() => setIndices(NIVEAU_REPONSE)}>{t('app.terminal.reponse')}</Bouton> : null}
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
                onChangeText={setSaisie}
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
            {[['Tab', tab], ['|', () => inserer(' | ')], ['>', () => inserer(' > ')], ['~', () => inserer('~')], ['/', () => inserer('/')], ['↑', () => setSaisie(partie.historique.at(-1) ?? '')]].map(([libelle, action]) => (
              <Pressable key={libelle} onPress={action} style={styles.touche} accessibilityRole="button" accessibilityLabel={libelle === '↑' ? t('app.terminal.derniere') : libelle}>
                <Text style={styles.toucheTexte}>{libelle}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Ecran>
  );
}

function Bouton({ plein = false, onPress, children }) {
  return (
    <Pressable onPress={onPress} style={plein ? styles.plein : styles.contour} accessibilityRole="button">
      <Text style={plein ? styles.pleinTexte : styles.contourTexte}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icone: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  parcours: { flexGrow: 0, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: couleurs.filet },
  pastille: { minWidth: CIBLE_TACTILE, height: 40, borderRadius: 3, borderWidth: 1, borderColor: couleurs.filet, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8 },
  pastilleActive: { borderColor: couleurs.lettre, backgroundColor: couleurs.cellule },
  pastilleTexte: { color: couleurs.lettreAttenuee, fontFamily: polices.panneauGras, fontSize: 15 },
  lampe: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: couleurs.filet },
  defi: { flex: 1 },
  niveau: { color: couleurs.lettreAttenuee, fontFamily: polices.panneauGras, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase' },
  titre: { color: couleurs.lettre, fontFamily: polices.panneauGras, fontSize: 24, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 4 },
  texte: { color: couleurs.lettreAttenuee, fontFamily: polices.texte, fontSize: 15, lineHeight: 22, marginTop: 6 },
  objectif: { color: couleurs.lettre, fontFamily: polices.texteGras, fontSize: 15, lineHeight: 22, marginTop: 10, paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: couleurs.cadre },
  indice: { color: couleurs.lettreAttenuee, fontFamily: polices.texte, fontSize: 14, marginTop: 6 },
  solution: { color: couleurs.lettre, fontFamily: MONO, fontSize: 14, marginTop: 8, padding: 10, backgroundColor: couleurs.cellule, borderRadius: 3 },
  echec: { color: couleurs.lettre, fontFamily: polices.texte, fontSize: 14, marginTop: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  plein: { minHeight: CIBLE_TACTILE, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 3, backgroundColor: couleurs.lettre },
  pleinTexte: { color: couleurs.fond, fontFamily: polices.panneauGras, fontSize: 15, letterSpacing: 1, textTransform: 'uppercase' },
  contour: { minHeight: CIBLE_TACTILE, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 3, borderWidth: 1, borderColor: couleurs.filet },
  contourTexte: { color: couleurs.lettre, fontFamily: polices.panneau, fontSize: 14, letterSpacing: 0.8, textTransform: 'uppercase' },
  cadre: { backgroundColor: couleurs.cadre, padding: 6 },
  terminal: { height: 220, backgroundColor: couleurs.fond, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8 },
  mono: { color: couleurs.lettre, fontFamily: MONO, fontSize: 13, lineHeight: 19 },
  monoInvite: { color: couleurs.lettreAttenuee },
  monoErreur: { color: couleurs.lettreAttenuee, fontStyle: 'italic' },
  saisie: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  champ: { flex: 1, padding: 0, minHeight: 32 },
  touches: { flexDirection: 'row', gap: 6, paddingTop: 6 },
  touche: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 3, backgroundColor: couleurs.cellule },
  toucheTexte: { color: couleurs.lettre, fontFamily: MONO, fontSize: 15 },
});
