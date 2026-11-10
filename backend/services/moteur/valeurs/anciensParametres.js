/**
 * Correspondance entre les anciens réglages (table ParametresPlanning, config/parametresPlanning.js)
 * et le catalogue du moteur. Les anciens réglages restent lus tels quels tant que la génération ne
 * lit pas les valeurs résolues ; cette table sert à la migration et au test de non-régression.
 * Les unités changent : le catalogue compte en minutes et en pourcentage.
 */
export const ANCIENS_PARAMETRES = {
    max_heures_jour_groupe: { id: "HOR.REGLE.MAX_H_JOUR_GROUPE", convertir: (v) => v * 60 },
    max_heures_jour_enseignant: { id: "ENS.CHARGE.MAX_H_JOUR", convertir: (v) => v * 60 },
    duree_seance_defaut_minutes: { id: "MAT.VOL.DUREE_REC", convertir: (v) => v },
    ratio_capacite_examen: { id: "EXA.EPREUVE.RATIO_CAPACITE", convertir: (v) => Math.round(v * 100) },
    surveillants_par_salle: { id: "EXA.EPREUVE.SURVEILLANTS_PAR_SALLE", convertir: (v) => v },
    trajet_inter_campus_defaut_minutes: { id: "LOG.TRAJET.CAMPUS_DEFAUT", convertir: (v) => v },
};

/** Ces deux-là deviennent des plages restreintes, avec ME-2a (fichier 04) : pas de conversion directe. */
export const ANCIENS_VERS_PLAGES = ["pause_vendredi", "samedi_apres_midi_initiale"];
