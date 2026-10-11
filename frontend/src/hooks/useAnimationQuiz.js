import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { secondesRestantes } from '../utils/animationQuiz';

/**
 * Animation d'une partie de quiz en direct depuis Planner (quiz-ia.md, lot CQ-2). Planner parle
 * au serveur de jeu par son WebSocket, relayé sur sa propre adresse (`animation.socket`, en
 * général /socket.io/) : la CSP n'a pas à s'ouvrir à un autre domaine.
 *
 * Protocole de l'animateur (classquiz/socket_server) : register_as_admin { game_pin, game_id }
 * → registered_as_admin { game } (le quiz complet, réponses attendues comprises) ; player_joined ;
 * start_game ; set_question_number « n » → set_question_number { question_index } ;
 * show_solutions ; get_question_results → question_results [réponses] ; get_final_results →
 * final_results { index: [réponses] }.
 *
 * « player_answer » et « everyone_answered » sont envoyés par le serveur à toutes les parties à la
 * fois : ils ne servent ici que d'indice, jamais à clore une question. La question se clôt à la fin
 * du temps, ou quand l'enseignant le décide.
 */

const ETAT_INITIAL = { etape: 'connexion', erreur: null, quiz: null, joueurs: [], index: -1, debut: 0, reponsesRecues: 0, reponses: null, resultats: null };

/**
 * Rend { etat, question, diapositive, derniere, restant, demarrer, voirReponses, suivant }. `etat.etape` vaut connexion, attente,
 * question, resultats, fin ou erreur (`etat.erreur` : absente, dejaAnimee, connexion ou serveur).
 */
export default function useAnimationQuiz(animation) {
  const socket = useRef(null);
  const [etat, setEtat] = useState(ETAT_INITIAL);
  const [restant, setRestant] = useState(null);
  // Question déjà close : la fin du temps et le bouton ne demandent les réponses qu'une fois
  const close = useRef(-1);
  const maj = useCallback((changement) => setEtat((e) => ({ ...e, ...(typeof changement === 'function' ? changement(e) : changement) })), []);
  const pin = animation?.game_pin;
  const jeton = animation?.game_id;
  const chemin = animation?.socket || '/socket.io/';

  useEffect(() => {
    if (!pin || !jeton) {
      maj({ etape: 'erreur', erreur: 'absente' });
      return undefined;
    }
    const s = io({ path: chemin, transports: ['websocket'] });
    socket.current = s;
    s.on('connect', () => s.emit('register_as_admin', { game_pin: pin, game_id: jeton }));
    s.on('connect_error', () => maj((e) => (e.etape === 'connexion' ? { etape: 'erreur', erreur: 'connexion' } : {})));
    s.on('registered_as_admin', (d) => {
      let quiz = null;
      try {
        quiz = JSON.parse(d?.game ?? 'null');
      } catch {
        // Quiz illisible : la partie se joue quand même, sans le décompte des bonnes réponses
      }
      maj({ etape: 'attente', quiz });
    });
    s.on('already_registered_as_admin', () => maj({ etape: 'erreur', erreur: 'dejaAnimee' }));
    s.on('error', () => maj({ etape: 'erreur', erreur: 'serveur' }));
    s.on('player_joined', (j) => maj((e) => (j?.username && !e.joueurs.includes(j.username) ? { joueurs: [...e.joueurs, j.username] } : {})));
    s.on('set_question_number', (d) => maj({ etape: 'question', index: Number(d?.question_index), debut: Date.now(), reponsesRecues: 0, reponses: null }));
    s.on('player_answer', () => maj((e) => ({ reponsesRecues: Math.min(e.reponsesRecues + 1, e.joueurs.length) })));
    s.on('question_results', (liste) => maj({ etape: 'resultats', reponses: Array.isArray(liste) ? liste : [] }));
    s.on('final_results', (r) => maj({ etape: 'fin', resultats: r ?? {} }));
    return () => {
      s.removeAllListeners();
      s.disconnect();
      socket.current = null;
    };
  }, [pin, jeton, chemin, maj]);

  const emettre = useCallback((evenement, donnees) => socket.current?.emit(evenement, donnees), []);
  const question = etat.quiz?.questions?.[etat.index] ?? null;
  const diapositive = question?.type === 'SLIDE';
  const derniere = Boolean(etat.quiz?.questions) && etat.index + 1 >= etat.quiz.questions.length;

  /** Démarre la partie et ouvre la première question, d'un seul geste. */
  const demarrer = useCallback(() => {
    emettre('start_game', '');
    emettre('set_question_number', '0');
  }, [emettre]);

  /** Clôt la question en cours : bonne réponse envoyée aux téléphones, réponses comptées à l'écran. */
  const voirReponses = useCallback(() => {
    if (etat.etape !== 'question' || close.current === etat.index) return;
    close.current = etat.index;
    emettre('show_solutions', {});
    emettre('get_question_results', { game_id: jeton, question_number: etat.index });
  }, [emettre, etat.etape, etat.index, jeton]);

  /** Question suivante, ou classement final après la dernière. */
  const suivant = useCallback(() => {
    if (derniere) emettre('get_final_results', {});
    else emettre('set_question_number', String(etat.index + 1));
  }, [emettre, derniere, etat.index]);

  // Compte à rebours de la question ; à zéro, les réponses s'affichent sans geste de l'enseignant
  useEffect(() => {
    if (etat.etape !== 'question' || diapositive || !question) {
      setRestant(null);
      return undefined;
    }
    const tic = () => {
      const s = secondesRestantes(etat.debut, question.time);
      setRestant(s);
      if (s === 0) voirReponses();
    };
    tic();
    const minuterie = setInterval(tic, 250);
    return () => clearInterval(minuterie);
  }, [etat.etape, etat.debut, diapositive, question, voirReponses]);

  return { etat, question, diapositive, derniere, restant, demarrer, voirReponses, suivant };
}
