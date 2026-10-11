package ma.hestim.solver.contraintes;

import java.util.Set;

import org.junit.jupiter.api.Test;

import ma.hestim.solver.domain.Lecon;
import ma.hestim.solver.domain.Voeu;

/**
 * Disponibilités des enseignants et grille du régime. Le serveur traduit les déclarations en vœux
 * (backend/services/generation/timefold/probleme.js) : un vacataire est indisponible sur tout
 * créneau qu'il n'a pas déclaré, et une indisponibilité qui couvre toute la période bloque le
 * créneau. Une date bloquée (férié, fermeture) ne passe pas par le solveur : le déploiement la
 * saute (test « férié sauté » de generation.test.js).
 */
class DisponibilitesTest extends GrilleDeTest {

    private static final long VACATAIRE = 10L;

    @Test
    void unVacataireHorsDeSesDisponibilitesEstRefuse() {
        // Le vacataire n'a déclaré que le mardi matin : le lundi matin lui arrive en INDISPONIBLE
        Voeu lundiMatin = new Voeu(VACATAIRE, lun1.getId(), Voeu.Type.INDISPONIBLE);
        Lecon lundi = lecon(lun1, g1, Set.of(VACATAIRE), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::enseignantIndisponible).given(lundi, lundiMatin).penalizesBy(1);
        Lecon mardi = lecon(mar1, g1, Set.of(VACATAIRE), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::enseignantIndisponible).given(mardi, lundiMatin).penalizesBy(0);
    }

    @Test
    void lIndisponibiliteDUnCoEnseignantBloqueAussiLaSeance() {
        Lecon aDeux = lecon(lun1, g1, Set.of(11L, VACATAIRE), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::enseignantIndisponible)
                .given(aDeux, new Voeu(VACATAIRE, lun1.getId(), Voeu.Type.INDISPONIBLE)).penalizesBy(1);
        // L'indisponibilité d'un collègue absent de la séance ne la touche pas
        verifier.verifyThat(ContraintesEmploiDuTemps::enseignantIndisponible)
                .given(aDeux, new Voeu(12L, lun1.getId(), Voeu.Type.INDISPONIBLE)).penalizesBy(0);
    }

    @Test
    void unJourEntierBloquePourLEnseignant() {
        // Indisponible tout le lundi : chaque créneau du lundi arrive en INDISPONIBLE
        Voeu[] lundi = {
                new Voeu(VACATAIRE, lun1.getId(), Voeu.Type.INDISPONIBLE),
                new Voeu(VACATAIRE, lun2.getId(), Voeu.Type.INDISPONIBLE),
                new Voeu(VACATAIRE, lun3.getId(), Voeu.Type.INDISPONIBLE),
                new Voeu(VACATAIRE, 4L, Voeu.Type.INDISPONIBLE),
        };
        Lecon matin = lecon(lun1, g1, Set.of(VACATAIRE), Set.of(100L));
        Lecon apresMidi = lecon(lun3, g2, Set.of(VACATAIRE), Set.of(101L));
        Lecon mardi = lecon(mar1, g1, Set.of(VACATAIRE), Set.of(102L));
        Object[] faits = { matin, apresMidi, mardi, lundi[0], lundi[1], lundi[2], lundi[3] };
        verifier.verifyThat(ContraintesEmploiDuTemps::enseignantIndisponible).given(faits).penalizesBy(2);
    }

    @Test
    void uneDemiJourneeToucheLesDeuxCreneaux() {
        Lecon a = lecon(lun1, g1, Set.of(VACATAIRE), Set.of(100L));
        a.setLongueur(2);
        // Indisponible sur le rang 2 : une demi-journée qui commence au rang 1 le touche aussi
        Voeu indisponible = new Voeu(VACATAIRE, lun2.getId(), Voeu.Type.INDISPONIBLE);
        verifier.verifyThat(ContraintesEmploiDuTemps::enseignantIndisponible).given(a, indisponible).penalizesBy(1);
        Voeu eviter = new Voeu(VACATAIRE, lun1.getId(), Voeu.Type.EVITER);
        verifier.verifyThat(ContraintesEmploiDuTemps::voeuEviter).given(a, eviter).penalizesBy(1);
    }

    @Test
    void voeuPrefere() {
        Lecon a = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        Voeu prefere = new Voeu(10L, 1L, Voeu.Type.PREFERE);
        verifier.verifyThat(ContraintesEmploiDuTemps::voeuPrefere).given(a, prefere).rewardsWith(1);
        // Le vœu d'un collègue, ou un vœu sur un autre créneau, ne rapporte rien
        verifier.verifyThat(ContraintesEmploiDuTemps::voeuPrefere).given(a, new Voeu(11L, 1L, Voeu.Type.PREFERE)).rewardsWith(0);
        verifier.verifyThat(ContraintesEmploiDuTemps::voeuPrefere).given(a, new Voeu(10L, 3L, Voeu.Type.PREFERE)).rewardsWith(0);

        // Une demi-journée sur deux créneaux préférés rapporte un point par créneau
        a.setLongueur(2);
        verifier.verifyThat(ContraintesEmploiDuTemps::voeuPrefere).given(a, prefere, new Voeu(10L, 2L, Voeu.Type.PREFERE)).rewardsWith(2);
        // Un vœu « à éviter » n'est pas une préférence
        verifier.verifyThat(ContraintesEmploiDuTemps::voeuPrefere).given(a, new Voeu(10L, 1L, Voeu.Type.EVITER)).rewardsWith(0);
    }

    @Test
    void grilleDuRegime() {
        // Un cours de formation initiale ne va pas sur la grille du soir (formation continue)
        Lecon initiale = lecon(soir, g1, Set.of(10L), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::grilleDuRegime).given(initiale).penalizesBy(1);
        initiale.setRegime("continue");
        verifier.verifyThat(ContraintesEmploiDuTemps::grilleDuRegime).given(initiale).penalizesBy(0);
    }
}
