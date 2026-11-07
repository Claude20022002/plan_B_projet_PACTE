/**
 * Outils communs aux parcours de démonstration (lot B-8) : comptes créés par la préparation de la
 * base (serveur.mjs), connexion par le formulaire du site, et scan d'un QR d'appel simulé comme
 * l'application mobile (le scan n'existe que dans l'application).
 */
const fs = require("node:fs");
const path = require("node:path");
const { expect } = require("@playwright/test");

const API = `http://127.0.0.1:${process.env.PARCOURS_PORT_API || "5001"}/api`;

/** Comptes et séance créés pour ce passage des tests : { motDePasse, admin, enseignante, etudiants, seance } */
const lireDonnees = () => JSON.parse(fs.readFileSync(path.join(__dirname, ".donnees.json"), "utf8"));

/** Se connecte par le formulaire du site et attend le tableau de bord du rôle. */
const seConnecter = async (page, { email, motDePasse, role }) => {
  await page.goto("/connexion");
  await page.getByRole("textbox", { name: "Adresse email" }).fill(email);
  await page.getByRole("textbox", { name: "Mot de passe", exact: true }).fill(motDePasse);
  await page.getByRole("button", { name: "Connexion", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/${role}$`), { timeout: 20_000 });
};

/**
 * Scanne un code d'appel comme le fait l'application : connexion « mobile » (jeton Bearer), puis
 * envoi du code avec l'identifiant du téléphone, que l'anti-fraude lie au compte. Rend le statut HTTP.
 */
const scannerCommeMobile = async (request, { email, motDePasse, code, appareil }) => {
  const enTetes = { "X-Client": "mobile" };
  const connexion = await request.post(`${API}/auth/login`, { headers: enTetes, data: { email, password: motDePasse } });
  expect(connexion.ok(), `connexion mobile de ${email}`).toBeTruthy();
  const { access_token: jeton } = await connexion.json();
  const scan = await request.post(`${API}/presences/scanner`, {
    headers: { ...enTetes, Authorization: `Bearer ${jeton}`, "X-Appareil": appareil },
    data: { code },
  });
  return scan.status();
};

/**
 * Publie le mois d'une filière aux étudiants, comme le bouton « Publier » de l'EDT du mois : sans
 * cela, les étudiants ne voient aucune séance (décision du 21 octobre 2026). `page` est celle de l'administration.
 */
const publierMois = async (page, { mois, idFiliere }) => {
  const reponse = await page.request.post("/api/agenda/edt-mensuel/publier", { headers: await enTeteCsrf(page), data: { mois, id_filiere: idFiliere } });
  expect(reponse.ok(), `publication de ${mois} : ${await reponse.text()}`).toBeTruthy();
};

/**
 * Supprime par l'API les modules d'un code laissés par un essai arrêté en route : la relance de la
 * CI (retries) et --repeat-each rejouent un parcours sur la même base. `page` est celle de l'administration.
 */
const supprimerModule = async (page, { code, semestre }) => {
  const liste = await page.request.get(`/api/cours?semestre=${semestre}&limit=100`);
  expect(liste.ok(), `liste des modules : ${await liste.text()}`).toBeTruthy();
  for (const { id_cours: id } of (await liste.json()).data.filter((c) => c.code_cours === code)) {
    const reponse = await page.request.delete(`/api/cours/${id}`, { headers: await enTeteCsrf(page) });
    expect(reponse.ok(), `suppression de ${code} : ${await reponse.text()}`).toBeTruthy();
  }
};

/** En-tête CSRF des requêtes d'écriture faites au nom de la session ouverte dans `page`. */
const enTeteCsrf = async (page) => {
  const jeton = await page.request.get("/api/auth/csrf-token");
  const csrf = (await page.context().cookies()).find((c) => c.name === "csrf_token")?.value ?? (await jeton.json()).csrfToken;
  return { "X-CSRF-Token": decodeURIComponent(csrf) };
};

module.exports = { lireDonnees, seConnecter, scannerCommeMobile, publierMois, supprimerModule, enTeteCsrf };
