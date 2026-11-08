/** Relie la session partagée à React tout en gardant le client HTTP existant (cookie et CSRF). */
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { request, jeuxAPI } from '../services/api';
import { creerSession } from '../../../shared/simulations/session.js';

const api = {
    progression: jeuxAPI.getProgression,
    essayer: (code, id, reponse) => request(`/jeux/${encodeURIComponent(code)}/defis/${encodeURIComponent(id)}/essais`, { method: 'POST', body: { reponse } }),
};

/** Renvoie l'état et les actions de la session ; les réponses tardives sont ignorées après une navigation ou un démontage. */
export default function useSimulation(jeu) {
    const session = useMemo(() => creerSession(jeu, api), [jeu]);
    const etat = useSyncExternalStore(session.abonner, session.lire);
    useEffect(() => { session.charger(); return session.annuler; }, [session]);
    return { etat, session };
}
