import { ErreurMetier } from "../planning/enseignements.js";

/**
 * Client d'IA configurable (plan docs/plans/quiz-ia.md, lot IA-1). Deux familles d'API :
 *  - « openai-compatible » (par défaut) : DeepSeek, Mistral, OpenAI, Groq… (POST {url}/chat/completions) ;
 *  - « anthropic » : POST {url}/messages.
 * Variables : IA_FOURNISSEUR, IA_URL, IA_CLE, IA_MODELE, IA_DELAI_MS. Sans IA_CLE, la fonction est
 * désactivée (estConfigure() faux, erreur 503). La clé ne quitte jamais le serveur et n'est jamais
 * journalisée ; le texte d'une erreur du fournisseur n'est pas renvoyé tel quel à l'utilisateur.
 */

const FOURNISSEURS = {
    "openai-compatible": { url: "https://api.deepseek.com/v1", modele: "deepseek-chat" },
    // Pas de modèle par défaut : les noms changent souvent, IA_MODELE est exigé
    anthropic: { url: "https://api.anthropic.com/v1", modele: null },
};

export const configuration = () => {
    const fournisseur = process.env.IA_FOURNISSEUR || "openai-compatible";
    const defauts = FOURNISSEURS[fournisseur];
    return {
        fournisseur,
        connu: Boolean(defauts),
        url: (process.env.IA_URL || defauts?.url || "").replace(/\/$/, ""),
        cle: process.env.IA_CLE || "",
        modele: process.env.IA_MODELE || defauts?.modele || "",
        delaiMs: Number(process.env.IA_DELAI_MS) || 90_000,
    };
};

/** La génération par IA est-elle disponible (fournisseur connu, clé et modèle renseignés) ? */
export const estConfigure = () => {
    const c = configuration();
    return c.connu && Boolean(c.cle) && Boolean(c.modele) && Boolean(c.url);
};

/** Réponse en JSON, éventuellement entourée d'un bloc ```json (certains modèles l'ajoutent). */
export const lireJson = (texte) => {
    const brut = String(texte ?? "").trim();
    const bloc = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(brut);
    try {
        return JSON.parse(bloc ? bloc[1] : brut);
    } catch {
        throw new ErreurMetier("La réponse de l'IA n'est pas un JSON valide", 502);
    }
};

const appeler = async (url, options, delaiMs) => {
    let reponse;
    try {
        reponse = await fetch(url, { ...options, signal: AbortSignal.timeout(delaiMs) });
    } catch (erreur) {
        if (erreur.name === "TimeoutError") throw new ErreurMetier("L'IA met trop de temps à répondre : réessayez", 504);
        throw new ErreurMetier("Le service d'IA est injoignable", 502);
    }
    if (!reponse.ok) {
        // Le détail reste dans les journaux du serveur (sans la clé), pas dans la réponse
        console.error(`IA : le fournisseur a répondu ${reponse.status}`);
        if (reponse.status === 429) throw new ErreurMetier("Le service d'IA est saturé : réessayez dans quelques minutes", 503);
        if (reponse.status === 401 || reponse.status === 403) throw new ErreurMetier("Le service d'IA refuse la clé configurée", 503);
        throw new ErreurMetier(`Le service d'IA a répondu ${reponse.status}`, 502);
    }
    return reponse.json();
};

const ADAPTATEURS = {
    "openai-compatible": async (c, { systeme, utilisateur, temperature, maxJetons }) => {
        const r = await appeler(
            `${c.url}/chat/completions`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.cle}` },
                body: JSON.stringify({
                    model: c.modele,
                    messages: [
                        { role: "system", content: systeme },
                        { role: "user", content: utilisateur },
                    ],
                    response_format: { type: "json_object" },
                    temperature,
                    max_tokens: maxJetons,
                }),
            },
            c.delaiMs
        );
        const choix = r.choices?.[0];
        return { texte: choix?.message?.content ?? "", tronque: choix?.finish_reason === "length", jetons: { entree: r.usage?.prompt_tokens ?? 0, sortie: r.usage?.completion_tokens ?? 0 } };
    },
    anthropic: async (c, { systeme, utilisateur, temperature, maxJetons }) => {
        const r = await appeler(
            `${c.url}/messages`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-api-key": c.cle, "anthropic-version": "2023-06-01" },
                body: JSON.stringify({ model: c.modele, system: systeme, max_tokens: maxJetons, temperature, messages: [{ role: "user", content: utilisateur }] }),
            },
            c.delaiMs
        );
        const texte = (r.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join("");
        return { texte, tronque: r.stop_reason === "max_tokens", jetons: { entree: r.usage?.input_tokens ?? 0, sortie: r.usage?.output_tokens ?? 0 } };
    },
};

const appelReel = async (demande) => {
    const c = configuration();
    if (!estConfigure()) throw new ErreurMetier("La génération par IA n'est pas configurée sur ce serveur", 503);
    return ADAPTATEURS[c.fournisseur](c, demande);
};

let client = appelReel;

/** Tests : remplace l'appel au fournisseur (demande → { texte, tronque, jetons }) ; null rétablit le vrai. */
export const definirClientIa = (remplacant) => {
    client = remplacant ?? appelReel;
};

/**
 * Demande une réponse JSON au modèle.
 * @param {{ systeme: string, utilisateur: string, temperature?: number, maxJetons?: number }} demande
 * @returns {Promise<{ donnees: any, jetons: { entree: number, sortie: number }, modele: string }>}
 */
export const genererJson = async ({ systeme, utilisateur, temperature = 0.4, maxJetons = 4096 }) => {
    const { texte, tronque, jetons } = await client({ systeme, utilisateur, temperature, maxJetons });
    if (tronque) throw new ErreurMetier("La réponse de l'IA est incomplète (trop longue) : demandez moins de questions", 502);
    return { donnees: lireJson(texte), jetons, modele: configuration().modele };
};
