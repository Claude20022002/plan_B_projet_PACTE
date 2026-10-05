import { PartieTerminal, defisLinux, pointsPour } from "../../../shared/terminal/jeu.js";
import { JEUX, jeuParCode } from "../../../shared/jeux/catalogue.js";
import { DEFIS_FR } from "../../../shared/terminal/defis-fr.js";

/**
 * Jeu « Terminal Linux » (shared/terminal) : chaque défi se résout par sa solution et seulement
 * par elle, ses textes existent en français, et le terminal reste une simulation.
 */

describe("Défis du terminal Linux", () => {
    const defis = defisLinux("fr");

    test.each(defis.map((d) => [d.id, d]))("%s : non résolu au départ, résolu par sa solution", (_id, defi) => {
        const partie = new PartieTerminal(defi.id, { joueur: "Mintsa" });
        expect(partie.verifier().ok).toBe(false);
        for (const ligne of defi.solution.split("\n")) partie.executer(ligne);
        expect(partie.verifier()).toEqual({ ok: true, message: "" });
    });

    test("chaque défi a ses textes français (titre, objectif, message d'échec)", () => {
        for (const d of defis) {
            expect(DEFIS_FR[d.id]).toBeDefined();
            expect(DEFIS_FR[d.id].titre).toBeTruthy();
            expect(DEFIS_FR[d.id].objectif).toBeTruthy();
            expect(DEFIS_FR[d.id].echec).toBeTruthy();
            expect(d.indices).toHaveLength(3);
        }
        expect(Object.keys(DEFIS_FR).sort()).toEqual(defis.map((d) => d.id).sort());
    });

    test("le message d'échec suit la langue de la partie", () => {
        expect(new PartieTerminal("navigation-01", { langue: "fr" }).verifier().message).toBe("Vous n'êtes pas encore dans projects.");
        expect(new PartieTerminal("navigation-01", { langue: "en" }).verifier().message).toBe("You are not inside projects yet.");
    });

    test("le catalogue reprend tous les défis, avec leur source et sa licence", () => {
        const jeu = jeuParCode("terminal-linux");
        expect(jeu.defis.map((d) => d.id)).toEqual(defis.map((d) => d.id));
        expect(jeu.source.licence).toBe("MIT");
        expect(JEUX.every((j) => /^[a-z0-9-]{3,40}$/.test(j.code))).toBe(true);
    });
});

describe("Terminal simulé", () => {
    test("tubes, redirections et variables, sans rien exécuter sur la machine", () => {
        const partie = new PartieTerminal(null, { joueur: "Mintsa Obame" });
        expect(partie.invite).toBe("mintsa-obame@hestim-lab:~ $");
        partie.executer('echo "bonjour" > salut.txt');
        expect(partie.executer("cat salut.txt | wc -l").sortie.trim()).toBe("1");
        expect(partie.executer("echo $HOME").sortie).toBe("/home/mintsa-obame\n");
        expect(partie.executer("node -e 1").erreur).toMatch(/command not found/);
        expect(partie.executer("rm -r /").erreur).toMatch(/Permission denied/);
    });

    test("complétion et commande help", () => {
        const partie = new PartieTerminal(null);
        expect(partie.completer("cd proj").valeur).toBe("cd projects/");
        expect(partie.executer("help").sortie).toMatch(/\bgrep\b/);
    });
});

describe("Barème", () => {
    test("moins de points avec des indices, 10 si la réponse a été affichée", () => {
        expect([0, 1, 2, 3, 4].map((n) => pointsPour(100, n))).toEqual([100, 80, 60, 40, 10]);
        expect(pointsPour(150, 99)).toBe(10);
        expect(pointsPour(150, -3)).toBe(150);
    });
});
