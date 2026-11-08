/** Moteur « robot » : exécution bornée d'un programme de déplacements en grille. */
import { memeCase, mouvements } from './_aides.js';

export default {
    valider(cles, reponse) {
        return cles.length === 1 && typeof reponse.programme === 'string'
            && /^[NESW\s]{1,160}$/.test(reponse.programme) && reponse.programme.replace(/\s/g, '').length > 0
            && reponse.programme.replace(/\s/g, '').length <= 40;
    },
    evaluer(defi, { programme }) {
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
    },
    formulaire(valeurs) {
        return { programme: valeurs.programme ?? '' };
    },
};
