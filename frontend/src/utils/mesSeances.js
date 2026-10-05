import { emploiDuTempsAPI } from '../services/api';
import { toLocalISODate } from './session';

const TRANCHE_JOURS = 60; // l'API refuse plus de 62 jours par appel

const plusJours = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

/**
 * Séances de l'étudiant connecté entre deux dates : celles de ses groupes et de leurs groupes
 * parents (un CM de promotion apparaît pour chaque TD), comme dans l'application mobile.
 * Une longue période est demandée par tranches de 60 jours.
 */
export const chargerMesSeances = async (du, au) => {
  const tranches = [];
  for (let debut = new Date(du); debut <= au; debut = plusJours(debut, TRANCHE_JOURS + 1)) {
    const fin = plusJours(debut, TRANCHE_JOURS) < au ? plusJours(debut, TRANCHE_JOURS) : au;
    tranches.push(emploiDuTempsAPI.getMoi({ du: toLocalISODate(debut), au: toLocalISODate(fin) }));
  }
  const reponses = await Promise.all(tranches);
  return {
    groupes: reponses[0]?.groupes || [],
    // La salle porte son campus ; le panneau affiche son nom sous la salle
    seances: reponses
      .flatMap((r) => r?.seances || [])
      .map((a) => ({ ...a, salle: a.salle ? { ...a.salle, batiment: a.salle.batiment || a.salle.campus?.nom || null } : null })),
  };
};
