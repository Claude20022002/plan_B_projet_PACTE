import { adresseOtpauth, base32, codeDuPas, depuisBase32, nouveauSecret, pasDe, verifierCode } from "../../utils/totp.js";

/** TOTP (RFC 6238) : valeurs de référence de la RFC (SHA-1, clé « 12345678901234567890 »). */
const CLE_RFC = Buffer.from("12345678901234567890");
const SECRET_RFC = base32(CLE_RFC);

describe("TOTP", () => {
    test("vecteurs de la RFC 6238 (6 derniers chiffres des codes à 8 chiffres)", () => {
        expect(codeDuPas(CLE_RFC, pasDe(new Date(59 * 1000)), 8)).toBe("94287082");
        expect(codeDuPas(CLE_RFC, pasDe(new Date(1111111109 * 1000)), 8)).toBe("07081804");
        expect(codeDuPas(CLE_RFC, pasDe(new Date(1234567890 * 1000)), 8)).toBe("89005924");
        expect(codeDuPas(CLE_RFC, pasDe(new Date(2000000000 * 1000)))).toBe("279037");
    });

    test("base32 aller-retour et secret de 160 bits", () => {
        expect(SECRET_RFC).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
        expect(depuisBase32(SECRET_RFC).equals(CLE_RFC)).toBe(true);
        expect(depuisBase32(" gezd-gnbv ")).toEqual(depuisBase32("GEZDGNBV"));
        const secret = nouveauSecret();
        expect(secret).toMatch(/^[A-Z2-7]{32}$/);
        expect(depuisBase32(secret)).toHaveLength(20);
    });

    test("un code est accepté sur le pas courant et ses voisins, jamais deux fois", () => {
        const maintenant = new Date(1111111109 * 1000);
        const pas = pasDe(maintenant);
        const code = codeDuPas(CLE_RFC, pas);
        expect(verifierCode(SECRET_RFC, code, { maintenant })).toBe(pas);
        expect(verifierCode(SECRET_RFC, ` ${code.slice(0, 3)} ${code.slice(3)} `, { maintenant })).toBe(pas);
        // 30 s d'avance ou de retard : toléré ; 2 minutes : refusé
        expect(verifierCode(SECRET_RFC, code, { maintenant: new Date(maintenant.getTime() + 30_000) })).toBe(pas);
        expect(verifierCode(SECRET_RFC, code, { maintenant: new Date(maintenant.getTime() + 120_000) })).toBeNull();
        // Rejeu : le pas déjà utilisé est refusé
        expect(verifierCode(SECRET_RFC, code, { maintenant, dernierPas: pas })).toBeNull();
        expect(verifierCode(SECRET_RFC, "000000", { maintenant })).toBeNull();
        expect(verifierCode(SECRET_RFC, "12345", { maintenant })).toBeNull();
        expect(verifierCode(SECRET_RFC, undefined, { maintenant })).toBeNull();
    });

    test("adresse otpauth pour le QR code", () => {
        expect(adresseOtpauth({ secret: "ABC", compte: "admin@hestim.ma" })).toBe(
            "otpauth://totp/HESTIM%20Planner%3Aadmin%40hestim.ma?secret=ABC&issuer=HESTIM%20Planner&algorithm=SHA1&digits=6&period=30"
        );
    });
});
