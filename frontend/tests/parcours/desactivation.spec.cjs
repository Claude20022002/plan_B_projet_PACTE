/**
 * Parcours « désactiver un compte » (plan multi-établissements, lot ME-17) : l'administration crée
 * un compte, le désactive avec un motif, le réactive, programme sa désactivation ; un enseignant qui
 * a des séances à venir ne se désactive qu'après le choix de les annuler (aperçu avant d'appliquer).
 * Le compte de l'essai est créé ici : les autres parcours partagent la base et gardent leurs comptes.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

test.setTimeout(120_000);

test("désactivation : motif, réactivation, programmation, et séances d'un enseignant à traiter", async ({ page }) => {
  const { admin, motDePasse, enseignante } = lireDonnees();
  await seConnecter(page, { email: admin.email, motDePasse, role: "admin" });
  await page.goto("/gestion/utilisateurs");

  // Un compte pour l'essai (administrateur : le formulaire n'en crée pas d'autre)
  await page.getByRole("button", { name: "Ajouter un administrateur" }).first().click();
  const formulaire = page.getByRole("dialog", { name: "Nouvel utilisateur" });
  await formulaire.getByLabel("Nom", { exact: true }).fill("Essai");
  await formulaire.getByLabel("Prénom").fill("Départ");
  await formulaire.getByLabel("Email").fill("depart.essai@exemple.hestim.test");
  await formulaire.getByRole("button", { name: "Créer" }).click();
  await expect(formulaire).toBeHidden({ timeout: 40_000 });
  const invitation = page.getByRole("dialog", { name: /Invitation de/ });
  if (await invitation.isVisible()) await invitation.getByRole("button", { name: "Fermer" }).click();

  const ligne = page.getByRole("row").filter({ hasText: "depart.essai@" });
  await expect(ligne).toContainText("Actif");

  // Désactivation immédiate : le bouton n'agit qu'avec un motif
  await ligne.getByRole("button", { name: "Désactiver Départ Essai" }).click();
  const fenetre = page.getByRole("dialog", { name: /Désactiver Départ Essai/ });
  const valider = fenetre.getByRole("button", { name: "Désactiver", exact: true });
  await expect(valider).toBeDisabled();
  await fenetre.getByRole("combobox", { name: /Motif/ }).click();
  await page.getByRole("option", { name: "Fin de contrat" }).click();
  await expect(valider).toBeEnabled();
  await valider.click();
  await expect(page.getByText("Départ Essai est désactivé.")).toBeVisible();
  await expect(ligne).toContainText("Désactivé");

  // Réactivation : rien n'est perdu
  await ligne.getByRole("button", { name: "Réactiver Départ Essai" }).click();
  await expect(page.getByText("Départ Essai est réactivé")).toBeVisible();
  await expect(ligne).toContainText("Actif");

  // Désactivation programmée dans dix jours, avec préavis par défaut
  const dansDixJours = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
  await ligne.getByRole("button", { name: "Désactiver Départ Essai" }).click();
  await fenetre.getByRole("combobox", { name: /Motif/ }).click();
  await page.getByRole("option", { name: "Départ", exact: true }).click();
  await fenetre.getByLabel("Date d’effet").fill(dansDixJours);
  await expect(fenetre.getByRole("checkbox", { name: /Prévenir la personne/ })).toBeChecked();
  await fenetre.getByRole("button", { name: "Programmer la désactivation" }).click();
  await expect(ligne).toContainText("Désactivation le");

  // Un enseignant avec des séances à venir : l'aperçu les montre, le choix d'annuler est obligatoire
  await page.getByRole("combobox", { name: /par page/i }).click();
  await page.getByRole("option", { name: "50" }).click();
  const prof = page.getByRole("row").filter({ hasText: enseignante.email });
  await prof.getByRole("button", { name: `Désactiver ${enseignante.prenom} ${enseignante.nom}` }).click();
  const fenetreProf = page.getByRole("dialog", { name: new RegExp(`Désactiver ${enseignante.prenom}`) });
  await fenetreProf.getByRole("combobox", { name: /Motif/ }).click();
  await page.getByRole("option", { name: "Autre" }).click();
  await expect(fenetreProf.getByText(/séances? à venir/).first()).toBeVisible();
  const validerProf = fenetreProf.getByRole("button", { name: "Désactiver", exact: true });
  await expect(validerProf).toBeDisabled();
  await fenetreProf.getByRole("checkbox", { name: /Annuler/ }).check();
  await expect(validerProf).toBeEnabled();
  // On s'arrête là : annuler les séances casserait les parcours suivants
  await fenetreProf.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(prof).toContainText("Actif");
});

test("désactivation d'un groupe entier : la fenêtre demande un motif et se ferme sans rien appliquer", async ({ page }) => {
  const { admin, motDePasse } = lireDonnees();
  await seConnecter(page, { email: admin.email, motDePasse, role: "admin" });
  await page.goto("/gestion/groupes");
  // Une filière et une année qui ont des groupes : on prend le premier bouton proposé
  const bouton = page.getByRole("button", { name: /Désactiver les comptes de/ }).first();
  await expect(bouton).toBeVisible({ timeout: 20_000 });
  await bouton.click();
  const fenetre = page.getByRole("dialog", { name: /Désactiver les étudiants de/ });
  await expect(fenetre.getByText(/Tous les étudiants inscrits dans ce groupe/)).toBeVisible();
  await expect(fenetre.getByRole("button", { name: "Désactiver", exact: true })).toBeDisabled();
  await fenetre.getByRole("button", { name: "Annuler" }).click();
  await expect(fenetre).toBeHidden();
});
