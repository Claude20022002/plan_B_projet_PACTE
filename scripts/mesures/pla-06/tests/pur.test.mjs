/**
 * Tests des fonctions pures du banc PLA-06 (config, statistiques, séances synthétiques).
 * Lancement : node --test scripts/mesures/pla-06/tests/
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { hoteEcole, motDePasseEcole, nomEcole, numeroDeHote, verifierMachines } from "../lib/config.mjs";
import { centile, estErreur, medianeEtEcart, resumer } from "../lib/stats.mjs";
import { dateDuJour, lundiDe, lundis, planifierSemaine, premierLundiDeLAnnee, seancesDeLAnnee } from "../lib/seances.mjs";

const machines = () => ({
    banc: { adresse: "192.168.1.20", port: 5099, ssh: "moi@pc-ubuntu", depot: "~/Planner" },
    limites: { mysqlMemoire: "2g", innodbPool: "1g", bancMemoire: "1536m", mysqlCpus: 2, bancCpus: 1.5, fichiersOuverts: [1024, 524288] },
});

test("noms des écoles : base, hôte, et retour du nom d'hôte au numéro", () => {
    assert.equal(nomEcole(1), "pla06_ecole_001");
    assert.equal(hoteEcole(200), "ecole-200.banc");
    assert.equal(numeroDeHote("ecole-007.banc:5099"), 7);
    assert.equal(numeroDeHote("ecole-7.banc"), null);
    assert.equal(numeroDeHote(undefined), null);
    assert.throws(() => nomEcole(0), RangeError);
});

test("mot de passe d'une école : stable, propre à chaque école et à chaque secret", () => {
    assert.equal(motDePasseEcole("s", 1), motDePasseEcole("s", 1));
    assert.notEqual(motDePasseEcole("s", 1), motDePasseEcole("s", 2));
    assert.notEqual(motDePasseEcole("s", 1), motDePasseEcole("t", 1));
    assert.match(motDePasseEcole("s", 1), /^[\w-]{32}$/);
});

test("machines.json : valide, puis chaque erreur nommée", () => {
    assert.deepEqual(verifierMachines(machines()), []);
    const m = machines();
    m.banc.adresse = "192.168.1.300";
    m.banc.ssh = "pas une adresse";
    m.limites.mysqlMemoire = "2 Go";
    m.limites.fichiersOuverts = [2048, 1024];
    const erreurs = verifierMachines(m);
    assert.equal(erreurs.length, 4);
    assert.ok(erreurs.some((e) => e.startsWith("banc.adresse")));
    assert.deepEqual(verifierMachines(null), ["machines.json doit contenir un objet"]);
    const sansSsh = machines();
    delete sansSsh.banc.ssh;
    assert.deepEqual(verifierMachines(sansSsh), []);
});

test("centiles par rang le plus proche, résumé, médiane et écart", () => {
    const v = Array.from({ length: 100 }, (_, i) => i + 1);
    assert.equal(centile(v, 50), 50);
    assert.equal(centile(v, 95), 95);
    assert.equal(centile(v, 100), 100);
    assert.equal(centile([], 50), null);
    assert.throws(() => centile(v, 101), RangeError);
    assert.deepEqual(resumer([3, 1, 2, Number.NaN]), { n: 3, min: 1, p50: 2, p95: 3, p99: 3, max: 3, moyenne: 2 });
    assert.deepEqual(medianeEtEcart([120, 100, 110]), { mediane: 110, ecart: 20, passages: 3 });
});

test("erreur au sens du seuil S4 : 5xx, refus ou délai, pas 4xx", () => {
    assert.equal(estErreur({ statut: 503 }), true);
    assert.equal(estErreur({ statut: 404 }), false);
    assert.equal(estErreur({ statut: null, refus: true }), true);
    assert.equal(estErreur({ statut: 200, delaiDepasse: true }), true);
});

test("dates : lundi de la semaine, suite de lundis, jour d'une semaine", () => {
    assert.equal(lundiDe(new Date("2026-11-15T12:00:00Z")), "2026-11-09"); // un dimanche
    assert.equal(lundiDe(new Date("2026-11-09T00:00:00Z")), "2026-11-09");
    assert.deepEqual(lundis("2026-11-09", 3), ["2026-11-09", "2026-11-16", "2026-11-23"]);
    assert.throws(() => lundis("2026-11-10", 2), /pas un lundi/);
    assert.equal(dateDuJour("2026-11-09", "samedi"), "2026-11-14");
    assert.equal(premierLundiDeLAnnee(new Date("2026-11-11T08:00:00Z")), "2026-09-14");
});

test("semaine type : environ 30 h par groupe, enseignements à tour de rôle, sans dimanche", () => {
    const creneaux = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"].flatMap((jour, j) =>
        ["08:30", "10:30", "13:30", "15:30"].map((h, k) => ({ id_creneau: j * 10 + k, jour_semaine: jour, heure_debut: h, duree_minutes: 120 })));
    const enseignements = [
        { id_enseignement: 1, id_groupe: 7, id_cours: 70, id_user_enseignant: 700 },
        { id_enseignement: 2, id_groupe: 7, id_cours: 71, id_user_enseignant: 701 },
        { id_enseignement: 3, id_groupe: 8, id_cours: 80, id_user_enseignant: 800 },
    ];
    const semaine = planifierSemaine({ enseignements, creneaux, salles: [{ id_salle: 1 }, { id_salle: 2 }] });
    const groupe7 = semaine.filter((s) => s.id_groupe === 7);
    assert.equal(groupe7.length, 15); // 15 × 2 h = 30 h
    assert.deepEqual(groupe7.slice(0, 3).map((s) => s.id_enseignement), [1, 2, 1]);
    assert.ok(semaine.every((s) => s.jour !== "dimanche"));
    assert.equal(semaine.filter((s) => s.id_groupe === 8).length, 15);
    const annee = seancesDeLAnnee(semaine, lundis("2026-11-09", 36));
    assert.equal(annee.length, 30 * 36);
    assert.equal(annee[0].date_seance, "2026-11-09");
    assert.throws(() => planifierSemaine({ enseignements, creneaux: [], salles: [] }), /Aucun créneau/);
});
