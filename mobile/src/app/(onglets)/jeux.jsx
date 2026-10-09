import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../../board/Ecran';
import { useAuth } from '../../auth/AuthContext';
import { chargerActivites, chargerHistoriqueQuiz, choisirAvatar } from '../../api/donnees';
import ChoixPersonnage from '../../jeux/ChoixPersonnage';
import Personnage from '../../jeux/Personnage';
import Scene from '../../jeux/Scene';
import { libelle } from '../../../../shared/jeux/catalogue.js';
import { CIBLE_TACTILE, creerStyles, espace, useTheme } from '../../theme';
import { useMargeOnglets } from '../../verre/Verre';

const RAFRAICHISSEMENT_QUIZ_MS = 20000;
// Écran de chaque jeu intégré
const ECRAN_JEU = { 'terminal-linux': '/terminal' };

// Lecture seule : le composant applique le résultat dans le .then (aucun état modifié ici)
const lireTout = () =>
  Promise.allSettled([chargerActivites(), chargerHistoriqueQuiz()]).then(([activites, historique]) => ({
    activites: activites.status === 'fulfilled' ? activites.value : null,
    historique: historique.status === 'fulfilled' ? historique.value : null,
    erreur: activites.status === 'rejected',
  }));

/**
 * Onglet Activités : quiz, devoirs et jeux forment un même ensemble, choisi par les enseignants
 * dans chaque module pour vérifier la compréhension d'un cours ou d'une notion, ou pour
 * s'entraîner. Le joueur dans sa scène en tête (personnage et décor repris de CatéGO), puis ses
 * modules, ce qui est à faire d'abord (quiz en cours, devoirs à rendre). Aucun son.
 */
export default function Jeux() {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const margeBas = useMargeOnglets();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { utilisateur } = useAuth();
  const [donnees, setDonnees] = useState(null);
  const [rafraichit, setRafraichit] = useState(false);
  const [avatarChoisi, setAvatarChoisi] = useState(null);
  const [choix, setChoix] = useState(false);

  const charger = useCallback(
    () =>
      lireTout().then((d) => {
        setDonnees((avant) => ({ ...d, activites: d.activites ?? avant?.activites ?? null, historique: d.historique ?? avant?.historique ?? [] }));
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

  const modules = donnees?.activites?.modules ?? [];
  const avatar = avatarChoisi ?? donnees?.activites?.profil?.avatar;
  // Score : chaque jeu compte une fois, même proposé dans plusieurs modules
  const jeux = [...new Map(modules.flatMap((m) => m.jeux).map((j) => [j.code, j])).values()];
  const total = jeux.reduce((somme, j) => ({ points: somme.points + j.progression.points, reussis: somme.reussis + j.progression.reussis }), { points: 0, reussis: 0 });
  const rien = donnees && !donnees.erreur && !modules.some((m) => m.quiz.length || m.devoirs.length || m.jeux.length);
  // La partie se joue dans l'application (écran /quiz, joueur natif) ; un quiz n'apparaît que
  // lorsqu'un enseignant lance une partie dans une séance de l'étudiant
  const ouvrir = (p) => router.push({ pathname: '/quiz', params: { url: p.url, id: String(p.id), titre: p.titre } });
  const historique = donnees?.historique ?? [];
  const dateCourte = (iso) => new Date(iso).toLocaleString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const choisir = (nouvel) => {
    const avant = avatar;
    setAvatarChoisi(nouvel);
    setChoix(false);
    // Hors ligne : l'ancien personnage revient
    choisirAvatar(nouvel).catch(() => setAvatarChoisi(avant ?? null));
  };

  return (
    <Ecran titre={t('app.activites.titre')}>
      <ScrollView contentContainerStyle={{ paddingBottom: margeBas }} scrollIndicatorInsets={{ bottom: margeBas }} refreshControl={<RefreshControl refreshing={rafraichit} onRefresh={() => { setRafraichit(true); charger(); }} tintColor={couleurs.lettre} colors={[couleurs.cadre]} />}>
        {/* Le joueur dans sa scène */}
        <Scene>
          <View style={styles.joueur}>
            <Pressable onPress={() => setChoix(true)} style={styles.personnage} accessibilityRole="button" accessibilityLabel={t('app.jeux.changerPersonnage')}>
              <Personnage avatar={avatar} idUser={utilisateur?.id_user} taille={64} />
              <View style={styles.crayon}>
                <MaterialCommunityIcons name="pencil" size={12} color={couleurs.surAccent} />
              </View>
            </Pressable>
            <View style={styles.score} accessible accessibilityLabel={t('app.jeux.score', { prenom: utilisateur?.prenom ?? '', points: total.points, reussis: total.reussis })}>
              <Text style={styles.prenom} numberOfLines={1}>
                {utilisateur?.prenom}
              </Text>
              <Text style={styles.points}>{t('app.jeux.points', { points: total.points })}</Text>
              <Text style={styles.reussis}>{t('app.jeux.defisReussis', { count: total.reussis })}</Text>
            </View>
          </View>
        </Scene>

        {donnees?.erreur ? <Message>{t('app.jeux.erreur')}</Message> : null}
        {!donnees ? <Message discret>{t('app.commun.chargement')}</Message> : null}

        {rien ? <Message discret>{t('app.activites.rien')}</Message> : null}

        {/* Une section par module : ce que les enseignants y ont proposé */}
        {modules.map((m) => {
          if (!m.quiz.length && !m.devoirs.length && !m.jeux.length) return null;
          return (
            <View key={m.code}>
              <Text style={styles.section} accessibilityRole="header">
                {m.nom}
              </Text>
              {m.quiz.map((p) => (
                <View key={`quiz-${p.id}`} style={styles.ligne}>
                  <View style={[styles.lampe, { backgroundColor: couleurs.enCours, borderColor: couleurs.enCours }]} />
                  <View style={styles.contenu}>
                    <Text style={styles.statut}>{t('app.jeux.enCours')}</Text>
                    <Text style={styles.titre}>{p.titre}</Text>
                    <Text style={styles.code}>{t('app.jeux.code', { pin: p.pin })}</Text>
                  </View>
                  {p.url ? (
                    <Pressable onPress={() => ouvrir(p)} style={styles.plein} accessibilityRole="button" accessibilityLabel={`${t('app.jeux.rejoindre')} : ${p.titre}`}>
                      <Text style={styles.pleinTexte}>{t('app.jeux.rejoindre')}</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
              {m.devoirs.map((dv) => {
                const aRendre = dv.ouvert && !dv.rendu;
                const etat = dv.rendu ? (dv.rendu.note === null ? t('app.devoirs.enCorrection') : t('app.devoirs.note', { note: dv.rendu.note })) : aRendre ? t('app.devoirs.avant', { date: dateCourte(dv.date_limite) }) : t('app.devoirs.nonRendu');
                return (
                  <Pressable key={`devoir-${dv.id}`} onPress={() => router.push(`/devoir/${dv.id}`)} style={styles.ligne} accessibilityRole="button" accessibilityLabel={`${dv.titre}, ${etat}`}>
                    <View style={[styles.lampe, aRendre && { backgroundColor: couleurs.lettre, borderColor: couleurs.lettre }, dv.rendu && { backgroundColor: couleurs.enCours, borderColor: couleurs.enCours }]} />
                    <View style={styles.contenu}>
                      <Text style={styles.etiquette}>{[t(`app.activites.buts.${dv.but ?? 'verifier'}`), dv.notion].filter(Boolean).join(' · ')}</Text>
                      <Text style={styles.titre} numberOfLines={2}>{dv.titre}</Text>
                      <Text style={[styles.code, aRendre && { color: couleurs.lettre }]}>{etat}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={couleurs.lettreAttenuee} />
                  </Pressable>
                );
              })}
              {m.jeux.map((jeu) => {
                const p = jeu.progression;
                return (
                  <Pressable
                    key={`jeu-${jeu.code}`}
                    onPress={() => ECRAN_JEU[jeu.code] && router.push(ECRAN_JEU[jeu.code])}
                    style={styles.ligne}
                    accessibilityRole="button"
                    accessibilityLabel={`${libelle(jeu.titre, i18n.language)}, ${t('app.jeux.progression', { reussis: p.reussis, total: p.total, points: p.points })}`}
                  >
                    <View style={styles.icone}>
                      <MaterialCommunityIcons name={jeu.type === 'terminal' ? 'console' : 'puzzle-outline'} size={20} color={couleurs.accent} />
                    </View>
                    <View style={styles.contenu}>
                      <Text style={styles.etiquette}>{[t(`app.activites.buts.${jeu.but ?? 'entrainer'}`), jeu.notion].filter(Boolean).join(' · ')}</Text>
                      <Text style={styles.titreCapitales}>{libelle(jeu.titre, i18n.language)}</Text>
                      <View style={styles.barre}>
                        <View style={[styles.barrePleine, { width: `${p.total ? Math.round((100 * p.reussis) / p.total) : 0}%` }]} />
                      </View>
                      <Text style={styles.code}>{t('app.jeux.progression', { reussis: p.reussis, total: p.total, points: p.points })}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={couleurs.lettreAttenuee} />
                  </Pressable>
                );
              })}
            </View>
          );
        })}

        {/* Mes derniers quiz : score, rang, équipes et nuages */}
        {historique.length ? (
          <View>
            <Text style={styles.section} accessibilityRole="header">{t('app.jeux.derniersQuiz')}</Text>
            {historique.slice(0, 5).map((h) => (
              <Pressable key={h.id} onPress={() => router.push(`/resultats/${h.id}`)} style={styles.ligne} accessibilityRole="button" accessibilityLabel={`${h.titre}, ${t('app.jeux.resumeQuiz', { score: h.score, count: h.rang, ordinal: true, total: h.nb_joueurs })}`}>
                <View style={[styles.lampe, h.rang <= 3 && { backgroundColor: couleurs.enCours, borderColor: couleurs.enCours }]} />
                <View style={styles.contenu}>
                  <Text style={styles.titre} numberOfLines={1}>{h.titre}</Text>
                  {h.module ? <Text style={styles.detail} numberOfLines={1}>{h.module.nom}</Text> : null}
                  <Text style={styles.code}>{t('app.jeux.resumeQuiz', { score: h.score, count: h.rang, ordinal: true, total: h.nb_joueurs })}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={couleurs.lettreAttenuee} />
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>
      <ChoixPersonnage visible={choix} actuel={avatar} choisir={choisir} fermer={() => setChoix(false)} />
    </Ecran>
  );
}

const useStyles = creerStyles((t) => ({
  joueur: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 14, paddingHorizontal: 16, paddingBottom: 18 },
  personnage: { width: CIBLE_TACTILE + 24, height: CIBLE_TACTILE + 24, alignItems: 'center', justifyContent: 'flex-end' },
  crayon: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.couleurs.accent,
    borderWidth: 2,
    borderColor: t.scene.ciel,
  },
  score: { flex: 1, paddingBottom: 30 },
  prenom: { color: t.scene.texte, fontFamily: t.polices.panneauGras, fontSize: 24, textTransform: t.capitales, letterSpacing: espace(t, 1) },
  points: { color: t.scene.texte, fontFamily: t.polices.panneau, fontSize: 17, letterSpacing: espace(t, 0.6), fontVariant: ['tabular-nums'] },
  reussis: { color: t.scene.texteAttenue, fontFamily: t.polices.texte, fontSize: 13 },
  etiquette: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauGras, fontSize: 11, letterSpacing: espace(t, 1.2), textTransform: t.capitales },
  section: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauGras, fontSize: 13, letterSpacing: espace(t, 1.8), textTransform: t.capitales, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: CIBLE_TACTILE + 16, borderTopWidth: 1, borderTopColor: t.couleurs.filet },
  lampe: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: t.couleurs.filet },
  contenu: { flex: 1 },
  statut: { color: t.couleurs.enCours, fontFamily: t.polices.panneauGras, fontSize: 13, letterSpacing: espace(t, 1.5), textTransform: t.capitales },
  titre: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 16, marginTop: 2 },
  titreCapitales: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: t.famille === 'planner' ? 18 : 16, letterSpacing: espace(t, 1), textTransform: t.capitales },
  detail: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 14, marginTop: 2, lineHeight: 20 },
  code: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauMoyen, fontSize: 14, marginTop: 4, letterSpacing: espace(t, 1) },
  source: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 12, marginTop: 4 },
  carte: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    backgroundColor: t.couleurs.cellule,
    borderRadius: t.rayons.md,
    borderWidth: t.sombre ? 0 : 1,
    borderColor: t.couleurs.filet,
  },
  carteEntete: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  icone: { width: 36, height: 36, borderRadius: t.famille === 'planner' ? t.rayons.sm : 10, alignItems: 'center', justifyContent: 'center', backgroundColor: t.couleurs.fond },
  barre: { height: 6, borderRadius: 3, backgroundColor: t.couleurs.filet, marginTop: 10, overflow: 'hidden' },
  barrePleine: { height: 6, borderRadius: 3, backgroundColor: t.couleurs.enCours },
  plein: { minHeight: CIBLE_TACTILE, paddingHorizontal: 18, justifyContent: 'center', borderRadius: t.rayons.md, backgroundColor: t.couleurs.accent },
  pleinTexte: { color: t.couleurs.surAccent, fontFamily: t.polices.panneauGras, fontSize: 16, letterSpacing: espace(t, 1), textTransform: t.capitales },
}));
