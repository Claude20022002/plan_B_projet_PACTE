const { test, expect } = require('@playwright/test');
let JEUX, evaluerSimulation;
test.beforeAll(async () => {
    ({ JEUX } = await import('../../../shared/jeux/catalogue.js'));
    ({ evaluerSimulation } = await import('../../../shared/simulations/moteur.js'));
});

/** Mocks transport/persistence only. These tests do not claim real API authentication coverage. */
async function preparer(page, { langue = 'en', refuse = false } = {}) {
    await page.addInitScript((lng) => localStorage.setItem('hp.lang', lng), langue);
    const saved = new Map(); const erreurs = []; const options = { echec: false };
    page.on('pageerror', (e) => erreurs.push(e.message));
    await page.route('**/api/**', async (route) => {
        const path = new URL(route.request().url()).pathname.slice(4);
        const json = (body, status = 200) => route.fulfill({ status, json: body });
        if (path === '/auth/me') return json({ user: { id_user: 5, role: 'enseignant', prenom: 'Test', nom: 'Teacher' } });
        if (path === '/auth/csrf-token') return json({ csrfToken: 'ui-test' });
        if (path === '/jeux') return json({ profil: {}, modules: [], jeux: JEUX.map((j) => ({ ...j, progression: { total: j.defis.length, reussis: 0, points: 0 } })) });
        const progression = path.match(/^\/jeux\/([^/]+)\/progression$/);
        if (progression) return json({ defis: [], points: 0 }, refuse ? 403 : 200);
        const essai = path.match(/^\/jeux\/([^/]+)\/defis\/([^/]+)\/essais$/);
        if (essai) {
            if (options.echec) return route.abort();
            const jeu = JEUX.find((j) => j.code === essai[1]); const defi = jeu.defis.find((d) => d.id === essai[2]);
            const r = evaluerSimulation(jeu, defi, route.request().postDataJSON().reponse);
            const cree = r.ok && !saved.has(defi.id);
            if (r.ok) saved.set(defi.id, defi.xp);
            return json({ ...r, enregistre: r.ok, cree, points: defi.xp, progression: { points: [...saved.values()].reduce((s, p) => s + p, 0) } });
        }
        return json({ data: [], notifications: [], count: 0 });
    });
    return { erreurs, options };
}

for (const [code, reponses] of [
    ['robot-route', ['EEESSS', 'SSSSEEEE', 'SSSSEEENNNEESSSS']],
    ['threshold-lab', ['50', '45', '35']],
    ['stock-pilot', [['0', '5', '3'], ['5', '4', '0'], ['6', '3', '0']]],
    ['tri-cyber', [['1', '4', '2', '3'], ['3', '2', '1', '4'], ['2', '4', '1', '3']]],
    ['quete-sql', [['2', '3', '1', '4'], ['4', '1', '3', '2'], ['4', '1', '2', '3']]],
    ['topo-reseau', [['0', '0', '1', '2'], ['0', '0', '1', '2'], ['2', '1', '0', '1']]],
    ['cpu-process', [['1', '0', '2', '3'], ['2', '1', '3', '0'], ['2', '1', '3', '0']]],
    ['sprint-agile', [['1', '1', '1', '0', '0'], ['1', '1', '1', '0', '0'], ['1', '1', '1', '0', '0']]],
    ['budget-erp', [['2', '2', '2', '2'], ['3', '3', '3', '3'], ['4', '4', '4', '4']]],
]) {
    const etiquettes = {
        'stock-pilot': (i) => `Day ${i + 1} order`,
        'tri-cyber': (i) => `Incident ${i + 1}`,
        'quete-sql': (i) => `Fragment ${i + 1}`,
        'topo-reseau': (i) => ['Poste Admin', 'Serveur Web', 'Switch Core', 'AP WiFi'][i],
        'cpu-process': (i) => `Slot ${i + 1}`,
        'sprint-agile': (i) => `Item ${i + 1}`,
        'budget-erp': (i) => `Line ${i + 1}`,
    };
    const etiquette = etiquettes[code];
    test(`${code}: all levels, feedback, replay, keyboard input, and responsive layout`, async ({ page }, info) => {
        const { erreurs } = await preparer(page);
        await page.goto(`/jeux/${code}`);
        for (const [i, reponse] of reponses.entries()) {
            if (code === 'robot-route') await page.getByLabel('Movement program', { exact: true }).fill(reponse);
            else if (code === 'threshold-lab') await page.getByLabel('Detection threshold').fill(reponse);
            else for (const [j, v] of reponse.entries()) await page.getByLabel(etiquette(j)).fill(v);
            await page.getByRole('button', { name: 'Show a hint' }).click();
            await page.getByRole('button', { name: 'Test my plan' }).focus();
            await page.keyboard.press('Enter');
            await expect(page.getByText('Objective reached.', { exact: true })).toBeVisible();
            await expect(page.getByText(`Mastery saved · ${100 + 50 * i} points.`)).toBeVisible();
            await page.getByRole('button', { name: 'Test my plan' }).click();
            await expect(page.getByText('Already completed: no additional points.')).toBeVisible();
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
            const contrastes = await page.locator('th[scope="col"]').evaluateAll((cells) => {
                const luminance = (rgb) => rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => v / 255)
                    .map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
                    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
                return cells.map((cell) => {
                    const style = getComputedStyle(cell); const a = luminance(style.color); const b = luminance(style.backgroundColor);
                    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
                });
            });
            expect(contrastes.every((ratio) => ratio >= 4.5)).toBe(true);
            if (i === 0) await page.screenshot({ path: info.outputPath(`${code}.png`), fullPage: true });
            if (i < 2) await page.getByRole('button', { name: 'Next challenge' }).click();
        }
        await expect(page.getByText('3/3 challenges completed · 450 points')).toBeVisible();
        expect(erreurs).toEqual([]);
    });
}

test('catalog renders original attribution, new games, and the existing terminal route', async ({ page }) => {
    const { erreurs } = await preparer(page);
    await page.goto('/jeux');
    await expect(page.getByText('Robot Route', { exact: true })).toBeVisible();
    await expect(page.getByText('Threshold Lab', { exact: true })).toBeVisible();
    await expect(page.getByText('Stock Pilot', { exact: true })).toBeVisible();
    await expect(page.getByText('Cyber Triage', { exact: true })).toBeVisible();
    await expect(page.getByText('Perfect Query', { exact: true })).toBeVisible();
    await expect(page.getByText('Network Nodes', { exact: true })).toBeVisible();
    await expect(page.getByText('CPU Scheduler', { exact: true })).toBeVisible();
    await expect(page.getByText('Agile Sprint', { exact: true })).toBeVisible();
    await expect(page.getByText('ERP Budget', { exact: true })).toBeVisible();
    await expect(page.getByText(/Bruno Zapico/)).toBeVisible();
    await page.goto('/jeux/terminal-linux');
    await expect(page.locator('input').last()).toBeVisible();
    expect(erreurs).toEqual([]);
});

test('French, validation, failed save, retry, and restart', async ({ page }) => {
    const { erreurs, options } = await preparer(page, { langue: 'fr' });
    await page.goto('/jeux/robot-route');
    await page.getByRole('button', { name: 'Tester mon plan' }).click();
    await expect(page.getByText(/Complétez les champs/)).toBeVisible();
    await page.getByLabel('Programme de déplacements', { exact: true }).fill('N');
    await page.getByRole('button', { name: 'Tester mon plan' }).click();
    await expect(page.getByText(/obstacle ou sortie de grille/)).toBeVisible();
    await page.getByLabel('Programme de déplacements', { exact: true }).fill('EEESSS');
    options.echec = true;
    await page.getByRole('button', { name: 'Tester mon plan' }).click();
    await expect(page.getByText(/Résultat local uniquement/)).toBeVisible();
    await expect(page.getByText('0/3 défis réussis · 0 points')).toBeVisible();
    options.echec = false;
    await page.getByRole('button', { name: 'Tester mon plan' }).click();
    await expect(page.getByText(/Réussite enregistrée/)).toBeVisible();
    await page.getByRole('button', { name: 'Recommencer' }).click();
    await expect(page.getByLabel('Programme de déplacements', { exact: true })).toHaveValue('');
    expect(erreurs).toEqual([]);
});

test('denied access and unknown game never expose a playable form', async ({ page }) => {
    await preparer(page, { refuse: true });
    await page.goto('/jeux/robot-route');
    await expect(page.getByText(/Game unavailable for this account/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Test my plan' })).toHaveCount(0);
    await page.goto('/jeux/unknown');
    await expect(page.getByText(/Game unavailable for this account/)).toBeVisible();
});
