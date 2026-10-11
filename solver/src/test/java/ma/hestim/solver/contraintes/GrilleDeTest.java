package ma.hestim.solver.contraintes;

import java.util.List;
import java.util.Set;

import ai.timefold.solver.test.api.score.stream.ConstraintVerifier;
import ma.hestim.solver.domain.Creneau;
import ma.hestim.solver.domain.EmploiDuTemps;
import ma.hestim.solver.domain.Lecon;
import ma.hestim.solver.domain.Salle;

/**
 * Grille, salles et fabrique de leçons communes aux tests des règles (lot A-8 : une classe de
 * test par règle).
 */
abstract class GrilleDeTest {

    protected final ConstraintVerifier<ContraintesEmploiDuTemps, EmploiDuTemps> verifier =
            ConstraintVerifier.build(new ContraintesEmploiDuTemps(), EmploiDuTemps.class, Lecon.class);

    // Lundi matin : rangs 1 et 2 (demi-journée), lundi après-midi : rang 3
    protected final Creneau lun1 = new Creneau(1L, 1, 540, 645, 1, "initiale", 2L, 750);
    protected final Creneau lun2 = new Creneau(2L, 1, 660, 750, 2, "initiale", null, null);
    protected final Creneau lun3 = new Creneau(3L, 1, 810, 915, 3, "initiale", 4L, 1020);
    protected final Creneau mar1 = new Creneau(5L, 2, 540, 645, 1, "initiale", 6L, 750);
    protected final Creneau sam3 = new Creneau(9L, 6, 810, 915, 3, "initiale", null, null);
    protected final Creneau soir = new Creneau(10L, 1, 1080, 1260, 1, "continue", null, null);

    {
        // Intervalles élémentaires de la grille (fait par EmploiDuTemps.preparerValeursPossibles en production)
        Creneau.calculerAtomes(List.of(lun1, lun2, lun3, mar1, sam3, soir));
    }

    // Campus 1 : Gandhi ; campus 2 : Stendhal
    protected final Salle g1 = new Salle(1L, "G-S01", 40, "Salle de cours", 1L);
    protected final Salle g2 = new Salle(2L, "G-S02", 40, "Salle de cours", 1L);
    protected final Salle petite = new Salle(3L, "G-TD01", 10, "Salle TD", 1L);
    protected final Salle st = new Salle(4L, "ST-S01", 40, "Salle de cours", 2L);
    protected final Salle labo = new Salle(5L, "G-LABO", 30, "Labo informatique", 1L);

    private static int compteur = 0;

    /** Rend un CM de 20 étudiants, d'un créneau, sur ce créneau et dans cette salle (salle nulle : sans salle). */
    protected static Lecon lecon(Creneau creneau, Salle salle, Set<Long> enseignants, Set<Long> groupes) {
        Lecon l = new Lecon();
        l.setId("L" + (++compteur));
        l.setEnseignementId((long) compteur);
        l.setCoursId((long) compteur);
        l.setType("CM");
        l.setRegime("initiale");
        l.setLongueur(1);
        l.setEnseignants(enseignants);
        l.setGroupes(groupes);
        l.setGroupesDirects(groupes);
        l.setEffectif(20);
        l.setCreneau(creneau);
        l.setSalle(salle);
        return l;
    }
}
