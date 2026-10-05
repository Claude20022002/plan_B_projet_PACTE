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
 * Jeu « Terminal Linux » sur téléphone : le parcours en haut, puis le défi et le terminal simulé
 * (même moteur que le web, shared/terminal). L'objectif est vérifié après chaque commande ; la
 * réussite est enregistrée par Planner.
 */
export default function Terminal() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { utilisateur } = useAuth();
  const { defi: demande } = useLocalSearchParams();
  const defis = useMemo(() => defisLinux(i18n.language), [i18n.language]);
  const [reussis, setReussis] = useState(() => new Map());
  const [choisi, setChoisi] = useState(typeof demande === 'string' ? demande : null);
  const [essai, setEssai] = useState(0);
  const courantId = defis.some((d) => d.id === choisi) ? choisi : (defis.find((d) => !reussis.has(d.id)) ?? defis[0]).id;
  const index = defis.findIndex((d) => d.id === courantId);

  useEffect(() => {
    chargerProgressionJeu(CODE)
      .then((p) => setReussis(new Map((p?.defis ?? []).map((d) => [d.id, d]))))
      .catch(() => {});
  }, []);

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
            const fait = reussis.has(d.id);
            return (
              <Pressable key={d.id} onPress={() => setChoisi(d.id)} style={[styles.pastille, actif && styles.pastilleActive]} accessibilityRole="button" accessibilityState={{ selected: actif }} accessibilityLabel={`${i + 1}. ${d.titre}${fait ? `, ${t('app.terminal.reussi')}` : ''}`}>
                <View style={[styles.lampe, fait && styles.lampeAllumee]} />
                <Text style={[styles.pastilleTexte, actif && { color: couleurs.lettre }]}>{i + 1}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {/* Une partie par défi et par essai : changer de défi ou recommencer repart d'un terminal neuf */}
        <Partie
          key={`${courantId}-${essai}`}
          defi={defis[index]}
          joueur={utilisateur?.prenom || 'etudiant'}
          langue={i18n.language}
          dejaReussi={reussis.get(courantId)}
          onReussite={(id, points) => setReussis((m) => new Map(m).set(id, { id, points }))}
          onSuivant={defis[index + 1] ? () => setChoisi(defis[index + 1].id) : null}
          onRecommencer={() => setEssai((n) => n + 1)}
        />
      </KeyboardAvoidingView>
    </Ecran>
  );
}

function Partie({ defi, joueur, langue, dejaReussi, onReussite, onSuivant, onRecommencer }) {
  const { t } = useTranslation();
  const [partie] = useState(() => new PartieTerminal(defi.id, { joueur, langue }));
  const [lignes, setLignes] = useState([]);
  const [saisie, setSaisie] = useState('');
  const [indices, setIndices] = useState(0);
  const [retour, setRetour] = useState(null);
  const ecran = useRef(null);

  const reussir = async () => {
    let points = dejaReussi?.points ?? pointsPour(defi.xp, indices);
    if (!dejaReussi) {
      try {
        points = (await enregistrerReussite(CODE, defi.id, indices)).points;
        onReussite(defi.id, points);
      } catch {
        // Hors ligne : la réussite est affichée, elle sera enregistrée en rejouant le défi
      }
    }
    setRetour({ ok: true, points });
  };

  const executer = () => {
    const ligne = saisie;
    setSaisie('');
    if (!ligne.trim()) return;
    const invite = partie.invite;
    const r = partie.executer(ligne);
    const sorties = [];
    if (r.erreur) sorties.push({ type: 'erreur', texte: r.erreur.replace(/\n$/, '') });
    if (r.sortie) sorties.push({ type: 'sortie', texte: r.sortie.replace(/\n$/, '') });
    setLignes((l) => (r.effacer ? sorties : [...l, { type: 'commande', invite, texte: ligne }, ...sorties].slice(-300)));
    if (!retour?.ok && partie.verifier().ok) reussir();
  };

  const verifier = () => {
    const v = partie.verifier();
    if (v.ok) reussir();
    else setRetour({ ok: false, message: v.message });
  };

  const completer = () => {
    const r = partie.completer(saisie);
    setSaisie(r.valeur);
    if (r.suggestions.length > 1) setLignes((l) => [...l, { type: 'erreur', texte: r.suggestions.join('   ') }]);
  };

  // Tab et caractères difficiles à taper sur un clavier de téléphone
  const touches = [
    { libelle: 'Tab', action: completer },
    { libelle: '|', action: () => setSaisie((s) => `${s} | `) },
    { libelle: '>', action: () => setSaisie((s) => `${s} > `) },
    { libelle: '~', action: () => setSaisie((s) => `${s}~`) },
    { libelle: '/', action: () => setSaisie((s) => `${s}/`) },
    { libelle: '↑', action: () => setSaisie(partie.historique.at(-1) ?? ''), nom: t('app.terminal.derniere') },
  ];

  return (
    <>
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

        <View accessibilityLiveRegion="polite">
          {retour?.ok ? <Message>{t('app.terminal.reussite', { points: retour.points })}</Message> : null}
          {retour && !retour.ok ? <Text style={styles.echec}>{retour.message}</Text> : null}
        </View>

        <View style={styles.actions}>
          {retour?.ok && onSuivant ? <Bouton plein onPress={onSuivant}>{t('app.terminal.suivant')}</Bouton> : null}
          {!retour?.ok ? <Bouton plein onPress={verifier}>{t('app.terminal.verifier')}</Bouton> : null}
          {!retour?.ok && indices < INDICES_MAX ? <Bouton onPress={() => setIndices((n) => n + 1)}>{t('app.terminal.indice', { n: indices + 1, total: INDICES_MAX })}</Bouton> : null}
          {!retour?.ok && indices === INDICES_MAX ? <Bouton onPress={() => setIndices(NIVEAU_REPONSE)}>{t('app.terminal.reponse')}</Bouton> : null}
          <Bouton onPress={onRecommencer}>{t('app.terminal.recommencer')}</Bouton>
        </View>
      </ScrollView>

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
          {touches.map((touche) => (
            <Pressable key={touche.libelle} onPress={touche.action} style={styles.touche} accessibilityRole="button" accessibilityLabel={touche.nom ?? touche.libelle}>
              <Text style={styles.toucheTexte}>{touche.libelle}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </>
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
  lampeAllumee: { backgroundColor: couleurs.enCours, borderColor: couleurs.enCours },
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
