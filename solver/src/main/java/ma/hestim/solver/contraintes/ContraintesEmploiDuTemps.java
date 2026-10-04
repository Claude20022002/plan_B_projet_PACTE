package ma.hestim.solver.contraintes;

import static ai.timefold.solver.core.api.score.stream.ConstraintCollectors.countDistinct;
import static ai.timefold.solver.core.api.score.stream.ConstraintCollectors.max;
import static ai.timefold.solver.core.api.score.stream.ConstraintCollectors.min;
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
import ai.timefold.solver.core.api.score.stream.tri.TriConstraintStream;
import ai.timefold.solver.core.api.score.stream.uni.UniConstraintStream;
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
 *
 * Une leçon sans salle (allowsUnassigned) reste visible des règles qui ne dépendent pas de la
 * salle : sinon, retirer la salle d'une leçon masquerait ses conflits d'enseignant ou de groupe
 * pour le prix d'une seule pénalité « salle requise ».
 */
public class ContraintesEmploiDuTemps implements ConstraintProvider {

    private static final int APRES_MIDI = 12 * 60 + 30;

    /** Clé « étudiants (ou enseignant) × jour » des règles par journée. */
    record Journee(Object qui, int jour) {
    }

    /** Leçons dont le créneau est posé, avec ou sans salle. */
    private static UniConstraintStream<Lecon> posees(ConstraintFactory factory) {
        return factory.forEachIncludingUnassigned(Lecon.class).filter(l -> l.getCreneau() != null);
    }

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
        return posees(factory)
                .join(posees(factory),
                        lessThan(Lecon::getId),
                        equal(Lecon::getJour),
                        overlapping(Lecon::getDebut, Lecon::getFin))
                .filter(Lecon::partageEnseignant)
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Enseignant déjà pris");
    }

    Constraint conflitGroupe(ConstraintFactory factory) {
        return posees(factory)
                .join(posees(factory),
                        lessThan(Lecon::getId),
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
        return posees(factory)
                .filter(l -> l.getRegime() != null && !l.getRegime().equals(l.getCreneau().getRegime()))
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Grille du régime");
    }

    Constraint longueurSeance(ConstraintFactory factory) {
        return posees(factory)
                .filter(l -> l.getLongueur() == 2 && l.getCreneau().getSuivantId() == null)
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Deux créneaux consécutifs");
    }

    Constraint enseignantIndisponible(ConstraintFactory factory) {
        return voeuxTouches(factory, Voeu.Type.INDISPONIBLE)
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Enseignant indisponible");
    }

    /** Leçon × créneau qu'elle occupe × vœu d'un de ses enseignants sur ce créneau (jointure indexée par créneau). */
    private static TriConstraintStream<Lecon, Long, Voeu> voeuxTouches(ConstraintFactory factory, Voeu.Type type) {
        return posees(factory)
                .expand(Lecon::getCreneauxOccupes)
                .flattenLast(ids -> ids)
                .join(Voeu.class,
                        equal((l, creneauId) -> creneauId, Voeu::getCreneauId),
                        equal((l, creneauId) -> type, Voeu::getType),
                        filtering((l, creneauId, v) -> l.getEnseignants().contains(v.getEnseignantId())));
    }

    Constraint maxHeuresJour(ConstraintFactory factory) {
        // Par étudiants (groupe le plus fin, séances des groupes parents comprises) et par enseignant
        return posees(factory)
                .expand(Lecon::getRessources)
                .flattenLast(ressources -> ressources)
                .groupBy((l, r) -> r, (l, r) -> l.getJour(), sum((l, r) -> l.getDuree()))
                .join(Parametres.class)
                .filter((r, jour, minutes, p) -> minutes > maxMinutes(r, p))
                .penalize(HardSoftScore.ONE_HARD, (r, jour, minutes, p) -> 1 + (minutes - maxMinutes(r, p)) / 60)
                .asConstraint("Heures maximales par jour");
    }

    private static int maxMinutes(Ressource r, Parametres p) {
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
        // forEach : seules les leçons avec salle ont un campus
        return factory.forEach(Lecon.class)
                .expand(Lecon::getFeuillesEffectives)
                .flattenLast(feuilles -> feuilles)
                .groupBy((l, g) -> new Journee(g, l.getJour()), countDistinct((l, g) -> l.getCampusId()))
                .filter((journee, campus) -> campus > 1)
                .penalize(HardSoftScore.ofSoft(10), (journee, campus) -> campus - 1)
                .asConstraint("Un seul campus par jour pour un groupe");
    }

    Constraint campusDeLaFiliere(ConstraintFactory factory) {
        return factory.forEach(Lecon.class)
                .filter(l -> l.getSalle() != null && l.getCampusPrefere() != null && !l.getCampusPrefere().equals(l.getSalle().getCampusId()))
                .penalize(HardSoftScore.ofSoft(2))
                .asConstraint("Campus de la filière");
    }

    Constraint memeEnseignementMemeJour(ConstraintFactory factory) {
        return posees(factory)
                .join(posees(factory), lessThan(Lecon::getId), equal(Lecon::getEnseignementId), equal(Lecon::getJour))
                .penalize(HardSoftScore.ofSoft(20))
                .asConstraint("Séances d'un enseignement sur des jours différents");
    }

    Constraint cmAvantTd(ConstraintFactory factory) {
        return posees(factory)
                .filter(l -> "CM".equals(l.getType()))
                .join(posees(factory),
                        equal(Lecon::getCoursId),
                        filtering((cm, td) -> !"CM".equals(td.getType()) && cm.partageGroupe(td)
                                && td.getInstantSemaine() < cm.getInstantSemaine()))
                .penalize(HardSoftScore.ofSoft(5))
                .asConstraint("CM avant TD et TP du même module");
    }

    Constraint trousDansLaJournee(ConstraintFactory factory) {
        // Trou = rang de la grille laissé vide entre le premier et le dernier cours des étudiants ;
        // la pause de midi n'en est pas un (les rangs 2 et 3 se suivent)
        return posees(factory)
                .expand(Lecon::getFeuillesEffectives)
                .flattenLast(feuilles -> feuilles)
                .groupBy((l, g) -> new Journee(g, l.getJour()),
                        min((Lecon l, Long g) -> l.getRangDebut()),
                        max((Lecon l, Long g) -> l.getRangFin()),
                        sum((Lecon l, Long g) -> l.getRangFin() - l.getRangDebut() + 1))
                .filter((journee, premier, dernier, occupes) -> dernier - premier + 1 > occupes)
                .penalize(HardSoftScore.ofSoft(5), (journee, premier, dernier, occupes) -> dernier - premier + 1 - occupes)
                .asConstraint("Journées sans trous");
    }

    Constraint voeuEviter(ConstraintFactory factory) {
        return voeuxTouches(factory, Voeu.Type.EVITER)
                .penalize(HardSoftScore.ofSoft(3))
                .asConstraint("Vœu : créneau à éviter");
    }

    Constraint voeuPrefere(ConstraintFactory factory) {
        return voeuxTouches(factory, Voeu.Type.PREFERE)
                .reward(HardSoftScore.ONE_SOFT)
                .asConstraint("Vœu : créneau préféré");
    }

    Constraint samediApresMidi(ConstraintFactory factory) {
        return posees(factory)
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
