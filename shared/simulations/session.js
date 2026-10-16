/** Framework-independent session store shared by React web and React Native. */
import { evaluerSimulation, reponseDuFormulaire } from './moteur.js';

/** Creates an observable session; injected requests retain each platform's authentication. */
export function creerSession(jeu, api) {
    let etat = { statut: 'chargement', defiId: jeu.defis[0].id, valeurs: {}, resultat: null, reussis: [], points: 0, occupe: false, erreur: null, indice: false };
    let version = 0;
    const abonnes = new Set();
    const publier = (patch) => {
        etat = { ...etat, ...patch };
        abonnes.forEach((fn) => fn());
    };
    return {
        lire: () => etat,
        abonner: (fn) => { abonnes.add(fn); return () => abonnes.delete(fn); },
        annuler: () => { version++; },
        charger: async () => {
            const requete = ++version;
            publier({ statut: 'chargement', erreur: null, occupe: false });
            try {
                const p = await api.progression(jeu.code);
                if (requete !== version) return;
                publier({ statut: 'pret', reussis: p.defis.map((d) => d.id), points: p.points });
            } catch (erreur) {
                if (requete === version) publier({ statut: [401, 403].includes(erreur.status ?? erreur.statut) ? 'interdit' : 'erreur' });
            }
        },
        choisir: (id) => {
            if (!jeu.defis.some((d) => d.id === id)) return;
            version++;
            publier({ defiId: id, valeurs: {}, resultat: null, erreur: null, indice: false, occupe: false });
        },
        saisir: (champ, valeur) => {
            if (etat.occupe) return;
            publier({ valeurs: { ...etat.valeurs, [champ]: valeur }, resultat: null, erreur: null });
        },
        aider: () => publier({ indice: true }),
        essayer: async () => {
            if (etat.statut !== 'pret' || etat.occupe) return;
            const defi = jeu.defis.find((d) => d.id === etat.defiId);
            const reponse = reponseDuFormulaire(jeu.moteur, etat.valeurs);
            const local = evaluerSimulation(jeu, defi, reponse);
            if (!local) { publier({ erreur: 'saisie', resultat: null }); return; }
            const requete = ++version;
            publier({ occupe: true, erreur: null, resultat: null });
            try {
                const resultat = await api.essayer(jeu.code, defi.id, reponse);
                if (requete !== version) return;
                publier({
                    resultat, occupe: false,
                    ...(resultat.enregistre ? { reussis: [...new Set([...etat.reussis, defi.id])], points: resultat.progression.points } : {}),
                });
            } catch (erreur) {
                if (requete !== version) return;
                const refuse = [401, 403, 404].includes(erreur.status ?? erreur.statut);
                publier({ occupe: false, erreur: refuse ? 'acces' : 'enregistrement', resultat: refuse ? null : { ...local, enregistre: false } });
            }
        },
    };
}
