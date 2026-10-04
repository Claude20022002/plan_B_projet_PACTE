package ma.hestim.solver;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ai.timefold.solver.core.api.solver.Solver;
import ai.timefold.solver.core.api.solver.SolverFactory;
import ai.timefold.solver.core.config.solver.SolverConfig;
import ma.hestim.solver.contraintes.ContraintesEmploiDuTemps;
import ma.hestim.solver.domain.Creneau;
import ma.hestim.solver.domain.EmploiDuTemps;
import ma.hestim.solver.domain.Lecon;
import ma.hestim.solver.domain.Ressource;
import ma.hestim.solver.domain.Salle;
import ma.hestim.solver.domain.Voeu;

/**
 * Résolution complète d'une petite semaine type : toutes les leçons sont placées sans enfreindre
 * de règle dure, la leçon épinglée reste à sa place, l'indisponibilité est respectée.
 */
class ResolutionTest {

    @Test
    void semaineTypeSansRegleDureEnfreinte() {
        EmploiDuTemps probleme = new EmploiDuTemps();
        List<Creneau> creneaux = new ArrayList<>();
        long id = 1;
        for (int jour = 1; jour <= 5; jour++) {
            creneaux.add(new Creneau(id, jour, 540, 645, 1, "initiale", id + 1, 750));
            creneaux.add(new Creneau(id + 1, jour, 660, 750, 2, "initiale", null, null));
            creneaux.add(new Creneau(id + 2, jour, 810, 915, 3, "initiale", id + 3, 1020));
            creneaux.add(new Creneau(id + 3, jour, 930, 1020, 4, "initiale", null, null));
            id += 4;
        }
        probleme.setCreneaux(creneaux);
        probleme.setSalles(List.of(
                new Salle(1L, "G-AMPHI", 120, "Amphithéâtre", 1L),
                new Salle(2L, "G-S01", 40, "Salle de cours", 1L),
                new Salle(3L, "G-LABO", 30, "Labo informatique", 1L)));

        // Promotion 100 (60 étudiants) et ses deux TD 101, 102
        List<Lecon> lecons = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            lecons.add(lecon("CM" + i, 10L + i, 1000L + i, "CM", Set.of(20L + i), Set.of(100L, 101L, 102L), Set.of(100L), 60, null));
        }
        for (int i = 0; i < 4; i++) {
            lecons.add(lecon("TDA" + i, 20L + i, 1000L + i, "TD", Set.of(30L + i), Set.of(100L, 101L), Set.of(101L), 30, null));
            lecons.add(lecon("TPB" + i, 30L + i, 1000L + i, "TP", Set.of(40L + i), Set.of(100L, 102L), Set.of(102L), 30, "Labo informatique"));
        }
        // Une séance déjà publiée : lundi matin dans l'amphi, épinglée
        Lecon publiee = lecon("PUB", 99L, 999L, "CM", Set.of(50L), Set.of(200L), Set.of(200L), 80, null);
        publiee.setCreneau(creneaux.get(0));
        publiee.setSalle(probleme.getSalles().get(0));
        publiee.setEpinglee(true);
        lecons.add(publiee);
        probleme.setLecons(lecons);

        // L'enseignant du premier CM est indisponible le mardi matin
        probleme.setVoeux(List.of(new Voeu(20L, 5L, Voeu.Type.INDISPONIBLE), new Voeu(20L, 6L, Voeu.Type.INDISPONIBLE)));
        probleme.setRessources(List.of(new Ressource(Ressource.Nature.GROUPE, 100L), new Ressource(Ressource.Nature.GROUPE, 101L), new Ressource(Ressource.Nature.GROUPE, 102L)));

        SolverConfig config = new SolverConfig()
                .withSolutionClass(EmploiDuTemps.class)
                .withEntityClasses(Lecon.class)
                .withConstraintProviderClass(ContraintesEmploiDuTemps.class)
                .withTerminationSpentLimit(Duration.ofSeconds(8));
        Solver<EmploiDuTemps> solver = SolverFactory.<EmploiDuTemps>create(config).buildSolver();
        probleme.preparerValeursPossibles();
        EmploiDuTemps solution = solver.solve(probleme);

        assertThat(solution.getScore().hardScore()).isZero();
        assertThat(solution.getLecons()).allMatch(l -> l.getCreneau() != null && l.getSalle() != null);
        Lecon pub = solution.getLecons().stream().filter(l -> l.getId().equals("PUB")).findFirst().orElseThrow();
        assertThat(pub.getCreneau().getId()).isEqualTo(1L);
        Lecon cm0 = solution.getLecons().stream().filter(l -> l.getId().equals("CM0")).findFirst().orElseThrow();
        assertThat(cm0.getCreneau().getId()).isNotIn(5L, 6L);
        assertThat(solution.getLecons().stream().filter(l -> l.getId().startsWith("TPB"))).allMatch(l -> l.getSalle().getId().equals(3L));
    }

    private static Lecon lecon(String id, Long enseignement, Long cours, String type, Set<Long> enseignants, Set<Long> groupes, Set<Long> directs, int effectif, String typeSalle) {
        Lecon l = new Lecon();
        l.setId(id);
        l.setEnseignementId(enseignement);
        l.setCoursId(cours);
        l.setType(type);
        l.setRegime("initiale");
        l.setLongueur(2);
        l.setEnseignants(enseignants);
        l.setGroupes(groupes);
        l.setGroupesDirects(directs);
        l.setEffectif(effectif);
        l.setTypeSalleRequis(typeSalle);
        return l;
    }
}
