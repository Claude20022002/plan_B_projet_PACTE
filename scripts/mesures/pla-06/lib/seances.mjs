/**
 * Séances synthétiques de la base modèle (PLA-06, correction C-5) : le seed ne crée aucune séance.
 * Une semaine type est tirée des enseignements du seed (chaque groupe suit ses enseignements à tour
 * de rôle sur les créneaux de la semaine, jusqu'à environ 30 h), puis recopiée sur 36 semaines.
 * Le volume compte, pas la qualité : les conflits de salle ou d'enseignant ne sont pas évités.
 * Fonctions pures, sans dépendance : l'insertion en base est faite par preparer.mjs.
 */

/** Rang des jours dans la semaine, lundi d'abord (valeurs de Creneaux.jour_semaine). */
export const RANG_DU_JOUR = { lundi: 0, mardi: 1, mercredi: 2, jeudi: 3, vendredi: 4, samedi: 5, dimanche: 6 };

/**
 * Semaine type. Entrées :
 * - enseignements : [{ id_enseignement, id_groupe, id_cours, id_user_enseignant }] ;
 * - creneaux : [{ id_creneau, jour_semaine, heure_debut, duree_minutes }] ;
 * - salles : [{ id_salle }].
 * Rend [{ id_groupe, id_enseignement, id_cours, id_user_enseignant, id_creneau, jour, id_salle }].
 */
export function planifierSemaine({ enseignements, creneaux, salles, heuresParSemaine = 30 }) {
    if (!creneaux.length) throw new Error("Aucun créneau : la base modèle n'a pas été remplie par le seed");
    const ordre = [...creneaux]
        .filter((c) => c.jour_semaine in RANG_DU_JOUR && c.jour_semaine !== "dimanche")
        .sort((a, b) => RANG_DU_JOUR[a.jour_semaine] - RANG_DU_JOUR[b.jour_semaine] || String(a.heure_debut).localeCompare(String(b.heure_debut)));
    const parGroupe = new Map();
    for (const e of enseignements) {
        if (!parGroupe.has(e.id_groupe)) parGroupe.set(e.id_groupe, []);
        parGroupe.get(e.id_groupe).push(e);
    }
    const seances = [];
    let rangGroupe = 0;
    for (const [idGroupe, liste] of [...parGroupe].sort(([a], [b]) => a - b)) {
        let minutes = 0;
        for (const [k, creneau] of ordre.entries()) {
            if (minutes >= heuresParSemaine * 60) break;
            const e = liste[k % liste.length];
            const salle = salles.length ? salles[(rangGroupe + k) % salles.length].id_salle : null;
            seances.push({ id_groupe: idGroupe, id_enseignement: e.id_enseignement, id_cours: e.id_cours, id_user_enseignant: e.id_user_enseignant, id_creneau: creneau.id_creneau, jour: creneau.jour_semaine, id_salle: salle });
            minutes += Number(creneau.duree_minutes) || 0;
        }
        rangGroupe += 1;
    }
    return seances;
}

const iso = (date) => date.toISOString().slice(0, 10);

/** Lundi (AAAA-MM-JJ, en UTC) de la semaine qui contient la date donnée. */
export function lundiDe(date) {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return iso(d);
}

/** Les lundis de `semaines` semaines consécutives à partir de `premierLundi` (AAAA-MM-JJ). */
export function lundis(premierLundi, semaines) {
    const depart = new Date(`${premierLundi}T00:00:00Z`);
    if (depart.getUTCDay() !== 1) throw new Error(`${premierLundi} n'est pas un lundi`);
    return Array.from({ length: semaines }, (_, i) => {
        const d = new Date(depart);
        d.setUTCDate(d.getUTCDate() + 7 * i);
        return iso(d);
    });
}

/** Date (AAAA-MM-JJ) du jour `jour` de la semaine qui commence le lundi donné. */
export function dateDuJour(lundi, jour) {
    if (!(jour in RANG_DU_JOUR)) throw new Error(`Jour inconnu : ${jour}`);
    const d = new Date(`${lundi}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + RANG_DU_JOUR[jour]);
    return iso(d);
}

/** Séances de l'année : la semaine type recopiée sur chaque lundi ; ajoute date_seance. */
export const seancesDeLAnnee = (semaine, lesLundis) => lesLundis.flatMap((lundi) => semaine.map((s) => ({ ...s, date_seance: dateDuJour(lundi, s.jour) })));

/**
 * Premier lundi de l'année synthétique : 8 semaines avant la semaine en cours, pour que la semaine
 * courante (celle que l'étudiant consulte pendant la mesure) tombe au milieu des séances.
 */
export const premierLundiDeLAnnee = (aujourdhui = new Date()) => {
    const d = new Date(`${lundiDe(aujourdhui)}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 7 * 8);
    return iso(d);
};
