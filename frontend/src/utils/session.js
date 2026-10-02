/**
 * Normalisation des séances (affectations API) en lignes de panneau.
 * Une seule source de vérité pour l'affichage : heure sans secondes, salle + bâtiment,
 * statut, filière, et position dans le temps (passée, en cours, prochaine).
 */

const pad = (n) => String(n).padStart(2, '0');

/** "09:00:00" → "09:00" */
export const formatHeure = (value) => {
  if (!value) return '';
  const [h, m] = String(value).split(':');
  return `${pad(Number(h))}:${pad(Number(m || 0))}`;
};

/** Date locale "YYYY-MM-DD" (sans décalage de fuseau, contrairement à toISOString) */
export const toLocalISODate = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const combine = (isoDate, heure) => {
  if (!isoDate || !heure) return null;
  const [y, mo, d] = String(isoDate).slice(0, 10).split('-').map(Number);
  const [h, mi] = String(heure).split(':').map(Number);
  return new Date(y, mo - 1, d, h, mi || 0);
};

/** Bâtiment lisible à partir du champ batiment ou du préfixe du code salle (G-, ST-) */
export const buildingOf = (salle) => {
  if (!salle) return '';
  if (salle.batiment) return salle.batiment;
  const code = String(salle.nom_salle || '');
  if (code.startsWith('ST-')) return 'Stendhal';
  if (code.startsWith('G-')) return 'Gandhi';
  return '';
};

const personName = (user) => (user ? [user.prenom, user.nom].filter(Boolean).join(' ') : '');

/**
 * @param {object} a - affectation renvoyée par l'API (avec cours, groupe, enseignant, salle, creneau)
 */
export const toBoardSession = (a) => {
  const start = combine(a.date_seance, a.creneau?.heure_debut);
  const end = combine(a.date_seance, a.creneau?.heure_fin);
  return {
    id: a.id_affectation,
    date: String(a.date_seance || '').slice(0, 10),
    start,
    end,
    startLabel: formatHeure(a.creneau?.heure_debut),
    endLabel: formatHeure(a.creneau?.heure_fin),
    durationMin: start && end ? Math.round((end - start) / 60000) : null,
    course: a.cours?.nom_cours || '',
    courseCode: a.cours?.code_cours || '',
    courseType: a.cours?.type_cours || '',
    group: a.groupe?.nom_groupe || '',
    teacher: personName(a.enseignant),
    teacherId: a.id_user_enseignant,
    room: a.salle?.nom_salle || '',
    building: buildingOf(a.salle),
    floor: a.salle?.etage ?? null,
    roomType: a.salle?.type_salle || '',
    status: a.statut || 'planifie',
    lineKey: a.cours?.id_filiere ?? a.groupe?.id_filiere ?? a.groupe?.nom_groupe,
    raw: a,
  };
};

/** Tri chronologique */
export const byStart = (x, y) => (x.start?.getTime() ?? 0) - (y.start?.getTime() ?? 0);

/**
 * Séance « en vedette » : celle en cours, sinon la prochaine non annulée.
 * Une seule à la fois (la couleur réservée ne s'applique qu'à elle).
 */
export const findSpotlight = (sessions, now = new Date()) => {
  const active = sessions.filter((s) => s.status !== 'annule' && s.end && s.end > now);
  const live = active.find((s) => s.start <= now && s.end > now);
  if (live) return { session: live, phase: 'live' };
  const next = active.filter((s) => s.start > now).sort(byStart)[0];
  return next ? { session: next, phase: 'next' } : null;
};

/**
 * Durée relative localisée : « dans 2 heures », « in 3 days ».
 * @param {Date} target
 * @param {string} language - 'fr' | 'en'
 */
export const relativeTo = (target, language, now = new Date()) => {
  if (!target) return '';
  const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  const diffMin = Math.round((target - now) / 60000);
  const abs = Math.abs(diffMin);
  if (abs < 60) return rtf.format(diffMin, 'minute');
  if (abs < 60 * 24) return rtf.format(Math.round(diffMin / 60), 'hour');
  return rtf.format(Math.round(diffMin / (60 * 24)), 'day');
};

/** « lundi 5 octobre » / « Monday, October 5 » */
export const formatDayLabel = (isoDate, language, options = {}) => {
  const [y, m, d] = String(isoDate).split('-').map(Number);
  return new Intl.DateTimeFormat(language, { weekday: 'long', day: 'numeric', month: 'long', ...options }).format(
    new Date(y, m - 1, d)
  );
};

/** Regroupe les séances par jour, dans l'ordre chronologique */
export const groupByDay = (sessions) => {
  const map = new Map();
  [...sessions].sort(byStart).forEach((s) => {
    if (!map.has(s.date)) map.set(s.date, []);
    map.get(s.date).push(s);
  });
  return [...map.entries()].map(([date, items]) => ({ date, items }));
};
