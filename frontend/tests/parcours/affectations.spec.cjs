/**
 * Parcours « planifier une séance » (lot B-7 : un parcours avant de découper
 * pages/gestion/Affectations.jsx). L'administration planifie une séance qui percute une séance
 * existante (même salle, même enseignante, même heure) : le serveur refuse et dit pourquoi ; elle
 * corrige la date, la séance est créée ; elle la confirme, puis la supprime.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

test.setTimeout(90_000);

/** Choisit, dans une liste du formulaire, l'option dont le texte contient `texte`. */
const choisir = async (page, formulaire, liste, texte) => {
  await formulaire.getByRole("combobox", { name: liste }).click();
  await page.getByRole("option", { name: texte }).first().click();
};

test("séances : un conflit refusé et expliqué, la séance corrigée, confirmée puis supprimée", async ({ page }) => {
  const { admin, enseignante, motDePasse, seanceFixe } = lireDonnees();
  await seConnecter(page, { email: admin.email, motDePasse, role: "admin" });
  await page.goto("/gestion/affectations");

  await page.getByRole("button", { name: "Planifier une séance" }).click();
  const formulaire = page.getByRole("dialog", { name: "Nouvelle affectation" });
  await choisir(page, formulaire, "Cours", "Algorithmique");
  await choisir(page, formulaire, "Groupe", seanceFixe.autreGroupe);
  await choisir(page, formulaire, "Enseignant", `${enseignante.prenom} ${enseignante.nom}`);
  await choisir(page, formulaire, "Salle", seanceFixe.salle);
  await choisir(page, formulaire, "Créneau", /lundi 09:00/);
  await formulaire.getByLabel("Date").fill(seanceFixe.date);
  await formulaire.getByRole("button", { name: "Créer" }).click();

  // Même salle, même enseignante, même heure : refusé, avec les règles en cause
  const refus = page.getByRole("dialog", { name: "Séance impossible en l’état" });
  await expect(refus).toBeVisible();
  await expect(refus.getByText(/salle/i).first()).toBeVisible();
  await refus.getByRole("button", { name: "Corriger" }).click();
  await expect(refus).toBeHidden();

  // Le lundi suivant : la séance est créée
  await formulaire.getByLabel("Date").fill("2027-01-11");
  await formulaire.getByRole("button", { name: "Créer" }).click();
  await expect(page.getByText(/Séance planifiée avec succès/)).toBeVisible();
  const ligne = page.getByRole("row", { name: /Algorithmique/ }).filter({ hasText: "11/01/2027" }).filter({ hasText: seanceFixe.autreGroupe });
  await expect(ligne).toHaveCount(1);

  // Confirmée
  await ligne.getByRole("button", { name: "Modifier la séance Algorithmique du 11/01/2027" }).click();
  const edition = page.getByRole("dialog", { name: "Modifier l'affectation" });
  await choisir(page, edition, "Statut", "Confirmé");
  await edition.getByRole("button", { name: "Modifier" }).click();
  await expect(page.getByText(/Séance modifiée avec succès/)).toBeVisible();
  await expect(ligne).toContainText("Confirmé");

  // Supprimée, après confirmation
  await ligne.getByRole("button", { name: "Supprimer la séance Algorithmique du 11/01/2027" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Supprimer" }).click();
  await expect(ligne).toHaveCount(0);
});
