import { useCallback, useEffect, useRef, useState } from 'react';
import { passationAPI } from '../../../services/studioApi';

/**
 * État d'une épreuve du Studio quiz : la copie, la question affichée, l'enregistrement de chaque
 * réponse (regroupé sur 600 ms pour la saisie, retenté si le réseau tombe) et le temps restant,
 * calculé sur l'horloge du serveur (écart mesuré au chargement) pour qu'une montre de téléphone
 * déréglée ne donne ni plus ni moins de temps.
 */

const DELAI_ENREGISTREMENT = 600;
const NOUVEL_ESSAI = 5000;

export default function useEpreuve(idTentative) {
  const [copie, setCopie] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [index, setIndex] = useState(0);
  const [reponses, setReponses] = useState({});
  const [marquees, setMarquees] = useState([]);
  const [retours, setRetours] = useState({});
  const [verrouillees, setVerrouillees] = useState([]);
  const [enregistrement, setEnregistrement] = useState('ok');
  const [restant, setRestant] = useState(null);
  const ecart = useRef(0);
  const enAttente = useRef(new Map());
  const minuteur = useRef(null);
  const copieRef = useRef(null);

  const appliquer = useCallback((donnees, { garderIndex = false } = {}) => {
    copieRef.current = donnees;
    ecart.current = Date.now() - new Date(donnees.maintenant).getTime();
    setCopie(donnees);
    setReponses(donnees.reponses ?? {});
    setMarquees(donnees.marquees ?? []);
    setVerrouillees(donnees.verrouillees ?? []);
    setRetours(donnees.retours ?? {});
    if (!garderIndex) setIndex(donnees.session.navigation === 'lineaire' ? Math.min(donnees.position, Math.max(0, donnees.questions.length - 1)) : 0);
  }, []);

  const charger = useCallback(
    async (options) => {
      try {
        appliquer(await passationAPI.tentative(idTentative), options);
        setErreur(null);
      } catch (e) {
        setErreur(e.message);
      }
    },
    [idTentative, appliquer]
  );

  useEffect(() => {
    charger();
  }, [charger]);

  // Envoie les réponses en attente ; une erreur réseau les garde pour un nouvel essai
  const vider = useCallback(async () => {
    clearTimeout(minuteur.current);
    const lot = [...enAttente.current.entries()];
    if (!lot.length) return true;
    enAttente.current.clear();
    setEnregistrement('en_cours');
    try {
      for (const [idq, corps] of lot) await passationAPI.repondre(idTentative, idq, corps);
      setEnregistrement('ok');
      return true;
    } catch (e) {
      if (['TEMPS_ECOULE', 'COPIE_RENDUE'].includes(e.response?.data?.code)) {
        await charger({ garderIndex: true });
        return false;
      }
      for (const [idq, corps] of lot) if (!enAttente.current.has(idq)) enAttente.current.set(idq, corps);
      setEnregistrement('erreur');
      minuteur.current = setTimeout(vider, NOUVEL_ESSAI);
      return false;
    }
  }, [idTentative, charger]);

  const programmer = useCallback(
    (idq, corps) => {
      enAttente.current.set(idq, { ...(enAttente.current.get(idq) ?? {}), ...corps });
      clearTimeout(minuteur.current);
      minuteur.current = setTimeout(vider, DELAI_ENREGISTREMENT);
    },
    [vider]
  );

  const repondre = useCallback(
    (idq, valeur) => {
      setReponses((r) => {
        const suivantes = { ...r };
        if (valeur === null || valeur === undefined) delete suivantes[idq];
        else suivantes[idq] = valeur;
        return suivantes;
      });
      programmer(idq, { reponse: valeur ?? null });
    },
    [programmer]
  );

  const basculerMarque = useCallback(
    (idq) => {
      const marquee = !marquees.includes(idq);
      setMarquees(marquee ? [...marquees, idq] : marquees.filter((x) => x !== idq));
      programmer(idq, { marquee });
    },
    [marquees, programmer]
  );

  /** Valide la question (navigation linéaire, ou entraînement : la correction revient aussitôt). */
  const valider = useCallback(
    async (idq) => {
      enAttente.current.delete(idq);
      await vider();
      setEnregistrement('en_cours');
      try {
        const r = await passationAPI.repondre(idTentative, idq, { reponse: reponses[idq] ?? null, valider: true });
        setVerrouillees((v) => [...new Set([...v, idq])]);
        if (r.retour) setRetours((x) => ({ ...x, [idq]: r.retour }));
        setEnregistrement('ok');
        return true;
      } catch (e) {
        if (e.response?.data?.code === 'QUESTION_VALIDEE') {
          setVerrouillees((v) => [...new Set([...v, idq])]);
          setEnregistrement('ok');
          return true;
        }
        if (['TEMPS_ECOULE', 'COPIE_RENDUE'].includes(e.response?.data?.code)) await charger({ garderIndex: true });
        else setEnregistrement('erreur');
        return false;
      }
    },
    [idTentative, reponses, vider, charger]
  );

  const aller = useCallback(
    async (cible) => {
      const c = copieRef.current;
      if (!c || cible < 0 || cible >= c.questions.length) return;
      if (c.session.navigation === 'lineaire' && cible < index) return;
      await vider();
      setIndex(cible);
    },
    [index, vider]
  );

  const rendre = useCallback(async () => {
    await vider();
    try {
      appliquer(await passationAPI.rendre(idTentative), { garderIndex: true });
    } catch (e) {
      setErreur(e.message);
    }
  }, [idTentative, vider, appliquer]);

  // Temps restant, à la seconde ; à zéro, la copie relue est rendue d'office par le serveur
  useEffect(() => {
    if (!copie?.echeance || copie.statut !== 'en_cours') {
      setRestant(null);
      return undefined;
    }
    const echeance = new Date(copie.echeance).getTime();
    let fini = false;
    const tic = () => {
      const reste = echeance - (Date.now() - ecart.current);
      setRestant(Math.max(0, reste));
      if (reste <= 0 && !fini) {
        fini = true;
        vider().finally(() => setTimeout(() => charger({ garderIndex: true }), 1500));
      }
    };
    tic();
    const intervalle = setInterval(tic, 1000);
    return () => clearInterval(intervalle);
  }, [copie?.echeance, copie?.statut, vider, charger]);

  // Une réponse en attente part avant de quitter la page
  useEffect(() => {
    const avant = (e) => {
      if (enAttente.current.size) {
        vider();
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', avant);
    return () => window.removeEventListener('beforeunload', avant);
  }, [vider]);

  return { copie, erreur, index, reponses, marquees, retours, verrouillees, enregistrement, restant, repondre, basculerMarque, valider, aller, rendre, recharger: charger };
}
