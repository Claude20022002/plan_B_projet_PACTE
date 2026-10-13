export const SEMESTRES = Array.from({ length: 10 }, (_, i) => `S${i + 1}`);
export const TYPES = ['CM', 'TD', 'TP', 'Projet'];
export const NIVEAUX_GROUPE = ['promotion', 'td', 'tp'];
export const MODALITES = ['presentiel', 'distanciel', 'hybride'];

export const MODULE_VIDE = {
    code_cours: '',
    nom_cours: '',
    id_filiere: '',
    niveau: '',
    semestre: 'S1',
    type_cours: 'CM',
    volume_horaire: '',
    ects: '',
    coefficient: 1,
    id_responsable: '',
};

export const COMPOSANTE_VIDE = {
    type: 'TD',
    volume_heures: '',
    niveau_groupe: 'td',
    creneaux_par_seance: 2,
    modalite: 'presentiel',
    mention: '',
    type_salle_requis: '',
    semaine_debut: '',
    semaine_fin: '',
    seances_par_semaine: '',
};

export const MODELE_CSV = [
    'code_cours;nom_cours;code_filiere;niveau;semestre;type_cours;volume_horaire;ects;coefficient',
    'IIIA-4-TLC;Théorie des langages et Compilation;IIIA;4ème année;S7;CM;21;3;1',
].join('\n');

export const periodeDe = (semestre) => {
    const numero = Number(String(semestre || '').match(/\d+/)?.[0]);
    if (!numero) return null;
    return numero % 2 === 1 ? 'S1' : 'S2';
};

export const nombreOuNull = (valeur) => (valeur === '' || valeur === null || valeur === undefined ? null : Number(valeur));
