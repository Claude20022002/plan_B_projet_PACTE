import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../../board/Ecran';
import { chargerDocument, lienTelechargement } from '../../api/donnees';
import { Couverture } from '../../bibliotheque/Etagere';
import Lecteur from '../../documents/Lecteur';
import { dejaTelecharge, formatDe, formatTaille, ouvrirAvec, SEUIL_CONFIRMATION_OCTETS, surDonneesMobiles, telecharger } from '../../documents/fichiers';
import { CIBLE_TACTILE, creerStyles, espace, lineColor, useTheme } from '../../theme';

const ID = /^[0-9a-f-]{36}$/i;

/**
 * Un document de la bibliothèque, comme un livre : sa fiche (format, taille, année), puis la
 * lecture dans l'application. La taille est visible avant tout téléchargement ; au-delà de 10 Mo
 * sur les données mobiles, l'étudiant confirme. Une fois téléchargé, le document reste sur le
 * téléphone et se relit sans connexion.
 */
export default function Document() {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const { id, titre, ligne } = useLocalSearchParams();
  const idValide = typeof id === 'string' && ID.test(id);
  const [doc, setDoc] = useState(null);
  const [fichier, setFichier] = useState(null);
  const [progression, setProgression] = useState(null); // null, ou 0 à 1 pendant le téléchargement
  const [lecture, setLecture] = useState(false);
  const [erreur, setErreur] = useState(!idValide);
  const annulation = useRef(null);

  useEffect(() => {
    if (!idValide) return undefined;
    let actif = true;
    chargerDocument(id).then(
      (d) => {
        if (!actif || !d) return;
        setDoc(d);
        setFichier(dejaTelecharge(d));
      },
      () => actif && setErreur(true)
    );
    return () => {
      actif = false;
      annulation.current?.();
    };
  }, [id, idValide]);

  const format = formatDe(doc?.mime_type);
  const taille = formatTaille(doc?.file_size);

  const afficher = useCallback(
    (local) => {
      if (format.lecture === 'externe') ouvrirAvec(local, doc?.mime_type).catch(() => setErreur(true));
      else setLecture(true);
    },
    [format.lecture, doc]
  );

  const lancerTelechargement = async () => {
    setErreur(false);
    setProgression(0);
    try {
      const url = await lienTelechargement(doc.id);
      if (typeof url !== 'string' || !url.startsWith('https://')) throw new Error('lien');
      const { promesse, annuler } = telecharger(doc, url, setProgression);
      annulation.current = annuler;
      const local = await promesse;
      setFichier(local);
      afficher(local);
    } catch {
      setErreur(true);
    } finally {
      annulation.current = null;
      setProgression(null);
    }
  };

  const ouvrir = async () => {
    if (fichier) return afficher(fichier);
    if ((doc.file_size ?? 0) > SEUIL_CONFIRMATION_OCTETS && (await surDonneesMobiles())) {
      Alert.alert(t('app.document.grosTitre'), t('app.document.grosMessage', { taille }), [
        { text: t('app.commun.annuler'), style: 'cancel' },
        { text: t('app.document.confirmer'), onPress: lancerTelechargement },
      ]);
      return undefined;
    }
    return lancerTelechargement();
  };

  const retour = (
    <Pressable
      onPress={() => (lecture ? setLecture(false) : router.canGoBack() ? router.back() : router.replace('/'))}
      style={styles.icone}
      accessibilityRole="button"
      accessibilityLabel={lecture ? t('app.document.fermerLecture') : t('app.commun.retour')}
    >
      <MaterialCommunityIcons name={lecture ? 'close' : 'arrow-left'} size={24} color={couleurs.surCadre} />
    </Pressable>
  );

  const nomAffiche = doc?.title ?? (typeof titre === 'string' ? titre : '');

  if (lecture && fichier) {
    return (
      <Ecran titre={nomAffiche} droite={retour} espaces={false}>
        <Lecteur
          fichier={fichier}
          mime={doc.mime_type}
          lecture={format.lecture}
          surErreur={() => {
            setLecture(false);
            setErreur(true);
          }}
        />
      </Ecran>
    );
  }

  const enCours = progression !== null;
  const libelleAction = fichier ? t('app.document.lire') : format.lecture === 'externe' ? t('app.document.telechargerOuvrir', { taille }) : t('app.document.telecharger', { taille });
  const details = [
    [t('app.document.format'), format.format],
    [t('app.document.taille'), taille],
    [t('app.document.annee'), doc?.year_concern],
    [t('app.document.nature'), doc?.type ? t(`app.document.natures.${doc.type}`, { defaultValue: String(doc.type) }) : null],
  ].filter(([, valeur]) => valeur);

  return (
    <Ecran titre={doc?.module?.code ?? ''} droite={retour} espaces={false}>
      <ScrollView contentContainerStyle={styles.contenu}>
        <View style={styles.entete}>
          <Couverture titre={nomAffiche} etiquette={format.format} pied={taille} couleur={lineColor(typeof ligne === 'string' ? ligne : undefined)} largeur={118} disabled={!doc || enCours} onPress={ouvrir} accessibilityLabel={nomAffiche} />
          <View style={styles.fiche}>
            <Text style={styles.titre}>{nomAffiche}</Text>
            {details.map(([libelle, valeur]) => (
              <View key={libelle} style={styles.detail}>
                <Text style={styles.libelle}>{libelle}</Text>
                <Text style={styles.valeur}>{valeur}</Text>
              </View>
            ))}
          </View>
        </View>

        {doc?.description ? <Text style={styles.description}>{doc.description}</Text> : null}
        {erreur ? <Message>{t('app.document.erreur')}</Message> : null}

        {enCours ? (
          <View style={styles.progression} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progression * 100) }}>
            <View style={styles.piste}>
              <View style={[styles.barre, { width: `${Math.round(progression * 100)}%` }]} />
            </View>
            <View style={styles.ligne}>
              <Text style={[styles.aide, { flex: 1 }]}>{t('app.document.telechargement', { pourcent: Math.round(progression * 100) })}</Text>
              <Pressable onPress={() => annulation.current?.()} style={styles.lien} accessibilityRole="button">
                <Text style={styles.lienTexte}>{t('app.commun.annuler')}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={ouvrir} disabled={!doc} style={[styles.bouton, !doc && styles.inactif]} accessibilityRole="button">
            <MaterialCommunityIcons name={fichier ? 'book-open-page-variant' : 'download'} size={20} color={couleurs.surAccent} />
            <Text style={styles.boutonTexte}>{libelleAction}</Text>
          </Pressable>
        )}

        {fichier && !enCours ? (
          <Pressable onPress={() => ouvrirAvec(fichier, doc?.mime_type).catch(() => setErreur(true))} style={styles.secondaire} accessibilityRole="button">
            <Text style={styles.lienTexte}>{t('app.document.ouvrirAvec')}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.aide}>{fichier ? t('app.document.horsLigne') : format.lecture === 'externe' ? t('app.document.externe') : ''}</Text>
      </ScrollView>
    </Ecran>
  );
}

const useStyles = creerStyles((t) => ({
  icone: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  contenu: { padding: 16, gap: 14, paddingBottom: 48 },
  entete: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  fiche: { flex: 1, gap: 8 },
  titre: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 18, lineHeight: 24 },
  detail: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, borderBottomWidth: 1, borderBottomColor: t.couleurs.filet, paddingBottom: 4 },
  libelle: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneau, fontSize: 12, textTransform: t.capitales, letterSpacing: espace(t, 0.8) },
  valeur: { color: t.couleurs.lettre, fontFamily: t.polices.panneauMoyen, fontSize: 13 },
  description: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 14, lineHeight: 20 },
  bouton: { flexDirection: 'row', gap: 10, minHeight: CIBLE_TACTILE + 4, backgroundColor: t.couleurs.accent, borderRadius: t.rayons.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  boutonTexte: { color: t.couleurs.surAccent, fontFamily: t.polices.panneauGras, fontSize: 16, textTransform: t.capitales, letterSpacing: espace(t, 1) },
  inactif: { opacity: 0.4 },
  secondaire: { minHeight: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  lien: { minHeight: CIBLE_TACTILE, justifyContent: 'center', paddingHorizontal: 6 },
  lienTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 14, textDecorationLine: 'underline' },
  progression: { gap: 4 },
  piste: { height: 8, borderRadius: 4, backgroundColor: t.couleurs.filet, overflow: 'hidden' },
  barre: { height: 8, backgroundColor: t.couleurs.accent },
  ligne: { flexDirection: 'row', alignItems: 'center' },
  aide: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 13, lineHeight: 18, textAlign: 'center' },
}));
