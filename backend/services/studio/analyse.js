/**
 * Statistiques d'une passation du Studio quiz, calculées sur la meilleure copie de chaque étudiant.
 * L'analyse des questions reprend les deux indicateurs classiques des examens à choix (et du
 * rapport de test de Moodle) :
 *  - facilité : part moyenne des points obtenus (une question réussie par tous n'apprend rien) ;
 *  - discrimination : réussite du tiers des meilleures copies moins celle du tiers des plus
 *    faibles ; proche de zéro ou négative, la question est sans doute ambiguë ou fausse.
 */

const arrondi = (v, n = 1) => Math.round(v * 10 ** n) / 10 ** n;

const mediane = (valeurs) => {
    if (!valeurs.length) return null;
    const triees = [...valeurs].sort((a, b) => a - b);
    const milieu = Math.floor(triees.length / 2);
    return triees.length % 2 ? triees[milieu] : (triees[milieu - 1] + triees[milieu]) / 2;
};

export const statistiques = (copies, seuil) => {
    const notes = copies.map((c) => c.pourcentage ?? 0);
    if (!notes.length) return { copies: 0, moyenne: null, mediane: null, min: null, max: null, ecart_type: null, taux_reussite: null };
    const moyenne = notes.reduce((s, n) => s + n, 0) / notes.length;
    const variance = notes.reduce((s, n) => s + (n - moyenne) ** 2, 0) / notes.length;
    return {
        copies: notes.length,
        moyenne: arrondi(moyenne),
        mediane: arrondi(mediane(notes)),
        min: arrondi(Math.min(...notes)),
        max: arrondi(Math.max(...notes)),
        ecart_type: arrondi(Math.sqrt(variance)),
        taux_reussite: arrondi((copies.filter((c) => (c.pourcentage ?? 0) >= seuil).length / notes.length) * 100),
    };
};

const partDe = (correction) => (correction && correction.points !== null && correction.max ? correction.points / correction.max : null);

/** Répartition des choix (questions à choix, vrai ou faux) : combien ont coché chaque option. */
const repartition = (question, copies) => {
    if (!["choix_unique", "choix_multiple", "vrai_faux"].includes(question.type)) return null;
    const compte = {};
    for (const c of copies) {
        const r = c.reponses?.[question.id_question];
        for (const choix of Array.isArray(r) ? r : r === undefined || r === null ? [] : [r]) compte[String(choix)] = (compte[String(choix)] ?? 0) + 1;
    }
    return compte;
};

export const analyserQuestions = (session, copies) => {
    const triees = [...copies].sort((a, b) => (b.pourcentage ?? 0) - (a.pourcentage ?? 0));
    const tiers = Math.floor(triees.length / 3);
    const hauts = tiers >= 2 ? triees.slice(0, tiers) : [];
    const bas = tiers >= 2 ? triees.slice(-tiers) : [];
    const reussite = (groupe, id) => {
        const parts = groupe.map((c) => partDe(c.corrections?.[id])).filter((p) => p !== null);
        return parts.length ? parts.reduce((s, p) => s + p, 0) / parts.length : null;
    };
    return (session.questions ?? []).map((q) => {
        const avec = copies.filter((c) => c.corrections?.[q.id_question]);
        const corrections = avec.map((c) => c.corrections[q.id_question]);
        const parts = corrections.map(partDe).filter((p) => p !== null);
        const facilite = parts.length ? parts.reduce((s, p) => s + p, 0) / parts.length : null;
        const haut = reussite(hauts, q.id_question);
        const faible = reussite(bas, q.id_question);
        return {
            id_question: q.id_question,
            type: q.type,
            enonce: q.enonce,
            points: q.points,
            reponses: avec.length,
            facilite: facilite === null ? null : arrondi(facilite * 100),
            discrimination: haut === null || faible === null ? null : arrondi(haut - faible, 2),
            sans_reponse: corrections.filter((c) => c.statut === "sans_reponse").length,
            a_corriger: corrections.filter((c) => c.points === null).length,
            repartition: repartition(q, avec),
        };
    });
};
