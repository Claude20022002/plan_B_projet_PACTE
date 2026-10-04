import crypto from "crypto";
import jwt from "jsonwebtoken";

/**
 * Jetons d'accès de Planner, fournisseur d'identité de la plateforme (phase C1).
 *
 * Signés en RS256 par la clé privée de Planner ; les autres services (StudyLib, application
 * mobile) les vérifient avec la clé publique publiée en JWKS (GET /api/.well-known/jwks.json),
 * sans jamais connaître de secret. Chaque clé porte un `kid` (empreinte RFC 7638) : une
 * nouvelle clé peut être introduite en gardant l'ancienne publiée le temps que ses jetons
 * expirent (JWT_PREVIOUS_PUBLIC_KEY).
 *
 * JWT_PRIVATE_KEY : clé RSA (PKCS#8 ou PKCS#1, 2048 bits au moins) en PEM ; les retours à la
 * ligne peuvent être écrits « \n » dans le fichier d'environnement. Obligatoire en production ;
 * en développement et en test, une clé éphémère est générée au démarrage.
 */

export const EMETTEUR = process.env.JWT_ISSUER || "hestim-planner";
// Un jeton sert à Planner et à StudyLib (connexion unique) ; chaque service vérifie la sienne
export const AUDIENCES = ["planner", "studylib"];
const ALGORITHME = "RS256";

const pem = (valeur) => (valeur ? valeur.replace(/\\n/g, "\n").trim() : null);

const chargerClePrivee = () => {
    const fournie = pem(process.env.JWT_PRIVATE_KEY);
    if (fournie) return crypto.createPrivateKey(fournie);
    if (process.env.NODE_ENV === "production") {
        console.error("ERREUR CRITIQUE : JWT_PRIVATE_KEY n'est pas définie. Arrêt du serveur.");
        process.exit(1);
    }
    if (process.env.NODE_ENV !== "test") {
        console.warn("AVERTISSEMENT : JWT_PRIVATE_KEY non définie, clé RSA éphémère (développement seulement : les sessions tombent au redémarrage).");
    }
    return crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
};

const clePrivee = chargerClePrivee();
if (clePrivee.asymmetricKeyType !== "rsa" || clePrivee.asymmetricKeyDetails?.modulusLength < 2048) {
    console.error("ERREUR CRITIQUE : JWT_PRIVATE_KEY doit être une clé RSA de 2048 bits au moins.");
    process.exit(1);
}

/** Empreinte RFC 7638 d'une clé publique RSA : identifiant stable, sans configuration. */
const empreinte = (jwk) =>
    crypto.createHash("sha256").update(JSON.stringify({ e: jwk.e, kty: jwk.kty, n: jwk.n })).digest("base64url");

const decrire = (clePublique) => {
    const jwk = clePublique.export({ format: "jwk" });
    return { kid: empreinte(jwk), clePublique, jwk: { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: ALGORITHME, use: "sig", kid: empreinte(jwk) } };
};

const courante = decrire(crypto.createPublicKey(clePrivee));
const precedente = pem(process.env.JWT_PREVIOUS_PUBLIC_KEY) ? decrire(crypto.createPublicKey(pem(process.env.JWT_PREVIOUS_PUBLIC_KEY))) : null;
const parKid = new Map([courante, precedente].filter(Boolean).map((c) => [c.kid, c.clePublique]));

/** Jeu de clés publiques (JWKS) : la courante, et la précédente pendant une rotation. */
export const jeuDeCles = () => ({ keys: [courante, precedente].filter(Boolean).map((c) => c.jwk) });

/**
 * Signe un jeton d'accès. `revendications` : sub, sid, fid, role, email, nom, prenom et, pour un
 * étudiant, filiere (code), niveau, groupe — ce dont StudyLib a besoin pour ouvrir le compte.
 */
export const signerJetonAcces = (revendications, dureeSecondes) =>
    jwt.sign({ ...revendications, jti: crypto.randomUUID() }, clePrivee, {
        algorithm: ALGORITHME,
        keyid: courante.kid,
        expiresIn: dureeSecondes,
        issuer: EMETTEUR,
        audience: AUDIENCES,
    });

/**
 * Vérifie un jeton d'accès pour Planner : RS256 uniquement (aucun « none » ni HS256, qui
 * permettrait de signer avec la clé publique), émetteur, audience et clé connue par son kid.
 */
export const verifierJetonAcces = (jeton) => {
    const entete = jwt.decode(jeton, { complete: true })?.header;
    const cle = entete && parKid.get(entete.kid);
    if (!cle) {
        const erreur = new jwt.JsonWebTokenError("Clé de signature inconnue");
        throw erreur;
    }
    return jwt.verify(jeton, cle, { algorithms: [ALGORITHME], issuer: EMETTEUR, audience: "planner" });
};
