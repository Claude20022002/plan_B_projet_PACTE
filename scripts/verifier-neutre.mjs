#!/usr/bin/env node
/**
 * Vérification « Planner pour toute école » (plan multi-établissements, D-11 et D-21, lot ME-1) :
 * le nom de l'école pilote n'est écrit en dur dans aucun écran, texte, courriel ou document. Tout
 * passe par l'identité de l'école (backend/services/etablissement/identite.js, {{ecole}} et
 * {{produit}} dans les textes traduits).
 *
 * Cherche « HESTIM » (en capitales) et le domaine « hestim.ma » dans le code du serveur, du site,
 * de l'application et du dossier partagé, hors commentaires et hors tests. Les identifiants
 * techniques en minuscules (« hestim-planner », colonne annees_a_hestim…) sont figés et ne
 * s'affichent pas : ils ne sont pas cherchés. Les exceptions sont listées ci-dessous, avec leur
 * raison ; toute autre occurrence fait échouer la vérification (CI : job du site).
 *
 * Lancement : node scripts/verifier-neutre.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOSSIERS = ['backend', 'frontend/src', 'mobile/src', 'shared'];
// Page d'entrée du site : titre et description avant le chargement de l'identité
const PAGES = ['frontend/index.html'];
const IGNORES = new Set(['node_modules', 'tests', '__tests__', 'dist', 'coverage', 'uploads']);
const EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs']);
const MOTIF = /HESTIM|hestim\.ma/;

// Exceptions permises : chemin (préfixe) et raison
const EXCEPTIONS = [
  { chemin: 'backend/migrations/', raison: "migrations figées : elles créent les données de l'école pilote (campus, identité)" },
  { chemin: 'backend/seed.js', raison: "données de démonstration de l'école pilote" },
  { chemin: 'backend/utils/campus.js', raison: "campus de l'école pilote, lus par la migration 0003" },
  { chemin: 'backend/services/oidc/provider.js', raison: 'nom du client enregistré chez ClassQuiz (connexion unique)' },
  { chemin: 'frontend/src/design-system/photosEcole.js', raison: "photos rangées par école : seule l'école pilote en a" },
  { chemin: 'mobile/src/intro/IntroLogo.jsx', raison: "animation du logo de l'école pilote, jouée pour elle seule" },
];

// Ligne de commentaire (//, /*, *, {/* en JSX) : la documentation peut nommer l'école pilote
const estCommentaire = (ligne) => /^\s*(\/\/|\/\*|\*|\{\/\*)/.test(ligne);

const fichiers = (dossier) =>
  fs.readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    if (IGNORES.has(entree.name)) return [];
    const chemin = path.join(dossier, entree.name);
    if (entree.isDirectory()) return fichiers(chemin);
    return EXTENSIONS.has(path.extname(entree.name)) ? [chemin] : [];
  });

const relatif = (chemin) => path.relative(RACINE, chemin).split(path.sep).join('/');
const permis = (chemin) => EXCEPTIONS.some((e) => chemin.startsWith(e.chemin));

const trouves = [...DOSSIERS.flatMap((dossier) => fichiers(path.join(RACINE, dossier))).map(relatif), ...PAGES]
  .filter((chemin) => !permis(chemin))
  .flatMap((chemin) =>
    fs
      .readFileSync(path.join(RACINE, chemin), 'utf8')
      .split(/\r?\n/)
      .map((ligne, i) => ({ chemin, numero: i + 1, ligne }))
      .filter(({ ligne }) => MOTIF.test(ligne) && !estCommentaire(ligne))
  );

if (trouves.length) {
  console.error(`Nom de l'école pilote écrit en dur (${trouves.length}) : passer par l'identité de l'école ({{ecole}}, {{produit}}, identiteEcole()).`);
  for (const { chemin, numero, ligne } of trouves) console.error(`  ${chemin}:${numero}  ${ligne.trim().slice(0, 140)}`);
  process.exit(1);
}
console.log(`Aucun nom d'école écrit en dur (${DOSSIERS.join(', ')} ; ${EXCEPTIONS.length} exceptions justifiées).`);
