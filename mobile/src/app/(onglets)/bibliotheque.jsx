import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ecran, { Message } from '../../board/Ecran';
import { chargerAvisStage, chargerIdeesProjet, chargerSeances, chargerSupports } from '../../api/donnees';
import Etagere, { Couverture, useLargeurCouverture } from '../../bibliotheque/Etagere';
import CarteStage from '../../bibliotheque/CarteStage';
import { CIBLE_TACTILE, creerStyles, espace, lineColor, useTheme } from '../../theme';
import { useMargeOnglets } from '../../verre/Verre';

const JOURS_MODULES = 42;

/** Modules des six prochaines semaines, leurs supports, avis de stage et idées (lecture seule). */
const lireBibliotheque = async () => {
  const { seances } = await chargerSeances(new Date(), new Date(Date.now() + JOURS_MODULES * 864e5));
  const parCode = new Map();
  seances.forEach((s) => s.courseCode && !parCode.has(s.courseCode) && parCode.set(s.courseCode, { code: s.courseCode, nom: s.course, ligne: s.lineKey }));
  const liste = [...parCode.values()].sort((a, b) => a.nom.localeCompare(b.nom));
  const [supports, avis, idees] = await Promise.all([chargerSupports(liste.map((m) => m.code)), chargerAvisStage().catch(() => []), chargerIdeesProjet().catch(() => [])]);
  return { liste, supports, avis, idees };
};

/**
 * Bibliothèque (StudyLib) : les modules suivis (tirés de l'emploi du temps des six prochaines
 * semaines) rangés comme des livres sur une étagère, puis les retours de stage des anciens (avec
 * photo) et les idées de projets.
 */
export default function Bibliotheque() {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const margeBas = useMargeOnglets();
  const { t } = useTranslation();
  const router = useRouter();
  const largeur = useLargeurCouverture();
  const [modules, setModules] = useState([]);
  const [supports, setSupports] = useState({});
  const [stages, setStages] = useState([]);
  const [projets, setProjets] = useState([]);
  const [etat, setEtat] = useState({ chargement: true, indisponible: false, rafraichit: false });

  const charger = useCallback(
    () =>
      lireBibliotheque().then(
        ({ liste, supports: sup, avis, idees }) => {
          setModules(liste);
          setSupports(sup);
          setStages(avis.slice(0, 5));
          setProjets(idees.slice(0, 5));
          setEtat({ chargement: false, indisponible: false, rafraichit: false });
        },
        () => setEtat({ chargement: false, indisponible: true, rafraichit: false })
      ),
    []
  );

  useEffect(() => {
    charger();
  }, [charger]);

  return (
    <Ecran titre={t('app.onglets.bibliotheque')}>
      <ScrollView contentContainerStyle={{ paddingBottom: margeBas }} scrollIndicatorInsets={{ bottom: margeBas }} refreshControl={<RefreshControl refreshing={etat.rafraichit} onRefresh={() => { setEtat((e) => ({ ...e, rafraichit: true })); charger(); }} tintColor={couleurs.lettre} colors={[couleurs.cadre]} />}>
        {etat.indisponible ? <Message>{t('app.bibliotheque.indisponible')}</Message> : null}

        <Text style={styles.section}>{t('app.bibliotheque.mesModules')}</Text>
        {!etat.chargement && modules.length === 0 ? <Message discret>{t('app.bibliotheque.aucunModule')}</Message> : null}
        {modules.length ? (
          <Etagere accessibilityLabel={t('app.bibliotheque.etagere')}>
            {modules.map((m) => {
              const n = supports[m.code]?.documents ?? 0;
              return (
                <Couverture
                  key={m.code}
                  titre={m.nom}
                  etiquette={m.code}
                  pied={t('app.bibliotheque.documents', { count: n })}
                  couleur={lineColor(m.ligne)}
                  largeur={largeur}
                  onPress={() => router.push({ pathname: '/module/[code]', params: { code: m.code, ligne: m.ligne ?? '', nom: m.nom } })}
                  disabled={!supports[m.code]}
                  accessibilityLabel={`${m.nom}, ${t('app.bibliotheque.documents', { count: n })}`}
                />
              );
            })}
          </Etagere>
        ) : null}

        <View style={styles.entete}>
          <Text style={[styles.section, styles.sectionLigne]}>{t('app.bibliotheque.stages')}</Text>
          <Pressable onPress={() => router.push('/stage/partager')} style={styles.action} accessibilityRole="button">
            <Text style={styles.actionTexte}>{t('app.bibliotheque.partagerStage')}</Text>
          </Pressable>
        </View>
        {!etat.chargement && !etat.indisponible && stages.length === 0 ? <Message discret>{t('app.bibliotheque.aucunStage')}</Message> : null}
        {stages.map((a) => (
          <CarteStage key={a.id} avis={a} />
        ))}

        <Text style={styles.section}>{t('app.bibliotheque.projets')}</Text>
        {projets.map((p) => (
          <View key={p.id} style={styles.carte}>
            <Text style={styles.nom}>{p.title}</Text>
            {p.description ? (
              <Text style={styles.detail} numberOfLines={2}>
                {p.description}
              </Text>
            ) : null}
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </Ecran>
  );
}

const useStyles = creerStyles((t) => ({
  section: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneau, fontSize: 14, textTransform: t.capitales, letterSpacing: espace(t, 1.2), paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 },
  sectionLigne: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'flex-end' },
  action: { minHeight: CIBLE_TACTILE, justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 6 },
  actionTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 14, textDecorationLine: 'underline' },
  nom: { flex: 1, color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 15 },
  carte: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.couleurs.filet, gap: 4 },
  detail: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 14, lineHeight: 20 },
}));
