package ma.hestim.solver.contraintes;

import java.util.Set;

import org.junit.jupiter.api.Test;

import ma.hestim.solver.domain.Lecon;

/** Règles dures de la salle : capacité, type, équipements, et une salle en présentiel. */
class CapaciteSalleTest extends GrilleDeTest {

    @Test
    void capaciteDepasseePenaliseeParTranchesDeDix() {
        // 1 point dès le premier étudiant en trop, puis 1 par tranche de 10 : le solveur préfère
        // déplacer le cours le plus à l'étroit
        Lecon cours = lecon(lun1, petite, Set.of(10L), Set.of(100L));
        cours.setEffectif(10);
        verifier.verifyThat(ContraintesEmploiDuTemps::capaciteSalle).given(cours).penalizesBy(0);
        cours.setEffectif(11);
        verifier.verifyThat(ContraintesEmploiDuTemps::capaciteSalle).given(cours).penalizesBy(1);
        cours.setEffectif(25);
        verifier.verifyThat(ContraintesEmploiDuTemps::capaciteSalle).given(cours).penalizesBy(2);

        // Sans salle, la capacité ne s'applique pas (la règle « salle requise » prend le relais)
        cours.setSalle(null);
        verifier.verifyThat(ContraintesEmploiDuTemps::capaciteSalle).given(cours).penalizesBy(0);
    }

    @Test
    void typeDeSalle() {
        Lecon tp = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        tp.setTypeSalleRequis("Labo informatique");
        verifier.verifyThat(ContraintesEmploiDuTemps::typeSalle).given(tp).penalizesBy(1);
        tp.setSalle(labo);
        verifier.verifyThat(ContraintesEmploiDuTemps::typeSalle).given(tp).penalizesBy(0);
        // Aucun type demandé : toute salle convient
        Lecon cm = lecon(lun1, labo, Set.of(11L), Set.of(101L));
        verifier.verifyThat(ContraintesEmploiDuTemps::typeSalle).given(cm).penalizesBy(0);
    }

    @Test
    void equipementsDeLaSalle() {
        Lecon tp = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        tp.setEquipementsRequis(Set.of("Vidéoprojecteur", "Postes informatiques"));
        // La salle n'a aucun des équipements demandés, puis un seul des deux : refusée dans les deux cas
        verifier.verifyThat(ContraintesEmploiDuTemps::equipementsSalle).given(tp).penalizesBy(1);
        g1.setEquipements(Set.of("Vidéoprojecteur"));
        verifier.verifyThat(ContraintesEmploiDuTemps::equipementsSalle).given(tp).penalizesBy(1);
        // Tout ce qui est demandé s'y trouve ; un équipement en plus ne gêne pas
        labo.setEquipements(Set.of("Vidéoprojecteur", "Postes informatiques", "Tableau interactif"));
        tp.setSalle(labo);
        verifier.verifyThat(ContraintesEmploiDuTemps::equipementsSalle).given(tp).penalizesBy(0);

        // Rien de demandé, ou pas de salle : la règle ne s'applique pas
        Lecon sansBesoin = lecon(lun1, g2, Set.of(11L), Set.of(101L));
        Lecon sansSalle = lecon(lun1, null, Set.of(12L), Set.of(102L));
        sansSalle.setEquipementsRequis(Set.of("Vidéoprojecteur"));
        verifier.verifyThat(ContraintesEmploiDuTemps::equipementsSalle).given(sansBesoin, sansSalle).penalizesBy(0);
    }

    @Test
    void salleRequiseEnPresentiel() {
        Lecon sansSalle = lecon(lun1, null, Set.of(10L), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::salleRequise).given(sansSalle).penalizesBy(1);
        sansSalle.setDistanciel(true);
        verifier.verifyThat(ContraintesEmploiDuTemps::salleRequise).given(sansSalle).penalizesBy(0);
        // Une leçon pas encore placée n'a pas besoin de salle
        Lecon nonPlacee = lecon(null, null, Set.of(11L), Set.of(101L));
        verifier.verifyThat(ContraintesEmploiDuTemps::salleRequise).given(nonPlacee).penalizesBy(0);
    }
}
