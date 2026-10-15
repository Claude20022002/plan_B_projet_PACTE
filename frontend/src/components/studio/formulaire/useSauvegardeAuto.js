import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { validerQuestion } from '../../../../../shared/quiz/studio/types.js';
import { studioAPI } from '../../../services/studioApi';
import { nettoyer } from './brouillon';

// Pause de frappe avant d'enregistrer
const DELAI_MS = 900;

/**
 * Enregistrement automatique d'une question, comme dans Google Forms : dès qu'elle est complète
 * (mêmes règles que le serveur) et qu'on s'arrête d'écrire, elle part au serveur ; une question
 * nouvelle est créée au premier enregistrement. Rend l'état à afficher :
 * « enregistree », « en_cours », « attente », « incomplete » (avec la raison) ou « erreur ».
 *
 * Le dernier corps envoyé est retenu : si le serveur rend la question un peu différente (espaces
 * retirés), on ne renvoie pas la même chose en boucle.
 */
export default function useSauvegardeAuto({ idQuestionnaire, brouillon, enregistree, onEnregistree }) {
  const corps = useMemo(() => JSON.stringify(nettoyer(brouillon)), [brouillon]);
  const verification = useMemo(() => validerQuestion(nettoyer(brouillon)), [brouillon]);
  const envoye = useRef(enregistree ? JSON.stringify(nettoyer(enregistree)) : null);
  const idQuestion = useRef(enregistree?.id_question ?? null);
  const dernier = useRef(brouillon);
  dernier.current = brouillon;
  const enCours = useRef(false);
  const relancer = useRef(false);
  const [etat, setEtat] = useState({ statut: 'repos', message: null });

  const sauver = useCallback(async () => {
    if (enCours.current) {
      relancer.current = true;
      return;
    }
    const aEnvoyer = nettoyer(dernier.current);
    const texte = JSON.stringify(aEnvoyer);
    if (texte === envoye.current || !validerQuestion(aEnvoyer).ok) return;
    enCours.current = true;
    setEtat({ statut: 'en_cours', message: null });
    try {
      const r = idQuestion.current ? await studioAPI.modifierQuestion(idQuestion.current, aEnvoyer) : await studioAPI.ajouterQuestion(idQuestionnaire, aEnvoyer);
      idQuestion.current = r.id_question;
      envoye.current = texte;
      onEnregistree(r);
      setEtat({ statut: 'repos', message: null });
    } catch (e) {
      setEtat({ statut: 'erreur', message: e.message });
    } finally {
      enCours.current = false;
      if (relancer.current) {
        relancer.current = false;
        sauver();
      }
    }
  }, [idQuestionnaire, onEnregistree]);

  // La carte se ferme (une autre question est ouverte) : ce qui est complet part sans attendre
  const sauverRef = useRef(sauver);
  sauverRef.current = sauver;
  useEffect(() => () => sauverRef.current(), []);

  const modifiee = corps !== envoye.current;
  useEffect(() => {
    if (!modifiee || !verification.ok) return undefined;
    const minuterie = setTimeout(sauver, DELAI_MS);
    return () => clearTimeout(minuterie);
  }, [corps, modifiee, verification.ok, sauver]);

  if (etat.statut === 'en_cours' || etat.statut === 'erreur') return { ...etat, sauver };
  if (!modifiee) return { statut: 'enregistree', message: null, sauver };
  if (!verification.ok) return { statut: 'incomplete', message: verification.raison, sauver };
  return { statut: 'attente', message: null, sauver };
}
