export const TYPES_EVENEMENT = ['vacances', 'examen', 'ferie', 'ramadan', 'stage', 'reunion', 'formation', 'autre'];
export const PORTEES = ['etablissement', 'campus', 'filiere', 'niveau', 'groupe'];

export const ANNEE_VIDE = { libelle: '', date_debut: '', date_fin: '', active: false };
export const PERIODE_VIDE = { code: 'S1', libelle: '', date_debut: '', date_fin: '', nb_semaines: 16 };
export const EVENEMENT_VIDE = {
    titre: '',
    description: '',
    date_debut: '',
    date_fin: '',
    type_evenement: 'vacances',
    bloque_affectations: true,
    portee: 'etablissement',
    id_cible: '',
    niveau: '',
    heure_debut: '',
    heure_fin: '',
};

export const hhmm = (heure) => (heure ? String(heure).slice(0, 5) : '');
