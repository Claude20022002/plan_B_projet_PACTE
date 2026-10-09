/**
 * Tests unitaires pour passwordHelper.js (sans base de données ni réseau : le service
 * Have I Been Pwned est remplacé par une fausse réponse).
 */
import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
    hashPassword,
    comparePassword,
    coutBcrypt,
    empreinteARenouveler,
    estDivulgue,
    reglesMotDePasse,
    verifierMotDePasse,
} from "../../utils/passwordHelper.js";

const compte = { nom: "Benali", prenom: "Hamza", email: "h.benali@hestim.ma" };

describe("reglesMotDePasse (NIST SP 800-63B)", () => {
    test("une phrase de passe sans majuscule ni chiffre est acceptée", () => {
        expect(reglesMotDePasse("le train de nuit pour fes")).toEqual([]);
        expect(reglesMotDePasse("Tr0mpette-Violette!")).toEqual([]);
    });

    test("12 caractères au moins, 64 au plus (et 72 octets pour bcrypt)", () => {
        expect(reglesMotDePasse("Court@123")[0]).toMatch(/au moins 12/);
        expect(reglesMotDePasse("a".repeat(11) + "b")).toEqual([]);
        expect(reglesMotDePasse("x".repeat(30) + "y".repeat(35))[0]).toMatch(/au plus 64/);
        // 30 caractères accentués = 60 octets : accepté ; 40 « é » = 80 octets : refusé
        expect(reglesMotDePasse("éa".repeat(15))).toEqual([]);
        expect(reglesMotDePasse("é".repeat(40)).some((e) => /au plus/.test(e))).toBe(true);
    });

    test("trop courants, répétitifs ou au nom de l'établissement : refusés", () => {
        expect(reglesMotDePasse("motdepasse123")[0]).toMatch(/trop courant/);
        expect(reglesMotDePasse("AZERTYUIOP12")[0]).toMatch(/trop courant/);
        expect(reglesMotDePasse("zzzzzzzzzzzzzz")[0]).toMatch(/trop courant/);
        expect(reglesMotDePasse("Hestim-Planner-2026")[0]).toMatch(/trop courant/);
    });

    test("nom, prénom ou email du compte : refusés (accents et casse ignorés)", () => {
        expect(reglesMotDePasse("benali-pour-toujours", compte)[0]).toMatch(/votre nom/);
        expect(reglesMotDePasse("HAMZA2026-printemps", compte)[0]).toMatch(/votre nom/);
        expect(reglesMotDePasse("le-velo-de-h.benali", compte)[0]).toMatch(/votre nom/);
        expect(reglesMotDePasse("Trompette-Violette", compte)).toEqual([]);
    });
});

describe("estDivulgue (Have I Been Pwned, k-anonymat)", () => {
    const motDePasse = "Trompette-Violette";
    const sha1 = crypto.createHash("sha1").update(motDePasse).digest("hex").toUpperCase();
    const reponse = (texte, ok = true) => async (url) => ({ ok, url, text: async () => texte });

    test("seuls les 5 premiers caractères de l'empreinte sont envoyés", async () => {
        let appel;
        await estDivulgue(motDePasse, { fetchImpl: async (url) => ((appel = url), { ok: true, text: async () => "" }) });
        expect(appel).toBe(`https://api.pwnedpasswords.com/range/${sha1.slice(0, 5)}`);
        expect(appel).not.toContain(sha1.slice(5));
    });

    test("suffixe présent avec un compte > 0 : divulgué ; remplissage (compte 0) ignoré", async () => {
        expect(await estDivulgue(motDePasse, { fetchImpl: reponse(`AAAA:3\r\n${sha1.slice(5)}:42\r\n`) })).toBe(true);
        expect(await estDivulgue(motDePasse, { fetchImpl: reponse(`${sha1.slice(5)}:0\r\n`) })).toBe(false);
        expect(await estDivulgue(motDePasse, { fetchImpl: reponse("AAAA:3") })).toBe(false);
    });

    test("service injoignable ou en erreur : pas de verdict (null)", async () => {
        expect(await estDivulgue(motDePasse, { fetchImpl: async () => { throw new Error("réseau"); } })).toBeNull();
        expect(await estDivulgue(motDePasse, { fetchImpl: reponse("", false) })).toBeNull();
    });

    test("verifierMotDePasse refuse un mot de passe divulgué", async () => {
        const resultat = await verifierMotDePasse(motDePasse, { fetchImpl: reponse(`${sha1.slice(5)}:7`) });
        expect(resultat.valid).toBe(false);
        expect(resultat.errors[0]).toMatch(/fuite/);
        expect((await verifierMotDePasse(motDePasse, { fetchImpl: reponse("") })).valid).toBe(true);
    });
});

describe("hashPassword, comparePassword et coût bcrypt", () => {
    test("hash puis comparaison", async () => {
        const hashed = await hashPassword("Trompette-Violette", 4);
        expect(hashed).not.toBe("Trompette-Violette");
        expect(await comparePassword("Trompette-Violette", hashed)).toBe(true);
        expect(await comparePassword("autre-mot-de-passe", hashed)).toBe(false);
    });

    test("coût 12 par défaut, jamais sous 10 en production", () => {
        const { BCRYPT_COST, NODE_ENV } = process.env;
        try {
            delete process.env.BCRYPT_COST;
            expect(coutBcrypt()).toBe(12);
            process.env.BCRYPT_COST = "4";
            process.env.NODE_ENV = "production";
            expect(coutBcrypt()).toBe(10);
        } finally {
            process.env.NODE_ENV = NODE_ENV;
            if (BCRYPT_COST === undefined) delete process.env.BCRYPT_COST;
            else process.env.BCRYPT_COST = BCRYPT_COST;
        }
    });

    test("une empreinte d'un coût inférieur est à renouveler", async () => {
        const ancienne = await bcrypt.hash("Trompette-Violette", 4);
        expect(empreinteARenouveler(ancienne)).toBe(coutBcrypt() > 4);
        expect(empreinteARenouveler("pas une empreinte")).toBe(false);
    });
});
