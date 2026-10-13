import { coursAPI } from '../../services/api';
import { nombreOuNull } from './constantes';

/** Crée les modules d'un fichier CSV, ligne à ligne. Rend le nombre de réussites et les erreurs par ligne. */
export const importerModules = async (lignes, filieres, t) => {
    const parCode = new Map(filieres.map((f) => [f.code_filiere.toLowerCase(), f.id_filiere]));
    const erreurs = [];
    let reussies = 0;
    for (const [index, ligne] of lignes.entries()) {
        const idFiliere = parCode.get(String(ligne.code_filiere || '').trim().toLowerCase()) ?? nombreOuNull(ligne.id_filiere);
        try {
            if (!idFiliere) throw new Error(t('ref.curriculum.unknownProgram', { code: ligne.code_filiere || '' }));
            await coursAPI.create({
                code_cours: String(ligne.code_cours || '').trim(),
                nom_cours: String(ligne.nom_cours || '').trim(),
                id_filiere: idFiliere,
                niveau: String(ligne.niveau || '').trim(),
                semestre: String(ligne.semestre || '').trim().toUpperCase(),
                type_cours: String(ligne.type_cours || 'CM').trim(),
                volume_horaire: Number(ligne.volume_horaire),
                ects: nombreOuNull(ligne.ects),
                coefficient: Number(ligne.coefficient) || 1,
            });
            reussies += 1;
        } catch (error) {
            erreurs.push({
                ligne: index + 2,
                libelle: ligne.code_cours,
                message: error.response?.data?.error || error.response?.data?.errors?.[0]?.message || error.message,
            });
        }
    }
    return { reussies, erreurs };
};
