/**
 * Client d'IA configurable (services/ia/client.js) : requêtes envoyées à chaque famille d'API,
 * lecture des réponses et erreurs, sans réseau (fetch remplacé).
 */
import { configuration, definirClientIa, estConfigure, genererJson, lireJson } from "../../services/ia/client.js";

const VARIABLES = ["IA_FOURNISSEUR", "IA_URL", "IA_CLE", "IA_MODELE", "IA_DELAI_MS"];
let sauvegarde;
let fetchOrigine;
let appels;

const repondre = (corps, { status = 200 } = {}) => {
    globalThis.fetch = async (url, options) => {
        appels.push({ url, options, corps: JSON.parse(options.body) });
        return { ok: status >= 200 && status < 300, status, json: async () => corps };
    };
};

beforeEach(() => {
    sauvegarde = Object.fromEntries(VARIABLES.map((v) => [v, process.env[v]]));
    VARIABLES.forEach((v) => delete process.env[v]);
    fetchOrigine = globalThis.fetch;
    appels = [];
    definirClientIa(null);
});
afterEach(() => {
    VARIABLES.forEach((v) => (sauvegarde[v] === undefined ? delete process.env[v] : (process.env[v] = sauvegarde[v])));
    globalThis.fetch = fetchOrigine;
    definirClientIa(null);
});

describe("Configuration", () => {
    test("DeepSeek par défaut ; désactivée sans clé", () => {
        expect(configuration()).toMatchObject({ fournisseur: "openai-compatible", url: "https://api.deepseek.com/v1", modele: "deepseek-chat" });
        expect(estConfigure()).toBe(false);
        process.env.IA_CLE = "cle-essai";
        expect(estConfigure()).toBe(true);
    });

    test("Anthropic exige un modèle ; un fournisseur inconnu reste désactivé", () => {
        process.env.IA_CLE = "cle-essai";
        process.env.IA_FOURNISSEUR = "anthropic";
        expect(estConfigure()).toBe(false);
        process.env.IA_MODELE = "un-modele";
        expect(estConfigure()).toBe(true);
        process.env.IA_FOURNISSEUR = "inconnu";
        expect(estConfigure()).toBe(false);
    });

    test("sans configuration : erreur 503, aucun appel réseau", async () => {
        repondre({});
        await expect(genererJson({ systeme: "s", utilisateur: "u" })).rejects.toMatchObject({ status: 503 });
        expect(appels).toHaveLength(0);
    });
});

describe("lireJson", () => {
    test("JSON nu ou entouré d'un bloc ```json", () => {
        expect(lireJson('{"a":1}')).toEqual({ a: 1 });
        expect(lireJson('```json\n{"a":2}\n```')).toEqual({ a: 2 });
        expect(() => lireJson("Voici le quiz : {")).toThrow(/JSON valide/);
    });
});

describe("Compatible OpenAI (DeepSeek)", () => {
    beforeEach(() => {
        process.env.IA_CLE = "cle-secrete";
    });

    test("requête : chat/completions, clé en Bearer, consigne système, réponse JSON exigée", async () => {
        repondre({ choices: [{ message: { content: '{"questions":[]}' }, finish_reason: "stop" }], usage: { prompt_tokens: 120, completion_tokens: 30 } });
        const resultat = await genererJson({ systeme: "consigne", utilisateur: "support", maxJetons: 2000 });
        expect(resultat).toEqual({ donnees: { questions: [] }, jetons: { entree: 120, sortie: 30 }, modele: "deepseek-chat" });
        const [appel] = appels;
        expect(appel.url).toBe("https://api.deepseek.com/v1/chat/completions");
        expect(appel.options.headers.Authorization).toBe("Bearer cle-secrete");
        expect(appel.corps).toMatchObject({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: "consigne" },
                { role: "user", content: "support" },
            ],
            response_format: { type: "json_object" },
            max_tokens: 2000,
        });
    });

    test("réponse tronquée (longueur) : erreur claire", async () => {
        repondre({ choices: [{ message: { content: '{"questions":[' }, finish_reason: "length" }], usage: {} });
        await expect(genererJson({ systeme: "s", utilisateur: "u" })).rejects.toThrow(/incomplète/);
    });

    test("clé refusée, saturation, erreur serveur : messages sans détail du fournisseur", async () => {
        const journal = [];
        const consoleError = console.error;
        console.error = (...args) => journal.push(args);
        for (const [status, attendu] of [
            [401, /refuse la clé/],
            [429, /saturé/],
            [500, /a répondu 500/],
        ]) {
            repondre({ error: { message: "détail interne du fournisseur" } }, { status });
            const promesse = genererJson({ systeme: "s", utilisateur: "u" });
            await expect(promesse).rejects.toThrow(attendu);
            await expect(promesse).rejects.not.toThrow(/détail interne/);
        }
        // La clé n'apparaît jamais dans les journaux
        console.error = consoleError;
        expect(journal.length).toBeGreaterThan(0);
        expect(JSON.stringify(journal)).not.toContain("cle-secrete");
    });

    test("délai dépassé : erreur 504", async () => {
        globalThis.fetch = async () => {
            const e = new Error("délai");
            e.name = "TimeoutError";
            throw e;
        };
        await expect(genererJson({ systeme: "s", utilisateur: "u" })).rejects.toMatchObject({ status: 504 });
    });

    test("autre fournisseur compatible (Mistral) par IA_URL et IA_MODELE", async () => {
        process.env.IA_URL = "https://api.mistral.ai/v1/";
        process.env.IA_MODELE = "mistral-large-latest";
        repondre({ choices: [{ message: { content: "{}" } }], usage: {} });
        await genererJson({ systeme: "s", utilisateur: "u" });
        expect(appels[0].url).toBe("https://api.mistral.ai/v1/chat/completions");
        expect(appels[0].corps.model).toBe("mistral-large-latest");
    });
});

describe("Anthropic", () => {
    beforeEach(() => {
        process.env.IA_FOURNISSEUR = "anthropic";
        process.env.IA_CLE = "cle-anthropic";
        process.env.IA_MODELE = "modele-essai";
    });

    test("requête : messages, clé en x-api-key, consigne système à part ; réponse lue dans les blocs texte", async () => {
        repondre({ content: [{ type: "text", text: '{"ok":' }, { type: "text", text: "true}" }], stop_reason: "end_turn", usage: { input_tokens: 50, output_tokens: 8 } });
        const resultat = await genererJson({ systeme: "consigne", utilisateur: "support" });
        expect(resultat).toEqual({ donnees: { ok: true }, jetons: { entree: 50, sortie: 8 }, modele: "modele-essai" });
        expect(appels[0].url).toBe("https://api.anthropic.com/v1/messages");
        expect(appels[0].options.headers["x-api-key"]).toBe("cle-anthropic");
        expect(appels[0].options.headers["anthropic-version"]).toBe("2023-06-01");
        expect(appels[0].corps).toMatchObject({ model: "modele-essai", system: "consigne", messages: [{ role: "user", content: "support" }] });
    });

    test("arrêt sur la limite de jetons : erreur claire", async () => {
        repondre({ content: [{ type: "text", text: "{" }], stop_reason: "max_tokens", usage: {} });
        await expect(genererJson({ systeme: "s", utilisateur: "u" })).rejects.toThrow(/incomplète/);
    });
});

describe("Client remplaçable (tests des lots suivants)", () => {
    test("definirClientIa : aucun appel réseau", async () => {
        repondre({});
        definirClientIa(async () => ({ texte: '{"questions":[1]}', tronque: false, jetons: { entree: 1, sortie: 1 } }));
        expect((await genererJson({ systeme: "s", utilisateur: "u" })).donnees).toEqual({ questions: [1] });
        expect(appels).toHaveLength(0);
    });
});
