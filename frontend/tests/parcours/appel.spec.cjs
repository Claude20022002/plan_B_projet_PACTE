/**
 * Parcours « appel par QR » (lot B-8), côté enseignant : Mes classes → Faire l'appel → Projeter le
 * QR code ; trois étudiants scannent (simulés comme l'application) et apparaissent à l'écran, sans
 * que les absents y figurent ; l'enseignante valide l'appel et voit le bilan.
 *
 * Avant lui, l'heure de l'école : elle est à UTC+0 (shared/dates.js), mais un navigateur dont la base
 * de fuseaux est ancienne met encore le Maroc à UTC+1. Entre 23 h et minuit, un calcul fait dans le
 * fuseau du navigateur se trompait d'heure et de jour : faux rappel « l'appel n'a pas été fait » (et
 * un second bouton « Faire l'appel »), appel du jour désactivé dans l'espace de la classe. Ce test
 * reproduit ce navigateur à 23 h 30, à toute heure ; il passe avant que l'appel du jour soit validé.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter, scannerCommeMobile } = require("./outils.cjs");

test("entre 23 h et minuit : pas de faux rappel, l'appel du jour reste ouvrable", async ({ browser }) => {
  test.setTimeout(120_000);
  const { enseignante, motDePasse } = lireDonnees();
  // Le Maroc tel que le voit le navigateur (UTC+1) ; horloge de la page arrêtée à 23 h 30 de l'école,
  // le jour de la séance du jour (date de l'école : UTC+0, comme shared/dates.js)
  const contexte = await browser.newContext({ timezoneId: "Africa/Casablanca" });
  const page = await contexte.newPage();
  await page.clock.setFixedTime(new Date(`${new Date().toISOString().slice(0, 10)}T23:30:00Z`));
  await seConnecter(page, { email: enseignante.email, motDePasse, role: "enseignant" });

  // La séance du jour finit à 23 h 55 : pas encore de rappel, un seul « Faire l'appel »
  await page.goto("/mes-classes");
  await expect(page.getByRole("heading", { name: /Algorithmique/, level: 2 }).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Faire l’appel" })).toHaveCount(1);

  // Espace de la classe : l'appel du jour s'ouvre encore
  await page.getByRole("button", { name: "Supports de cours" }).first().click();
  await page.getByRole("tab", { name: "Appel" }).click();
  await expect(page.getByRole("button", { name: "Appel à faire" }).first()).toBeEnabled({ timeout: 20_000 });
  await contexte.close();
});

test("appel par QR : projection, scans, validation", async ({ page, request }) => {
  const { enseignante, etudiants, motDePasse, seance } = lireDonnees();
  await seConnecter(page, { email: enseignante.email, motDePasse, role: "enseignant" });

  // La classe en cours est en tête de Mes classes, avec l'appel à faire
  await page.goto("/mes-classes");
  await page.getByRole("button", { name: "Faire l’appel" }).click();
  await expect(page).toHaveURL(new RegExp(`/appel/${seance.id}$`));

  // La projection s'ouvre dans une fenêtre à part, à glisser sur l'écran de la salle
  const [projection] = await Promise.all([page.waitForEvent("popup"), page.getByRole("link", { name: "Projeter le QR code" }).click()]);
  // Premier affichage plus lent : le site de développement compile la page à la demande
  await expect(projection.getByRole("img", { name: /QR code de l’appel/ })).toBeVisible({ timeout: 20_000 });
  await expect(projection.getByText("0 / 8 présents")).toBeVisible();

  // Trois étudiants scannent le code affiché
  const { code } = await projection.evaluate((id) => fetch(`/api/presences/seances/${id}/code`, { credentials: "include" }).then((r) => r.json()), seance.id);
  for (const [i, etudiant] of etudiants.slice(0, 3).entries()) {
    const statut = await scannerCommeMobile(request, { email: etudiant.email, motDePasse, code, appareil: `telephone-parcours-${i + 1}` });
    expect(statut, `scan de ${etudiant.email}`).toBe(200);
  }

  // Chacun voit son nom apparaître ; les absents ne sont jamais projetés
  await expect(projection.getByText("3 / 8 présents")).toBeVisible({ timeout: 10_000 });
  for (const etudiant of etudiants.slice(0, 3)) await expect(projection.getByText(`${etudiant.prenom} ${etudiant.nom}`)).toBeVisible();
  await expect(projection.getByText(etudiants[7].nom)).toHaveCount(0);

  // Validation de l'appel, puis bilan
  await projection.getByRole("button", { name: "Valider l’appel" }).click();
  await projection.getByRole("dialog").getByRole("button", { name: "Valider l’appel" }).click();
  await expect(projection.getByText("APPEL TERMINÉ", { exact: true })).toBeVisible();
  await expect(projection.getByText("3 présents · 5 absents")).toBeVisible();
});
