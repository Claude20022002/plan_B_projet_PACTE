package ma.hestim.solver.contraintes;

import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ma.hestim.solver.domain.Lecon;
import ma.hestim.solver.domain.Parametres;

/**
 * Règle dure : deux séances qui se suivent sur deux campus laissent le temps du trajet (30 minutes
 * par défaut). Préférence : un groupe reste sur un seul campus dans la journée.
 */
class TrajetEntreCampusTest extends GrilleDeTest {

    @Test
    void unQuartDHeureNeSuffitPasPourChangerDeCampus() {
        Parametres parametres = new Parametres();
        // 9 h - 10 h 45 à Gandhi puis 11 h à Stendhal : 15 minutes < 30
        Lecon gandhi = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        Lecon stendhal = lecon(lun2, st, Set.of(11L), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::trajetEntreCampus).given(gandhi, stendhal, parametres).penalizesBy(1);
        verifier.verifyThat(ContraintesEmploiDuTemps::unSeulCampusParJour).given(gandhi, stendhal).penalizesBy(1);
    }

    @Test
    void leTempsDeTrajetEstReglableParPaireDeCampus() {
        Parametres parametres = new Parametres();
        parametres.setTrajets(Map.of("1-2", 10));
        Lecon gandhi = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        Lecon stendhal = lecon(lun2, st, Set.of(11L), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::trajetEntreCampus).given(gandhi, stendhal, parametres).penalizesBy(0);
    }

    @Test
    void laPauseDeMidiLaisseLeTempsDuTrajet() {
        // 10 h 45 à Gandhi, 13 h 30 à Stendhal
        Lecon matin = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        Lecon apresMidi = lecon(lun3, st, Set.of(11L), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::trajetEntreCampus).given(matin, apresMidi, new Parametres()).penalizesBy(0);
    }

    @Test
    void lEnseignantAussiDoitPouvoirSeDeplacer() {
        // Deux groupes différents, le même enseignant : c'est lui qui change de campus
        Lecon gandhi = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        Lecon stendhal = lecon(lun2, st, Set.of(10L), Set.of(101L));
        verifier.verifyThat(ContraintesEmploiDuTemps::trajetEntreCampus).given(gandhi, stendhal, new Parametres()).penalizesBy(1);
        // Ni groupe ni enseignant en commun : personne ne se déplace
        Lecon autre = lecon(lun2, st, Set.of(11L), Set.of(101L));
        verifier.verifyThat(ContraintesEmploiDuTemps::trajetEntreCampus).given(gandhi, autre, new Parametres()).penalizesBy(0);
    }

    @Test
    void memeCampusOuAutreJourNeCoutentRien() {
        Lecon gandhi = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        Lecon gandhiEnsuite = lecon(lun2, g2, Set.of(11L), Set.of(100L));
        Lecon stendhalMardi = lecon(mar1, st, Set.of(11L), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::trajetEntreCampus).given(gandhi, gandhiEnsuite, stendhalMardi, new Parametres()).penalizesBy(0);
        verifier.verifyThat(ContraintesEmploiDuTemps::unSeulCampusParJour).given(gandhi, gandhiEnsuite, stendhalMardi).penalizesBy(0);
    }

    @Test
    void lesEtudiantsDUnTdSuiventLeCmDeLeurPromotion() {
        // CM de promotion à Gandhi, TD 202 à Stendhal l'après-midi : les étudiants du TD changent de campus
        Lecon cm = lecon(lun1, g1, Set.of(10L), Set.of(200L));
        cm.setFeuilles(Set.of(202L, 203L));
        Lecon td = lecon(lun3, st, Set.of(11L), Set.of(202L));
        verifier.verifyThat(ContraintesEmploiDuTemps::unSeulCampusParJour).given(cm, td).penalizesBy(1);
    }
}
