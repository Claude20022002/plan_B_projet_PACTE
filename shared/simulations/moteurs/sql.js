/** Moteur « sql » : remise en ordre des clauses (permutation + position canonique). */
import { entierEntre, nombre } from './_aides.js';

export default {
    valider(cles, reponse) {
        if (cles.length !== 1 || !Array.isArray(reponse.positions) || reponse.positions.length !== 4) return false;
        if (!reponse.positions.every((p) => entierEntre(p, 1, 4))) return false;
        return new Set(reponse.positions).size === 4;
    },
    evaluer(defi, { positions }) {
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
    },
    formulaire(valeurs) {
        return { positions: [0, 1, 2, 3].map((i) => nombre(valeurs[`clause${i}`])) };
    },
};
