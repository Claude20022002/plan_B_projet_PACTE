import { Op } from "sequelize";
import {
    Affectation,
    AnneeUniversitaire,
    Cours,
    CoursComposante,
    Creneau,
    Enseignement,
    EnseignementEnseignant,
    EnseignementGroupe,
    Evenement,
    Filiere,
    Groupe,
    Periode,
    Salle,
    Users,
} from "../../models/index.js";
import { ErreurMetier } from "./enseignements.js";
import { STATUTS_ACTIFS, jourDe, minutes, seChevauchent } from "./affectationRules.js";
import { ancetres } from "./groupes.js";
import { appliquerRamadan } from "./ramadan.js";

/**
 * Emploi du temps mensuel au format HESTIM (phase P4), calqué sur l'EDT officiel d'octobre 2026
 * (docs/Planning) : en-tête, une ligne par semaine puis par jour, matin (rangs 1-2) et
 * après-midi (rangs 3-4), créneaux consécutifs d'un même enseignement fusionnés, (P.S) / (D.S)
 * sur la première et la dernière séance, distanciel, événements en blocs, horaire décalé du
 * vendredi rappelé. Le frontend n'a plus qu'à dessiner la structure renvoyée.
 */

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const JOURS_COURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const APRES_MIDI = 12 * 60 + 30;
const hhmm = (h) => String(h).slice(0, 5);
const heureLisible = (h) => hhmm(h).replace(":", "h");
const ordinal = (n) => (n === 1 ? "1ère" : `${n}ème`);

const ajouterJour = (date, n) => {
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
};
const libelleJour = (date) => {
    const [, m, j] = date.split("-").map(Number);
    return `${jourDe(date)} ${j} ${MOIS[m - 1]} ${date.slice(0, 4)}`;
};
const libelleSemaine = (debut, fin) => {
    const [, m1, j1] = debut.split("-").map(Number);
    const [annee, m2, j2] = fin.split("-").map(Number);
    const deux = (n) => String(n).padStart(2, "0");
    const mois = (m) => MOIS[m - 1].charAt(0).toUpperCase() + MOIS[m - 1].slice(1);
    return m1 === m2 ? `Du ${deux(j1)} Au ${deux(j2)} ${mois(m2)} ${annee}` : `Du ${deux(j1)} ${mois(m1)} Au ${deux(j2)} ${mois(m2)} ${annee}`;
};
const nomEnseignant = (u) => (u ? `${u.prenom ? `${u.prenom[0]}. ` : ""}${u.nom}` : "");
const demiDe = (creneau) => (minutes(creneau.heure_debut) < APRES_MIDI ? "matin" : "apres_midi");

/** Intitulé de la classe : « 2ème année du cycle Ingénieur d'Etat en … » et « 4A | IIIA (S7) ». */
const intitules = (groupe, periode) => {
    const filiere = groupe.filiere;
    const annee = groupe.annee ?? Number(String(groupe.niveau).match(/\d/)?.[0]) ?? null;
    const anneeCycle = annee && filiere?.premiere_annee_cycle ? annee - filiere.premiere_annee_cycle + 1 : annee;
    const semestre = annee && periode ? (periode.code === "S1" ? 2 * annee - 1 : 2 * annee) : null;
    return {
        intitule_classe: filiere?.intitule_cycle && anneeCycle ? `${ordinal(anneeCycle)} année du ${filiere.intitule_cycle} en ${filiere.nom_filiere}` : filiere?.nom_filiere ?? groupe.nom_groupe,
        code_classe: `${annee ? `${annee}A` : groupe.nom_groupe} | ${filiere?.code_filiere ?? ""}${semestre ? ` (S${semestre})` : ""}`,
    };
};

/** Un événement bloquant concerne-t-il la classe (et quelles heures) ? */
const evenementDeLaClasse = (e, { groupe, idsGroupes }) => {
    switch (e.portee) {
        case "etablissement":
            return true;
        case "campus":
            return groupe.filiere?.id_campus_prefere === e.id_cible;
        case "filiere":
            return groupe.id_filiere === e.id_cible;
        case "niveau":
            return (!e.id_cible || groupe.id_filiere === e.id_cible) && String(groupe.annee ?? "") === String(e.niveau ?? "").match(/\d/)?.[0];
        case "groupe":
            return idsGroupes.includes(e.id_cible);
        default:
            return false;
    }
};

export const edtMensuel = async ({ id_groupe, mois }) => {
    if (!/^\d{4}-\d{2}$/.test(String(mois || ""))) throw new ErreurMetier("Mois attendu au format AAAA-MM", 400);
    const groupe = await Groupe.findByPk(id_groupe, { include: [{ model: Filiere, as: "filiere" }] });
    if (!groupe) throw new ErreurMetier("Groupe introuvable", 404);
    const famille = await Groupe.findAll({ where: { id_filiere: groupe.id_filiere } });
    // La classe suit ses propres séances et celles des groupes qui la contiennent (CM de la promotion)
    const idsGroupes = [groupe.id_groupe, ...ancetres(groupe, new Map(famille.map((g) => [g.id_groupe, g]))).map((g) => g.id_groupe)];

    const [anneeNum, moisNum] = mois.split("-").map(Number);
    const premier = `${mois}-01`;
    const dernier = new Date(Date.UTC(anneeNum, moisNum, 0)).toISOString().slice(0, 10);
    const [annee, periode] = await Promise.all([
        AnneeUniversitaire.findOne({ where: { date_debut: { [Op.lte]: dernier }, date_fin: { [Op.gte]: premier } } }),
        Periode.findOne({ where: { date_debut: { [Op.lte]: dernier }, date_fin: { [Op.gte]: premier } } }),
    ]);

    // Grille de la filière : rangs du matin et de l'après-midi, horaires du vendredi
    const regime = groupe.filiere?.regime ?? "initiale";
    const creneaux = await Creneau.findAll({ where: { regime, variante: "normale" }, order: [["rang", "ASC"]] });
    const grilleDe = (jour) => creneaux.filter((c) => c.jour_semaine === jour && c.rang);
    const reference = grilleDe("lundi").length ? grilleDe("lundi") : creneaux.filter((c) => c.rang);
    const colonne = (c) => ({ rang: c.rang, heure_debut: hhmm(c.heure_debut), heure_fin: hhmm(c.heure_fin) });
    const grille = {
        matin: reference.filter((c) => demiDe(c) === "matin").map(colonne),
        apres_midi: reference.filter((c) => demiDe(c) === "apres_midi").map(colonne),
    };
    const vendredi = grilleDe("vendredi").filter((c) => demiDe(c) === "apres_midi");
    const decaleVendredi = vendredi.some((c) => grille.apres_midi.some((r) => r.rang === c.rang && r.heure_debut !== hhmm(c.heure_debut)));

    // Séances du mois de la classe : directes, ou d'un enseignement qui réunit la classe
    const enseignementsDeLaClasse = (await EnseignementGroupe.findAll({ where: { id_groupe: idsGroupes }, attributes: ["id_enseignement"] })).map((l) => l.id_enseignement);
    const seances = await Affectation.findAll({
        where: {
            date_seance: { [Op.between]: [premier, dernier] },
            statut: STATUTS_ACTIFS,
            [Op.or]: [{ id_groupe: idsGroupes }, ...(enseignementsDeLaClasse.length ? [{ id_enseignement: enseignementsDeLaClasse }] : [])],
        },
        include: [
            { model: Creneau, as: "creneau" },
            { model: Cours, as: "cours", attributes: ["id_cours", "nom_cours"] },
            { model: Users, as: "enseignant", attributes: ["id_user", "nom", "prenom"] },
            { model: Salle, as: "salle" },
            {
                model: Enseignement,
                as: "enseignement",
                include: [
                    { model: CoursComposante, as: "composante", attributes: ["modalite", "mention", "type"] },
                    { model: EnseignementEnseignant, as: "services", where: { role: "co_enseignant", statut_service: { [Op.ne]: "refuse" } }, required: false, include: [{ model: Users, as: "enseignant", attributes: ["nom", "prenom"] }] },
                ],
            },
        ],
    });
    await appliquerRamadan(seances);

    // (P.S) / (D.S) : première et dernière séance de chaque enseignement, toutes dates confondues
    const cleEnseignement = (s) => (s.id_enseignement ? `e${s.id_enseignement}` : `c${s.id_cours}|g${s.id_groupe}`);
    const ordre = (s) => `${s.date_seance}|${String(s.creneau.rang ?? 0).padStart(2, "0")}`;
    const bornes = new Map();
    const ids = [...new Set(seances.filter((s) => s.id_enseignement).map((s) => s.id_enseignement))];
    const toutes = ids.length
        ? await Affectation.findAll({ where: { id_enseignement: ids, statut: STATUTS_ACTIFS }, attributes: ["id_affectation", "id_enseignement", "id_cours", "id_groupe", "date_seance"], include: [{ model: Creneau, as: "creneau", attributes: ["rang"] }] })
        : [];
    for (const s of [...toutes, ...seances.filter((x) => !x.id_enseignement)]) {
        const cle = cleEnseignement(s);
        const b = bornes.get(cle) || { premiere: s, derniere: s };
        if (ordre(s) < ordre(b.premiere)) b.premiere = s;
        if (ordre(s) > ordre(b.derniere)) b.derniere = s;
        bornes.set(cle, b);
    }

    const evenements = (
        await Evenement.findAll({ where: { bloque_affectations: true, date_debut: { [Op.lte]: dernier }, date_fin: { [Op.gte]: premier } } })
    ).filter((e) => evenementDeLaClasse(e, { groupe, idsGroupes }));

    const cellulesDuJour = (date) => {
        const jour = jourDe(date);
        const rangs = grilleDe(jour);
        const parDemi = { matin: [], apres_midi: [] };
        const duJour = seances.filter((s) => s.date_seance === date);
        const evts = evenements.filter((e) => e.date_debut <= date && date <= e.date_fin);
        for (const demi of ["matin", "apres_midi"]) {
            const colonnes = rangs.filter((c) => demiDe(c) === demi);
            let courante = null;
            for (const c of colonnes) {
                const evt = evts.find((e) => !e.heure_debut || seChevauchent(c, e));
                const seance = duJour.find((s) => s.creneau.rang === c.rang || (s.creneau.jour_semaine === jour && seChevauchent(c, s.creneau)));
                let cellule;
                if (evt) {
                    cellule = { type: "evenement", cle: `ev${evt.id_evenement}`, titre: evt.titre, type_evenement: evt.type_evenement };
                } else if (seance) {
                    const b = bornes.get(cleEnseignement(seance));
                    const co = (seance.enseignement?.services ?? []).map((x) => nomEnseignant(x.enseignant));
                    const distanciel = seance.enseignement?.composante?.modalite === "distanciel" || !seance.salle;
                    cellule = {
                        type: "seance",
                        cle: `${cleEnseignement(seance)}|${seance.id_user_enseignant}|${seance.id_salle ?? "dist"}`,
                        id_affectations: [seance.id_affectation],
                        matiere: seance.enseignement?.libelle || seance.cours?.nom_cours,
                        type_composante: seance.enseignement?.composante?.type ?? null,
                        enseignants: [nomEnseignant(seance.enseignant), ...co].join(" / "),
                        salle: distanciel ? null : { campus: `HESTIM-${String(seance.salle.campus?.nom ?? "").toUpperCase()}`, detail: `${seance.salle.etage != null ? `Étage ${seance.salle.etage} - ` : ""}${seance.salle.nom_salle}` },
                        distanciel,
                        mention: seance.enseignement?.composante?.mention ?? null,
                        premiere_seance: b?.premiere.id_affectation === seance.id_affectation,
                        derniere_seance: b?.derniere.id_affectation === seance.id_affectation,
                        statut: seance.statut,
                        ramadan: seance.creneau.get?.("variante_appliquee") === "ramadan",
                    };
                } else {
                    cellule = { type: "vide", cle: null };
                }
                const heures = { heure_debut: hhmm(c.heure_debut), heure_fin: hhmm(c.heure_fin) };
                // Fusion : même enseignement, même enseignant, même salle (ou même événement) sur des rangs consécutifs
                if (courante && cellule.cle && courante.cle === cellule.cle) {
                    courante.rangs.push(c.rang);
                    courante.heure_fin = heures.heure_fin;
                    if (cellule.type === "seance") {
                        courante.id_affectations.push(...cellule.id_affectations);
                        courante.derniere_seance ||= cellule.derniere_seance;
                    }
                } else {
                    courante = { ...cellule, rangs: [c.rang], ...heures };
                    parDemi[demi].push(courante);
                }
            }
            // Horaire décalé du vendredi après-midi, rappelé sous le module
            if (jour === "vendredi" && demi === "apres_midi" && decaleVendredi) {
                parDemi[demi].filter((x) => x.type === "seance").forEach((x) => (x.horaire_rappel = `(${heureLisible(x.heure_debut)} - ${heureLisible(x.heure_fin)})`));
            }
        }
        return parDemi;
    };

    // Semaines du lundi au samedi qui touchent le mois ; seuls les jours du mois sont listés
    const semaines = [];
    let lundi = premier;
    while (jourDe(lundi) !== "lundi") lundi = ajouterJour(lundi, -1);
    for (; lundi <= dernier; lundi = ajouterJour(lundi, 7)) {
        const jours = JOURS_COURS.map((_, i) => ajouterJour(lundi, i))
            .filter((d) => d >= premier && d <= dernier && grilleDe(jourDe(d)).length)
            .map((date) => ({ date, libelle: libelleJour(date), ...cellulesDuJour(date) }));
        if (jours.length) semaines.push({ libelle: libelleSemaine(jours[0].date, jours[jours.length - 1].date), jours });
    }

    return {
        entete: {
            annee_universitaire: annee ? annee.libelle.replace("-", "/") : null,
            ...intitules(groupe, periode),
            mois: `${MOIS[moisNum - 1]} ${anneeNum}`,
            groupe: { id_groupe: groupe.id_groupe, nom_groupe: groupe.nom_groupe },
        },
        grille,
        pied: {
            vendredi: decaleVendredi ? `Horaires des vendredis après-midi : ${vendredi.map((c) => `${heureLisible(c.heure_debut)}-${heureLisible(c.heure_fin)}`).join(" & ")}` : null,
            legende: ["(P.S) : Première séance", "(D.S) : Dernière séance"],
        },
        semaines,
    };
};
