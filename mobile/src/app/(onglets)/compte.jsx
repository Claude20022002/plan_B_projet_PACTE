import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import Ecran from '../../board/Ecran';
import { useAuth } from '../../auth/AuthContext';
import { changerLangue } from '../../i18n';
import { desinscrireDesNotifications, inscrireAuxNotifications, notificationsActives } from '../../push';
import { CIBLE_TACTILE, couleurs, polices, rayons } from '../../theme';

/** Compte : profil, langue FR/EN, notifications, déconnexion. */
export default function Compte() {
  const { t, i18n } = useTranslation();
  const { utilisateur, deconnexion } = useAuth();
  const [alertes, setAlertes] = useState(false);
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    notificationsActives().then(setAlertes);
  }, []);

  const basculerAlertes = async (actif) => {
    setOccupe(true);
    try {
      if (actif) setAlertes(Boolean(await inscrireAuxNotifications()));
      else {
        await desinscrireDesNotifications();
        setAlertes(false);
      }
    } catch {
      setAlertes(await notificationsActives());
    } finally {
      setOccupe(false);
    }
  };

  return (
    <Ecran titre={t('app.onglets.compte')}>
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.section}>{t('app.compte.profil')}</Text>
        <View style={styles.bloc}>
          <Text style={styles.nom}>{[utilisateur?.prenom, utilisateur?.nom].filter(Boolean).join(' ')}</Text>
          <Text style={styles.detail}>{utilisateur?.email}</Text>
          {utilisateur?.niveau ? <Text style={styles.detail}>{utilisateur.niveau}</Text> : null}
        </View>

        <Text style={styles.section}>{t('app.compte.langue')}</Text>
        <View style={styles.choix} accessibilityRole="radiogroup">
          {['fr', 'en'].map((langue) => {
            const actif = i18n.language === langue;
            return (
              <Pressable key={langue} onPress={() => changerLangue(langue)} style={[styles.option, actif && styles.optionActive]} accessibilityRole="radio" accessibilityState={{ checked: actif }}>
                <Text style={[styles.optionTexte, actif && styles.optionTexteActif]}>{langue === 'fr' ? 'Français' : 'English'}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>{t('app.compte.notifications')}</Text>
        <View style={[styles.bloc, styles.ligne]}>
          <Text style={[styles.detail, { flex: 1 }]}>{t('app.compte.notificationsAide')}</Text>
          <Switch value={alertes} disabled={occupe} onValueChange={basculerAlertes} trackColor={{ true: couleurs.enCours, false: couleurs.filet }} accessibilityLabel={t('app.compte.notifications')} />
        </View>

        <Pressable onPress={deconnexion} style={styles.deconnexion} accessibilityRole="button">
          <Text style={styles.deconnexionTexte}>{t('app.compte.deconnexion')}</Text>
        </Pressable>
        <Text style={styles.version}>{t('app.compte.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}</Text>
      </ScrollView>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  contenu: { paddingBottom: 32 },
  section: { color: couleurs.lettreAttenuee, fontFamily: polices.panneau, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 },
  bloc: { marginHorizontal: 16, padding: 14, backgroundColor: couleurs.cellule, borderRadius: rayons.md, gap: 4 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nom: { color: couleurs.lettre, fontFamily: polices.texteGras, fontSize: 17 },
  detail: { color: couleurs.lettreAttenuee, fontFamily: polices.texte, fontSize: 14 },
  choix: { flexDirection: 'row', marginHorizontal: 16, gap: 8 },
  option: { flex: 1, minHeight: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center', backgroundColor: couleurs.cellule, borderRadius: rayons.sm, borderWidth: 1, borderColor: couleurs.cellule },
  optionActive: { borderColor: couleurs.lettre },
  optionTexte: { color: couleurs.lettreAttenuee, fontFamily: polices.panneau, fontSize: 16, textTransform: 'uppercase' },
  optionTexteActif: { color: couleurs.lettre },
  deconnexion: { marginHorizontal: 16, marginTop: 32, minHeight: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: couleurs.filet, borderRadius: rayons.sm },
  deconnexionTexte: { color: couleurs.lettre, fontFamily: polices.panneau, fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 },
  version: { color: couleurs.lettreAttenuee, fontFamily: polices.texte, fontSize: 12, textAlign: 'center', marginTop: 16 },
});
