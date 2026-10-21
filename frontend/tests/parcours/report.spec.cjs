/**
 * Parcours « demande de report puis décision » (lot B-8, repris après la recette du 20 octobre,
 * B-2, puis la décision du 21 octobre : l'enseignant confirme) : l'enseignante choisit un créneau
 * libre de sa séance du lundi 4 janvier 2027 ; l'administration le valide, l'enseignante
 * l'accepte. Puis une seconde demande : l'administration renonce à un refus (confirmation) et
 * valide un autre créneau libre ; l'enseignante en propose un troisième, retenu aussitôt.
 * Enfin, un refus avec sa raison, que l'enseignante lit dans sa liste.
 * Les créneaux proposés ont déjà passé les règles de planification, qui ont leurs propres tests.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

// Deux connexions et deux écrans, souvent juste après les générations qui chargent la machine
test.setTimeout(120_000);
test.describe.configure({ mode: "serial" });

/**
 * Envoie une demande de report : la séance (sa date, ou la première de la liste sans `seance`),
 * un créneau libre entre `jour` et `jusquau` (le même jour par défaut), le motif.
 */
const demander = async (prof, { seance, jour, jusquau = jour, motif }) => {
  await prof.goto("/demandes-report");
  await prof.getByRole("button", { name: "Nouvelle demande" }).click();
  const formulaire = prof.getByRole("dialog");
  const liste = formulaire.getByRole("combobox", { name: "Séance" });
  const option = seance ? liste.locator("option", { hasText: seance }) : liste.locator("option:not([value=''])");
  await liste.selectOption({ label: (await option.first().innerText()).trim() });
  // Les créneaux libres de la séance, sur les jours voulus
  await formulaire.getByLabel("Du", { exact: true }).fill(jour);
  await formulaire.getByLabel("Au", { exact: true }).fill(jusquau);
  await formulaire.getByRole("button", { name: "Chercher" }).click();
  const creneaux = formulaire.getByRole("list", { name: "Créneaux libres" });
  await creneaux.getByRole("button", { name: /^Choisir/ }).first().click();
  await expect(creneaux.getByRole("button", { name: /^Choisi :/ })).toHaveCount(1);
  await expect(formulaire.getByText(/^Nouveau créneau : /)).toBeVisible();
  await formulaire.getByRole("textbox", { name: "Motif" }).fill(motif);
  await formulaire.getByRole("button", { name: "Envoyer la demande" }).click();
  await expect(formulaire).toBeHidden();
};

test("demande de report : un créneau libre choisi par l'enseignante, approuvé par l'administration", async ({ browser }) => {
  const { admin, enseignante, motDePasse } = lireDonnees();

  const prof = await (await browser.newContext()).newPage();
  await seConnecter(prof, { email: enseignante.email, motDePasse, role: "enseignant" });
  await demander(prof, { seance: "04/01/2027", jour: "2027-01-11", motif: "Jury de soutenance le même jour" });
  const ligne = prof.getByRole("row").filter({ hasText: "En attente" });
  await expect(ligne).toHaveCount(1);
  // La date d'origine et la date demandée, chacune avec son heure
  await expect(ligne).toContainText("04/01/2027 ·");
  await expect(ligne).toContainText("11/01/2027 ·");

  const adm = await (await browser.newContext()).newPage();
  await seConnecter(adm, { email: admin.email, motDePasse, role: "admin" });
  await adm.goto("/gestion/demandes-report");
  const demande = adm.getByRole("row").filter({ hasText: enseignante.nom });
  await demande.getByRole("button", { name: "Approuver" }).click();
  // Validée, la demande attend l'enseignante : la séance n'a pas encore bougé
  await expect(demande.getByText("À confirmer")).toBeVisible();

  await prof.reload();
  await expect(prof.getByRole("row").filter({ hasText: "À confirmer" })).toHaveCount(1);
  await expect(prof.getByText(/^L’administration propose le lundi 11 janvier/)).toBeVisible();
  await prof.getByRole("button", { name: "Accepter" }).click();
  await expect(prof.getByRole("row").filter({ hasText: "Approuvée" })).toHaveCount(1);

  await adm.reload();
  await expect(demande.getByText("Approuvée")).toBeVisible();
  // La date d'origine reste le 4 janvier, même si la séance a changé de date
  await expect(demande).toContainText("04/01/2027");
});

test("l'administration renonce à refuser, puis approuve sur un autre créneau libre", async ({ browser }) => {
  const { admin, enseignante, motDePasse } = lireDonnees();

  const prof = await (await browser.newContext()).newPage();
  await seConnecter(prof, { email: enseignante.email, motDePasse, role: "enseignant" });
  await demander(prof, { seance: "11/01/2027", jour: "2027-01-18", motif: "Conférence à l'étranger" });

  const adm = await (await browser.newContext()).newPage();
  await seConnecter(adm, { email: admin.email, motDePasse, role: "admin" });
  await adm.goto("/gestion/demandes-report");
  const demande = adm.getByRole("row").filter({ hasText: "En attente" });

  // Un refus se confirme : annulé, la demande reste en attente
  await demande.getByRole("button", { name: "Refuser" }).click();
  const confirmation = adm.getByRole("dialog");
  await expect(confirmation).toContainText("ne pourra pas être annulée");
  await confirmation.getByRole("button", { name: "Annuler" }).click();
  await expect(demande).toContainText("En attente");

  // Un autre créneau libre, approuvé en une fois
  await demande.getByRole("button", { name: "Voir le détail" }).click();
  await adm.getByRole("dialog").getByRole("button", { name: "Choisir un autre créneau" }).click();
  const assistant = adm.getByRole("dialog");
  await assistant.getByRole("list", { name: "Créneaux libres" }).getByRole("button", { name: /^Approuver ici/ }).first().click();
  await expect(assistant).toBeHidden();
  await expect(adm.getByRole("row").filter({ hasText: "À confirmer" })).toHaveCount(1);

  // L'enseignante ne garde pas cette place : elle propose un autre créneau libre, retenu aussitôt
  await prof.reload();
  await prof.getByRole("button", { name: "Proposer un autre créneau" }).click();
  const proposition = prof.getByRole("dialog");
  await proposition.getByRole("list", { name: "Créneaux libres" }).getByRole("button", { name: /^Choisir/ }).first().click();
  await proposition.getByRole("button", { name: "Proposer ce créneau" }).click();
  await expect(proposition).toBeHidden();
  await expect(prof.getByRole("row").filter({ hasText: "Approuvée" })).toHaveCount(2);

  await adm.reload();
  await expect(adm.getByRole("row").filter({ hasText: "Approuvée" })).toHaveCount(2);
});

test("un refus avec sa raison, lue par l'enseignante", async ({ browser }) => {
  const { admin, enseignante, motDePasse } = lireDonnees();

  // Les séances de janvier ont été déplacées par les deux parcours précédents : la première venue suffit
  const prof = await (await browser.newContext()).newPage();
  await seConnecter(prof, { email: enseignante.email, motDePasse, role: "enseignant" });
  await demander(prof, { jour: "2027-02-01", jusquau: "2027-02-05", motif: "Formation hors de l'école" });

  const adm = await (await browser.newContext()).newPage();
  await seConnecter(adm, { email: admin.email, motDePasse, role: "admin" });
  await adm.goto("/gestion/demandes-report");
  const demande = adm.getByRole("row").filter({ hasText: "En attente" });
  await demande.getByRole("button", { name: "Refuser" }).click();
  const refus = adm.getByRole("dialog");
  await refus.getByRole("textbox", { name: "Raison (facultatif)" }).fill("Semaine des examens");
  await refus.getByRole("button", { name: "Refuser" }).click();
  await expect(refus).toBeHidden();
  await expect(adm.getByRole("row").filter({ hasText: "Refusée" })).toHaveCount(1);

  await prof.reload();
  await expect(prof.getByRole("row").filter({ hasText: "Refusée" })).toContainText("Raison du refus : Semaine des examens");
});
