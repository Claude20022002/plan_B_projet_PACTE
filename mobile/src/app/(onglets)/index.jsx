import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { findSpotlight, formatDayLabel, groupByDay, toLocalISODate } from '../../../../shared/session.js';
import Ecran, { Message } from '../../board/Ecran';
import Spotlight from '../../board/Spotlight';
import DepartureRow from '../../board/DepartureRow';
import { useAuth } from '../../auth/AuthContext';
import { chargerAlertes, chargerSupports, chargerTableau } from '../../api/donnees';
import { ErreurApi } from '../../api/client';
import { ecrireCache, lireCache } from '../../cache';
import useRafraichissement from '../../hooks/useRafraichissement';
import { HORIZON_TABLEAU_JOURS } from '../../config';
import { CIBLE_TACTILE, couleurs, polices } from '../../theme';

const heure = (iso) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
// Les dates reviennent du cache en texte : on refait des objets Date
const reviver = (s) => ({ ...s, start: s.start ? new Date(s.start) : null, end: s.end ? new Date(s.end) : null });

/**
 * Séances et alertes du tableau ; en cas d'échec, la dernière copie en cache (lecture seule).
 * Retourne de quoi mettre l'écran à jour en une fois.
 */
const lireTableau = async (utilisateur, silencieux) => {
  try {
    const [{ seances }, alertes] = await Promise.all([chargerTableau(HORIZON_TABLEAU_JOURS), utilisateur ? chargerAlertes(utilisateur.id_user).catch(() => []) : []]);
    const le = new Date();
    ecrireCache('tableau', { seances, alertes }, le);
    return { seances, alertes, le, etat: { chargement: false, erreur: false, horsLigne: false, le: le.toISOString(), rafraichit: false } };
  } catch (erreur) {
    const cache = await lireCache('tableau');
    const horsLigne = erreur instanceof ErreurApi && erreur.code === 'RESEAU';
    return {
      seances: cache ? cache.donnees.seances.map(reviver) : null,
      alertes: cache ? cache.donnees.alertes || [] : null,
      le: new Date(),
      etat: { chargement: false, erreur: !cache && !silencieux, horsLigne: Boolean(cache) && horsLigne, le: cache?.le ?? null, rafraichit: false },
    };
  }
};

/** Tableau : prochaine séance, aujourd'hui et le prochain jour de cours, changements récents. */
export default function Tableau() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { utilisateur } = useAuth();
  const [seances, setSeances] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [supports, setSupports] = useState({});
  const [etat, setEtat] = useState({ chargement: true, erreur: false, horsLigne: false, le: null, rafraichit: false });
  const [maintenant, setMaintenant] = useState(new Date());

  const charger = useCallback(
    ({ silencieux = false } = {}) =>
      lireTableau(utilisateur, silencieux).then((lu) => {
        if (lu.seances) setSeances(lu.seances);
        if (lu.alertes) setAlertes(lu.alertes);
        setMaintenant(lu.le);
        setEtat(lu.etat);
      }),
    [utilisateur]
  );

  useEffect(() => {
    // Le cache s'affiche tout de suite, la mise à jour arrive ensuite
    lireCache('tableau').then((cache) => {
      if (cache) {
        setSeances(cache.donnees.seances.map(reviver));
        setAlertes(cache.donnees.alertes || []);
        setEtat((e) => ({ ...e, chargement: false, le: cache.le }));
      }
    });
    charger();
  }, [charger]);
  useRafraichissement(charger);

  const aVenir = useMemo(() => seances.filter((s) => !s.end || s.end > maintenant), [seances, maintenant]);
  const vedette = useMemo(() => findSpotlight(aVenir, maintenant), [aVenir, maintenant]);
  const aujourdhui = toLocalISODate(maintenant);
  const jours = useMemo(() => groupByDay(aVenir), [aVenir]);
  const duJour = jours.find((j) => j.date === aujourdhui)?.items ?? [];
  const prochainJour = jours.find((j) => j.date > aujourdhui);
  const codeVedette = vedette?.session.courseCode;

  // Supports du cours en vedette (bibliothèque) : discret si StudyLib est indisponible
  useEffect(() => {
    if (!codeVedette) return;
    chargerSupports([codeVedette]).then(setSupports).catch(() => setSupports({}));
  }, [codeVedette]);

  const cloche = (
    <View style={{ flexDirection: 'row' }}>
      <Pressable onPress={() => router.push('/jeux')} style={styles.cloche} accessibilityRole="button" accessibilityLabel={t('app.jeux.titre')}>
        <MaterialCommunityIcons name="gamepad-variant-outline" size={24} color="#FFFFFF" />
      </Pressable>
      <Pressable onPress={() => router.push('/alertes')} style={styles.cloche} accessibilityRole="button" accessibilityLabel={`${t('app.tableau.alertes')} : ${alertes.length}`}>
        <MaterialCommunityIcons name="bell-outline" size={24} color="#FFFFFF" />
        {alertes.length > 0 ? <View style={styles.pastille} /> : null}
      </Pressable>
    </View>
  );

  return (
    <Ecran titre={t('board.title')} droite={cloche}>
      <ScrollView refreshControl={<RefreshControl refreshing={etat.rafraichit} onRefresh={() => { setEtat((e) => ({ ...e, rafraichit: true })); charger(); }} tintColor={couleurs.lettre} colors={[couleurs.cadre]} />}>
        {etat.le ? <Message discret>{t(etat.horsLigne ? 'app.tableau.horsLigne' : 'app.tableau.misAJour', { heure: heure(etat.le) })}</Message> : null}
        {etat.erreur ? (
          <View>
            <Message>{t('app.tableau.erreur')}</Message>
            <Pressable onPress={() => charger()} style={styles.reessayer} accessibilityRole="button">
              <Text style={styles.reessayerTexte}>{t('app.tableau.reessayer')}</Text>
            </Pressable>
          </View>
        ) : null}

        {vedette ? (
          <Spotlight seance={vedette.session} phase={vedette.phase} maintenant={maintenant} supports={supports[codeVedette]} onSupports={() => router.push(`/module/${encodeURIComponent(codeVedette)}`)} />
        ) : !etat.chargement && !etat.erreur ? (
          <View>
            <Text style={styles.videTitre}>{t('board.noSessionsTitle')}</Text>
            <Message>{t('board.noSessionsBody')}</Message>
          </View>
        ) : null}

        {duJour.length > 0 ? (
          <View>
            <Text style={styles.section}>{t('app.tableau.aujourdhui')}</Text>
            {duJour.map((s) => (
              <DepartureRow key={s.id} seance={s} enVedette={vedette?.session.id === s.id && vedette.phase === 'live'} />
            ))}
          </View>
        ) : null}

        {prochainJour ? (
          <View>
            <Text style={styles.section}>{formatDayLabel(prochainJour.date, i18n.language)}</Text>
            {prochainJour.items.map((s) => (
              <DepartureRow key={s.id} seance={s} />
            ))}
          </View>
        ) : null}

        {alertes.length > 0 ? (
          <View style={styles.changements}>
            <Text style={styles.section}>{t('board.changesTitle')}</Text>
            {alertes.slice(0, 3).map((a) => (
              <Pressable key={a.id_notification} onPress={() => router.push('/alertes')} style={styles.alerte} accessibilityRole="button">
                <Text style={styles.alerteTitre}>{a.titre}</Text>
                <Text style={styles.alerteTexte} numberOfLines={2}>
                  {a.message}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  cloche: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  pastille: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: couleurs.reporte },
  section: { color: couleurs.lettreAttenuee, fontFamily: polices.panneau, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 },
  videTitre: { color: couleurs.lettre, fontFamily: polices.panneauGras, fontSize: 22, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 24 },
  reessayer: { marginHorizontal: 16, minHeight: CIBLE_TACTILE, justifyContent: 'center' },
  reessayerTexte: { color: couleurs.lettre, fontFamily: polices.texteGras, fontSize: 15, textDecorationLine: 'underline' },
  changements: { paddingBottom: 24 },
  alerte: { paddingHorizontal: 16, paddingVertical: 10, minHeight: CIBLE_TACTILE, borderBottomWidth: 1, borderBottomColor: couleurs.filet },
  alerteTitre: { color: couleurs.lettre, fontFamily: polices.texteGras, fontSize: 15 },
  alerteTexte: { color: couleurs.lettreAttenuee, fontFamily: polices.texte, fontSize: 14, marginTop: 2 },
});
