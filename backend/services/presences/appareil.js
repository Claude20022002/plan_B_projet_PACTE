import crypto from "crypto";

/**
 * Téléphone de l'étudiant pour l'appel : l'application envoie son identifiant d'installation
 * (en-tête X-Appareil) ; seule son empreinte est conservée. Partagé par l'appel (un compte = un
 * téléphone) et les demandes de changement de téléphone (R-10).
 */

export const APPAREIL = /^[A-Za-z0-9_-]{16,64}$/;

/** Rend l'empreinte SHA-256 (hexadécimale) d'un identifiant d'installation. */
export const empreinteAppareil = (appareil) => crypto.createHash("sha256").update(appareil).digest("hex");
