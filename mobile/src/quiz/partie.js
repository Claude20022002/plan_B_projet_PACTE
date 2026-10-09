import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { addScreenshotListener } from 'expo-screen-capture';
import { io } from 'socket.io-client';

/**
 * Partie ClassQuiz jouée nativement dans l'application (lot anti-triche 4) : l'application parle
 * directement au serveur de jeu (socket.io), sans la page web de ClassQuiz.
 *
 * Protocole du joueur (voir classquiz/socket_server) : join_game { username, game_pin, hestim },
 * puis joined_game, start_game, set_question_number { question_index, question }, submit_answer,
 * everyone_answered, question_results [réponses de tous], final_results { index: [réponses] }.
 * time_sync doit être renvoyé (echo_time_sync) : le serveur en tire la latence du joueur.
 * Après une coupure (téléphone en veille), rejoin_game { old_sid, username, game_pin }.
 *
 * Anti-triche : le passage de l'application en arrière-plan pendant une question (plus d'une
 * seconde, avant d'avoir répondu) est signalé (hestim_sortie), de façon fiable (état de
 * l'application, pas celui d'une page web) ; une capture d'écran aussi (hestim_capture).
 */

const SORTIE_MIN_MS = 1000;
const ESSAIS_PSEUDO = 3;

// ── Logique pure (testée) ────────────────────────────────────────────────

/** Paramètres du lien donné par Planner (…/play?pin=…&name=…&hid=…), seulement sur l'origine de ClassQuiz. */
export const lireLienPartie = (url, origine) => {
  if (typeof url !== 'string' || !origine || !url.startsWith(`${origine}/`)) return null;
  // Lecture à la main : URLSearchParams est incomplet dans React Native
  const params = {};
  for (const morceau of (url.split('?')[1] ?? '').split('#')[0].split('&')) {
    const [cle, valeur = ''] = morceau.split('=');
    if (cle) params[decodeURIComponent(cle)] = decodeURIComponent(valeur.replace(/\+/g, ' '));
  }
  if (!/^\d{4,12}$/.test(params.pin ?? '')) return null;
  return { pin: params.pin, nom: (params.name || 'Joueur').trim().slice(0, 30), hid: params.hid || null };
};

/** Texte d'une question sans mise en forme HTML (ClassQuiz en autorise un peu). */
export const texteSimple = (html) =>
  String(html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();

/**
 * Positions d'origine des réponses dans l'ordre d'affichage : mélangées en mode « normal » (deux
 * voisins ne voient pas la bonne réponse au même endroit), inchangées en mode « kahoot » (formes
 * du projecteur).
 */
export const ordreAffichage = (nombre, mode, hasard = Math.random) => {
  const ordre = Array.from({ length: nombre }, (_, i) => i);
  if (mode !== 'normal') return ordre;
  for (let i = nombre - 1; i > 0; i -= 1) {
    const j = Math.floor(hasard() * (i + 1));
    [ordre[i], ordre[j]] = [ordre[j], ordre[i]];
  }
  return ordre;
};

/** Cases à cocher : positions d'origine cochées, croissantes et collées (format de ClassQuiz). */
export const reponseCases = (cochees) => [...new Set(cochees)].sort((a, b) => a - b).join('');

/** Mon résultat à une question parmi les réponses de tous les joueurs ; null si je n'ai pas répondu. */
export const monResultat = (reponses, pseudo) => {
  const r = (Array.isArray(reponses) ? reponses : []).find((x) => x?.username === pseudo);
  return r ? { juste: Boolean(r.right), points: Math.max(0, Math.round(Number(r.score) || 0)) } : null;
};

/** Bilan de fin de partie : mes points et mes bonnes réponses. */
export const monBilan = (resultats, pseudo) =>
  Object.values(resultats && typeof resultats === 'object' ? resultats : {}).reduce(
    (bilan, reponses) => {
      const r = monResultat(reponses, pseudo);
      return r ? { points: bilan.points + r.points, bonnes: bilan.bonnes + (r.juste ? 1 : 0) } : bilan;
    },
    { points: 0, bonnes: 0 }
  );

/** Durée d'une sortie à signaler, ou null (trop courte). */
export const dureeSortie = (debut, fin) => (debut !== null && fin - debut >= SORTIE_MIN_MS ? fin - debut : null);

// ── Connexion à la partie ────────────────────────────────────────────────

/**
 * État de la partie pour l'écran : etape = connexion | attente | question | envoyee | resultat |
 * diapo | fin | erreur ; avec la question en cours, le mode (normal ou kahoot), mon résultat à la
 * dernière question, mon bilan final, et `connecte` (faux pendant une coupure).
 */
export function usePartie({ origine, pin, nom, hid }) {
  const [etat, setEtat] = useState({ etape: 'connexion', connecte: false, mode: 'normal' });
  const socket = useRef(null);
  const pseudo = useRef(nom);
  const ancienSid = useRef(null);
  const enAttente = useRef([]);
  const enJeu = useRef(false);
  const question = useRef({ index: null, active: false });
  const sortieDepuis = useRef(null);

  const maj = useCallback((changements) => setEtat((e) => ({ ...e, ...changements })), []);

  // Envoi seulement une fois dans la partie (sinon gardé et envoyé au retour dans la partie)
  const envoyer = useCallback((evenement, donnees) => {
    if (socket.current?.connected && enJeu.current) socket.current.emit(evenement, donnees);
    else enAttente.current.push([evenement, donnees]);
  }, []);
  const viderAttente = () => {
    const file = enAttente.current;
    enAttente.current = [];
    for (const [evenement, donnees] of file) socket.current?.emit(evenement, donnees);
  };

  useEffect(() => {
    if (!origine || !pin) return undefined;
    let essaisPseudo = 0;
    const s = io(origine, { transports: ['websocket'], reconnection: true, reconnectionDelay: 1000, timeout: 10000 });
    socket.current = s;
    const rejoindre = () => s.emit('join_game', { username: pseudo.current, game_pin: pin, hestim: hid ?? undefined });

    s.on('connect', () => {
      maj({ connecte: true });
      enJeu.current = false;
      if (ancienSid.current) s.emit('rejoin_game', { old_sid: ancienSid.current, username: pseudo.current, game_pin: pin });
      else rejoindre();
    });
    s.on('disconnect', () => maj({ connecte: false }));
    s.on('time_sync', (donnees) => s.emit('echo_time_sync', donnees));
    s.on('joined_game', (donnees) => {
      const partie = Array.isArray(donnees) ? donnees[0] : donnees;
      ancienSid.current = s.id;
      enJeu.current = true;
      maj({ etape: 'attente', commencee: Boolean(partie?.started), mode: partie?.game_mode === 'kahoot' ? 'kahoot' : 'normal', pseudo: pseudo.current });
      viderAttente();
    });
    s.on('rejoined_game', () => {
      ancienSid.current = s.id;
      enJeu.current = true;
      viderAttente();
    });
    s.on('username_already_exists', () => {
      // Deux étudiants « Sara B. » : on suffixe le pseudo (le jeton HESTIM reste l'identité)
      essaisPseudo += 1;
      if (essaisPseudo > ESSAIS_PSEUDO) return maj({ etape: 'erreur', erreur: 'pseudo' });
      pseudo.current = `${nom} ${essaisPseudo + 1}`;
      return rejoindre();
    });
    s.on('game_not_found', () => maj({ etape: 'erreur', erreur: 'introuvable' }));
    s.on('game_already_started', () => maj({ etape: 'erreur', erreur: 'commencee' }));
    s.on('kick', () => {
      maj({ etape: 'erreur', erreur: 'exclu' });
      s.disconnect();
    });
    s.on('start_game', () => maj({ commencee: true }));
    s.on('set_question_number', (donnees) => {
      const q = donnees?.question;
      question.current = { index: donnees?.question_index ?? null, active: Boolean(q) };
      if (!q) return maj({ etape: 'diapo', question: null });
      const duree = Math.max(1, Number(q.time) || 20);
      return maj({ etape: 'question', question: { ...q, index: donnees.question_index }, finLe: Date.now() + duree * 1000, resultat: undefined, tard: false });
    });
    s.on('everyone_answered', () => {
      question.current.active = false;
      setEtat((e) => (e.etape === 'question' ? { ...e, etape: 'envoyee', tard: true } : e));
    });
    s.on('question_not_active', () => maj({ etape: 'envoyee', tard: true }));
    s.on('question_results', (reponses) => {
      question.current.active = false;
      maj({ etape: 'resultat', resultat: monResultat(reponses, pseudo.current) });
    });
    s.on('final_results', (resultats) => {
      question.current.active = false;
      maj({ etape: 'fin', bilan: monBilan(resultats, pseudo.current) });
    });

    // Sorties : application en arrière-plan pendant une question qui attend ma réponse
    const abonnement = AppState.addEventListener('change', (etatApp) => {
      if (etatApp !== 'active') {
        if (sortieDepuis.current === null && question.current.active) sortieDepuis.current = Date.now();
        return;
      }
      const duree = dureeSortie(sortieDepuis.current, Date.now());
      const index = question.current.index;
      sortieDepuis.current = null;
      if (duree !== null && index !== null) envoyer('hestim_sortie', { question_index: Number(index), duree_ms: duree });
    });

    // Captures d'écran : bloquées sur Android ; l'iPhone ne permet que de les détecter, on les signale
    const captures = addScreenshotListener(() => {
      if (question.current.active) envoyer('hestim_capture', { question_index: Number(question.current.index) });
    });

    return () => {
      captures.remove();
      abonnement.remove();
      s.removeAllListeners();
      s.disconnect();
      socket.current = null;
    };
  }, [origine, pin, nom, hid, maj, envoyer]);

  /** Envoie ma réponse (texte, nombre, positions de cases, ou ordre complet). */
  const repondre = useCallback(
    (reponse, ordre) => {
      if (!question.current.active) return;
      question.current.active = false;
      envoyer('submit_answer', {
        question_index: question.current.index,
        answer: ordre ? 'a' : String(reponse),
        ...(ordre ? { complex_answer: ordre.map((answer) => ({ answer })) } : {}),
      });
      maj({ etape: 'envoyee', tard: false });
    },
    [envoyer, maj]
  );

  /** Temps écoulé côté téléphone : plus de réponse possible. */
  const tempsEcoule = useCallback(() => {
    if (!question.current.active) return;
    question.current.active = false;
    maj({ etape: 'envoyee', tard: true });
  }, [maj]);

  return { ...etat, repondre, tempsEcoule };
}
