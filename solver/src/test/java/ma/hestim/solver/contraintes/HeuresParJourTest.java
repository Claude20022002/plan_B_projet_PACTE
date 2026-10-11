package ma.hestim.solver.contraintes;

import java.util.Set;

import org.junit.jupiter.api.Test;

import ma.hestim.solver.domain.Lecon;
import ma.hestim.solver.domain.Parametres;
import ma.hestim.solver.domain.Ressource;

/** Règle dure : heures maximales par jour, pour les étudiants et pour chaque enseignant. */
class HeuresParJourTest extends GrilleDeTest {

    @Test
    void heuresMaximalesDuGroupe() {
        Parametres parametres = new Parametres();
        parametres.setMaxMinutesJourGroupe(180);
        Lecon matin = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        matin.setLongueur(2);
        Lecon apresMidi = lecon(lun3, g1, Set.of(11L), Set.of(100L));
        apresMidi.setLongueur(2);
        Ressource groupe = new Ressource(Ressource.Nature.GROUPE, 100L);
        verifier.verifyThat(ContraintesEmploiDuTemps::maxHeuresJour).given(matin, apresMidi, groupe, parametres).penalizes();
    }

    @Test
    void heuresParJourVuesParLesEtudiants() {
        Parametres parametres = new Parametres();
        parametres.setMaxMinutesJourGroupe(420);
        // CM de la promotion 100 le matin, TD 102 et TD 103 (frères) en parallèle l'après-midi :
        // chaque étudiant a 7 h (420 min), pas 10 h 30
        Lecon cm = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        cm.setLongueur(2);
        cm.setFeuilles(Set.of(102L, 103L));
        Lecon td102 = lecon(lun3, g1, Set.of(11L), Set.of(102L));
        td102.setLongueur(2);
        Lecon td103 = lecon(lun3, g2, Set.of(12L), Set.of(103L));
        td103.setLongueur(2);
        verifier.verifyThat(ContraintesEmploiDuTemps::maxHeuresJour).given(cm, td102, td103, parametres).penalizesBy(0);
        parametres.setMaxMinutesJourGroupe(360);
        // 420 minutes > 360 pour chacun des deux TD : 2 × (1 + 60 / 60)
        verifier.verifyThat(ContraintesEmploiDuTemps::maxHeuresJour).given(cm, td102, td103, parametres).penalizesBy(4);
    }

    @Test
    void heuresMaximalesDeLEnseignant() {
        // Un enseignant, deux classes : 420 minutes dans la journée pour un plafond de 360
        Parametres parametres = new Parametres();
        parametres.setMaxMinutesJourEnseignant(360);
        Lecon matin = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        matin.setLongueur(2);
        Lecon apresMidi = lecon(lun3, g1, Set.of(10L), Set.of(101L));
        apresMidi.setLongueur(2);
        verifier.verifyThat(ContraintesEmploiDuTemps::maxHeuresJour).given(matin, apresMidi, parametres).penalizesBy(2);
        // Le même volume sur deux jours passe
        Lecon mardi = lecon(mar1, g1, Set.of(10L), Set.of(101L));
        mardi.setLongueur(2);
        verifier.verifyThat(ContraintesEmploiDuTemps::maxHeuresJour).given(matin, mardi, parametres).penalizesBy(0);
    }
}
