/**
 * Parcours « appel par QR » (lot B-8), côté enseignant : Mes classes → Faire l'appel → Projeter le
 * QR code ; trois étudiants scannent (simulés comme l'application) et apparaissent à l'écran, sans
 * que les absents y figurent ; l'enseignante valide l'appel et voit le bilan.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter, scannerCommeMobile } = require("./outils.cjs");

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
