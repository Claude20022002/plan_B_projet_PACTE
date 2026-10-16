import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { planner } from '../api/client';
import { creerSession } from '../../../shared/simulations/session.js';

const api = {
    progression: (code) => planner(`/jeux/${encodeURIComponent(code)}/progression`),
    essayer: (code, id, reponse) => planner(`/jeux/${encodeURIComponent(code)}/defis/${encodeURIComponent(id)}/essais`, { method: 'POST', body: { reponse } }),
};

/** Native authentication stays in the existing HTTP client, outside shared game state. */
export default function useSimulation(jeu) {
    const session = useMemo(() => creerSession(jeu, api), [jeu]);
    const etat = useSyncExternalStore(session.abonner, session.lire);
    useEffect(() => { session.charger(); return session.annuler; }, [session]);
    return { etat, session };
}
