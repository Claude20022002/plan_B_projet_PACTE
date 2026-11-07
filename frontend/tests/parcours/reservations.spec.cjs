/**
 * Parcours « réservation d'une salle » (retours du 21 octobre, lot R-5) : seule l'administration
 * réserve, d'abord pour un événement. Le formulaire part sur « Événement », la salle est
 * obligatoire, et la réservation passe du premier coup, en soirée, hors des cours.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

test("réservation : l'administration réserve une salle pour un événement", async ({ page }) => {
  const { admin, motDePasse, seanceFixe } = lireDonnees();
  await seConnecter(page, { email: admin.email, motDePasse, role: "admin" });
  await page.goto("/reservations");
  await page.getByRole("button", { name: "Nouvelle réservation" }).first().click();

  const formulaire = page.getByRole("dialog", { name: "Nouvelle réservation" });
  await expect(formulaire.getByRole("combobox", { name: "Type" })).toHaveText("Événement");
  await formulaire.getByRole("textbox", { name: "Intitulé" }).fill("Conférence métiers");
  await formulaire.getByLabel("Date").fill("2027-01-05");
  await formulaire.getByLabel("Début").fill("18:00");
  await formulaire.getByLabel("Fin").fill("20:00");
  // Plus de « Sans salle » : une salle est choisie dans la liste
  await formulaire.getByRole("combobox", { name: "Salle" }).click();
  await expect(page.getByRole("option", { name: "Sans salle" })).toHaveCount(0);
  await page.getByRole("option", { name: new RegExp(seanceFixe.salle) }).click();
  await formulaire.getByRole("button", { name: "Réserver" }).click();

  await expect(formulaire).toBeHidden();
  await expect(page.getByText("Réservation enregistrée")).toBeVisible();
  // La liste s'ouvre sur « À venir », où la réservation figure
  await expect(page.getByRole("button", { name: "À venir", pressed: true })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "Conférence métiers" })).toContainText(seanceFixe.salle);
});
