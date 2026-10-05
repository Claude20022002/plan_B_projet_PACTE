import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../../board/Ecran';
import { chargerResultatsQuiz } from '../../api/donnees';
import { CIBLE_TACTILE, creerStyles, espace, useTheme } from '../../theme';

/**
 * Résultats d'un quiz pour l'étudiant : son score et son rang, le défi par équipes (groupes de TP
 * de la séance, classés par moyenne), le podium et les nuages de mots des réponses libres.
 */
export default function Resultats() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams();
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (!/^\d{1,10}$/.test(String(id ?? ''))) return;
    chargerResultatsQuiz(id).then(setDonnees, () => setErreur(true));
  }, [id]);

  const nombre = (n) => Number(n ?? 0).toLocaleString(i18n.language === 'en' ? 'en-GB' : 'fr-FR');
  const p = donnees?.partie;
  const meilleure = Math.max(1, ...(donnees?.equipes ?? []).map((e) => e.moyenne));
  // Teintes du nuage : celles du thème, lisibles sur la carte (contrastes testés)
  const teintes = [couleurs.lettre, couleurs.enCours, couleurs.lettreAttenuee];
  const retour = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/jeux'))} style={styles.icone} accessibilityRole="button" accessibilityLabel={t('app.commun.retour')}>
      <MaterialCommunityIcons name="arrow-left" size={24} color={couleurs.surCadre} />
    </Pressable>
  );

  return (
    <Ecran titre={t('app.resultats.titre')} droite={retour} espaces={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {erreur || !/^\d{1,10}$/.test(String(id ?? '')) ? <Message>{t('app.resultats.erreur')}</Message> : null}
        {!donnees && !erreur ? <Message discret>{t('app.commun.chargement')}</Message> : null}
        {donnees ? (
          <>
            <View style={styles.entete}>
              <Text style={styles.titre} accessibilityRole="header">{p.titre}</Text>
              <Text style={styles.detail}>{[p.module?.nom, t('app.resultats.joueurs', { count: p.nb_joueurs ?? 0 })].filter(Boolean).join(' · ')}</Text>
            </View>

            {donnees.moi ? (
              <View style={styles.score} accessible accessibilityLabel={t('app.resultats.monScoreLu', { score: donnees.moi.score, count: donnees.moi.rang, ordinal: true, total: p.nb_joueurs })}>
                <Text style={styles.scoreValeur}>{nombre(donnees.moi.score)}</Text>
                <Text style={styles.scoreUnite}>pts</Text>
                <View style={{ flex: 1 }} />
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.rang}>{t('app.resultats.rang', { count: donnees.moi.rang, ordinal: true, total: p.nb_joueurs })}</Text>
                  {p.nb_questions ? <Text style={styles.detail}>{t('app.resultats.bonnes', { bonnes: donnees.moi.bonnes, total: p.nb_questions })}</Text> : null}
                </View>
              </View>
            ) : null}

            {donnees.equipes.length ? (
              <View>
                <Text style={styles.section} accessibilityRole="header">{t('app.resultats.equipes')}</Text>
                {donnees.equipes.map((e) => (
                  <View key={e.id_groupe} style={styles.equipe} accessible accessibilityLabel={`${e.rang}. ${e.nom} : ${t('app.resultats.moyenne', { moyenne: e.moyenne, count: e.joueurs })}`}>
                    <Text style={[styles.equipeRang, e.rang === 1 && { color: couleurs.lettre }]}>{e.rang}</Text>
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.equipeNom}>{e.nom}</Text>
                        <Text style={styles.detail}>{t('app.resultats.moyenne', { moyenne: nombre(e.moyenne), count: e.joueurs })}</Text>
                      </View>
                      <View style={styles.barre}>
                        <View style={[styles.barrePleine, { width: `${Math.round((100 * e.moyenne) / meilleure)}%`, backgroundColor: e.rang === 1 ? couleurs.enCours : couleurs.lettreAttenuee }]} />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            <Text style={styles.section} accessibilityRole="header">{t('app.resultats.podium')}</Text>
            {donnees.classement.map((c) => (
              <View key={c.pseudo} style={[styles.ligne, donnees.moi?.pseudo === c.pseudo && styles.ligneMoi]}>
                <Text style={styles.ligneRang}>{c.rang}</Text>
                <Text style={styles.lignePseudo} numberOfLines={1}>{c.pseudo}</Text>
                <Text style={styles.ligneScore}>{nombre(c.score)}</Text>
              </View>
            ))}

            {donnees.nuages.map((n) => (
              <View key={n.index}>
                <Text style={styles.section} accessibilityRole="header">{t('app.resultats.nuage')}</Text>
                <Text style={[styles.detail, { paddingHorizontal: 16, marginBottom: 8 }]}>{n.question}</Text>
                <View style={styles.nuage} accessibilityRole="list">
                  {n.mots.map((m, i) => {
                    const max = n.mots[0]?.nombre || 1;
                    return (
                      <Text
                        key={m.texte}
                        accessibilityLabel={`${m.texte} : ${t('app.resultats.reponses', { count: m.nombre })}`}
                        style={[styles.mot, { fontSize: 15 + 22 * Math.sqrt(m.nombre / max), color: teintes[i % teintes.length] }]}
                      >
                        {m.texte}
                      </Text>
                    );
                  })}
                </View>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </Ecran>
  );
}

const useStyles = creerStyles((t) => ({
  icone: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  entete: { paddingHorizontal: 16, paddingTop: 16, gap: 4 },
  titre: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 24, textTransform: t.capitales, letterSpacing: espace(t, 0.6) },
  detail: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 14 },
  score: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    margin: 16,
    padding: 16,
    borderRadius: t.rayons.md,
    backgroundColor: t.scene.ciel,
  },
  scoreValeur: { color: t.scene.texte, fontFamily: t.polices.panneauGras, fontSize: 48, fontVariant: ['tabular-nums'] },
  scoreUnite: { color: t.scene.texteAttenue, fontFamily: t.polices.panneau, fontSize: 18 },
  rang: { color: t.scene.texte, fontFamily: t.polices.panneauGras, fontSize: 18, textTransform: t.capitales },
  section: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauGras, fontSize: 13, letterSpacing: espace(t, 1.8), textTransform: t.capitales, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  equipe: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  equipeRang: { width: 22, color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauGras, fontSize: 22 },
  equipeNom: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 17, textTransform: t.capitales },
  barre: { height: 8, borderRadius: 4, backgroundColor: t.couleurs.filet, overflow: 'hidden' },
  barrePleine: { height: 8, borderRadius: 4 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: CIBLE_TACTILE, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: t.couleurs.filet },
  ligneMoi: { backgroundColor: t.couleurs.cellule },
  ligneRang: { width: 22, color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauGras, fontSize: 18 },
  lignePseudo: { flex: 1, color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 15 },
  ligneScore: { color: t.couleurs.lettre, fontFamily: t.polices.panneau, fontSize: 17, fontVariant: ['tabular-nums'] },
  nuage: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: 14, rowGap: 4, marginHorizontal: 16, padding: 14, borderRadius: t.rayons.md, backgroundColor: t.couleurs.cellule },
  mot: { fontFamily: t.polices.panneauGras },
}));
