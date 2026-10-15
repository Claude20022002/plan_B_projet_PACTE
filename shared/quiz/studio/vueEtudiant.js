/**
 * Ce que l'étudiant voit d'une question pendant l'épreuve (Studio quiz) : l'énoncé et les choix,
 * jamais les bonnes réponses. Le mélange est tiré une fois au début de la tentative et gardé avec
 * elle : recharger la page ne change pas l'ordre, et deux voisins n'ont pas le même.
 */

/** Mélange de Fisher-Yates ; `aleatoire` rend un nombre dans [0, 1[ (remplaçable dans les tests). */
export const melanger = (liste, aleatoire = Math.random) => {
    const copie = [...liste];
    for (let i = copie.length - 1; i > 0; i -= 1) {
        const j = Math.floor(aleatoire() * (i + 1));
        [copie[i], copie[j]] = [copie[j], copie[i]];
    }
    return copie;
};

/**
 * Ordre d'affichage tiré pour une question : options, éléments à remettre en ordre, colonne de
 * droite d'une association, listes des trous. L'ordre d'une question « ordre » est toujours mélangé
 * (sinon la réponse serait donnée), et jamais laissé dans l'ordre juste quand c'est évitable.
 */
export const tirerOrdre = (question, { melangerOptions = true } = {}, aleatoire = Math.random) => {
    const d = question.donnees;
    const ids = (liste) => liste.map((e) => e.id);
    const tirer = (liste) => (melangerOptions ? melanger(liste, aleatoire) : liste);
    switch (question.type) {
        case "choix_unique":
        case "choix_multiple":
            return { options: tirer(ids(d.options)) };
        case "ordre": {
            const juste = ids(d.elements);
            let tire = melanger(juste, aleatoire);
            for (let essai = 0; essai < 5 && tire.every((id, i) => id === juste[i]); essai += 1) tire = melanger(juste, aleatoire);
            return { elements: tire };
        }
        case "association":
            return { droites: melanger([...ids(d.paires), ...d.distracteurs.map((_, i) => `d${i + 1}`)], aleatoire) };
        case "texte_trous":
            return { trous: Object.fromEntries(d.trous.filter((t) => t.options).map((t) => [t.id, tirer(t.options)])) };
        default:
            return {};
    }
};

const parId = (liste) => new Map(liste.map((e) => [e.id, e]));

/**
 * Question telle que l'étudiant la reçoit.
 * @param {object} question question validée (avec `id_question`)
 * @param {object} ordre ordre tiré par tirerOrdre
 */
export const vueEtudiant = (question, ordre = {}) => {
    const d = question.donnees;
    const base = {
        id_question: question.id_question,
        type: question.type,
        enonce: question.enonce,
        points: question.points,
        id_media: question.id_media ?? null,
        extrait: question.extrait ?? null,
    };
    switch (question.type) {
        case "choix_unique":
        case "choix_multiple": {
            const options = parId(d.options);
            const vue = { ...base, options: (ordre.options ?? d.options.map((o) => o.id)).map((id) => options.get(id)).filter(Boolean) };
            // « Choisissez 2 réponses », comme à l'examen Cisco (l'enseignant peut le taire)
            if (question.type === "choix_multiple" && d.annoncer_nombre) vue.nombre_attendu = d.bonnes.length;
            return vue;
        }
        case "numerique":
            return { ...base, unite: d.unite ?? null };
        case "texte_trous":
            return { ...base, texte: d.texte, trous: d.trous.map((t) => ({ id: t.id, ...(t.options ? { options: ordre.trous?.[t.id] ?? t.options } : {}) })) };
        case "association": {
            const droites = new Map([...d.paires.map((p) => [p.id, p.droite]), ...d.distracteurs.map((t, i) => [`d${i + 1}`, t])]);
            return {
                ...base,
                gauches: d.paires.map((p) => ({ id: p.id, texte: p.gauche })),
                droites: (ordre.droites ?? [...droites.keys()]).map((id) => ({ id, texte: droites.get(id) })).filter((e) => e.texte),
            };
        }
        case "ordre": {
            const elements = parId(d.elements);
            return { ...base, elements: (ordre.elements ?? d.elements.map((e) => e.id)).map((id) => elements.get(id)).filter(Boolean) };
        }
        case "reponse_libre":
            return { ...base, longueur_max: d.longueur_max };
        default:
            return base;
    }
};
