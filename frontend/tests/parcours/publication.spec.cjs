/**
 * Parcours « publication des changements » (décision du 21 octobre 2026) : les étudiants voient la
 * version publiée de leur emploi du temps. Le mois de janvier 2027 de la classe des parcours est
 * publié à la préparation des données ; une séance ajoutée ensuite par l'administration reste
 * invisible de l'étudiante, la page « EDT du mois » signale la classe à republier, et
 * « Publier les changements » la rend visible. La séance est enfin supprimée, ce qui est publié
 * aussitôt (changement ponctuel).
 */
const { test, expect } = require("@playwright/test");
const { lireDonnees, seConnecter } = require("./outils.cjs");

test.setTimeout(120_000);

/** Requête de l'administration avec son jeton CSRF ; rend le corps de la réponse. */
const envoyer = async (page, methode, url, data) => {
  const jeton = await page.request.get("/api/auth/csrf-token");
  const csrf = (await page.context().cookies()).find((c) => c.name === "csrf_token")?.value ?? (await jeton.json()).csrfToken;
  const reponse = await page.request.fetch(url, { method: methode, headers: { "X-CSRF-Token": decodeURIComponent(csrf) }, data });
  expect(reponse.ok(), `${methode} ${url} : ${await reponse.text()}`).toBeTruthy();
  return reponse.json();
};

/** Les séances de janvier 2027 que voit l'étudiante dans l'EDT du mois de sa classe. */
const seancesVues = async (page, idGroupe) => {
  const reponse = await page.request.get(`/api/emplois-du-temps/groupe/${idGroupe}/mensuel?mois=2027-01`);
  expect(reponse.ok()).toBeTruthy();
  const edt = await reponse.json();
  return edt.semaines.flatMap((s) => s.jours).flatMap((j) => [...j.matin, ...j.apres_midi]).flatMap((c) => c.id_affectations ?? []);
};

test("un changement fait après publication attend « Publier les changements »", async ({ browser }) => {
  const { admin, etudiants, motDePasse, seanceFixe } = lireDonnees();
  const adm = await (await browser.newContext()).newPage();
  await seConnecter(adm, { email: admin.email, motDePasse, role: "admin" });
  const etu = await (await browser.newContext()).newPage();
  await seConnecter(etu, { email: etudiants[0].email, motDePasse, role: "etudiant" });

  // La séance fixe du lundi 4 janvier, copiée le lundi 25 : un changement en masse, non publié
  const liste = await (await adm.request.get(`/api/affectations?date_seance=${seanceFixe.date}&limit=100`)).json();
  const fixe = (liste.data ?? liste).find((s) => s.groupe?.nom_groupe === seanceFixe.groupe);
  const { affectation: ajoutee } = await envoyer(adm, "POST", "/api/affectations", {
    date_seance: "2027-01-25",
    id_cours: fixe.id_cours,
    id_groupe: fixe.id_groupe,
    id_user_enseignant: fixe.id_user_enseignant,
    id_salle: fixe.id_salle,
    id_creneau: fixe.id_creneau,
  });
  expect(await seancesVues(etu, fixe.id_groupe)).not.toContain(ajoutee.id_affectation);

  // L'EDT du mois signale la classe à republier, puis publie ses changements
  await adm.goto(`/emploi-du-temps/mensuel?groupe=${fixe.id_groupe}&mois=2027-01`);
  const alerte = adm.getByRole("alert").filter({ hasText: "Changements non publiés" });
  await expect(alerte.getByRole("button", { name: `${seanceFixe.groupe} · 1 changement` })).toBeVisible();
  await alerte.getByRole("button", { name: "Publier les changements" }).click();
  await adm.getByRole("dialog").getByRole("button", { name: "Publier les changements" }).click();
  await expect(adm.getByText("Les étudiants voient la version à jour.")).toBeVisible();
  expect(await seancesVues(etu, fixe.id_groupe)).toContain(ajoutee.id_affectation);

  // Une suppression prévient les étudiants : elle est publiée aussitôt
  await envoyer(adm, "DELETE", `/api/affectations/${ajoutee.id_affectation}`);
  expect(await seancesVues(etu, fixe.id_groupe)).not.toContain(ajoutee.id_affectation);
  await adm.reload();
  await expect(adm.getByText("Les étudiants voient la version à jour.")).toBeVisible();
});
