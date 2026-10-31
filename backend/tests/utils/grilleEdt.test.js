import { grilleDuPdf, jourDeSeance, libelleHoraire } from "../../../shared/grilleEdt.js";

// Grille horaire du PDF de l'emploi du temps (lot ME-1, règles G-1 à G-7 et G-9)

// Grille de HESTIM (backend/seed.js) : 4 créneaux, vendredi après-midi décalé, samedi matin seulement
const MATIN = [["09:00:00", "10:45:00"], ["11:00:00", "12:30:00"]];
const APRES_MIDI = [["13:30:00", "15:15:00"], ["15:30:00", "17:00:00"]];
const VENDREDI = [["14:30:00", "16:15:00"], ["16:30:00", "18:00:00"]];
const PLAGES = { lundi: [...MATIN, ...APRES_MIDI], mardi: [...MATIN, ...APRES_MIDI], mercredi: [...MATIN, ...APRES_MIDI], jeudi: [...MATIN, ...APRES_MIDI], vendredi: [...MATIN, ...VENDREDI], samedi: MATIN };
const creneau = (jour, [debut, fin], rang, autres = {}) => ({ jour_semaine: jour, heure_debut: debut, heure_fin: fin, rang, regime: "initiale", variante: "normale", ...autres });
const HESTIM = Object.entries(PLAGES).flatMap(([jour, plages]) => plages.map((p, i) => creneau(jour, p, i + 1)));
const seance = (date, c) => ({ date_seance: date, creneau: c });

describe("grille de l'école pilote", () => {
    const grille = grilleDuPdf(HESTIM, []);

    test("4 colonnes aux horaires réels, libellées par l'horaire le plus fréquent de leur rang", () => {
        expect(grille.colonnes.map((c) => c.libelle)).toEqual(["09h00 - 10h45", "11h00 - 12h30", "13h30 - 15h15", "15h30 - 17h00"]);
        expect(grille.colonnes.map((c) => c.matin)).toEqual([true, true, false, false]);
    });

    test("du lundi au samedi, vendredi compris", () => {
        expect(grille.jours).toEqual(["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]);
    });

    test("une séance du vendredi à 14h30 va en 3e colonne, son horaire écrit", () => {
        const vendredi = seance("2026-11-06", creneau("vendredi", VENDREDI[0], 3));
        const g = grilleDuPdf(HESTIM, [vendredi]);
        expect(g.colonneDe(vendredi)).toBe(2);
        expect(g.horaireDiffere(vendredi)).toBe(true);
        const lundi = seance("2026-11-02", creneau("lundi", MATIN[1], 2));
        expect([g.colonneDe(lundi), g.horaireDiffere(lundi)]).toEqual([1, false]);
    });
});

describe("source de la grille (G-1, G-9)", () => {
    test("la variante Ramadan et les autres régimes sont ignorés", () => {
        const autres = [creneau("lundi", ["09:00", "10:00"], 1, { variante: "ramadan" }), creneau("lundi", ["18:00", "20:00"], 5, { regime: "continue" })];
        expect(grilleDuPdf([...HESTIM, ...autres], []).colonnes).toHaveLength(4);
    });

    test("le régime des séances exportées choisit la grille", () => {
        const soir = [creneau("lundi", ["18:00", "19:30"], 1, { regime: "continue" }), creneau("lundi", ["19:45", "21:15"], 2, { regime: "continue" })];
        const g = grilleDuPdf([...HESTIM, ...soir], [seance("2026-11-02", soir[1])]);
        expect(g.colonnes.map((c) => c.libelle)).toEqual(["18h00 - 19h30", "19h45 - 21h15"]);
        expect(g.jours).toEqual(["lundi"]);
    });

    test("aucun créneau lisible : la grille est tirée des créneaux des séances", () => {
        const s = [seance("2026-11-02", creneau("lundi", MATIN[0], 1)), seance("2026-11-03", creneau("mardi", APRES_MIDI[0], 3))];
        const g = grilleDuPdf([], s);
        expect(g.colonnes.map((c) => c.libelle)).toEqual(["09h00 - 10h45", "13h30 - 15h15"]);
        expect(g.jours).toEqual(["lundi", "mardi"]);
        expect(s.map(g.colonneDe)).toEqual([0, 1]);
    });

    test("ni créneau ni séance : grille vide, aucune colonne", () => {
        expect(grilleDuPdf(undefined, [])).toMatchObject({ jours: [], colonnes: [] });
        expect(grilleDuPdf([], []).colonneDe(seance("2026-11-02", null))).toBe(-1);
    });
});

describe("placement (G-3, G-4, G-5)", () => {
    test("créneau sans rang : sa place dans la journée, par heure de début", () => {
        const sansRang = HESTIM.filter((c) => c.jour_semaine === "lundi").map(({ rang, ...c }) => c);
        expect(grilleDuPdf(sansRang, []).colonnes.map((c) => c.rang)).toEqual([1, 2, 3, 4]);
    });

    test("séance hors grille : la dernière colonne commencée, sinon la première", () => {
        const g = grilleDuPdf(HESTIM, []);
        expect(g.colonneDe(seance("2026-11-02", creneau("lundi", ["12:00", "13:00"], null)))).toBe(1);
        expect(g.colonneDe(seance("2026-11-02", creneau("lundi", ["00:05", "23:55"], null)))).toBe(0);
        expect(g.colonneDe(seance("2026-11-02", {}))).toBe(0);
    });

    test("une séance un dimanche ajoute la ligne du dimanche", () => {
        expect(grilleDuPdf(HESTIM, [seance("2026-11-08", creneau("lundi", MATIN[0], 1))]).jours.at(-1)).toBe("dimanche");
    });

    test("une grille de 3 créneaux du matin au soir", () => {
        const autreEcole = ["lundi", "mardi"].flatMap((j) => [creneau(j, ["08:00", "10:00"], 1), creneau(j, ["10:15", "12:15"], 2), creneau(j, ["14:00", "16:00"], 3)]);
        const g = grilleDuPdf(autreEcole, []);
        expect(g.colonnes.map((c) => [c.libelle, c.matin])).toEqual([["08h00 - 10h00", true], ["10h15 - 12h15", true], ["14h00 - 16h00", false]]);
    });
});

describe("outils", () => {
    test("jour d'une séance : sa date, sinon son créneau", () => {
        expect(jourDeSeance({ date_seance: "2026-11-06" })).toBe("vendredi");
        expect(jourDeSeance({ date_seance: "2026-11-08T00:00:00.000Z" })).toBe("dimanche");
        expect(jourDeSeance({ creneau: { jour_semaine: "Mardi" } })).toBe("mardi");
    });

    test("libellé d'un horaire", () => {
        expect(libelleHoraire("09:00:00", "10:45:00")).toBe("09h00 - 10h45");
    });
});
