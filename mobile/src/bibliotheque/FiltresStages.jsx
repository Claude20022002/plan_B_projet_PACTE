import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CIBLE_TACTILE, creerStyles, useTheme } from '../theme';

/**
 * Filtres des retours de stage : une rangée de pastilles (ville, secteur, année, rémunération).
 * Une pastille ouvre la liste de ses valeurs ; une pastille active se remet à « Tous » d'un toucher
 * sur sa croix. `valeurs` : { cities, sectors, years } (GET /internship-reviews/filtres).
 * `liste` remplace les filtres des avis (offres : type et ville) ; `affiche` traduit une valeur.
 */
const FILTRES = [
  { cle: 'city', libelle: 'ville', valeurs: (v) => v.cities ?? [] },
  { cle: 'sector', libelle: 'secteur', valeurs: (v) => v.sectors ?? [] },
  { cle: 'year_done', libelle: 'annee', valeurs: (v) => (v.years ?? []).map(String) },
  { cle: 'is_paid', libelle: 'remuneration', valeurs: () => ['1', '0'], affiche: (v, t) => t(v === '1' ? 'app.bibliotheque.remunere' : 'app.bibliotheque.nonRemunere') },
];

/** Filtres des offres : type (stage, emploi, alternance) et ville */
export const FILTRES_OFFRES = [
  { cle: 'type', libelle: 'type', valeurs: () => ['stage', 'emploi', 'alternance'], affiche: (v, t) => t(`app.offres.types.${v}`) },
  { cle: 'city', libelle: 'ville', valeurs: (v) => v.villes ?? [] },
];

export default function FiltresStages({ valeurs, filtres, onChange, liste = FILTRES }) {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const [ouvert, setOuvert] = useState(null);
  const libelleValeur = (cle, v) => liste.find((f) => f.cle === cle)?.affiche?.(v, t) ?? v;
  const choisir = (cle, v) => {
    setOuvert(null);
    onChange({ ...filtres, [cle]: v });
  };
  const filtre = liste.find((f) => f.cle === ouvert);

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangee}>
        {liste.map((f) => {
          const actif = filtres[f.cle] !== undefined && filtres[f.cle] !== '';
          return (
            <Pressable
              key={f.cle}
              onPress={() => (actif ? choisir(f.cle, '') : setOuvert(f.cle))}
              style={[styles.pastille, actif && styles.pastilleActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: actif }}
              accessibilityLabel={actif ? t('app.stages.retirerFiltre', { filtre: libelleValeur(f.cle, filtres[f.cle]) }) : t(`app.stages.filtres.${f.libelle}`)}
            >
              <Text style={[styles.pastilleTexte, actif && styles.pastilleTexteActif]}>{actif ? libelleValeur(f.cle, filtres[f.cle]) : t(`app.stages.filtres.${f.libelle}`)}</Text>
              <MaterialCommunityIcons name={actif ? 'close' : 'chevron-down'} size={16} color={actif ? couleurs.surAccent : couleurs.lettre} />
            </Pressable>
          );
        })}
      </ScrollView>

      <Modal visible={Boolean(filtre)} transparent animationType="fade" onRequestClose={() => setOuvert(null)}>
        <Pressable style={styles.voile} onPress={() => setOuvert(null)} accessibilityRole="button" accessibilityLabel={t('app.commun.fermer')}>
          <View style={styles.feuille}>
            <Text style={styles.titre}>{filtre ? t(`app.stages.filtres.${filtre.libelle}`) : ''}</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {filtre && filtre.valeurs(valeurs ?? {}).length === 0 ? <Text style={styles.vide}>{t('app.stages.aucuneValeur')}</Text> : null}
              {filtre?.valeurs(valeurs ?? {}).map((v) => (
                <Pressable key={v} onPress={() => choisir(filtre.cle, v)} style={styles.choix} accessibilityRole="button">
                  <Text style={styles.choixTexte}>{libelleValeur(filtre.cle, v)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const useStyles = creerStyles((t) => ({
  rangee: { gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  pastille: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: t.couleurs.filet, backgroundColor: t.couleurs.cellule },
  pastilleActive: { backgroundColor: t.couleurs.accent, borderColor: t.couleurs.accent },
  pastilleTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 14 },
  pastilleTexteActif: { color: t.couleurs.surAccent, fontFamily: t.polices.texteGras },
  voile: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'flex-end' },
  feuille: { backgroundColor: t.couleurs.cellule, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24, paddingTop: 8 },
  titre: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texteGras, fontSize: 14, paddingHorizontal: 20, paddingVertical: 12 },
  choix: { minHeight: CIBLE_TACTILE, justifyContent: 'center', paddingHorizontal: 20 },
  choixTexte: { color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 16 },
  vide: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, paddingHorizontal: 20, paddingVertical: 12 },
}));
