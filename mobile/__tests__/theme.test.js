jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { FAMILLES, MODES, THEMES, themePour } from '../src/theme';

/**
 * Thèmes : deux familles (Planner, StudyLib) en clair et en sombre, mêmes clés partout, et des
 * textes lisibles (contraste WCAG AA) sur chaque fond.
 */

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => {
  const [claire, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (claire + 0.05) / (sombre + 0.05);
};

describe('Thèmes', () => {
  test('la préférence choisit la famille et le mode ; automatique suit le téléphone', () => {
    expect(themePour({ famille: 'planner', mode: 'automatique' }, 'dark').id).toBe('planner-sombre');
    expect(themePour({ famille: 'planner', mode: 'automatique' }, 'light').id).toBe('planner-clair');
    // Apparence inconnue (ancien Android) : le panneau sombre d'origine
    expect(themePour({ famille: 'planner', mode: 'automatique' }, null).id).toBe('planner-sombre');
    expect(themePour({ famille: 'studylib', mode: 'clair' }, 'dark').id).toBe('studylib-clair');
    expect(themePour({ famille: 'studylib', mode: 'sombre' }, 'light').id).toBe('studylib-sombre');
    expect(themePour({ famille: 'inconnue', mode: 'clair' }, 'light').id).toBe('planner-clair');
  });

  test('quatre thèmes aux mêmes clés', () => {
    const ids = FAMILLES.flatMap((f) => ['clair', 'sombre'].map((m) => `${f}-${m}`));
    expect(Object.keys(THEMES).sort()).toEqual(ids.sort());
    expect(MODES).toEqual(['automatique', 'clair', 'sombre']);
    const reference = THEMES['planner-sombre'];
    for (const theme of Object.values(THEMES)) {
      for (const groupe of ['couleurs', 'polices', 'rayons', 'volet', 'statuts', 'scene']) {
        expect(Object.keys(theme[groupe]).sort()).toEqual(Object.keys(reference[groupe]).sort());
      }
    }
  });

  test.each(Object.keys(THEMES))('%s : textes lisibles (WCAG AA)', (id) => {
    const { couleurs: c, statuts, scene, volet } = THEMES[id];
    expect(contraste(c.lettre, c.fond)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(c.lettre, c.cellule)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(c.lettreAttenuee, c.fond)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(c.lettreAttenuee, c.cellule)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(c.surCadre, c.cadre)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(c.surAccent, c.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(volet.lettre, volet.fond)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(scene.texte, scene.ciel)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(scene.texteAttenue, scene.ciel)).toBeGreaterThanOrEqual(4.5);
    // Statuts écrits en petites capitales sur le sol et dans les cartes
    for (const couleur of [...Object.values(statuts), c.enCours, c.reporte, c.annule]) {
      expect(contraste(couleur, c.fond)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
