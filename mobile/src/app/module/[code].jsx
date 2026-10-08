import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../../board/Ecran';
import { chargerDocuments, chargerSupports } from '../../api/donnees';
import Etagere, { Couverture, useLargeurCouverture } from '../../bibliotheque/Etagere';
import { dejaTelecharge, formatDe, formatTaille } from '../../documents/fichiers';
import { CIBLE_TACTILE, creerStyles, espace, lineColor, useTheme } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CODE = /^[A-Za-z0-9_.-]{1,30}$/;

/**
 * Documents publiés d'un module, rangés comme des livres : format et taille sur la couverture
 * (visibles avant tout téléchargement), une pastille pour ceux déjà gardés sur le téléphone. Le
 * toucher ouvre la fiche du document puis sa lecture dans l'application.
 */
export default function Module() {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const largeur = useLargeurCouverture();
  const margeBas = useSafeAreaInsets().bottom;
  const { code, ligne, nom } = useLocalSearchParams();
  const [documents, setDocuments] = useState(null);
  const codeValide = typeof code === 'string' && CODE.test(code);
  const [erreurChargement, setErreur] = useState(false);
  const erreur = !codeValide || erreurChargement;
  const couleur = lineColor(typeof ligne === 'string' ? ligne : undefined);

  useEffect(() => {
    if (!codeValide) return;
    (async () => {
      try {
        const module = (await chargerSupports([code]))[code];
        setDocuments(module ? await chargerDocuments(module.module_id) : []);
      } catch {
        setErreur(true);
      }
    })();
  }, [code, codeValide]);

  const fermer = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.fermer} accessibilityRole="button" accessibilityLabel={t('app.commun.retour')}>
      <MaterialCommunityIcons name="arrow-left" size={24} color={couleurs.surCadre} />
    </Pressable>
  );

  return (
    <Ecran titre={String(code ?? '')} droite={fermer} espaces={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: margeBas + 24 }}>
        {typeof nom === 'string' && nom ? <Text style={styles.nom}>{nom}</Text> : null}
        {erreur ? <Message>{t('app.bibliotheque.indisponible')}</Message> : null}
        {documents?.length === 0 ? <Message>{t('app.bibliotheque.aucunDocument')}</Message> : null}
        {!documents && !erreur ? <Message discret>{t('app.commun.chargement')}</Message> : null}
        {documents?.length ? (
          <Etagere>
            {documents.map((d) => {
              const format = formatDe(d.mime_type).format;
              const local = Boolean(dejaTelecharge(d));
              const pied = [d.year_concern, formatTaille(d.file_size)].filter(Boolean).join(' · ');
              return (
                <Couverture
                  key={d.id}
                  titre={d.title}
                  etiquette={local ? `${format} ✓` : format}
                  pied={pied}
                  couleur={couleur}
                  largeur={largeur}
                  onPress={() => router.push({ pathname: '/document/[id]', params: { id: d.id, titre: d.title, ligne: typeof ligne === 'string' ? ligne : '' } })}
                  accessibilityLabel={[d.title, format, formatTaille(d.file_size), d.year_concern].filter(Boolean).join(', ')}
                />
              );
            })}
          </Etagere>
        ) : null}
      </ScrollView>
    </Ecran>
  );
}

const useStyles = creerStyles((t) => ({
  fermer: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  nom: { color: t.couleurs.lettre, fontFamily: t.polices.panneauGras, fontSize: 18, textTransform: t.capitales, letterSpacing: espace(t, 1), paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
}));
