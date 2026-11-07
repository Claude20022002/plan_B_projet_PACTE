import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { repondreSondage } from '../api/donnees';
import { CIBLE_TACTILE, creerStyles, useTheme } from '../theme';

/** Un sondage ouvert : les choix, « Répondre », puis le merci (réponse anonyme et définitive). */
function Sondage({ sondage, onRecharger }) {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const [choix, setChoix] = useState(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);

  const repondre = async () => {
    setEnCours(true);
    setErreur(null);
    try {
      await repondreSondage(sondage.id_sondage, choix);
    } catch (e) {
      // Fermé ou déjà répondu ailleurs : le message de Planner le dit, la liste se met à jour
      setErreur(e?.message ?? t('app.sondages.echec'));
    } finally {
      setEnCours(false);
      onRecharger();
    }
  };

  return (
    <View style={styles.carte}>
      <View style={styles.entete}>
        <MaterialCommunityIcons name="poll" size={16} color={couleurs.lettreAttenuee} />
        <Text style={styles.etiquette}>{t('app.sondages.etiquette')}</Text>
      </View>
      <Text style={styles.question} accessibilityRole="header">{sondage.question}</Text>
      {sondage.a_repondu ? (
        <Text style={styles.merci}>{t('app.sondages.dejaRepondu')}</Text>
      ) : (
        <>
          <View accessibilityRole="radiogroup" style={styles.choix}>
            {sondage.choix.map((c) => {
              const coche = choix === c.id_choix;
              return (
                <Pressable
                  key={c.id_choix}
                  onPress={() => setChoix(c.id_choix)}
                  style={[styles.option, coche && styles.optionCochee]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: coche }}
                  accessibilityLabel={c.libelle}
                >
                  <MaterialCommunityIcons name={coche ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={coche ? couleurs.accent : couleurs.lettreAttenuee} />
                  <Text style={styles.libelle}>{c.libelle}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={repondre}
            disabled={!choix || enCours}
            style={[styles.bouton, (!choix || enCours) && styles.boutonInactif]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !choix || enCours }}
          >
            <Text style={styles.boutonTexte}>{t('app.sondages.repondre')}</Text>
          </Pressable>
          <Text style={styles.aide}>{t('app.sondages.anonyme')}</Text>
        </>
      )}
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}
    </View>
  );
}

/**
 * Sondages ouverts d'une classe (lot EC-9), en tête de l'écran du cours. Rien quand l'école ne les a
 * pas allumés, ou quand aucun n'attend de réponse.
 */
export default function SondagesOuverts({ sondages, onRecharger }) {
  if (!sondages?.length) return null;
  return sondages.map((s) => <Sondage key={s.id_sondage} sondage={s} onRecharger={onRecharger} />);
}

const useStyles = creerStyles((t) => ({
  carte: { marginHorizontal: 16, marginTop: 16, padding: 14, gap: 8, borderWidth: 1, borderColor: t.couleurs.filet, borderLeftWidth: 4, borderLeftColor: t.couleurs.accent, borderRadius: 8, backgroundColor: t.couleurs.cellule },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  etiquette: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.panneauMoyen, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  question: { color: t.couleurs.lettre, fontFamily: t.polices.texteGras, fontSize: 17, lineHeight: 23 },
  choix: { gap: 6 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: CIBLE_TACTILE, paddingHorizontal: 10, borderWidth: 1, borderColor: t.couleurs.filet, borderRadius: 8 },
  optionCochee: { borderColor: t.couleurs.accent },
  libelle: { flex: 1, color: t.couleurs.lettre, fontFamily: t.polices.texte, fontSize: 15 },
  bouton: { minHeight: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: t.couleurs.accent, marginTop: 4 },
  boutonInactif: { opacity: 0.45 },
  boutonTexte: { color: t.couleurs.surAccent, fontFamily: t.polices.texteGras, fontSize: 15 },
  aide: { color: t.couleurs.lettreAttenuee, fontFamily: t.polices.texte, fontSize: 12 },
  merci: { color: t.couleurs.enCours, fontFamily: t.polices.texteGras, fontSize: 15 },
  erreur: { color: t.couleurs.annule, fontFamily: t.polices.texte, fontSize: 13 },
}));
