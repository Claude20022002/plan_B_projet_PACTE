import { noterEchecCourriel, noterRequete, reinitialiserCompteurs, resume } from "../../services/supervision/compteurs.js";

// Compteurs de la supervision (lot ME-21) : fenêtre glissante minute par minute, centiles des temps
// de réponse, erreurs 500 et courriels en échec ; rien au-delà d'une heure

let maintenant;
const avancer = (minutes) => {
    maintenant += minutes * 60_000;
};

beforeEach(() => {
    maintenant = Date.UTC(2026, 9, 30, 2, 0, 0);
    reinitialiserCompteurs(() => maintenant);
});

test("compte les requêtes, les erreurs 500 et les courriels en échec de la fenêtre", () => {
    noterRequete(10, 200);
    noterRequete(20, 404);
    noterRequete(30, 500);
    noterRequete(40, 503);
    noterEchecCourriel();
    expect(resume(15)).toMatchObject({ requetes: 4, erreurs5xx: 2, courrielsEnEchec: 1 });
});

test("centiles 50 et 95 des temps de réponse", () => {
    for (let ms = 1; ms <= 100; ms += 1) noterRequete(ms, 200);
    const { p50, p95 } = resume(15);
    expect(p50).toBe(51);
    expect(p95).toBe(96);
});

test("sans requête : zéro et centiles nuls", () => {
    expect(resume(15)).toEqual({ requetes: 0, erreurs5xx: 0, courrielsEnEchec: 0, p50: null, p95: null });
});

test("seules les minutes de la fenêtre comptent", () => {
    noterRequete(10, 500);
    avancer(10);
    noterRequete(10, 200);
    expect(resume(15).requetes).toBe(2);
    expect(resume(5)).toMatchObject({ requetes: 1, erreurs5xx: 0 });
    avancer(20);
    expect(resume(15).requetes).toBe(0);
});

test("rien n'est gardé au-delà d'une heure", () => {
    noterRequete(10, 500);
    avancer(61);
    noterRequete(10, 200);
    expect(resume(120)).toMatchObject({ requetes: 1, erreurs5xx: 0 });
});
