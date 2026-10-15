import { ErreurMetier } from "../planning/enseignements.js";

/**
 * Fournisseurs d'IA pour les médias du Studio quiz (docs/plans/quiz-ia.md, § 4 bis) : un par
 * nature, chacun configurable à part, car le fournisseur du texte (DeepSeek par défaut) ne fait ni
 * images, ni voix, ni transcription. Les trois parlent l'API « compatible OpenAI », la plus répandue
 * (OpenAI, Groq et d'autres pour la transcription ; OpenAI, Mistral… pour l'image et la voix).
 *
 *   image          IA_IMAGE_URL, IA_IMAGE_CLE, IA_IMAGE_MODELE, IA_IMAGE_TAILLE   POST /images/generations
 *   voix           IA_VOIX_URL, IA_VOIX_CLE, IA_VOIX_MODELE, IA_VOIX_VOIX         POST /audio/speech
 *   transcription  IA_TRANSCRIPTION_URL, IA_TRANSCRIPTION_CLE, IA_TRANSCRIPTION_MODELE   POST /audio/transcriptions
 *
 * Sans clé, la fonction est absente de l'écran et la route répond 503. Les clés ne quittent jamais
 * le serveur ; le texte d'erreur d'un fournisseur reste dans les journaux.
 */

const DEFAUTS = {
    image: { url: "https://api.openai.com/v1", modele: "", extra: { taille: "1024x1024" } },
    voix: { url: "https://api.openai.com/v1", modele: "", extra: { voix: "alloy" } },
    transcription: { url: "https://api.openai.com/v1", modele: "" },
};

export const configurationMedia = (nature) => {
    const prefixe = `IA_${nature.toUpperCase()}`;
    const d = DEFAUTS[nature];
    return {
        url: (process.env[`${prefixe}_URL`] || d.url).replace(/\/$/, ""),
        cle: process.env[`${prefixe}_CLE`] || "",
        modele: process.env[`${prefixe}_MODELE`] || d.modele,
        taille: process.env.IA_IMAGE_TAILLE || d.extra?.taille,
        voix: process.env.IA_VOIX_VOIX || d.extra?.voix,
        delaiMs: Number(process.env.IA_MEDIA_DELAI_MS) || 120_000,
    };
};

export const mediaConfigure = (nature) => {
    const c = configurationMedia(nature);
    return Boolean(c.cle && c.modele && c.url);
};

const appeler = async (url, options, delaiMs) => {
    let reponse;
    try {
        reponse = await fetch(url, { ...options, signal: AbortSignal.timeout(delaiMs) });
    } catch (erreur) {
        if (erreur.name === "TimeoutError") throw new ErreurMetier("Le service d'IA met trop de temps à répondre : réessayez", 504);
        throw new ErreurMetier("Le service d'IA est injoignable", 502);
    }
    if (!reponse.ok) {
        console.error(`IA (média) : le fournisseur a répondu ${reponse.status}`);
        if (reponse.status === 429) throw new ErreurMetier("Le service d'IA est saturé : réessayez dans quelques minutes", 503);
        if (reponse.status === 401 || reponse.status === 403) throw new ErreurMetier("Le service d'IA refuse la clé configurée", 503);
        if (reponse.status === 400) throw new ErreurMetier("Le service d'IA a refusé cette demande (contenu ou format)", 422);
        throw new ErreurMetier(`Le service d'IA a répondu ${reponse.status}`, 502);
    }
    return reponse;
};

const exiger = (nature) => {
    if (!mediaConfigure(nature)) throw new ErreurMetier("Cette fonction d'IA n'est pas configurée sur ce serveur", 503);
    return configurationMedia(nature);
};

const APPELS_REELS = {
    /** @returns {Promise<{ contenu: Buffer, type: string }>} une image PNG */
    image: async ({ prompt }) => {
        const c = exiger("image");
        // Les modèles « dall-e » rendent une adresse par défaut : on demande le contenu lui-même
        const corps = { model: c.modele, prompt, n: 1, size: c.taille, ...(c.modele.startsWith("dall-e") ? { response_format: "b64_json" } : {}) };
        const r = await (await appeler(`${c.url}/images/generations`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.cle}` }, body: JSON.stringify(corps) }, c.delaiMs)).json();
        const b64 = r.data?.[0]?.b64_json;
        if (!b64) throw new ErreurMetier("Le service d'IA n'a pas rendu d'image", 502);
        return { contenu: Buffer.from(b64, "base64"), type: "image/png", modele: c.modele };
    },
    /** @returns {Promise<{ contenu: Buffer, type: string }>} un MP3 */
    voix: async ({ texte, voix }) => {
        const c = exiger("voix");
        const r = await appeler(
            `${c.url}/audio/speech`,
            { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.cle}` }, body: JSON.stringify({ model: c.modele, input: texte, voice: voix || c.voix, response_format: "mp3" }) },
            c.delaiMs
        );
        return { contenu: Buffer.from(await r.arrayBuffer()), type: "audio/mpeg", modele: c.modele };
    },
    /** @returns {Promise<{ texte: string, segments: {debut,fin,texte}[], duree: number|null }>} */
    transcription: async ({ contenu, type, nom, langue }) => {
        const c = exiger("transcription");
        const formulaire = new FormData();
        formulaire.append("file", new Blob([contenu], { type }), nom || "media");
        formulaire.append("model", c.modele);
        formulaire.append("response_format", "verbose_json");
        formulaire.append("timestamp_granularities[]", "segment");
        if (langue) formulaire.append("language", langue);
        const r = await (await appeler(`${c.url}/audio/transcriptions`, { method: "POST", headers: { Authorization: `Bearer ${c.cle}` }, body: formulaire }, c.delaiMs)).json();
        const segments = (Array.isArray(r.segments) ? r.segments : []).map((s) => ({ debut: Number(s.start) || 0, fin: Number(s.end) || 0, texte: String(s.text ?? "").trim() })).filter((s) => s.texte);
        return { texte: String(r.text ?? "").trim(), segments, duree: Number(r.duration) || null, modele: c.modele };
    },
};

const remplacants = {};

/** Tests : remplace l'appel d'une nature (image, voix, transcription) ; null rétablit le vrai. */
export const definirFournisseurMedia = (nature, remplacant) => {
    if (remplacant) remplacants[nature] = remplacant;
    else delete remplacants[nature];
};

/** Une fonction remplacée dans les tests compte comme configurée. */
export const mediaDisponible = (nature) => Boolean(remplacants[nature]) || mediaConfigure(nature);

export const genererImage = (demande) => (remplacants.image ?? APPELS_REELS.image)(demande);
export const genererVoix = (demande) => (remplacants.voix ?? APPELS_REELS.voix)(demande);
export const transcrire = (demande) => (remplacants.transcription ?? APPELS_REELS.transcription)(demande);
