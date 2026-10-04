package ma.hestim.solver.contraintes;

import static ai.timefold.solver.core.api.score.stream.ConstraintCollectors.sum;
import static ai.timefold.solver.core.api.score.stream.Joiners.equal;
import static ai.timefold.solver.core.api.score.stream.Joiners.filtering;
import static ai.timefold.solver.core.api.score.stream.Joiners.lessThan;
import static ai.timefold.solver.core.api.score.stream.Joiners.overlapping;

import java.util.Objects;

import ai.timefold.solver.core.api.score.buildin.hardsoft.HardSoftScore;
import ai.timefold.solver.core.api.score.stream.Constraint;
import ai.timefold.solver.core.api.score.stream.ConstraintFactory;
import ai.timefold.solver.core.api.score.stream.ConstraintProvider;
import ma.hestim.solver.domain.Lecon;
import ma.hestim.solver.domain.Parametres;
import ma.hestim.solver.domain.Ressource;
import ma.hestim.solver.domain.Voeu;

/**
 * Règles de la semaine type HESTIM.
 *
 * Impératives (dures) : salle, enseignant (co-enseignants compris) et groupe (hiérarchie
 * promotion > TD > TP comprise) jamais en double ; capacité, type de salle et équipements ;
 * salle obligatoire en présentiel ; grille du régime ; séance de deux créneaux sur deux créneaux
 * consécutifs ; enseignant disponible ; heures maximales par jour ; temps de trajet entre campus.
 *
 * Préférences (souples) : un groupe reste sur un seul campus dans la journée ; campus de la
 * filière ; séances d'un même enseignement sur des jours différents ; CM avant TD/TP du même
 * module ; journées sans trous ; vœux des enseignants ; pas de samedi après-midi.
 */
public class ContraintesEmploiDuTemps implements ConstraintProvider {

    private static final int APRES_MIDI = 12 * 60 + 30;

    @Override
    public Constraint[] defineConstraints(ConstraintFactory factory) {
        return new Constraint[] {
                conflitSalle(factory),
                conflitEnseignant(factory),
                conflitGroupe(factory),
                capaciteSalle(factory),
                typeSalle(factory),
                equipementsSalle(factory),
                salleRequise(factory),
                grilleDuRegime(factory),
                longueurSeance(factory),
                enseignantIndisponible(factory),
                maxHeuresJour(factory),
                trajetEntreCampus(factory),
                // Préférences
                unSeulCampusParJour(factory),
                campusDeLaFiliere(factory),
                memeEnseignementMemeJour(factory),
                cmAvantTd(factory),
                trousDansLaJournee(factory),
                voeuEviter(factory),
                voeuPrefere(factory),
                samediApresMidi(factory),
                salleInutileEnDistanciel(factory),
        };
    }

    // ── Impératives ─────────────────────────────────────────────────────

    Constraint conflitSalle(ConstraintFactory factory) {
        return factory.forEachUniquePair(Lecon.class,
                        equal(Lecon::getSalle),
                        equal(Lecon::getJour),
                        overlapping(Lecon::getDebut, Lecon::getFin))
                .filter((a, b) -> a.getSalle() != null)
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Salle déjà occupée");
    }

    Constraint conflitEnseignant(ConstraintFactory factory) {
        return factory.forEachUniquePair(Lecon.class,
                        equal(Lecon::getJour),
                        overlapping(Lecon::getDebut, Lecon::getFin))
                .filter(Lecon::partageEnseignant)
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Enseignant déjà pris");
    }

    Constraint conflitGroupe(ConstraintFactory factory) {
        return factory.forEachUniquePair(Lecon.class,
                        equal(Lecon::getJour),
                        overlapping(Lecon::getDebut, Lecon::getFin))
                .filter(Lecon::partageGroupe)
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Groupe déjà pris");
    }

    Constraint capaciteSalle(ConstraintFactory factory) {
        return factory.forEach(Lecon.class)
                .filter(l -> l.getSalle() != null && l.getEffectif() > l.getSalle().getCapacite())
                .penalize(HardSoftScore.ONE_HARD, l -> 1 + (l.getEffectif() - l.getSalle().getCapacite()) / 10)
                .asConstraint("Capacité de la salle");
    }

    Constraint typeSalle(ConstraintFactory factory) {
        return factory.forEach(Lecon.class)
                .filter(l -> l.getSalle() != null && l.getTypeSalleRequis() != null && !l.getTypeSalleRequis().equals(l.getSalle().getType()))
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Type de salle");
    }

    Constraint equipementsSalle(ConstraintFactory factory) {
        return factory.forEach(Lecon.class)
                .filter(l -> l.getSalle() != null && !l.getSalle().getEquipements().containsAll(l.getEquipementsRequis()))
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Équipements de la salle");
    }

    Constraint salleRequise(ConstraintFactory factory) {
        // forEachIncludingUnassigned : une leçon sans salle n'est pas vue par forEach
        return factory.forEachIncludingUnassigned(Lecon.class)
                .filter(l -> l.getCreneau() != null && !l.isDistanciel() && l.getSalle() == null)
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Salle requise en présentiel");
    }

    Constraint grilleDuRegime(ConstraintFactory factory) {
        return factory.forEach(Lecon.class)
                .filter(l -> l.getRegime() != null && !l.getRegime().equals(l.getCreneau().getRegime()))
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Grille du régime");
    }

    Constraint longueurSeance(ConstraintFactory factory) {
        return factory.forEach(Lecon.class)
                .filter(l -> l.getLongueur() == 2 && l.getCreneau().getSuivantId() == null)
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Deux créneaux consécutifs");
    }

    Constraint enseignantIndisponible(ConstraintFactory factory) {
        return factory.forEach(Lecon.class)
                .join(Voeu.class,
                        filtering((l, v) -> v.getType() == Voeu.Type.INDISPONIBLE
                                && l.getEnseignants().contains(v.getEnseignantId())
                                && l.occupeCreneau(v.getCreneauId())))
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Enseignant indisponible");
    }

    Constraint maxHeuresJour(ConstraintFactory factory) {
        return factory.forEach(Ressource.class)
                .join(Lecon.class, filtering(Ressource::concerne))
                .groupBy((r, l) -> r, (r, l) -> l.getJour(), sum((r, l) -> l.getDuree()))
                .join(Parametres.class)
                .filter((r, jour, minutes, p) -> minutes > max(r, p))
                .penalize(HardSoftScore.ONE_HARD, (r, jour, minutes, p) -> 1 + (minutes - max(r, p)) / 60)
                .asConstraint("Heures maximales par jour");
    }

    private static int max(Ressource r, Parametres p) {
        return r.getNature() == Ressource.Nature.GROUPE ? p.getMaxMinutesJourGroupe() : p.getMaxMinutesJourEnseignant();
    }

    Constraint trajetEntreCampus(ConstraintFactory factory) {
        return factory.forEachUniquePair(Lecon.class, equal(Lecon::getJour))
                .filter((a, b) -> a.getSalle() != null && b.getSalle() != null && !a.chevauche(b)
                        && !Objects.equals(a.getCampusId(), b.getCampusId())
                        && (a.partageEnseignant(b) || a.partageGroupe(b)))
                .join(Parametres.class)
                .filter((a, b, p) -> a.ecartAvec(b) < p.trajet(a.getCampusId(), b.getCampusId()))
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Temps de trajet entre campus");
    }

    // ── Préférences ─────────────────────────────────────────────────────

    Constraint unSeulCampusParJour(ConstraintFactory factory) {
        return factory.forEachUniquePair(Lecon.class, equal(Lecon::getJour))
                .filter((a, b) -> a.getSalle() != null && b.getSalle() != null && a.partageGroupe(b)
                        && !Objects.equals(a.getCampusId(), b.getCampusId()))
                .penalize(HardSoftScore.ofSoft(10))
                .asConstraint("Un seul campus par jour pour un groupe");
    }

    Constraint campusDeLaFiliere(ConstraintFactory factory) {
        return factory.forEach(Lecon.class)
                .filter(l -> l.getSalle() != null && l.getCampusPrefere() != null && !l.getCampusPrefere().equals(l.getSalle().getCampusId()))
                .penalize(HardSoftScore.ofSoft(2))
                .asConstraint("Campus de la filière");
    }

    Constraint memeEnseignementMemeJour(ConstraintFactory factory) {
        return factory.forEachUniquePair(Lecon.class, equal(Lecon::getEnseignementId), equal(Lecon::getJour))
                .penalize(HardSoftScore.ofSoft(20))
                .asConstraint("Séances d'un enseignement sur des jours différents");
    }

    Constraint cmAvantTd(ConstraintFactory factory) {
        return factory.forEach(Lecon.class)
                .filter(l -> "CM".equals(l.getType()))
                .join(Lecon.class,
                        equal(Lecon::getCoursId),
                        filtering((cm, td) -> !"CM".equals(td.getType()) && cm.partageGroupe(td)
                                && td.getInstantSemaine() < cm.getInstantSemaine()))
                .penalize(HardSoftScore.ofSoft(5))
                .asConstraint("CM avant TD et TP du même module");
    }

    Constraint trousDansLaJournee(ConstraintFactory factory) {
        return factory.forEach(Lecon.class)
                .join(Lecon.class,
                        equal(Lecon::getJour),
                        lessThan(Lecon::getFin, Lecon::getDebut),
                        filtering(Lecon::partageGroupe))
                // Rien entre les deux pour ce groupe : c'est un trou
                .ifNotExists(Lecon.class,
                        equal((a, b) -> a.getJour(), Lecon::getJour),
                        filtering((a, b, c) -> c != a && c != b && c.partageGroupe(a)
                                && c.getDebut() >= a.getFin() && c.getFin() <= b.getDebut()))
                .filter((a, b) -> b.getDebut() - a.getFin() > 30)
                .penalize(HardSoftScore.ONE_SOFT, (a, b) -> (b.getDebut() - a.getFin()) / 30)
                .asConstraint("Journées sans trous");
    }

    Constraint voeuEviter(ConstraintFactory factory) {
        return factory.forEach(Lecon.class)
                .join(Voeu.class,
                        filtering((l, v) -> v.getType() == Voeu.Type.EVITER && l.getEnseignants().contains(v.getEnseignantId()) && l.occupeCreneau(v.getCreneauId())))
                .penalize(HardSoftScore.ofSoft(3))
                .asConstraint("Vœu : créneau à éviter");
    }

    Constraint voeuPrefere(ConstraintFactory factory) {
        return factory.forEach(Lecon.class)
                .join(Voeu.class,
                        filtering((l, v) -> v.getType() == Voeu.Type.PREFERE && l.getEnseignants().contains(v.getEnseignantId()) && l.occupeCreneau(v.getCreneauId())))
                .reward(HardSoftScore.ONE_SOFT)
                .asConstraint("Vœu : créneau préféré");
    }

    Constraint samediApresMidi(ConstraintFactory factory) {
        return factory.forEach(Lecon.class)
                .filter(l -> l.getJour() == 6 && l.getDebut() >= APRES_MIDI && "initiale".equals(l.getRegime()))
                .join(Parametres.class)
                .filter((l, p) -> !p.isSamediApresMidi())
                .penalize(HardSoftScore.ofSoft(50))
                .asConstraint("Pas de samedi après-midi");
    }

    Constraint salleInutileEnDistanciel(ConstraintFactory factory) {
        return factory.forEach(Lecon.class)
                .filter(l -> l.isDistanciel() && l.getSalle() != null)
                .penalize(HardSoftScore.ofSoft(5))
                .asConstraint("Pas de salle en distanciel");
    }
}
