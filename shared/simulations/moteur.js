/** Deterministic, bounded simulations. No user code, SQL, shell, or robot hardware is executed. */
const memeCase = (a, b) => a[0] === b[0] && a[1] === b[1];
const entier = (n, max) => Number.isInteger(n) && n >= 0 && n <= max;
const entierEntre = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
const mouvements = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };

/** Validates the exact request shape before simulation; blank inputs must never become zero. */
export function reponseValide(moteur, reponse) {
    if (!reponse || typeof reponse !== 'object' || Array.isArray(reponse)) return false;
    const cles = Object.keys(reponse);
    if (moteur === 'robot') return cles.length === 1 && typeof reponse.programme === 'string'
        && /^[NESW\s]{1,160}$/.test(reponse.programme) && reponse.programme.replace(/\s/g, '').length > 0
        && reponse.programme.replace(/\s/g, '').length <= 40;
    if (moteur === 'seuil') return cles.length === 1 && entier(reponse.seuil, 100);
    if (moteur === 'stock') return cles.length === 1 && Array.isArray(reponse.commandes)
        && reponse.commandes.length === 3 && [0, 1, 2].every((i) => entier(reponse.commandes[i], 100));
    if (moteur === 'triage') return cles.length === 1 && Array.isArray(reponse.severites)
        && reponse.severites.length === 4 && reponse.severites.every((s) => entierEntre(s, 1, 4));
    if (moteur === 'sql') {
        if (cles.length !== 1 || !Array.isArray(reponse.positions) || reponse.positions.length !== 4) return false;
        if (!reponse.positions.every((p) => entierEntre(p, 1, 4))) return false;
        return new Set(reponse.positions).size === 4;
    }
    if (moteur === 'reseau') return cles.length === 1 && Array.isArray(reponse.ports)
        && reponse.ports.length === 4 && reponse.ports.every((p) => entierEntre(p, 0, 2));
    if (moteur === 'cpu') {
        if (cles.length !== 1 || !Array.isArray(reponse.ordre) || reponse.ordre.length !== 4) return false;
        if (!reponse.ordre.every((p) => entierEntre(p, 0, 3))) return false;
        return new Set(reponse.ordre).size === 4;
    }
    if (moteur === 'sprint') return cles.length === 1 && Array.isArray(reponse.choix)
        && reponse.choix.length === 5 && reponse.choix.every((c) => c === 0 || c === 1);
    if (moteur === 'budget') return cles.length === 1 && Array.isArray(reponse.quantites)
        && reponse.quantites.length === 4 && reponse.quantites.every((q) => entier(q, 999));
    return false;
}

function robot(defi, { programme }) {
    const instructions = programme.replace(/\s/g, '').split('');
    const trajet = [[...defi.depart]];
    const problemes = [];
    for (const [index, instruction] of instructions.entries()) {
        const precedent = trajet[trajet.length - 1];
        const delta = mouvements[instruction];
        const prochain = [precedent[0] + delta[0], precedent[1] + delta[1]];
        if (prochain.some((n) => n < 0 || n >= defi.taille) || defi.obstacles.some((p) => memeCase(p, prochain))) {
            problemes.push({ code: 'collision', valeurs: { step: index + 1 } });
            break;
        }
        trajet.push(prochain);
    }
    if (!memeCase(trajet[trajet.length - 1], defi.arrivee)) problemes.push({ code: 'destination' });
    if (!defi.passages.every((p) => trajet.some((t) => memeCase(p, t)))) problemes.push({ code: 'checkpoint' });
    if (instructions.length > defi.maxPas) problemes.push({ code: 'steps', valeurs: { max: defi.maxPas } });
    return { ok: !problemes.length, problemes, trajet, pas: instructions.length };
}

function seuil(defi, { seuil: limite }) {
    let vp = 0; let fp = 0; let vn = 0; let fn = 0;
    const observations = defi.observations.map(([score, vrai]) => {
        const predit = score >= limite;
        if (predit && vrai) vp++;
        else if (predit) fp++;
        else if (vrai) fn++;
        else vn++;
        return { score, vrai: Boolean(vrai), predit };
    });
    // Undefined precision is explicit: displaying 100% when no alerts exist would misteach it.
    const precision = vp + fp ? 100 * vp / (vp + fp) : null;
    const rappel = vp + fn ? 100 * vp / (vp + fn) : null;
    const cout = fp * defi.coutFP + fn * defi.coutFN;
    const problemes = [];
    if (precision === null || precision < defi.precisionMin) problemes.push({ code: 'precision', valeurs: { min: defi.precisionMin } });
    if (rappel === null || rappel < defi.rappelMin) problemes.push({ code: 'recall', valeurs: { min: defi.rappelMin } });
    if (cout > defi.coutMax) problemes.push({ code: 'cost', valeurs: { max: defi.coutMax } });
    return { ok: !problemes.length, problemes, observations, vp, fp, vn, fn, precision, rappel, cout };
}

function stock(defi, { commandes }) {
    let disponible = defi.initial;
    const problemes = [];
    const jours = defi.demandes.map((demande, index) => {
        const ouverture = disponible;
        const reception = commandes[index - defi.delai] ?? 0;
        const avant = ouverture + reception;
        const manque = Math.max(0, demande - avant);
        // Unserved demand is lost, never turned into negative inventory carried to the next day.
        disponible = Math.max(0, avant - demande);
        if (avant > defi.capacite) problemes.push({ code: 'capacity', valeurs: { day: index + 1, max: defi.capacite } });
        if (manque) problemes.push({ code: 'shortage', valeurs: { day: index + 1, count: manque } });
        return { jour: index + 1, ouverture, reception, demande, fermeture: disponible, manque };
    });
    const cout = commandes.reduce((s, n) => s + n, 0) * defi.prix;
    const transit = commandes.filter((_, i) => i + defi.delai >= defi.demandes.length).reduce((s, n) => s + n, 0);
    if (cout > defi.budget) problemes.push({ code: 'budget', valeurs: { max: defi.budget } });
    if (disponible > defi.finalMax) problemes.push({ code: 'remaining', valeurs: { max: defi.finalMax } });
    if (transit) problemes.push({ code: 'transit' });
    return { ok: !problemes.length, problemes, jours, cout, transit, restant: disponible };
}

/** Canonical score: scope × data multiplier × status multiplier. */
const MULT_DATA = { public: 1, confidentiel: 2, secret: 3 };
const MULT_STATUT = { contenu: 1, actif: 2 };
const niveauDuScore = (s) => (s >= 30 ? 1 : s >= 12 ? 2 : s >= 4 ? 3 : 4);

function triage(defi, { severites }) {
    const problemes = [];
    const evenements = defi.evenements.map((evt, i) => {
        const score = evt.portee * MULT_DATA[evt.donnees] * MULT_STATUT[evt.statut];
        const attendu = niveauDuScore(score);
        const donne = severites[i];
        return { id: evt.id, portee: evt.portee, donnees: evt.donnees, statut: evt.statut, score, attendu, donne, correct: donne === attendu };
    });
    evenements.forEach((e, i) => { if (!e.correct) problemes.push({ code: 'triage', valeurs: { index: i + 1, attendu: e.attendu, donne: e.donne } }); });
    return { ok: !problemes.length, problemes, evenements };
}

function sql(defi, { positions }) {
    const n = defi.clauses.length;
    const attendu = defi.clauses.map((c) => c.position);
    const sorted = [...positions].sort((a, b) => a - b);
    const isPermutation = JSON.stringify(sorted) === JSON.stringify(Array.from({ length: n }, (_, i) => i + 1));
    const problemes = [];
    if (!isPermutation) {
        problemes.push({ code: 'permutation' });
    } else {
        positions.forEach((p, i) => { if (p !== attendu[i]) problemes.push({ code: 'ordre', valeurs: { index: i + 1, attendu: attendu[i] } }); });
    }
    const fragments = defi.clauses.map((c, i) => ({ texte: c.texte, position: positions[i], attendu: attendu[i], correct: positions[i] === attendu[i] }));
    return { ok: !problemes.length, problemes, fragments };
}

function reseau(defi, { ports }) {
    const problemes = [];
    const countByPort = defi.switches.map((_, j) => ports.filter((p) => p === j).length);
    defi.switches.forEach((sw, j) => {
        if (countByPort[j] > sw.capacite) problemes.push({ code: 'capacite', valeurs: { switchNom: sw.nom, max: sw.capacite, count: countByPort[j] } });
    });
    (defi.contraintes_same ?? []).forEach(([a, b]) => {
        if (ports[a] !== ports[b]) problemes.push({ code: 'sous_reseau', valeurs: { devA: defi.appareils[a].nom, devB: defi.appareils[b].nom } });
    });
    (defi.contraintes_diff ?? []).forEach(([a, b]) => {
        if (ports[a] === ports[b]) problemes.push({ code: 'isolation', valeurs: { devA: defi.appareils[a].nom, devB: defi.appareils[b].nom } });
    });
    const appareils = defi.appareils.map((app, i) => ({ ...app, port: ports[i], switchNom: defi.switches[ports[i]]?.nom ?? '?', portIdx: ports[i] }));
    return { ok: !problemes.length, problemes, appareils, countByPort };
}

const arrondi = (n) => Math.round(n * 100) / 100;

/** Ordinary execution: the first process whose arrival has passed starts immediately. */
function cpu(defi, { ordre }) {
    const problemes = []; let horloge = 0;
    const rendu = ordre.map((idx) => {
        const p = defi.processus[idx];
        const debut = Math.max(horloge, p.arrivee);
        const fin = debut + p.duree;
        horloge = fin;
        return { nom: p.nom, arrivee: p.arrivee, duree: p.duree, echeance: p.echeance, debut, fin,
           rotation: fin - p.arrivee, attente: debut - p.arrivee };
    });
    const moyenne = rendu.reduce((s, r) => s + r.rotation, 0) / rendu.length;
    rendu.forEach((r, i) => {
        if (r.fin > r.echeance) problemes.push({ code: 'echeance', valeurs: { nom: r.nom, index: i + 1, fin: r.fin, echeance: r.echeance } });
    });
    if (moyenne > defi.moyenneMax) problemes.push({ code: 'cpu_moyenne', valeurs: { moyenne: arrondi(moyenne), max: defi.moyenneMax } });
    return { ok: !problemes.length, problemes, rendu, moyenne: arrondi(moyenne), occupation: horloge };
}

/** Backlog selection: capacity, dependencies and minimum value are checked, never a fixed set. */
function sprint(defi, { choix }) {
    const problemes = [];
    const pris = defi.backlog.filter((_, i) => choix[i] === 1);
    const obligation = defi.backlog.map((it, i) => ({ it, i })).filter(({ it }) => it.obligatoire).filter(({ i }) => choix[i] !== 1);
    obligation.forEach(({ it }) => problemes.push({ code: 'obligatoire', valeurs: { nom: it.nom } }));
    const charge = pris.reduce((s, it) => s + it.charges, 0);
    const valeur = pris.reduce((s, it) => s + it.valeur, 0);
    if (charge > defi.capacite) problemes.push({ code: 'charge', valeurs: { charge, max: defi.capacite } });
    if (valeur < defi.valeurMin) problemes.push({ code: 'valeur', valeurs: { valeur, min: defi.valeurMin } });
    defi.backlog.forEach((it, i) => {
        if (choix[i] !== 1 || it.dependsOn == null) return;
        if (choix[it.dependsOn] !== 1) problemes.push({ code: 'dependance', valeurs: { nom: it.nom, avant: defi.backlog[it.dependsOn].nom } });
    });
    const lignes = defi.backlog.map((it, i) => ({ ...it, pris: choix[i] === 1 }));
    return { ok: !problemes.length, problemes, lignes, charge, valeur, nbPris: pris.length };
}

/** Linear cost model: every line is priced, then compared with budget, unit target and coverage. */
function budget(defi, { quantites }) {
    const problemes = [];
    const lignes = defi.lignes.map((l, i) => ({ ...
        l, quantite: quantites[i], cout: l.fixe + l.unite * quantites[i] }));
    const total = lignes.reduce((s, l) => s + l.cout, 0);
    if (total > defi.budget) problemes.push({ code: 'depassement', valeurs: { total, max: defi.budget } });
    const couverture = Math.min(...lignes.map((l) => l.quantite));
    if (couverture < defi.couvertureMin) problemes.push({ code: 'couverture', valeurs: { min: defi.couvertureMin, couverture } });
    if (total / couverture > defi.couteUnitaireMax) {
        problemes.push({ code: 'cout_unitaire', valeurs: { unitaire: arrondi(total / couverture), max: defi.couteUnitaireMax } });
    }
    return { ok: !problemes.length, problemes, lignes, total, couverture };
}

/** Returns objective feedback from canonical challenge data, or null for malformed input. */
export function evaluerSimulation(jeu, defi, reponse) {
    if (!jeu || !defi || !reponseValide(jeu.moteur, reponse)) return null;
    if (jeu.moteur === 'robot') return robot(defi, reponse);
    if (jeu.moteur === 'seuil') return seuil(defi, reponse);
    if (jeu.moteur === 'stock') return stock(defi, reponse);
    if (jeu.moteur === 'triage') return triage(defi, reponse);
    if (jeu.moteur === 'sql') return sql(defi, reponse);
    if (jeu.moteur === 'reseau') return reseau(defi, reponse);
    if (jeu.moteur === 'cpu') return cpu(defi, reponse);
    if (jeu.moteur === 'sprint') return sprint(defi, reponse);
    if (jeu.moteur === 'budget') return budget(defi, reponse);
    return null;
}

/** Converts form strings only when complete, leaving invalid/empty input distinguishable. */
export function reponseDuFormulaire(moteur, valeurs) {
    const nombre = (v) => /^\d{1,3}$/.test(String(v)) ? Number(v) : null;
    if (moteur === 'robot') return { programme: valeurs.programme ?? '' };
    if (moteur === 'seuil') return { seuil: nombre(valeurs.seuil) };
    if (moteur === 'triage') return { severites: [0, 1, 2, 3].map((i) => nombre(valeurs[`evt${i}`])) };
    if (moteur === 'sql') return { positions: [0, 1, 2, 3].map((i) => nombre(valeurs[`clause${i}`])) };
    if (moteur === 'reseau') return { ports: [0, 1, 2, 3].map((i) => nombre(valeurs[`device${i}`])) };
    if (moteur === 'cpu') return { ordre: [0, 1, 2, 3].map((i) => nombre(valeurs[`cpu${i}`])) };
    if (moteur === 'sprint') { const b = (v) => v === '1' ? 1 : v === '0' ? 0 : null; return { choix: [0, 1, 2, 3, 4].map((i) => b(valeurs[`item${i}`])) }; }
    if (moteur === 'budget') return { quantites: [0, 1, 2, 3].map((i) => nombre(valeurs[`poste${i}`])) };
    return { commandes: [0, 1, 2].map((i) => nombre(valeurs[`jour${i}`])) };
}
