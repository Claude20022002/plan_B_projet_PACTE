import { useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ecran, { Message } from '../board/Ecran';
import { planner } from '../api/client';
import { CIBLE_TACTILE, creerStyles, useTheme } from '../theme';

/**
 * Appel par QR code (I1) : l'étudiant scanne le QR affiché par l'enseignant ; sa présence est
 * enregistrée aussitôt. Un seul envoi par code lu ; en cas d'erreur (code expiré, autre groupe),
 * il peut scanner de nouveau.
 */
export default function Scanner() {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const [permission, demanderPermission] = useCameraPermissions();
  const [resultat, setResultat] = useState(null); // { ok, texte, detail }
  const enCours = useRef(false);

  const lu = async ({ data }) => {
    if (enCours.current || resultat) return;
    enCours.current = true;
    try {
      const r = await planner('/presences/scanner', { method: 'POST', body: { code: data } });
      const s = r.seance;
      setResultat({ ok: true, texte: t(r.deja ? 'app.appel.deja' : 'app.appel.ok'), detail: [s.cours, `${s.heure_debut}–${s.heure_fin}`, s.salle].filter(Boolean).join(' · ') });
    } catch (e) {
      setResultat({ ok: false, texte: e?.message || t('app.appel.erreur') });
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
  viseur: { position: 'absolute', alignSelf: 'center', top: '22%', width: 240, height: 240, borderWidth: 3, borderColor: '#FFFFFF', borderRadius: 16 },
  consigne: { position: 'absolute', bottom: 48, left: 24, right: 24, textAlign: 'center', color: '#FFFFFF', fontFamily: t.polices.texteGras, fontSize: 16, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 6 },
}));
