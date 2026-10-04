package ma.hestim.solver.contraintes;

import static ai.timefold.solver.core.api.score.stream.ConstraintCollectors.countDistinct;
import static ai.timefold.solver.core.api.score.stream.ConstraintCollectors.max;
import static ai.timefold.solver.core.api.score.stream.ConstraintCollectors.min;
import static ai.timefold.solver.core.api.score.stream.ConstraintCollectors.sum;
import static ai.timefold.solver.core.api.score.stream.ConstraintCollectors.toList;
import static ai.timefold.solver.core.api.score.stream.Joiners.equal;
import static ai.timefold.solver.core.api.score.stream.Joiners.filtering;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;

import ai.timefold.solver.core.api.score.buildin.hardsoft.HardSoftScore;
import ai.timefold.solver.core.api.score.stream.Constraint;
import ai.timefold.solver.core.api.score.stream.ConstraintFactory;
import ai.timefold.solver.core.api.score.stream.ConstraintProvider;
import ai.timefold.solver.core.api.score.stream.tri.TriConstraintStream;
import ai.timefold.solver.core.api.score.stream.uni.UniConstraintStream;
import ma.hestim.solver.domain.Lecon;
import ma.hestim.solver.domain.Occupation;
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

    /** Paire non ordonnée comptée une fois (après les jointures indexées, moins coûteux qu'un lessThan). */
    private static boolean avant(Lecon a, Lecon b) {
        return a.getId().compareTo(b.getId()) < 0;
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

    /*
     * Conflits : une occupation (intervalle élémentaire × salle, enseignant ou étudiants) prise par
     * plusieurs leçons. Le regroupement est indexé par clé : chaque coup ne touche que les
     * occupations de la leçon déplacée, au lieu de la comparer à toutes celles du même jour.
     * Chaque paire de leçons qui se chevauchent compte une fois, à l'intervalle où commence la plus
     * tardive des deux (ou la commune, si elles commencent ensemble).
     */
    private static Constraint conflit(UniConstraintStream<Lecon> lecons, Function<Lecon, List<Occupation>> occupations, String nom) {
        return lecons
                .expand(occupations)
                .flattenLast(o -> o)
                .groupBy((l, o) -> o, toList((l, o) -> l))
                .filter((o, enConflit) -> enConflit.size() > 1 && pairesQuiCommencent(o, enConflit) > 0)
                .penalize(HardSoftScore.ONE_HARD, ContraintesEmploiDuTemps::pairesQuiCommencent)
                .asConstraint(nom);
    }

    /** Paires en conflit nées sur cet intervalle : au moins l'une des deux leçons y commence. */
    static int pairesQuiCommencent(Occupation o, List<Lecon> enConflit) {
        int commencent = 0;
        for (Lecon l : enConflit) {
            if (l.getAtomes().get(0) == o.atome()) {
                commencent++;
            }
        }
        return commencent * (enConflit.size() - commencent) + commencent * (commencent - 1) / 2;
    }

    Constraint conflitSalle(ConstraintFactory factory) {
        return conflit(factory.forEach(Lecon.class), Lecon::getOccupationsSalle, "Salle déjà occupée");
    }

    Constraint conflitEnseignant(ConstraintFactory factory) {
        return conflit(posees(factory), Lecon::getOccupationsEnseignants, "Enseignant déjà pris");
    }

    Constraint conflitGroupe(ConstraintFactory factory) {
        return conflit(posees(factory), Lecon::getOccupationsEtudiants, "Groupe déjà pris");
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
        // Journée de chaque enseignant et des étudiants de chaque groupe le plus fin : deux séances
        // qui se suivent sur deux campus doivent laisser le temps du trajet
        return factory.forEach(Lecon.class)
                .expand(Lecon::getRessources)
                .flattenLast(ressources -> ressources)
                .groupBy((l, r) -> new Journee(r, l.getJour()), toList((l, r) -> l))
                .filter((journee, lecons) -> lecons.size() > 1)
                .join(Parametres.class)
                .filter((journee, lecons, p) -> trajetsTropCourts(lecons, p) > 0)
                .penalize(HardSoftScore.ONE_HARD, (journee, lecons, p) -> trajetsTropCourts(lecons, p))
                .asConstraint("Temps de trajet entre campus");
    }

    static int trajetsTropCourts(List<Lecon> lecons, Parametres p) {
        List<Lecon> journee = lecons.stream().sorted(Comparator.comparingInt(Lecon::getDebut)).toList();
        int manques = 0;
        for (int i = 1; i < journee.size(); i++) {
            Lecon a = journee.get(i - 1);
            Lecon b = journee.get(i);
            if (!a.chevauche(b) && !Objects.equals(a.getCampusId(), b.getCampusId())
                    && b.getDebut() - a.getFin() < p.trajet(a.getCampusId(), b.getCampusId())) {
                manques++;
            }
        }
        return manques;
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
                .join(posees(factory), equal(Lecon::getEnseignementId), equal(Lecon::getJour))
                .filter(ContraintesEmploiDuTemps::avant)
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
