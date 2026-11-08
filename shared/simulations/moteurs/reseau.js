/** Moteur « reseau » : placement d'appareils sur des switchs (capacité, VLAN, isolation). */
import { entierEntre, nombre } from './_aides.js';

export default {
    valider(cles, reponse) {
        return cles.length === 1 && Array.isArray(reponse.ports)
            && reponse.ports.length === 4 && reponse.ports.every((p) => entierEntre(p, 0, 2));
    },
    evaluer(defi, { ports }) {
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
    },
    formulaire(valeurs) {
        return { ports: [0, 1, 2, 3].map((i) => nombre(valeurs[`device${i}`])) };
    },
};
