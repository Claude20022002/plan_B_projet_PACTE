import { DUREE_QUESTION, POINTS_BASE, classer, classerEquipes, dureeQuestion, nuageDeMots, pointsDirect, questionsHorsDirect, repartition } from "../../../shared/quiz/studio/direct.js";

/**
 * Quiz en direct du Studio (lot SC-1a) : points selon la justesse et la rapidité, durée bornée,
 * classement avec égalités, défi par équipes à la moyenne, nuage de mots, répartition des choix.
 */

describe("Points : justesse et rapidité", () => {
    test("faux ou sans réponse : rien, quelle que soit la rapidité", () => {
        expect(pointsDirect({ part: 0, delaiMs: 0, dureeS: 20 })).toBe(0);
        expect(pointsDirect({ part: Number.NaN, delaiMs: 0, dureeS: 20 })).toBe(0);
    });

    test("juste : tous les points à l'instant, la moitié à la dernière seconde, jamais moins", () => {
        expect(pointsDirect({ part: 1, delaiMs: 0, dureeS: 20 })).toBe(POINTS_BASE);
        expect(pointsDirect({ part: 1, delaiMs: 10000, dureeS: 20 })).toBe(750);
        expect(pointsDirect({ part: 1, delaiMs: 20000, dureeS: 20 })).toBe(500);
        expect(pointsDirect({ part: 1, delaiMs: 25000, dureeS: 20 })).toBe(500);
    });

    test("plus rapide, plus de points ; une question à deux points en vaut deux fois plus", () => {
        expect(pointsDirect({ part: 1, delaiMs: 2000, dureeS: 20 })).toBeGreaterThan(pointsDirect({ part: 1, delaiMs: 8000, dureeS: 20 }));
        expect(pointsDirect({ part: 1, delaiMs: 0, dureeS: 20, poids: 2 })).toBe(2 * POINTS_BASE);
    });

    test("en partie juste : une part des points", () => {
        expect(pointsDirect({ part: 0.5, delaiMs: 0, dureeS: 20 })).toBe(500);
    });
});

test("durée d'une question : bornée, par défaut sinon", () => {
    expect(dureeQuestion(undefined)).toBe(DUREE_QUESTION.defaut);
    expect(dureeQuestion("abc")).toBe(DUREE_QUESTION.defaut);
    expect(dureeQuestion(1)).toBe(DUREE_QUESTION.min);
    expect(dureeQuestion(999)).toBe(DUREE_QUESTION.max);
    expect(dureeQuestion("30")).toBe(30);
});

test("questions hors direct : réponse rédigée, zone sur image, association, texte à trous", () => {
    const types = ["choix_unique", "reponse_libre", "ordre", "zone_image", "association", "texte_trous", "numerique"];
    expect(questionsHorsDirect(types.map((type) => ({ type }))).map((q) => q.type)).toEqual(["reponse_libre", "zone_image", "association", "texte_trous"]);
});

test("classement : points décroissants, même rang à égalité", () => {
    const rangs = classer([
        { id_user: 1, nom: "B", points: 500 },
        { id_user: 2, nom: "A", points: 900 },
        { id_user: 3, nom: "C", points: 500 },
        { id_user: 4, nom: "D", points: 0 },
    ]).map((j) => [j.id_user, j.rang]);
    expect(rangs).toEqual([[2, 1], [1, 2], [3, 2], [4, 4]]);
});

test("équipes : moyenne des points, une grande équipe n'est pas avantagée ; un joueur sans équipe ne compte pas", () => {
    const joueurs = [{ id_user: 1, points: 900 }, { id_user: 2, points: 100 }, { id_user: 3, points: 100 }, { id_user: 4, points: 600 }, { id_user: 5, points: 1000 }];
    const tp1 = { id: 10, nom: "TP1" };
    const tp2 = { id: 11, nom: "TP2" };
    const equipes = classerEquipes(joueurs, new Map([[1, tp1], [2, tp1], [3, tp1], [4, tp2]]));
    expect(equipes.map((e) => [e.nom, e.points, e.joueurs, e.rang])).toEqual([["TP2", 600, 1, 1], ["TP1", 367, 3, 2]]);
});

test("nuage de mots : casse, accents et ponctuation réunis, les plus fréquents d'abord", () => {
    expect(nuageDeMots(["ARP", "arp.", " Arp ", "DNS", "", null])).toEqual([{ texte: "ARP", nombre: 3 }, { texte: "DNS", nombre: 1 }]);
});

test("répartition : par option, par vrai ou faux, rien pour les autres types", () => {
    const choix = { type: "choix_multiple", donnees: { options: [{ id: "o1" }, { id: "o2" }, { id: "o3" }] } };
    expect(repartition(choix, [["o1", "o3"], ["o1"], "o9"])).toEqual([{ id: "o1", nombre: 2 }, { id: "o2", nombre: 0 }, { id: "o3", nombre: 1 }]);
    expect(repartition({ type: "vrai_faux", donnees: {} }, [true, false, true])).toEqual([{ id: "true", nombre: 2 }, { id: "false", nombre: 1 }]);
    expect(repartition({ type: "numerique", donnees: {} }, [12])).toBeNull();
});
