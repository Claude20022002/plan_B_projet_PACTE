import * as yup from 'yup';

export const validationSchema = yup.object({
    date_seance: yup.date().required('La date est requise'),
    id_cours: yup.number().required('Le cours est requis'),
    id_groupe: yup.number().required('Le groupe est requis'),
    id_user_enseignant: yup.number().required("L'enseignant est requis"),
    id_salle: yup.number().required('La salle est requise'),
    id_creneau: yup.number().required('Le créneau est requis'),
});

/** Valeurs d'une séance à planifier : tout est vide, sauf le statut et l'administrateur connecté. */
export const valeursVides = (user) => ({
    date_seance: '',
    statut: 'planifie',
    commentaire: '',
    id_cours: '',
    id_groupe: '',
    id_user_enseignant: '',
    id_salle: '',
    id_creneau: '',
    id_user_admin: user?.id_user || '',
});
