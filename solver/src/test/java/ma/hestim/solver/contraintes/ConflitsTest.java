package ma.hestim.solver.contraintes;

import java.util.Set;

import org.junit.jupiter.api.Test;

import ma.hestim.solver.domain.Lecon;
import ma.hestim.solver.domain.Voeu;

/** Règle dure : une salle, un enseignant ou un groupe n'est jamais à deux endroits à la fois. */
class ConflitsTest extends GrilleDeTest {

    @Test
    void salleEnseignantEtGroupeJamaisEnDouble() {
        Lecon a = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        Lecon memeSalle = lecon(lun1, g1, Set.of(11L), Set.of(101L));
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitSalle).given(a, memeSalle).penalizesBy(1);

        Lecon memeProf = lecon(lun1, g2, Set.of(10L), Set.of(101L));
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitEnseignant).given(a, memeProf).penalizesBy(1);

        // Le CM de la promotion (100) concerne les étudiants des TD 102 et 103 (groupes les plus fins)
        a.setFeuilles(Set.of(102L, 103L));
        Lecon td = lecon(lun1, g2, Set.of(11L), Set.of(102L, 100L));
        td.setGroupesDirects(Set.of(102L));
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitGroupe).given(a, td).penalizesBy(1);
        // Deux TD frères (102 et 103) de la même promotion peuvent avoir cours en même temps
        Lecon tdFrere = lecon(lun1, g1, Set.of(12L), Set.of(103L, 100L));
        tdFrere.setGroupesDirects(Set.of(103L));
        tdFrere.setFeuilles(Set.of(103L));
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitGroupe).given(td, tdFrere).penalizesBy(0);

        Lecon autreJour = lecon(mar1, g1, Set.of(10L), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitSalle).given(a, autreJour).penalizesBy(0);
    }

    @Test
    void troisLeconsDansLaMemeSalleFontTroisConflits() {
        // Une pénalité par paire : le score dit combien de séances il faut déplacer
        Lecon a = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        Lecon b = lecon(lun1, g1, Set.of(11L), Set.of(101L));
        Lecon c = lecon(lun1, g1, Set.of(12L), Set.of(102L));
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitSalle).given(a, b, c).penalizesBy(3);
    }

    @Test
    void lesCoEnseignantsComptentCommeLEnseignantPrincipal() {
        Lecon aDeux = lecon(lun1, g1, Set.of(10L, 11L), Set.of(100L));
        Lecon duCoEnseignant = lecon(lun1, g2, Set.of(11L), Set.of(101L));
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitEnseignant).given(aDeux, duCoEnseignant).penalizesBy(1);
        // Les deux mêmes enseignants : un conflit pour chacun
        Lecon memeBinome = lecon(lun1, g2, Set.of(10L, 11L), Set.of(101L));
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitEnseignant).given(aDeux, memeBinome).penalizesBy(2);
    }

    @Test
    void uneLeconSansSalleGardeSesConflits() {
        // Retirer la salle ne doit pas masquer un conflit d'enseignant ou de groupe
        Lecon a = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        Lecon sansSalle = lecon(lun1, null, Set.of(10L), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitEnseignant).given(a, sansSalle).penalizesBy(1);
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitGroupe).given(a, sansSalle).penalizesBy(1);
        verifier.verifyThat(ContraintesEmploiDuTemps::enseignantIndisponible)
                .given(sansSalle, new Voeu(10L, 1L, Voeu.Type.INDISPONIBLE)).penalizesBy(1);
    }

    @Test
    void uneSeanceDeDeuxCreneauxOccupeLaDemiJournee() {
        Lecon demiJournee = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        demiJournee.setLongueur(2);
        Lecon rang2 = lecon(lun2, g1, Set.of(11L), Set.of(101L));
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitSalle).given(demiJournee, rang2).penalizesBy(1);
        // Deux demi-journées entières sur le même créneau : un seul conflit, pas un par intervalle
        Lecon memeDemiJournee = lecon(lun1, g1, Set.of(10L), Set.of(104L));
        memeDemiJournee.setLongueur(2);
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitSalle).given(demiJournee, memeDemiJournee).penalizesBy(1);
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitEnseignant).given(demiJournee, memeDemiJournee, rang2).penalizesBy(1);

        Lecon surRang2 = lecon(lun2, g2, Set.of(12L), Set.of(103L));
        surRang2.setLongueur(2);
        verifier.verifyThat(ContraintesEmploiDuTemps::longueurSeance).given(surRang2).penalizesBy(1);
    }
}
