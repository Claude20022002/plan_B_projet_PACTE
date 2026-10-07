import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, useColorScheme, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import Ecran from '../../board/Ecran';
import { useAuth } from '../../auth/AuthContext';
import { changerLangue } from '../../i18n';
import { desinscrireDesNotifications, inscrireAuxNotifications, notificationsActives } from '../../push';
import { CIBLE_TACTILE, creerStyles, espace, FAMILLES, MODES, themePour, usePreferenceTheme, useTheme } from '../../theme';
import { useMargeOnglets } from '../../verre/Verre';
import { ajouterAuCalendrier } from '../../agenda';

/** Compte : profil, apparence (thème Planner ou StudyLib, clair ou sombre), langue, notifications, déconnexion. */
export default function Compte() {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const margeBas = useMargeOnglets();
  const { t, i18n } = useTranslation();
  const { utilisateur, deconnexion } = useAuth();
  const [erreurAgenda, setErreurAgenda] = useState(false);
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
      <ScrollView contentContainerStyle={{ paddingBottom: margeBas }} scrollIndicatorInsets={{ bottom: margeBas }}>
        <Text style={styles.section}>{t('app.compte.profil')}</Text>
        <View style={styles.bloc}>
          <Text style={styles.nom}>{[utilisateur?.prenom, utilisateur?.nom].filter(Boolean).join(' ')}</Text>
          <Text style={styles.detail}>{utilisateur?.email}</Text>
          {utilisateur?.niveau ? <Text style={styles.detail}>{utilisateur.niveau}</Text> : null}
        </View>

        <Apparence />

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

        <Text style={styles.section}>{t('app.compte.agenda')}</Text>
        <View style={styles.bloc}>
          <Text style={styles.detail}>{t('app.compte.agendaAide')}</Text>
          <Pressable
            onPress={() => ajouterAuCalendrier(couleurs).catch(() => setErreurAgenda(true))}
            style={({ pressed }) => [styles.option, styles.optionActive, { marginTop: 12, minHeight: CIBLE_TACTILE, justifyContent: 'center' }, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
          >
            <Text style={styles.agendaBouton}>{t('app.compte.agendaAjouter')}</Text>
          </Pressable>
          {erreurAgenda ? <Text style={[styles.detail, { marginTop: 8 }]}>{t('app.compte.agendaErreur')}</Text> : null}
        </View>

        <Pressable onPress={deconnexion} style={styles.deconnexion} accessibilityRole="button">
          <Text style={styles.deconnexionTexte}>{t('app.compte.deconnexion')}</Text>
        </Pressable>
        <Text style={styles.version}>{t('app.compte.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}</Text>
      </ScrollView>
    </Ecran>
  );
}

/**
 * Apparence : deux thèmes (le panneau de Planner, la bibliothèque StudyLib) montrés en aperçu
 * dans le mode courant, puis le mode automatique (celui du téléphone), clair ou sombre.
 */
function Apparence() {
  const { t } = useTranslation();
  const styles = useStyles();
  const schema = useColorScheme();
  const { preference, changer } = usePreferenceTheme();

  return (
    <>
      <Text style={styles.section}>{t('app.compte.theme')}</Text>
      <View style={styles.choix} accessibilityRole="radiogroup">
        {FAMILLES.map((famille) => {
          const actif = preference.famille === famille;
          const apercu = themePour({ famille, mode: preference.mode }, schema);
          const c = apercu.couleurs;
          return (
            <Pressable
              key={famille}
              onPress={() => changer({ famille })}
              style={[styles.theme, actif && styles.optionActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: actif }}
              accessibilityLabel={`${t(`app.compte.themes.${famille}`)}. ${t(`app.compte.themes.${famille}Aide`)}`}
            >
              {/* Aperçu : barre de titre, deux lignes du tableau, un bouton */}
              <View style={[styles.apercu, { backgroundColor: c.fond, borderColor: c.filet, borderRadius: apercu.rayons.sm }]}>
                <View style={[styles.apercuBarre, { backgroundColor: c.cadre, borderBottomColor: c.bordCadre }]}>
                  <View style={[styles.apercuTrait, { width: 34, backgroundColor: c.surCadre }]} />
                </View>
                {[0.8, 0.55].map((largeur, i) => (
                  <View key={largeur} style={[styles.apercuLigne, { borderBottomColor: c.filet }]}>
                    <View style={[styles.apercuTrait, { width: 12, backgroundColor: c.lettre }]} />
                    <View style={[styles.apercuTrait, { flex: largeur, backgroundColor: c.lettreAttenuee, opacity: 0.6 }]} />
                    <View style={[styles.apercuPoint, { backgroundColor: i ? c.reporte : c.enCours }]} />
                  </View>
                ))}
                <View style={[styles.apercuBouton, { backgroundColor: c.accent, borderRadius: apercu.rayons.xs }]} />
              </View>
              <Text style={[styles.themeNom, actif && styles.optionTexteActif, { fontFamily: apercu.polices.panneauGras, textTransform: apercu.capitales }]}>{t(`app.compte.themes.${famille}`)}</Text>
              <Text style={styles.themeAide}>{t(`app.compte.themes.${famille}Aide`)}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.choix, { marginTop: 8 }]} accessibilityRole="radiogroup" accessibilityLabel={t('app.compte.mode')}>
        {MODES.map((mode) => {
          const actif = preference.mode === mode;
          return (
            <Pressable key={mode} onPress={() => changer({ mode })} style={[styles.option, actif && styles.optionActive]} accessibilityRole="radio" accessibilityState={{ checked: actif }}>
              <Text style={[styles.optionTexte, styles.optionPetite, actif && styles.optionTexteActif]}>{t(`app.compte.modes.${mode}`)}</Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

const useStyles = creerStyles((t) => ({
  section: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneau, fontSize: 14, textTransform: t.capitales, letterSpacing: espace(t, 1.2), paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 },
  bloc: { marginHorizontal: 16, padding: 14, backgroundColor: t.couleurs.cellule, borderRadius: t.rayons.md, gap: 4 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nom: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 17 },
  detail: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 14 },
  agendaBouton: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 15, textAlign: 'center' },
  choix: { flexDirection: 'row', marginHorizontal: 16, gap: 8 },
  option: { flex: 1, minHeight: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center', backgroundColor: t.couleurs.cellule, borderRadius: t.rayons.sm, borderWidth: 1, borderColor: t.sombre ? t.couleurs.cellule : t.couleurs.filet },
  optionActive: { borderColor: t.famille === 'planner' ? t.couleurs.lettre : t.couleurs.accent, borderWidth: 2 },
  optionPetite: { fontSize: 14 },
  theme: { flex: 1, padding: 10, gap: 6, backgroundColor: t.couleurs.cellule, borderRadius: t.rayons.md, borderWidth: 1, borderColor: t.sombre ? t.couleurs.cellule : t.couleurs.filet },
  apercu: { height: 78, borderWidth: 1, overflow: 'hidden' },
  apercuBarre: { height: 18, justifyContent: 'center', paddingHorizontal: 6, borderBottomWidth: 1 },
  apercuLigne: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 18, paddingHorizontal: 6, borderBottomWidth: 1 },
  apercuTrait: { height: 4, borderRadius: 2 },
  apercuPoint: { width: 6, height: 6, borderRadius: 3, marginLeft: 'auto' },
  apercuBouton: { height: 10, width: 36, margin: 6, alignSelf: 'flex-end' },
  themeNom: { color: t.couleurs.lettreAttenuee, fontSize: 16, letterSpacing: espace(t, 0.6) },
  themeAide: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 12, lineHeight: 16 },
  optionTexte: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneau, fontSize: 16, textTransform: t.capitales },
  optionTexteActif: { color: t.couleurs.lettre },
  deconnexion: { marginHorizontal: 16, marginTop: 32, minHeight: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.couleurs.filet, borderRadius: t.rayons.sm },
  deconnexionTexte: { color: t.couleurs.lettre, fontFamily: t.polices.panneau, fontSize: 16, textTransform: t.capitales, letterSpacing: espace(t, 1) },
  version: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 12, textAlign: 'center', marginTop: 16 },
}));
