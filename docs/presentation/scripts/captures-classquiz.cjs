// Captures du site ClassQuiz local (port 5180) en clair et en sombre, pour vérifier le thème HESTIM.
// Lancer d'abord : cd ../ClassQuiz/frontend && npx vite dev --port 5180 --strictPort
// Puis, depuis Git Bash (playwright vient du frontend de Planner) :
//   NP="$(cygpath -w "$PWD/frontend/node_modules")"; MSYS_NO_PATHCONV=1 NODE_PATH="$NP" node docs/presentation/scripts/captures-classquiz.cjs "/,/play,/account/login"
// Les images sont écrites dans le dossier courant.
const { chromium } = require('playwright');
const path = require('path');

const SORTIE = process.cwd();
const PAGES = (process.argv[2] || '/,/play,/account/login').split(',');

(async () => {
  const navigateur = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    const contexte = await navigateur.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: theme });
    const page = await contexte.newPage();
    await page.addInitScript((t) => {
      localStorage.setItem('theme', t);
      localStorage.setItem('language', 'fr');
    }, theme);
    for (const chemin of PAGES) {
      try {
        await page.goto(`http://localhost:5180${chemin}`, { waitUntil: 'networkidle', timeout: 60000 });
      } catch (e) {
        console.log(`${chemin} : ${e.message.split('\n')[0]}`);
      }
      await page.waitForTimeout(800);
      const nom = `cq-${theme}-${chemin.replace(/[^a-z0-9]+/gi, '_') || 'accueil'}.png`;
      await page.screenshot({ path: path.join(SORTIE, nom) });
      console.log(nom);
    }
    await contexte.close();
  }
  await navigateur.close();
})();
