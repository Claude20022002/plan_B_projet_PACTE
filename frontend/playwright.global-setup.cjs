/**
 * Playwright Global Setup
 * Exécuté UNE FOIS avant tous les tests
 * Lance le seed des données après le démarrage des serveurs
 */

const { exec } = require("child_process");
const path = require("path");
const http = require("http");

const BACKEND_URL = "http://localhost:5000/health";
const MAX_RETRIES = 30;
const RETRY_DELAY = 2000; // 2 secondes

/**
 * Vérifier si le backend est prêt
 */
function waitForBackend(retries = 0) {
    return new Promise((resolve, reject) => {
        http.get(BACKEND_URL, (res) => {
            if (res.statusCode === 200) {
                console.log("✓ Backend est prêt");
                resolve();
            } else {
                if (retries < MAX_RETRIES) {
                    setTimeout(
                        () =>
                            waitForBackend(retries + 1)
                                .then(resolve)
                                .catch(reject),
                        RETRY_DELAY,
                    );
                } else {
                    reject(new Error("Backend n'a pas répondu à temps"));
                }
            }
        }).on("error", () => {
            if (retries < MAX_RETRIES) {
                setTimeout(
                    () =>
                        waitForBackend(retries + 1)
                            .then(resolve)
                            .catch(reject),
                    RETRY_DELAY,
                );
            } else {
                reject(new Error("Impossible de se connecter au backend"));
            }
        });
    });
}

/**
 * Exécuter le seed
 */
function runSeed() {
    return new Promise((resolve, reject) => {
        const backendPath = path.join(__dirname, "..", "backend");
        const seedProcess = exec("npm run seed", { cwd: backendPath });

        let output = "";
        let errors = "";

        seedProcess.stdout.on("data", (data) => {
            output += data.toString();
            console.log(`[Seed] ${data.toString().trim()}`);
        });

        seedProcess.stderr.on("data", (data) => {
            errors += data.toString();
            console.log(`[Seed ERROR] ${data.toString().trim()}`);
        });

        seedProcess.on("close", (code) => {
            if (code === 0) {
                console.log("✓ Seed completed successfully");
                resolve();
            } else {
                reject(new Error(`Seed failed with code ${code}: ${errors}`));
            }
        });

        seedProcess.on("error", (error) => {
            reject(error);
        });
    });
}

module.exports = async function globalSetup() {
    console.log("\n=== Playwright Global Setup ===\n");

    try {
        console.log("⏳ Attente du backend...");
        await waitForBackend();

        console.log("⏳ Exécution du seed...");
        await runSeed();

        console.log("\n✓ Setup completed successfully\n");
    } catch (error) {
        console.error("✗ Setup failed:", error.message);
        // Ne pas rejeter complètement — laisser les tests essayer quand même
        // car le reuseExistingServer peut utiliser un serveur existant
    }
};
