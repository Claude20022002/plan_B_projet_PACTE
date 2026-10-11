/**
 * Grille horaire des parcours (lot B-8), celle des emplois du temps de HESTIM : quatre créneaux par
 * jour du lundi au vendredi, 09:00-10:45, 11:00-12:30, 13:30-15:15, 15:30-17:00 ; le vendredi
 * après-midi décalé, 14:30-16:15 et 16:30-18:00 ; le samedi, le matin seulement. Une séance occupe
 * en général deux créneaux de la même demi-journée. Une seule grille pour toute l'école, comme en
 * production : chaque scénario de génération la partage.
 */

const MATIN = [["09:00", "10:45"], ["11:00", "12:30"]];
const APRES_MIDI = [["13:30", "15:15"], ["15:30", "17:00"]];
const APRES_MIDI_VENDREDI = [["14:30", "16:15"], ["16:30", "18:00"]];
const JOURS = {
  lundi: [...MATIN, ...APRES_MIDI],
  mardi: [...MATIN, ...APRES_MIDI],
  mercredi: [...MATIN, ...APRES_MIDI],
  jeudi: [...MATIN, ...APRES_MIDI],
  vendredi: [...MATIN, ...APRES_MIDI_VENDREDI],
  samedi: MATIN,
};

const minutes = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));

/** Crée la grille (régime initial, variante normale) ; rend { lundi: [créneaux…], …, samedi } */
export const creerGrille = async (Creneau) => {
  const grille = {};
  for (const [jour, plages] of Object.entries(JOURS)) {
    grille[jour] = [];
    for (const [rang, [debut, fin]] of plages.entries()) {
      grille[jour].push(await Creneau.create({ jour_semaine: jour, heure_debut: debut, heure_fin: fin, duree_minutes: minutes(fin) - minutes(debut), rang: rang + 1 }));
    }
  }
  return grille;
};
