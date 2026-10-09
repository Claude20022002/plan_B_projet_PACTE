import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Mots de passe : empreinte bcrypt et politique de choix (NIST SP 800-63B, OWASP ASVS V2.1).
 * Pas de règle de composition (majuscule, chiffre, caractère spécial) : la longueur compte, une
 * phrase de passe convient. Refusés : trop courts, trop longs pour bcrypt, trop courants, liés
 * au compte (nom, prénom, email) ou divulgués dans une fuite connue (Have I Been Pwned).
 */

export const LONGUEUR_MIN = 12;
export const LONGUEUR_MAX = 64;
// bcrypt ignore tout ce qui dépasse 72 octets : deux mots de passe différents au-delà seraient égaux
const OCTETS_MAX = 72;

/**
 * Coût bcrypt : 12 par défaut (OWASP : 10 au moins). BCRYPT_COST permet de l'abaisser pour les
 * tests ; jamais sous 10 en production.
 */
export const coutBcrypt = () => {
    const cout = Number(process.env.BCRYPT_COST) || 12;
    return process.env.NODE_ENV === "production" ? Math.max(10, cout) : Math.max(4, cout);
};

export const hashPassword = (password, saltRounds = coutBcrypt()) => bcrypt.hash(password, saltRounds);

export const comparePassword = (password, hashedPassword) => bcrypt.compare(password, hashedPassword);

/** Empreinte calculée avec un coût inférieur au coût actuel : à recalculer (à la connexion). */
export const empreinteARenouveler = (hashedPassword) => {
    try {
        return bcrypt.getRounds(hashedPassword) < coutBcrypt();
    } catch {
        return false;
    }
};

// Mots de passe parmi les plus essayés (complétés par la vérification des fuites, et par le
// nom de l'établissement, des comptes et de l'année, contrôlés à part)
const COURANTS = new Set([
    "123456789012", "azertyuiop12", "motdepasse123", "motdepasse1234", "password1234", "password12345",
    "qwertyuiop12", "azertyuiopqs", "abcdefghijkl", "aaaaaaaaaaaa", "000000000000", "111111111111",
    "iloveyou1234", "bienvenue123", "bienvenue1234", "welcome12345", "changeme1234", "soleil123456",
    "marocmaroc12", "casablanca12", "casablanca123", "administrateur", "admin1234567", "etudiant1234",
    "enseignant12", "professeur12",
]);

const sansAccents = (texte) => String(texte ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Règles locales (sans réseau) ; `user` : { nom, prenom, email } du compte s'il est connu. */
export const reglesMotDePasse = (password, user = null) => {
    const erreurs = [];
    if (typeof password !== "string" || password.length < LONGUEUR_MIN) {
        erreurs.push(`Le mot de passe doit contenir au moins ${LONGUEUR_MIN} caractères (une phrase de passe convient)`);
        return erreurs;
    }
    if (password.length > LONGUEUR_MAX || Buffer.byteLength(password, "utf8") > OCTETS_MAX) {
        erreurs.push(`Le mot de passe doit contenir au plus ${LONGUEUR_MAX} caractères`);
    }
    const normalise = sansAccents(password);
    if (COURANTS.has(normalise) || /^(.)\1+$/.test(password) || normalise.includes("hestim")) {
        erreurs.push("Ce mot de passe est trop courant : choisissez-en un moins prévisible");
    }
    const personnels = [user?.nom, user?.prenom, String(user?.email ?? "").split("@")[0]].map(sansAccents).filter((m) => m.length >= 4);
    if (personnels.some((mot) => normalise.includes(mot))) {
        erreurs.push("Le mot de passe ne doit contenir ni votre nom, ni votre prénom, ni votre email");
    }
    return erreurs;
};

/**
 * Le mot de passe figure-t-il dans une fuite connue ? Have I Been Pwned, par k-anonymat : seuls
 * les 5 premiers caractères de son empreinte SHA-1 sont envoyés. Service injoignable : null (on
 * n'empêche pas de changer de mot de passe pour autant). MOTS_DE_PASSE_FUITES=false désactive.
 */
export const estDivulgue = async (password, { fetchImpl = globalThis.fetch, delaiMs = 2500 } = {}) => {
    if (process.env.MOTS_DE_PASSE_FUITES === "false" || !fetchImpl) return null;
    const empreinte = crypto.createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
    const [prefixe, suffixe] = [empreinte.slice(0, 5), empreinte.slice(5)];
    try {
        const reponse = await fetchImpl(`https://api.pwnedpasswords.com/range/${prefixe}`, {
            headers: { "Add-Padding": "true", "User-Agent": "HESTIM-Planner" },
            signal: AbortSignal.timeout(delaiMs),
        });
        if (!reponse.ok) return null;
        return (await reponse.text()).split("\n").some((ligne) => {
            const [s, nombre] = ligne.trim().split(":");
            return s === suffixe && Number(nombre) > 0;
        });
    } catch {
        return null;
    }
};

/** Vérification complète : { valid, errors } (règles locales, puis fuites connues). */
export const verifierMotDePasse = async (password, { user = null, fetchImpl } = {}) => {
    const errors = reglesMotDePasse(password, user);
    if (!errors.length && (await estDivulgue(password, { fetchImpl }))) {
        errors.push("Ce mot de passe figure dans une fuite de données connue : choisissez-en un autre");
    }
    return { valid: errors.length === 0, errors };
};
