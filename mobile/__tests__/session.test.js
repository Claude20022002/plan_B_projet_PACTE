import { findSpotlight, groupByDay, relativeTo, toBoardSession, formatHeure } from '../../shared/session.js';
import { lineColor, tokens } from '../../shared/tokens.js';

/** Logique partagée avec le web (shared/), exécutée ici comme sur le téléphone. */

const seance = (id, date, debut, fin, statut = 'planifie') =>
  toBoardSession({ id_affectation: id, date_seance: date, statut, creneau: { heure_debut: debut, heure_fin: fin }, cours: { nom_cours: `Cours ${id}`, code_cours: `C${id}` }, salle: { nom_salle: 'G-101' } });

describe('séance en vedette', () => {
  const maintenant = new Date(2027, 2, 2, 10, 0);
  const s1 = seance(1, '2027-03-02', '09:00:00', '10:45:00');
  const s2 = seance(2, '2027-03-02', '11:00:00', '12:30:00');
  const annulee = seance(3, '2027-03-02', '13:30:00', '15:15:00', 'annule');

  test('celle en cours, sinon la prochaine non annulée', () => {
    expect(findSpotlight([s2, s1], maintenant)).toEqual({ session: s1, phase: 'live' });
    expect(findSpotlight([s2, annulee], new Date(2027, 2, 2, 12, 45))).toBeNull();
    expect(findSpotlight([annulee, s2], new Date(2027, 2, 2, 10, 50))).toEqual({ session: s2, phase: 'next' });
  });

  test('regroupe par jour dans l’ordre', () => {
    const lendemain = seance(4, '2027-03-03', '09:00:00', '10:45:00');
    expect(groupByDay([lendemain, s2, s1]).map((j) => [j.date, j.items.map((s) => s.id)])).toEqual([
      ['2027-03-02', [1, 2]],
      ['2027-03-03', [4]],
    ]);
  });

  test('heure sans secondes, salle et bâtiment déduits du code', () => {
    expect(formatHeure('09:05:00')).toBe('09:05');
    expect(s1).toMatchObject({ startLabel: '09:00', endLabel: '10:45', room: 'G-101', building: 'Gandhi', durationMin: 105 });
  });
});

describe('durée relative', () => {
  const maintenant = new Date(2027, 2, 2, 10, 0);
  test('avec Intl.RelativeTimeFormat', () => {
    expect(relativeTo(new Date(2027, 2, 2, 12, 0), 'fr', maintenant)).toMatch(/2 heures/);
  });

  test('repli sans Intl.RelativeTimeFormat (Hermes)', () => {
    const original = Intl.RelativeTimeFormat;
    Intl.RelativeTimeFormat = undefined;
    try {
      expect(relativeTo(new Date(2027, 2, 2, 10, 20), 'fr', maintenant)).toBe('dans 20 minutes');
      expect(relativeTo(new Date(2027, 2, 2, 12, 0), 'en', maintenant)).toBe('in 2 hours');
      expect(relativeTo(new Date(2027, 2, 1, 10, 0), 'fr', maintenant)).toBe('il y a 1 jour');
    } finally {
      Intl.RelativeTimeFormat = original;
    }
  });
});

describe('jetons partagés', () => {
  test('même couleur de ligne pour la même filière, jamais une couleur de statut', () => {
    expect(lineColor('IIIA')).toBe(lineColor('IIIA'));
    expect(tokens.lines).toContain(lineColor('IIIA'));
    expect(tokens.lines).not.toContain(tokens.board.delayed);
    expect(lineColor(null)).toBe(tokens.lineUnknown);
  });
});
