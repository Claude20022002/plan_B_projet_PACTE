import crypto from "crypto";
import { MediaQuiz, QuestionQuiz, SessionQuiz } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { nomSur } from "../../utils/fichiers.js";
import { exigerEnseignant } from "./questionnaires.js";

/**
 * Médias des questions (Studio quiz) : images (« Refer to the exhibit » de l'examen Cisco),
 * audios et vidéos dont la question cite un extrait. Stockés en base comme les fichiers des devoirs,
 * en attendant le stockage objet de l'espace de cours (lot E-1) ; diffusés par le serveur seul,
 * avec des requêtes partielles (Range) pour que le lecteur se place au début de l'extrait.
 *
 * Sécurité : liste blanche de types, signature réelle du contenu vérifiée (un fichier renommé est
 * refusé), jamais de SVG ni de HTML (qui pourraient porter du script), diffusion bac à sable.
 */

const debut = (octets, decalage = 0) => (b) => b.length >= decalage + octets.length && b.subarray(decalage, decalage + octets.length).equals(Buffer.from(octets));
const ascii = (texte, decalage = 0) => (b) => b.subarray(decalage, decalage + texte.length).toString("latin1") === texte;
const ebml = debut([0x1a, 0x45, 0xdf, 0xa3]);
const isoMp4 = ascii("ftyp", 4);
const mp3 = (b) => ascii("ID3")(b) || (b.length > 1 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0);

const TYPES = {
    "image/png": { media: "image", signature: debut([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
    "image/jpeg": { media: "image", signature: debut([0xff, 0xd8, 0xff]) },
    "image/webp": { media: "image", signature: (b) => ascii("RIFF")(b) && ascii("WEBP", 8)(b) },
    "image/gif": { media: "image", signature: ascii("GIF8") },
    "audio/mpeg": { media: "audio", signature: mp3 },
    "audio/ogg": { media: "audio", signature: ascii("OggS") },
    "audio/wav": { media: "audio", signature: (b) => ascii("RIFF")(b) && ascii("WAVE", 8)(b) },
    "audio/x-wav": { media: "audio", signature: (b) => ascii("RIFF")(b) && ascii("WAVE", 8)(b) },
    "audio/mp4": { media: "audio", signature: isoMp4 },
    "audio/x-m4a": { media: "audio", signature: isoMp4 },
    "audio/webm": { media: "audio", signature: ebml },
    "video/mp4": { media: "video", signature: isoMp4 },
    "video/webm": { media: "video", signature: ebml },
};
export const TYPES_MEDIAS_ACCEPTES = Object.keys(TYPES);

/** Type d'un contenu d'après sa signature (un fichier reçu sans type sûr, comme « image/* ») ; null s'il n'est pas accepté. */
export const typeDuContenu = (contenu) => {
    // Une vidéo MP4 et un son M4A ont la même signature : la vidéo d'abord
    const ordre = ["image/png", "image/jpeg", "image/webp", "image/gif", "video/mp4", "video/webm", "audio/mpeg", "audio/ogg", "audio/wav"];
    return ordre.find((type) => TYPES[type].signature(contenu)) ?? null;
};

// nginx accepte 25 Mo : une vidéo plus longue se coupe avant d'être déposée
export const TAILLES_MAX = { image: 5 * 1024 * 1024, audio: 10 * 1024 * 1024, video: 20 * 1024 * 1024 };
export const TAILLE_MAX_DEPOT = TAILLES_MAX.video;
const QUOTA_OCTETS = () => (Number(process.env.STUDIO_QUOTA_MO) || 300) * 1024 * 1024;

const vueMedia = (m) => ({
    id_media: m.id_media,
    type: m.type,
    type_mime: m.type_mime,
    nom: m.nom,
    taille: m.taille,
    duree: m.duree,
    origine: m.origine,
    description: m.description,
    transcription: m.transcription ?? null,
    cree_le: m.createdAt,
});

const ATTRIBUTS = { exclude: ["contenu"] };

const lireDescription = (brut) => {
    if (brut === undefined || brut === null) return null;
    const texte = String(brut).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    if (texte.length > 500) throw new ErreurMetier("Description : 500 caractères au plus", 400);
    return texte || null;
};

const lireDuree = (brut) => {
    if (brut === undefined || brut === null || brut === "") return null;
    const duree = Number(brut);
    return Number.isFinite(duree) && duree > 0 && duree <= 4 * 3600 ? Math.round(duree * 10) / 10 : null;
};

/**
 * Enregistre un média vérifié. `origine` : « depot » (l'enseignant), « ia_image », « ia_voix » ou
 * « import » (repris d'un quiz de ClassQuiz).
 * @param {{ contenu: Buffer, type: string, nom?: string, description?: string, duree?: number, transcription?: object }} fichier
 */
export const enregistrerMedia = async (user, fichier, { origine = "depot" } = {}) => {
    exigerEnseignant(user);
    const typeMime = String(fichier.type ?? "").split(";")[0].trim().toLowerCase();
    const regle = TYPES[typeMime];
    if (!regle) throw new ErreurMetier("Média : image (PNG, JPEG, WebP, GIF), audio (MP3, OGG, WAV, M4A) ou vidéo (MP4, WebM) seulement", 415);
    const contenu = fichier.contenu;
    if (!Buffer.isBuffer(contenu) || !contenu.length) throw new ErreurMetier("Fichier vide", 400);
    if (contenu.length > TAILLES_MAX[regle.media]) throw new ErreurMetier(`${regle.media === "image" ? "Image" : regle.media === "audio" ? "Audio" : "Vidéo"} : ${TAILLES_MAX[regle.media] / 1024 / 1024} Mo au plus`, 413);
    if (!regle.signature(contenu)) throw new ErreurMetier("Le contenu du fichier ne correspond pas à son type", 415);
    const utilise = (await MediaQuiz.sum("taille", { where: { id_user: user.id_user } })) ?? 0;
    if (utilise + contenu.length > QUOTA_OCTETS()) throw new ErreurMetier(`Espace des médias plein (${QUOTA_OCTETS() / 1024 / 1024} Mo) : supprimez des médias inutilisés`, 413, "QUOTA_MEDIAS");
    const media = await MediaQuiz.create({
        id_user: user.id_user,
        type: regle.media,
        type_mime: typeMime === "audio/x-wav" ? "audio/wav" : typeMime,
        nom: nomSur(fichier.nom || `${regle.media}`),
        taille: contenu.length,
        empreinte: crypto.createHash("sha256").update(contenu).digest("hex"),
        duree: regle.media === "image" ? null : lireDuree(fichier.duree),
        origine,
        description: lireDescription(fichier.description),
        transcription: fichier.transcription ?? null,
        contenu,
    });
    return vueMedia(media);
};

export const mediaDe = async (user, id, { contenu = false } = {}) => {
    exigerEnseignant(user);
    const media = await MediaQuiz.findOne({ where: { id_media: Number(id) || 0, id_user: user.id_user }, ...(contenu ? {} : { attributes: ATTRIBUTS }) });
    if (!media) throw new ErreurMetier("Média introuvable", 404);
    return media;
};

export const listerMedias = async (user, { type } = {}) => {
    exigerEnseignant(user);
    const where = { id_user: user.id_user, ...(["image", "audio", "video"].includes(type) ? { type } : {}) };
    const [medias, utilise] = await Promise.all([MediaQuiz.findAll({ where, attributes: ATTRIBUTS, order: [["createdAt", "DESC"]], limit: 300 }), MediaQuiz.sum("taille", { where: { id_user: user.id_user } })]);
    return { medias: medias.map(vueMedia), utilise: utilise ?? 0, quota: QUOTA_OCTETS() };
};

export const detailMedia = async (user, id) => vueMedia(await mediaDe(user, id));

/** Description (texte de remplacement), durée mesurée par le navigateur, transcription corrigée à la main. */
export const modifierMedia = async (user, id, { description, duree, transcription } = {}) => {
    const media = await mediaDe(user, id);
    const maj = {};
    if (description !== undefined) maj.description = lireDescription(description);
    if (duree !== undefined && media.type !== "image") maj.duree = lireDuree(duree);
    if (transcription !== undefined) {
        const texte = transcription === null ? null : String(transcription.texte ?? transcription).replace(/<[^>]*>/g, "").trim().slice(0, 20000);
        maj.transcription = texte ? { texte, segments: Array.isArray(media.transcription?.segments) ? media.transcription.segments : [] } : null;
    }
    await media.update(maj);
    return vueMedia(media);
};

/** Supprime un média que plus aucune question ni passation n'utilise. */
export const supprimerMedia = async (user, id) => {
    const media = await mediaDe(user, id);
    const questions = await QuestionQuiz.count({ where: { id_media: media.id_media } });
    const sessions = await SessionQuiz.findAll({ where: { id_user: user.id_user }, attributes: ["questions"] });
    if (questions || sessions.some((s) => (s.questions ?? []).some((q) => q.id_media === media.id_media))) {
        throw new ErreurMetier("Ce média sert encore à une question ou à une passation", 409, "MEDIA_UTILISE");
    }
    await media.destroy();
};

/**
 * Diffuse le contenu, en entier ou par plage (Range : bytes=début-fin), sans jamais l'exécuter :
 * type fixé par le serveur, interdiction de deviner le type, politique de contenu vide.
 */
export const diffuserMedia = (req, res, media) => {
    const total = media.taille;
    const enTetes = {
        "Content-Type": media.type_mime,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": "inline",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "X-Content-Type-Options": "nosniff",
        ETag: `"${media.empreinte}"`,
    };
    if (req.get("If-None-Match") === enTetes.ETag) return res.status(304).set(enTetes).end();
    const plage = /^bytes=(\d*)-(\d*)$/.exec(req.get("Range") ?? "");
    if (plage && (plage[1] || plage[2])) {
        let debutPlage = plage[1] ? Number(plage[1]) : Math.max(0, total - Number(plage[2]));
        let finPlage = plage[1] && plage[2] ? Math.min(Number(plage[2]), total - 1) : total - 1;
        if (debutPlage >= total || debutPlage > finPlage) return res.status(416).set({ "Content-Range": `bytes */${total}` }).end();
        debutPlage = Math.max(0, debutPlage);
        finPlage = Math.max(debutPlage, finPlage);
        return res
            .status(206)
            .set({ ...enTetes, "Content-Range": `bytes ${debutPlage}-${finPlage}/${total}`, "Content-Length": String(finPlage - debutPlage + 1) })
            .end(media.contenu.subarray(debutPlage, finPlage + 1));
    }
    return res.status(200).set({ ...enTetes, "Content-Length": String(total) }).end(media.contenu);
};
