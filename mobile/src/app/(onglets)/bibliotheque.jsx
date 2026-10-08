import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../../board/Ecran';
import { chargerAvisStage, chargerIdeesProjet, chargerSeances, chargerSupports, rechercherDocuments } from '../../api/donnees';
import Etagere, { Couverture, useLargeurCouverture } from '../../bibliotheque/Etagere';
import CarteStage from '../../bibliotheque/CarteStage';
import CarteIdee from '../../bibliotheque/CarteIdee';
import { formatDe, formatTaille } from '../../documents/fichiers';
import { CIBLE_TACTILE, creerStyles, espace, lineColor, useTheme } from '../../theme';
import { useMargeOnglets } from '../../verre/Verre';

const JOURS_MODULES = 42;
const DELAI_RECHERCHE_MS = 350;

/** Comparaison sans casse ni accents (« memoire » trouve « Mémoire ») */
const normaliser = (texte) =>
  String(texte ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
const contient = (terme, ...champs) => champs.some((c) => normaliser(c).includes(terme));

/** Modules des six prochaines semaines, leurs supports, retours de stage et premières idées. */
const lireBibliotheque = async () => {
  const { seances } = await chargerSeances(new Date(), new Date(Date.now() + JOURS_MODULES * 864e5));
  const parCode = new Map();
  seances.forEach((s) => s.courseCode && !parCode.has(s.courseCode) && parCode.set(s.courseCode, { code: s.courseCode, nom: s.course, ligne: s.lineKey }));
  const liste = [...parCode.values()].sort((a, b) => a.nom.localeCompare(b.nom));
  const [supports, avis, idees] = await Promise.all([
    chargerSupports(liste.map((m) => m.code)),
    chargerAvisStage().catch(() => []),
    chargerIdeesProjet().catch(() => ({ idees: [], suite: false })),
  ]);
  return { liste, supports, avis, idees };
};

/**
 * Bibliothèque (StudyLib) : une recherche en tête (modules, documents, stages, idées), les modules
 * suivis rangés comme des livres sur une étagère, les retours de stage des anciens (avec photo) et
 * les idées de projets, chargées par pages.
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
  const [idees, setIdees] = useState({ liste: [], page: 1, suite: false, chargement: false });
  const [etat, setEtat] = useState({ chargement: true, indisponible: false, rafraichit: false });
  const [saisie, setSaisie] = useState('');
  const [terme, setTerme] = useState('');
  const [resultats, setResultats] = useState({ documents: [], idees: [], chargement: false });

  const charger = useCallback(
    () =>
      lireBibliotheque().then(
        ({ liste, supports: sup, avis, idees: premieres }) => {
          setModules(liste);
          setSupports(sup);
          setStages(avis);
          setIdees({ liste: premieres.idees, page: 1, suite: premieres.suite, chargement: false });
          setEtat({ chargement: false, indisponible: false, rafraichit: false });
        },
        () => setEtat({ chargement: false, indisponible: true, rafraichit: false })
      ),
    []
  );

  useEffect(() => {
    charger();
  }, [charger]);

  // La recherche part après une courte pause de frappe, à partir de deux caractères
  useEffect(() => {
    const minuterie = setTimeout(() => setTerme(saisie.trim().length >= 2 ? saisie.trim() : ''), DELAI_RECHERCHE_MS);
    return () => clearTimeout(minuterie);
  }, [saisie]);

  useEffect(() => {
    if (!terme) return undefined;
    let actif = true;
    Promise.all([rechercherDocuments(terme).catch(() => []), chargerIdeesProjet(terme).catch(() => ({ idees: [] }))]).then(([documents, trouvees]) => {
      if (actif) setResultats({ documents, idees: trouvees.idees, chargement: false });
    });
    return () => {
      actif = false;
    };
  }, [terme]);

  const changerSaisie = (texte) => {
    setSaisie(texte);
    if (texte.trim().length >= 2) setResultats((r) => ({ ...r, chargement: true }));
  };

  const ideesSuivantes = async () => {
    setIdees((i) => ({ ...i, chargement: true }));
    try {
      const suite = await chargerIdeesProjet('', idees.page + 1);
      setIdees((i) => ({ liste: [...i.liste, ...suite.idees], page: i.page + 1, suite: suite.suite, chargement: false }));
    } catch {
      setIdees((i) => ({ ...i, chargement: false }));
    }
  };

  const enRecherche = Boolean(terme);
  const cle = normaliser(terme);
  const modulesAffiches = useMemo(() => (enRecherche ? modules.filter((m) => contient(cle, m.nom, m.code)) : modules), [enRecherche, modules, cle]);
  const stagesAffiches = useMemo(() => (enRecherche ? stages.filter((a) => contient(cle, a.company, a.position, a.description, a.city)) : stages.slice(0, 5)), [enRecherche, stages, cle]);
  const ideesAffichees = enRecherche ? resultats.idees : idees.liste;
  const rien = enRecherche && !resultats.chargement && !modulesAffiches.length && !resultats.documents.length && !stagesAffiches.length && !ideesAffichees.length;

  const etagereModules = modulesAffiches.length ? (
    <Etagere accessibilityLabel={t('app.bibliotheque.etagere')}>
      {modulesAffiches.map((m) => {
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
  ) : null;

  return (
    <Ecran titre={t('app.onglets.bibliotheque')}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: margeBas }}
        scrollIndicatorInsets={{ bottom: margeBas }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={etat.rafraichit} onRefresh={() => { setEtat((e) => ({ ...e, rafraichit: true })); charger(); }} tintColor={couleurs.lettre} colors={[couleurs.cadre]} />}
      >
        <View style={styles.recherche}>
          <MaterialCommunityIcons name="magnify" size={20} color={couleurs.lettreAttenuee} />
          <TextInput
            value={saisie}
            onChangeText={changerSaisie}
            placeholder={t('app.bibliotheque.rechercher')}
            placeholderTextColor={couleurs.lettreAttenuee}
            style={styles.champ}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel={t('app.bibliotheque.rechercher')}
          />
          {resultats.chargement && saisie.trim().length >= 2 ? <ActivityIndicator size="small" color={couleurs.lettreAttenuee} /> : null}
          {saisie ? (
            <Pressable onPress={() => { setSaisie(''); setTerme(''); }} style={styles.effacer} accessibilityRole="button" accessibilityLabel={t('app.bibliotheque.effacer')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={couleurs.lettreAttenuee} />
            </Pressable>
          ) : null}
        </View>

        {etat.indisponible ? <Message>{t('app.bibliotheque.indisponible')}</Message> : null}
        {rien ? <Message discret>{t('app.bibliotheque.aucunResultat', { terme })}</Message> : null}

        {!enRecherche || modulesAffiches.length ? <Text style={styles.section}>{t('app.bibliotheque.mesModules')}</Text> : null}
        {!enRecherche && !etat.chargement && modules.length === 0 ? <Message discret>{t('app.bibliotheque.aucunModule')}</Message> : null}
        {etagereModules}

        {enRecherche && resultats.documents.length ? (
          <>
            <Text style={styles.section}>{t('app.bibliotheque.resultatsDocuments')}</Text>
            <Etagere>
              {resultats.documents.map((d) => (
                <Couverture
                  key={d.id}
                  titre={d.title}
                  etiquette={[formatDe(d.mime_type).format, d.module?.code].filter(Boolean).join(' · ')}
                  pied={[d.year_concern, formatTaille(d.file_size)].filter(Boolean).join(' · ')}
                  couleur={lineColor(d.module?.code)}
                  largeur={largeur}
                  onPress={() => router.push({ pathname: '/document/[id]', params: { id: d.id, titre: d.title, ligne: '' } })}
                  accessibilityLabel={[d.title, d.module?.name, formatTaille(d.file_size)].filter(Boolean).join(', ')}
                />
              ))}
            </Etagere>
          </>
        ) : null}

        {!enRecherche || stagesAffiches.length ? (
          <View style={styles.entete}>
            <Text style={[styles.section, styles.sectionLigne]}>{t('app.bibliotheque.stages')}</Text>
            {!enRecherche ? (
              <Pressable onPress={() => router.push('/stage/partager')} style={styles.action} accessibilityRole="button">
                <Text style={styles.actionTexte}>{t('app.bibliotheque.partagerStage')}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {!enRecherche && !etat.chargement && !etat.indisponible && stages.length === 0 ? <Message discret>{t('app.bibliotheque.aucunStage')}</Message> : null}
        {stagesAffiches.map((a) => (
          <CarteStage key={a.id} avis={a} />
        ))}

        {ideesAffichees.length ? <Text style={styles.section}>{t('app.bibliotheque.projets')}</Text> : null}
        {ideesAffichees.map((idee) => (
          <CarteIdee key={idee.id} idee={idee} />
        ))}
        {!enRecherche && idees.suite ? (
          <Pressable onPress={ideesSuivantes} disabled={idees.chargement} style={styles.plus} accessibilityRole="button">
            {idees.chargement ? <ActivityIndicator size="small" color={couleurs.lettre} /> : <Text style={styles.actionTexte}>{t('app.bibliotheque.plusIdees')}</Text>}
          </Pressable>
        ) : null}
        <View style={{ height: 24 }} />
      </ScrollView>
    </Ecran>
  );
}

const useStyles = creerStyles((t) => ({
  recherche: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, paddingHorizontal: 12, minHeight: CIBLE_TACTILE, backgroundColor: t.couleurs.cellule, borderRadius: t.rayons.sm, borderWidth: t.sombre ? 0 : 1, borderColor: t.couleurs.filet },
  champ: { flex: 1, minHeight: CIBLE_TACTILE, color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 16 },
  effacer: { width: CIBLE_TACTILE - 8, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  section: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneau, fontSize: 14, textTransform: t.capitales, letterSpacing: espace(t, 1.2), paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 },
  sectionLigne: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'flex-end' },
  action: { minHeight: CIBLE_TACTILE, justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 6 },
  actionTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 14, textDecorationLine: 'underline' },
  plus: { minHeight: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
}));
