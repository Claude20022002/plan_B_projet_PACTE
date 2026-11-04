/**
 * Parcours « lien de visio » (plan multi-établissements, lot EC-11, conception-ec11-groupe-b.md) :
 * l'enseignante pose le lien de sa séance à distance dans la fiche de la séance ; une adresse en
 * http:// est refusée sous le champ ; l'étudiante de la classe voit « Rejoindre sur … ».
 * La séance à distance est préparée par donnees.mjs, dans une semaine, sans salle.
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

test.setTimeout(120_000);

/** Ouvre la fiche de la séance du `date` dans l'emploi du temps (vue en liste, semaine de la date). */
const ouvrirFiche = async (page, chemin, date, cours) => {
  await page.goto(`${chemin}?date=${date}`);
  const liste = page.getByRole("button", { name: "Liste" });
  await liste.click();
  await expect(liste).toHaveAttribute("aria-pressed", "true");
  await page.locator(`section[aria-labelledby="jour-${date}"]`).getByRole("button", { name: new RegExp(cours) }).first().click({ timeout: 20_000 });
  return page.getByRole("dialog");
};

test("visio : l'enseignante pose le lien de sa séance à distance, l'étudiante le rejoint", async ({ browser }) => {
  const { enseignante, etudiants, motDePasse, seance, seanceADistance } = lireDonnees();
  const lien = `https://meet.google.com/parcours-${Date.now().toString(36)}`;

  const prof = await (await browser.newContext()).newPage();
  await seConnecter(prof, { email: enseignante.email, motDePasse, role: "enseignant" });
  const fiche = await ouvrirFiche(prof, "/emploi-du-temps/enseignant", seanceADistance.date, seance.cours);
  const champ = fiche.getByRole("textbox", { name: "Lien de visioconférence" });

  // Adresse refusée avant l'envoi, avec la règle partagée (shared/lienVisio.js)
  await champ.fill("http://meet.google.com/abc");
  await fiche.getByRole("button", { name: "Enregistrer" }).click();
  await expect(fiche.getByText("Le lien doit commencer par https://")).toBeVisible();

  await champ.fill(lien);
  await fiche.getByRole("button", { name: "Enregistrer" }).click();
  await expect(fiche.getByText("Lien enregistré.")).toBeVisible();
  await expect(fiche.getByRole("link", { name: "Rejoindre sur meet.google.com" })).toHaveAttribute("href", lien);

  // L'étudiante : tout de suite, sans nouvelle publication de l'emploi du temps
  const etu = await (await browser.newContext()).newPage();
  await seConnecter(etu, { email: etudiants[0].email, motDePasse, role: "etudiant" });
  const ficheEtu = await ouvrirFiche(etu, "/emploi-du-temps/etudiant", seanceADistance.date, seance.cours);
  const rejoindre = ficheEtu.getByRole("link", { name: "Rejoindre sur meet.google.com" });
  await expect(rejoindre).toHaveAttribute("href", lien);
  await expect(rejoindre).toHaveAttribute("rel", "noopener noreferrer");
  await expect(ficheEtu.getByRole("textbox", { name: "Lien de visioconférence" })).toHaveCount(0);
});
