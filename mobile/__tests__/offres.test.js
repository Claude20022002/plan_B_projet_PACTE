import { dateLisible, offreValide, versDateIso } from '../src/stage/offre';

// Partage d'une offre : la date saisie (jj/mm/aaaa) et les champs obligatoires avant publication
describe('formulaire d’offre', () => {
  it('convertit la date lisible et refuse les dates impossibles', () => {
    expect(versDateIso('15/12/2026')).toBe('2026-12-15');
    expect(versDateIso('1/2/2027')).toBe('2027-02-01');
    expect(versDateIso('  ')).toBeNull();
    expect(versDateIso('31/02/2027')).toBe(false);
    expect(versDateIso('2027-02-01')).toBe(false);
    expect(dateLisible('2026-12-15')).toBe('15/12/2026');
  });

  it('exige poste, entreprise et un lien https', () => {
    const base = { title: 'Stage data', company_name: 'OCP', apply_url: 'https://www.rekrute.com/offre-1.html', deadline: '' };
    expect(offreValide(base)).toBe(true);
    expect(offreValide({ ...base, title: ' ' })).toBe(false);
    expect(offreValide({ ...base, apply_url: 'http://exemple.ma/offre' })).toBe(false);
    expect(offreValide({ ...base, apply_url: 'javascript:alert(1)' })).toBe(false);
    expect(offreValide({ ...base, deadline: '32/01/2027' })).toBe(false);
  });
});
