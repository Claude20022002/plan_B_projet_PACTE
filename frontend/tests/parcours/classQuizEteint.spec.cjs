/**
 * Parcours « ClassQuiz éteint pour l'école » (plan multi-établissements, lot ME-0c, écrans ;
 * conception-me0c-ecrans-groupe-b.md). La réponse de GET /api/quiz/config est simulée, éteinte
 * (celle de #141 pour une école sans ClassQuiz) puis allumée (HESTIM). Deux lectures qui ne passent
 * pas par le moteur sont simulées aussi, pour avoir de quoi masquer : un quiz encore à importer dans
 * le Studio, une partie terminée dans l'historique de l'enseignante. Éteint, ces entrées et l'espace
 * « Quiz » disparaissent ; le Studio et les activités restent ouverts. Allumé, rien ne change.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

const CONFIG = {
  eteint: { actif: false, url: null, peutLancer: false },
  allume: { actif: true, url: "https://quiz.exemple.test", peutLancer: true },
};
const PARTIE = { id: "quiz-77", type: "quiz", id_partie: 77, titre: "Quiz réseaux du parcours", date: new Date().toISOString(), module: null, nb_joueurs: 5, moyenne: 60 };

const simuler = async (page, etat) => {
  await page.route("**/api/quiz/config", (route) => route.fulfill({ json: CONFIG[etat] }));
  await page.route(/\/api\/studio-quiz\/classquiz$/, (route) => route.fulfill({ json: { a_importer: 2 } }));
  await page.route("**/api/jeux/historique", (route) => route.fulfill({ json: { data: [PARTIE] } }));
};

for (const etat of ["eteint", "allume"]) {
  const visible = etat === "allume";

  test(`ClassQuiz ${etat} pour l'école : entrées ${visible ? "présentes" : "masquées"}, Studio et activités ouverts`, async ({ page }) => {
    test.setTimeout(120_000);
    const { enseignante, motDePasse } = lireDonnees();
    await simuler(page, etat);
    await seConnecter(page, { email: enseignante.email, motDePasse, role: "enseignant" });

    // Activités : la page s'ouvre ; la partie terminée n'est dans l'historique que si ClassQuiz est allumé
    await page.goto("/jeux");
    await expect(page.getByRole("heading", { name: "Historique" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(PARTIE.titre)).toHaveCount(visible ? 1 : 0);
    await expect(page.getByRole("button", { name: "Résultats" })).toHaveCount(visible ? 1 : 0);

    // Sélecteur d'espaces : l'espace « Quiz »
    await page.getByRole("button", { name: "Changer d’espace" }).first().click();
    const espaces = page.getByRole("navigation", { name: /^Espaces/ });
    await expect(espaces.getByRole("button").first()).toBeVisible();
    await expect(espaces.getByRole("button").filter({ hasText: "Quiz en direct pendant la séance" })).toHaveCount(visible ? 1 : 0);
    await page.keyboard.press("Escape");

    // Studio « Mes quiz » : toujours ouvert ; l'import depuis l'ancien service seulement si allumé
    await page.goto("/studio-quiz");
    await expect(page.getByRole("heading", { name: "Mes quiz", level: 1 })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Créer un quiz" }).first()).toBeVisible();
    await expect(page.getByText("Vous avez encore 2 quiz dans l’ancien service de quiz", { exact: false })).toHaveCount(visible ? 1 : 0);
  });
}
