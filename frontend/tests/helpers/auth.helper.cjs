/**
 * auth.helper.js — Page Object Model pour l'authentification
 * Fournit des méthodes réutilisables pour tous les tests.
 */

// ── Credentials de test (doivent correspondre au seed) ────────────────────────
const USERS = {
    admin: { email: "admin@hestim.ma", password: "password123", role: "admin" },
    enseignant: {
        email: "alain.bennis0@hestim.ma",
        password: "password123",
        role: "enseignant",
    },
    etudiant: {
        email: "hamza.benali0@hestim.ma", // déterministe : etuCount=0 → isMale=(0%2===0)=true → PRENOMS_M[0]='Hamza'
        password: "password123",
        role: "etudiant",
    },
    invalid: { email: "inconnu@hestim.ma", password: "wrongpass" },
};

/**
 * Se connecte via l'interface et attend la redirection dashboard.
 * @param {import('@playwright/test').Page} page
 * @param {'admin'|'enseignant'|'etudiant'} role
 */
async function login(page, role = "admin") {
    const user = USERS[role];
    await page.goto("/connexion");
    await page.waitForLoadState("networkidle");

    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel(/mot de passe/i).fill(user.password);

    // Sélectionner la fonction selon le rôle
    const fonctionMap = {
        admin: "Administrateur",
        enseignant: "Professeur",
        etudiant: "Étudiant",
    };
    const select = page
        .locator('select, [role="combobox"]')
        .filter({ hasText: /fonction|rôle/i })
        .first();
    if (await select.isVisible().catch(() => false)) {
        await select.selectOption({ label: fonctionMap[role] });
    }

    await page.getByRole("button", { name: /connexion/i }).click();
    await page.waitForURL(`**/dashboard/${role}`, { timeout: 10_000 });
}

/**
 * Injecte directement le token JWT (plus rapide, évite l'UI login).
 * Usage : `await loginViaToken(page, 'admin')` au début d'un test.
 * Avec retry automatique en cas d'erreur de connexion.
 */
async function loginViaToken(page, role = "admin", maxRetries = 3) {
    const user = USERS[role];
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Attendre que le backend soit prêt
            if (attempt > 1) {
                await page.waitForTimeout(1000 * attempt); // backoff exponentiel
            }

            const response = await page.request.post(
                "http://127.0.0.1:5000/api/auth/login",
                {
                    data: { email: user.email, password: user.password },
                },
            );

            if (!response.ok()) {
                throw new Error(
                    `Login API failed: ${response.status()} ${response.statusText()}`,
                );
            }

            const { token } = await response.json();
            if (!token) {
                throw new Error("Pas de token dans la réponse");
            }

            await page.goto("/");
            await page.evaluate((t) => localStorage.setItem("token", t), token);
            await page.goto(`/dashboard/${role}`);
            await page.waitForLoadState("networkidle");
            return; // Succès
        } catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                console.log(
                    `⚠️ Tentative ${attempt}/${maxRetries} échouée: ${error.message}`,
                );
            }
        }
    }

    // Tous les essais ont échoué
    throw new Error(
        `loginViaToken failed après ${maxRetries} tentatives: ${lastError.message}`,
    );
}

/**
 * Se déconnecte via le menu avatar.
 */
async function logout(page) {
    // Clic sur avatar ou bouton déconnexion
    const avatar = page
        .locator(
            '[aria-label*="compte"], [aria-label*="profil"], .MuiAvatar-root',
        )
        .first();
    if (await avatar.isVisible().catch(() => false)) {
        await avatar.click();
        await page.getByText(/déconnexion/i).click();
    } else {
        // Fallback : vider localStorage
        await page.evaluate(() => localStorage.removeItem("token"));
        await page.goto("/connexion");
    }
    await page.waitForURL("**/connexion");
}

module.exports = { USERS, login, loginViaToken, logout };
