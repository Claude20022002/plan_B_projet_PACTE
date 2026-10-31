import { Fragment, useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ecran, { Message } from '../../board/Ecran';
import { chargerEspaceCours, chargerSondages, lienSupport } from '../../api/donnees';
import SondagesOuverts from '../../cours/SondagesOuverts';
import Etagere, { Couverture, useLargeurCouverture } from '../../bibliotheque/Etagere';
import { dejaTelecharge, formatDe, formatTaille } from '../../documents/fichiers';
import { CIBLE_TACTILE, creerStyles, espace, lineColor, useTheme } from '../../theme';

// « idCours-idGroupe » (l'écran se rouvre depuis une notification ou un lien)
const CLASSE = /^(\d{1,10})-(\d{1,10})$/;

/**
 * Un de mes cours (docs/plans/espace-de-cours.md, lot E-5) : les supports que mes enseignants ont
 * publiés pour ma classe, section par section, rangés comme les documents d'un module. Un document
 * s'ouvre dans la fiche habituelle (téléchargement, lecture hors connexion) ; un lien, dans le
 * navigateur du téléphone. Les sondages ouverts de l'enseignant (lot EC-9) passent en tête.
 */
export default function CoursDeLaClasse() {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const largeur = useLargeurCouverture();
  const margeBas = useSafeAreaInsets().bottom;
  const { classe, nom, ligne } = useLocalSearchParams();
  const [, idCours, idGroupe] = (typeof classe === 'string' && CLASSE.exec(classe)) || [];
  const [espaceCours, setEspace] = useState(null);
  const [erreur, setErreur] = useState(!idCours);
  const [sondages, setSondages] = useState([]);
  const couleur = lineColor(typeof ligne === 'string' && ligne ? ligne : undefined);

  useEffect(() => {
    if (!idCours) return;
    chargerEspaceCours(idCours, idGroupe).then(setEspace, () => setErreur(true));
  }, [idCours, idGroupe]);

  // Interrupteur de l'école éteint ou lecture en échec : pas de sondage, le cours s'affiche quand même
  const chargerLesSondages = useCallback(() => {
    if (!idCours) return;
    chargerSondages(idCours, idGroupe).then((d) => setSondages(d?.actif ? d.sondages : []), () => setSondages([]));
  }, [idCours, idGroupe]);
  useEffect(chargerLesSondages, [chargerLesSondages]);

  const ouvrir = async (s) => {
    if (s.type === 'lien') {
      try {
        const url = await lienSupport(s.id_support);
        if (/^https?:\/\//.test(url)) await Linking.openURL(url);
      } catch {
        setErreur(true);
      }
      return;
    }
    router.push({
      pathname: '/document/[id]',
      params: { id: `classe-${s.id_support}`, support: String(s.id_support), titre: s.titre, mime: s.type_mime ?? '', taille: String(s.taille ?? ''), ligne: typeof ligne === 'string' ? ligne : '' },
    });
  };

  const fermer = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.fermer} accessibilityRole="button" accessibilityLabel={t('app.commun.retour')}>
      <MaterialCommunityIcons name="arrow-left" size={24} color={couleurs.surCadre} />
    </Pressable>
  );
  const titre = espaceCours?.classe.nom_cours ?? (typeof nom === 'string' ? nom : '');

  return (
    <Ecran titre={espaceCours?.classe.code_cours ?? t('app.bibliotheque.mesCours')} droite={fermer} espaces={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: margeBas + 24 }}>
        {titre ? <Text style={styles.nom}>{titre}</Text> : null}
        <SondagesOuverts sondages={sondages} onRecharger={chargerLesSondages} />
        {erreur ? <Message>{t('app.bibliotheque.coursIndisponible')}</Message> : null}
        {!espaceCours && !erreur ? <Message discret>{t('app.commun.chargement')}</Message> : null}
        {espaceCours?.sections.length === 0 ? <Message>{t('app.bibliotheque.aucunSupport')}</Message> : null}
        {espaceCours?.sections.map((section) => (
          <Fragment key={section.id_section}>
            <Text style={styles.section} accessibilityRole="header">{section.titre}</Text>
            <Etagere accessibilityLabel={section.titre}>
            {section.supports.map((s) => {
              const lien = s.type === 'lien';
              const format = lien ? t('app.bibliotheque.lien') : formatDe(s.type_mime).format;
              const local = !lien && Boolean(dejaTelecharge({ id: `classe-${s.id_support}`, file_size: s.taille, mime_type: s.type_mime }));
              return (
                <Couverture
                  key={s.id_support}
                  titre={s.titre}
                  etiquette={local ? `${format} ✓` : format}
                  pied={lien ? '' : formatTaille(s.taille)}
                  couleur={couleur}
                  largeur={largeur}
                  onPress={() => ouvrir(s)}
                  accessibilityLabel={[s.titre, format, lien ? null : formatTaille(s.taille)].filter(Boolean).join(', ')}
                />
              );
            })}
            </Etagere>
          </Fragment>
        ))}
      </ScrollView>
    </Ecran>
  );
}

const useStyles = creerStyles((t) => ({
  fermer: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  nom: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 18, textTransform: t.capitales, letterSpacing: espace(t, 1), paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  // Même titre de section que l'onglet Bibliothèque
  section: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneau, fontSize: 14, textTransform: t.capitales, letterSpacing: espace(t, 1.2), paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 },
}));
