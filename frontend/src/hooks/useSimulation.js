/** Connects the shared session to React while retaining the existing cookie/CSRF API client. */
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { request, jeuxAPI } from '../services/api';
import { creerSession } from '../../../shared/simulations/session.js';

const api = {
    progression: jeuxAPI.getProgression,
    essayer: (code, id, reponse) => request(`/jeux/${encodeURIComponent(code)}/defis/${encodeURIComponent(id)}/essais`, { method: 'POST', body: { reponse } }),
};

/** Returns session state and actions; late responses are discarded after navigation/unmount. */
export default function useSimulation(jeu) {
    const session = useMemo(() => creerSession(jeu, api), [jeu]);
    const etat = useSyncExternalStore(session.abonner, session.lire);
    useEffect(() => { session.charger(); return session.annuler; }, [session]);
    return { etat, session };
}
