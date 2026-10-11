/**
 * Vrai solveur Timefold pour les parcours (lot B-8), lancé par playwright.parcours.config.cjs :
 * le conteneur de l'image construite depuis `solver/` (docker build -t hestim-solver:parcours solver).
 * Un conteneur resté d'un passage interrompu est d'abord retiré ; arret.cjs le retire à la fin.
 *
 * Variables : PARCOURS_PORT_SOLVEUR (8090), PARCOURS_SOLVEUR_IMAGE (hestim-solver:parcours),
 * SOLVER_TOKEN (jeton partagé avec le serveur, fourni par la configuration).
 */
import { execFileSync, spawn } from "node:child_process";

export const NOM_CONTENEUR = "hestim-solveur-parcours";
const port = process.env.PARCOURS_PORT_SOLVEUR || "8090";
const image = process.env.PARCOURS_SOLVEUR_IMAGE || "hestim-solver:parcours";

try {
  execFileSync("docker", ["rm", "-f", NOM_CONTENEUR], { stdio: "ignore" });
} catch {
  // Aucun conteneur à retirer
}

const solveur = spawn("docker", ["run", "--rm", "--name", NOM_CONTENEUR, "-p", `${port}:8080`, "-e", `SOLVER_TOKEN=${process.env.SOLVER_TOKEN}`, image], { stdio: "inherit" });
solveur.on("exit", (code) => process.exit(code ?? 0));
