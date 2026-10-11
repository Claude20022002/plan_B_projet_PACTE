/**
 * Fin des parcours (lot B-8) : retire le conteneur du solveur. Sous Windows, Playwright arrête le
 * lanceur sans lui laisser le temps d'arrêter Docker ; le conteneur resterait sinon allumé.
 */
const { execFileSync } = require("node:child_process");

module.exports = async () => {
  if (process.env.PARCOURS_SOLVEUR_URL) return; // solveur fourni de l'extérieur (CI) : pas le nôtre
  try {
    execFileSync("docker", ["rm", "-f", "hestim-solveur-parcours"], { stdio: "ignore" });
  } catch {
    // Déjà arrêté
  }
};
