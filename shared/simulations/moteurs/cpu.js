/** Moteur « cpu » : ordonnancement non préemptif sous échéances et moyenne de rotation. */
import { entierEntre, arrondi, nombre } from './_aides.js';

export default {
    valider(cles, reponse) {
        if (cles.length !== 1 || !Array.isArray(reponse.ordre) || reponse.ordre.length !== 4) return false;
        if (!reponse.ordre.every((p) => entierEntre(p, 0, 3))) return false;
        return new Set(reponse.ordre).size === 4;
    },
    evaluer(defi, { ordre }) {
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
    },
    formulaire(valeurs) {
        return { ordre: [0, 1, 2, 3].map((i) => nombre(valeurs[`cpu${i}`])) };
    },
};
