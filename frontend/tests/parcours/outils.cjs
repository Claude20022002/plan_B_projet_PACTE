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

module.exports = { lireDonnees, seConnecter, scannerCommeMobile };
