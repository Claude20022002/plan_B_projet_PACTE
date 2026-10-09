import crypto from "crypto";

/**
 * Codes à usage unique basés sur le temps (TOTP, RFC 6238) : ceux des applications
 * d'authentification (Google Authenticator, Microsoft Authenticator, 2FAS…). HMAC-SHA1, 6 chiffres,
 * pas de 30 secondes ; un code est accepté sur le pas courant et ses voisins (décalage d'horloge).
 */

export const PAS_SECONDES = 30;
const CHIFFRES = 6;
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export const base32 = (octets) => {
    let bits = 0;
    let valeur = 0;
    let sortie = "";
    for (const octet of octets) {
        valeur = (valeur << 8) | octet;
        bits += 8;
        while (bits >= 5) {
            sortie += BASE32[(valeur >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) sortie += BASE32[(valeur << (5 - bits)) & 31];
    return sortie;
};

export const depuisBase32 = (texte) => {
    const propre = String(texte).toUpperCase().replace(/[\s=-]/g, "");
    let bits = 0;
    let valeur = 0;
    const octets = [];
    for (const lettre of propre) {
        const index = BASE32.indexOf(lettre);
        if (index < 0) throw new Error("Secret base32 invalide");
        valeur = (valeur << 5) | index;
        bits += 5;
        if (bits >= 8) {
            octets.push((valeur >>> (bits - 8)) & 255);
            bits -= 8;
        }
    }
    return Buffer.from(octets);
};

/** Nouveau secret : 20 octets aléatoires (160 bits, recommandation de la RFC 4226), en base32. */
export const nouveauSecret = () => base32(crypto.randomBytes(20));

/** Pas de temps (nombre de périodes de 30 s depuis l'époque Unix). */
export const pasDe = (date = new Date()) => Math.floor(date.getTime() / 1000 / PAS_SECONDES);

/** Code du pas donné, à partir de la clé brute (Buffer). */
export const codeDuPas = (cle, pas, chiffres = CHIFFRES) => {
    const compteur = Buffer.alloc(8);
    compteur.writeBigUInt64BE(BigInt(pas));
    const hmac = crypto.createHmac("sha1", cle).update(compteur).digest();
    const decalage = hmac[hmac.length - 1] & 0x0f;
    const binaire = hmac.readUInt32BE(decalage) & 0x7fffffff;
    return String(binaire % 10 ** chiffres).padStart(chiffres, "0");
};

/**
 * Vérifie un code : renvoie le pas reconnu, ou null. Un pas déjà utilisé (dernierPas) ou plus
 * ancien est refusé : un code vu par-dessus l'épaule ne resert pas.
 */
export const verifierCode = (secretBase32, code, { maintenant = new Date(), dernierPas = null, tolerance = 1 } = {}) => {
    const saisi = String(code ?? "").replace(/\s/g, "");
    if (!/^\d{6}$/.test(saisi)) return null;
    const cle = depuisBase32(secretBase32);
    const courant = pasDe(maintenant);
    for (let ecart = -tolerance; ecart <= tolerance; ecart += 1) {
        const pas = courant + ecart;
        if (dernierPas !== null && pas <= Number(dernierPas)) continue;
        const attendu = codeDuPas(cle, pas);
        if (crypto.timingSafeEqual(Buffer.from(attendu), Buffer.from(saisi))) return pas;
    }
    return null;
};

/** Adresse à mettre dans le QR code, lue par l'application d'authentification. */
export const adresseOtpauth = ({ secret, compte, emetteur = "HESTIM Planner" }) =>
    `otpauth://totp/${encodeURIComponent(`${emetteur}:${compte}`)}?secret=${secret}&issuer=${encodeURIComponent(emetteur)}&algorithm=SHA1&digits=${CHIFFRES}&period=${PAS_SECONDES}`;
