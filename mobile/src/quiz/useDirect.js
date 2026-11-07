import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { lireDirect, rejoindreDirect, repondreDirect } from '../api/donnees';
import { RELECTURE_MS, ordreDeDepart, secondesRestantes } from './direct';

/**
 * Partie de quiz en direct vue par le joueur (lot SC-1c) : la rejoindre, relire son état chaque
 * seconde tant que l'application est au premier plan, compter le temps d'après l'heure du serveur
 * et envoyer la réponse. Rend { vue, restant, valeur, changer, envoyer, envoi, erreur, termine }.
 * `messageErreur` : texte d'une erreur sans message.
 */
export default function useDirect(id, messageErreur) {
  const [vue, setVue] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [termine, setTermine] = useState(false);
  const [valeur, setValeur] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const version = useRef(undefined);
  const index = useRef(null);
  // Écart entre l'heure du serveur et celle du téléphone ; mis à jour seulement s'il bouge vraiment
  const [decalage, setDecalage] = useState(0);
  const enCours = useRef(false);
  const actif = useRef(true);

  const recevoir = (v) => {
    if (v.maintenant_ms) {
      const ecart = v.maintenant_ms - Date.now();
      setDecalage((d) => (Math.abs(d - ecart) > 250 ? ecart : d));
    }
    if (v.inchange) return;
    version.current = v.version;
    // Nouvelle question : la réponse repart de zéro (une remise en ordre, d'un ordre mélangé)
    if (index.current !== v.index) setValeur(v.question?.type === 'ordre' ? ordreDeDepart(v.question.elements) : null);
    index.current = v.index;
    setVue(v);
  };

  const lire = useCallback(async () => {
    // Une lecture lente ne s'empile pas sur la suivante
    if (enCours.current) return;
    enCours.current = true;
    try {
      const v = version.current === undefined ? await rejoindreDirect(id) : await lireDirect(id, version.current);
      if (!actif.current) return;
      recevoir(v);
      setErreur(null);
    } catch (e) {
      if (!actif.current) return;
      const code = e?.code;
      if (code === 'PAS_REJOINT') version.current = undefined;
      else if (code === 'DIRECT_TERMINE') setTermine(true);
      else setErreur(e?.message || messageErreur);
    } finally {
      enCours.current = false;
    }
  }, [id, messageErreur]);

  const fini = termine || vue?.etape === 'termine';
  useEffect(() => {
    actif.current = true;
    if (fini) return undefined;
    lire();
    const minuterie = setInterval(() => AppState.currentState === 'active' && lire(), RELECTURE_MS);
    return () => {
      actif.current = false;
      clearInterval(minuterie);
    };
  }, [lire, fini]);

  // Le chrono avance entre deux relectures
  const enQuestion = vue?.etape === 'question';
  useEffect(() => {
    if (!enQuestion) return undefined;
    const minuterie = setInterval(() => setMaintenant(Date.now()), 250);
    return () => clearInterval(minuterie);
  }, [enQuestion]);

  const envoyer = async (reponse) => {
    setEnvoi(true);
    try {
      await repondreDirect(id, vue.index, reponse);
      setVue((v) => ({ ...v, repondu: true }));
    } catch (e) {
      setErreur(e?.message || messageErreur);
    } finally {
      setEnvoi(false);
    }
  };

  return { vue, restant: secondesRestantes(vue, decalage, maintenant), valeur, changer: setValeur, envoyer, envoi, erreur, termine };
}
