import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import Ecran, { Message } from '../../board/Ecran';
import { chargerAccueilJeux, chargerConfigQuiz, chargerPartiesQuiz } from '../../api/donnees';
import { adresseEspace } from '../../../../shared/espaces.js';
import { libelle } from '../../../../shared/jeux/catalogue.js';
import { CIBLE_TACTILE, couleurs, polices } from '../../theme';

const RAFRAICHISSEMENT_QUIZ_MS = 20000;
// Écran de chaque jeu intégré
const ECRAN_JEU = { 'terminal-linux': '/terminal' };

// Lecture seule : le composant applique le résultat dans le .then (aucun état modifié ici)
const lireTout = () =>
  Promise.allSettled([chargerPartiesQuiz(), chargerAccueilJeux(), chargerConfigQuiz()]).then(([parties, accueil, config]) => ({
    parties: parties.status === 'fulfilled' ? parties.value : null,
    accueil: accueil.status === 'fulfilled' ? accueil.value : null,
    config: config.status === 'fulfilled' ? config.value : null,
    erreur: accueil.status === 'rejected',
  }));

const ouvrir = (url) => WebBrowser.openBrowserAsync(url, { toolbarColor: couleurs.fond, controlsColor: couleurs.lettre, dismissButtonStyle: 'close' }).catch(() => {});

/**
 * Onglet Jeux : quiz en direct de mes séances (ClassQuiz, code et nom déjà remplis), jeux
 * proposés dans mes modules et tous les jeux avec ma progression (terminal Linux…).
 */
export default function Jeux() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [donnees, setDonnees] = useState(null);
  const [rafraichit, setRafraichit] = useState(false);

  const charger = useCallback(
    () =>
      lireTout().then((d) => {
        setDonnees((avant) => ({ ...d, parties: d.parties ?? avant?.parties ?? [], accueil: d.accueil ?? avant?.accueil ?? null }));
        setRafraichit(false);
      }),
    []
  );

  useEffect(() => {
    charger();
    // Une partie se lance en cours de séance : on revérifie toutes les 20 secondes
    const id = setInterval(() => charger(), RAFRAICHISSEMENT_QUIZ_MS);
    return () => clearInterval(id);
  }, [charger]);

  const urlQuiz = donnees?.config?.actif && /^https:\/\//.test(donnees.config.url ?? '') ? donnees.config.url : null;
  const saisirCode = adresseEspace('quiz', { role: 'etudiant', urlQuiz });
  const jeux = donnees?.accueil?.jeux ?? [];
  const modules = donnees?.accueil?.modules ?? [];
  const titreJeu = (code) => libelle(jeux.find((j) => j.code === code)?.titre, i18n.language) || code;

  return (
    <Ecran titre={t('app.jeux.titre')}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={rafraichit} onRefresh={() => { setRafraichit(true); charger(); }} tintColor={couleurs.lettre} colors={[couleurs.cadre]} />}
      >
        {donnees?.erreur ? <Message>{t('app.jeux.erreur')}</Message> : null}
        {!donnees ? <Message discret>{t('app.commun.chargement')}</Message> : null}

        {/* Quiz en direct */}
        {urlQuiz ? (
          <View>
            <Text style={styles.section} accessibilityRole="header">{t('app.jeux.quiz')}</Text>
            {(donnees?.parties ?? []).map((p) => (
              <View key={p.id} style={styles.ligne}>
                <View style={[styles.lampe, { backgroundColor: couleurs.enCours }]} />
                <View style={styles.contenu}>
                  <Text style={styles.statut}>{t('app.jeux.enCours')}</Text>
                  <Text style={styles.titre}>{p.titre}</Text>
                  {p.module ? <Text style={styles.detail}>{p.module.nom}</Text> : null}
                  <Text style={styles.code}>{t('app.jeux.code', { pin: p.pin })}</Text>
                </View>
                {p.url ? (
                  <Pressable onPress={() => ouvrir(p.url)} style={styles.plein} accessibilityRole="button" accessibilityLabel={`${t('app.jeux.rejoindre')} : ${p.titre}`}>
                    <Text style={styles.pleinTexte}>{t('app.jeux.rejoindre')}</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
            {donnees && !(donnees.parties ?? []).length ? (
              <View style={styles.ligne}>
                <View style={styles.lampe} />
                <Text style={[styles.detail, styles.contenu]}>{t('app.jeux.vide')}</Text>
                {saisirCode ? (
                  <Pressable onPress={() => ouvrir(saisirCode)} style={styles.contour} accessibilityRole="button">
                    <Text style={styles.contourTexte}>{t('app.jeux.saisirCode')}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Jeux de mes modules */}
        {modules.length ? (
          <View>
            <Text style={styles.section} accessibilityRole="header">{t('app.jeux.mesModules')}</Text>
            {modules.flatMap((m) =>
              m.jeux.map((code) => (
                <Pressable key={`${m.id_cours}-${code}`} onPress={() => ECRAN_JEU[code] && router.push(ECRAN_JEU[code])} style={styles.ligne} accessibilityRole="button">
                  <View style={[styles.lampe, { backgroundColor: couleurs.enCours }]} />
                  <View style={styles.contenu}>
                    <Text style={styles.titreCapitales}>{titreJeu(code)}</Text>
                    <Text style={styles.detail}>{t('app.jeux.proposePar', { module: `${m.code} · ${m.nom}` })}</Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        ) : null}

        {/* Tous les jeux */}
        <Text style={styles.section} accessibilityRole="header">{t('app.jeux.tous')}</Text>
        {jeux.map((jeu) => {
          const p = jeu.progression;
          return (
            <Pressable key={jeu.code} onPress={() => ECRAN_JEU[jeu.code] && router.push(ECRAN_JEU[jeu.code])} style={styles.ligne} accessibilityRole="button" accessibilityLabel={`${libelle(jeu.titre, i18n.language)}, ${t('app.jeux.progression', { reussis: p.reussis, total: p.total, points: p.points })}`}>
              <View style={[styles.lampe, p.reussis ? { backgroundColor: couleurs.enCours } : null]} />
              <View style={styles.contenu}>
                <Text style={styles.titreCapitales}>{libelle(jeu.titre, i18n.language)}</Text>
                <Text style={styles.detail}>{libelle(jeu.resume, i18n.language)}</Text>
                <View style={styles.barre}>
                  <View style={[styles.barrePleine, { width: `${p.total ? Math.round((100 * p.reussis) / p.total) : 0}%` }]} />
                </View>
                <Text style={styles.code}>{t('app.jeux.progression', { reussis: p.reussis, total: p.total, points: p.points })}</Text>
                <Text style={styles.source}>{t('app.jeux.source', { nom: jeu.source.nom, auteur: jeu.source.auteur, licence: jeu.source.licence })}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  section: { color: couleurs.lettreAttenuee, fontFamily: polices.panneauGras, fontSize: 13, letterSpacing: 1.8, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: CIBLE_TACTILE + 16, borderTopWidth: 1, borderTopColor: couleurs.filet },
  lampe: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: couleurs.filet },
  contenu: { flex: 1 },
  statut: { color: couleurs.enCours, fontFamily: polices.panneauGras, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' },
  titre: { color: couleurs.lettre, fontFamily: polices.texteGras, fontSize: 16, marginTop: 2 },
  titreCapitales: { color: couleurs.lettre, fontFamily: polices.panneauGras, fontSize: 18, letterSpacing: 1, textTransform: 'uppercase' },
  detail: { color: couleurs.lettreAttenuee, fontFamily: polices.texte, fontSize: 14, marginTop: 2, lineHeight: 20 },
  code: { color: couleurs.lettreAttenuee, fontFamily: polices.panneauMoyen, fontSize: 14, marginTop: 4, letterSpacing: 1 },
  source: { color: couleurs.lettreAttenuee, fontFamily: polices.texte, fontSize: 12, marginTop: 4 },
  barre: { height: 4, borderRadius: 2, backgroundColor: couleurs.filet, marginTop: 10, overflow: 'hidden' },
  barrePleine: { height: 4, backgroundColor: couleurs.lettre },
  plein: { minHeight: CIBLE_TACTILE, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 4, backgroundColor: couleurs.lettre },
  pleinTexte: { color: couleurs.fond, fontFamily: polices.panneauGras, fontSize: 16, letterSpacing: 1, textTransform: 'uppercase' },
  contour: { minHeight: CIBLE_TACTILE, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 3, borderWidth: 1, borderColor: couleurs.filet },
  contourTexte: { color: couleurs.lettre, fontFamily: polices.panneau, fontSize: 14, letterSpacing: 0.8, textTransform: 'uppercase' },
});
