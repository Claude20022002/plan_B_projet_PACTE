import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../board/Ecran';
import { planner } from '../api/client';
import { chargerPartiesQuiz, rejoindreQuizStudio, rejoindreSessionJeu } from '../api/donnees';
import { sourceClassQuiz } from '../quiz/classQuiz';
import { ecranDuQuiz } from '../quiz/direct';
import { origineDe, partieDuPin, pinScanne } from '../quiz/scan';
import { codeSessionScanne, ecranDeSession } from '../jeux/session';
import { cheminQuiz, codeQuizScanne } from '../quiz/studio';
import { ouvrirSurLeWeb } from '../espaces/ouvrir';
import { ouvrirPartie as ouvrirLaPartie } from '../quiz/ouvrir';
import { proposerChangement } from '../telephone/etat';
import { QUIZ_DANS_L_APPLICATION } from '../../../shared/fonctions.js';
import { ressembleAPartie } from '../../../shared/classQuiz.js';
import { CIBLE_TACTILE, creerStyles, useTheme } from '../theme';

/**
 * Scan du QR affiché par l'enseignant. Appel (I1) : la présence est enregistrée aussitôt. Quiz du
 * Studio : en direct, l'écran natif du joueur (quiz-direct/[id].jsx, SC-1c) ; sinon il s'ouvre sur
 * le site, déjà connecté (quiz/studio.js). Partie ClassQuiz : elle s'ouvre si
 * elle est lancée dans l'une de mes séances (quiz/scan.js, quiz/ouvrir.js). Jeu lancé en classe :
 * jeux/session.js. C'est la seule porte de l'étudiant vers les quiz et les jeux (R-10). Un seul
 * envoi par code lu ; en cas d'erreur (code expiré, autre groupe), l'étudiant peut scanner de nouveau.
 */
export default function Scanner() {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const [permission, demanderPermission] = useCameraPermissions();
  const [resultat, setResultat] = useState(null); // { ok, texte, detail }
  const enCours = useRef(false);
  // Partie trouvée : la caméra ne doit plus rien lire pendant l'ouverture de l'écran du quiz
  const partieOuverte = useRef(false);
  // Origine du service de quiz (promesse), pour reconnaître un QR de partie ; null sans quiz installé
  const origineQuiz = useRef(null);

  useEffect(() => {
    // Source commune (lot ME-0c) : éteint pour l'école, ou configuration illisible, l'origine est nulle
    origineQuiz.current = sourceClassQuiz.lire().then((c) => (c.actif ? origineDe(c.url) : null));
  }, []);

  // Vue navigateur ouverte : le scanner se ferme derrière elle (au retour, l'étudiant retrouve l'application)
  const fermerDerriere = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const ouvrirPartie = async (pin, origine) => {
    const partie = partieDuPin(await chargerPartiesQuiz(), pin, origine);
    if (!partie) {
      setResultat({ ok: false, texte: t('app.appel.partieAbsente') });
      return;
    }
    partieOuverte.current = true;
    await ouvrirLaPartie({ router, partie, couleurs, remplacer: true });
    if (QUIZ_DANS_L_APPLICATION) return;
    fermerDerriere();
  };

  const lu = async ({ data }) => {
    if (enCours.current || resultat || partieOuverte.current) return;
    enCours.current = true;
    try {
      // Session de jeu lancée par l'enseignant : rejoindre, puis le jeu ou le tableau de la classe
      const codeSession = codeSessionScanne(data);
      if (codeSession) {
        const ecranJeu = ecranDeSession(await rejoindreSessionJeu(codeSession));
        if (!ecranJeu) throw new Error(t('app.sessionJeu.erreur'));
        partieOuverte.current = true;
        router.replace(ecranJeu);
        return;
      }
      // Quiz du Studio : en direct, l'écran de l'application (SC-1c) ; sinon le site l'ouvre (code
      // inconnu ou expiré, il le dit lui-même)
      const codeQuiz = codeQuizScanne(data);
      if (codeQuiz) {
        partieOuverte.current = true;
        const ecranDirect = ecranDuQuiz(await rejoindreQuizStudio(codeQuiz).catch(() => null));
        if (ecranDirect) {
          router.replace(ecranDirect);
          return;
        }
        await ouvrirSurLeWeb(cheminQuiz(codeQuiz), couleurs);
        fermerDerriere();
        return;
      }
      const origine = await origineQuiz.current;
      const pin = pinScanne(data, origine);
      if (pin) {
        await ouvrirPartie(pin, origine);
        return;
      }
      // QR d'une partie alors que le service de quiz est éteint pour l'école : rien ne s'ouvre (C-6)
      if (!origine && ressembleAPartie(data)) {
        setResultat({ ok: false, texte: t('app.jeux.quizFerme') });
        return;
      }
      const r = await planner('/presences/scanner', { method: 'POST', body: { code: data } });
      const s = r.seance;
      setResultat({ ok: true, texte: t(r.deja ? 'app.appel.deja' : 'app.appel.ok'), detail: [s.cours, `${s.heure_debut}–${s.heure_fin}`, s.salle].filter(Boolean).join(' · ') });
    } catch (e) {
      setResultat({ ok: false, texte: e?.message || t('app.appel.erreur'), changement: proposerChangement(e) });
    } finally {
      enCours.current = false;
    }
  };

  const fermer = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.icone} accessibilityRole="button" accessibilityLabel={t('app.commun.fermer')}>
      <MaterialCommunityIcons name="close" size={24} color={couleurs.surCadre} />
    </Pressable>
  );

  let contenu;
  if (!permission) {
    contenu = <Message discret>{t('app.commun.chargement')}</Message>;
  } else if (!permission.granted) {
    contenu = (
      <View style={styles.centre}>
        <Text style={styles.texte}>{t('app.appel.permission')}</Text>
        <Pressable
          onPress={() => (permission.canAskAgain ? demanderPermission() : Linking.openSettings())}
          style={({ pressed }) => [styles.bouton, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
        >
          <Text style={styles.boutonTexte}>{t(permission.canAskAgain ? 'app.appel.autoriser' : 'app.appel.reglages')}</Text>
        </Pressable>
      </View>
    );
  } else if (resultat) {
    contenu = (
      <View style={styles.centre} accessibilityLiveRegion="polite">
        <MaterialCommunityIcons name={resultat.ok ? 'check-circle' : 'alert-circle'} size={72} color={resultat.ok ? couleurs.enCours : couleurs.reporte} />
        <Text style={styles.titre}>{resultat.texte}</Text>
        {resultat.detail ? <Text style={styles.texte}>{resultat.detail}</Text> : null}
        <Pressable
          onPress={() => (resultat.ok ? (router.canGoBack() ? router.back() : router.replace('/')) : setResultat(null))}
          style={({ pressed }) => [styles.bouton, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
        >
          <Text style={styles.boutonTexte}>{t(resultat.ok ? 'app.commun.fermer' : 'app.appel.recommencer')}</Text>
        </Pressable>
        {/* Refus « compte lié à un autre téléphone » (R-10) : déclarer le nouveau sans chercher dans le Compte */}
        {resultat.changement ? (
          <Pressable onPress={() => router.replace('/telephone')} style={({ pressed }) => [styles.lien, pressed && { opacity: 0.7 }]} accessibilityRole="button">
            <Text style={styles.lienTexte}>{t('app.appel.changeTelephone')}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  } else {
    contenu = (
      <View style={{ flex: 1 }}>
        <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={lu} />
        <View style={styles.viseur} pointerEvents="none" />
        <Text style={styles.consigne}>{t('app.appel.consigne')}</Text>
      </View>
    );
  }

  return (
    <Ecran titre={t('app.appel.titre')} droite={fermer} espaces={false}>
      {contenu}
    </Ecran>
  );
}

const useStyles = creerStyles((t) => ({
  icone: { width: CIBLE_TACTILE, height: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  titre: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 20, textAlign: 'center' },
  texte: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  bouton: { minHeight: CIBLE_TACTILE, paddingHorizontal: 20, justifyContent: 'center', borderRadius: t.rayons.sm, backgroundColor: t.couleurs.cadre },
  boutonTexte: { color: t.couleurs.surCadre, fontFamily: t.polices.texteGras, fontSize: 15 },
  lien: { minHeight: CIBLE_TACTILE, paddingHorizontal: 12, justifyContent: 'center' },
  lienTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 15, textDecorationLine: 'underline' },
  viseur: { position: 'absolute', alignSelf: 'center', top: '22%', width: 240, height: 240, borderWidth: 3, borderColor: '#FFFFFF', borderRadius: 16 },
  consigne: { position: 'absolute', bottom: 48, left: 24, right: 24, textAlign: 'center', color: '#FFFFFF', fontFamily: t.polices.texteGras, fontSize: 16, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 6 },
}));
