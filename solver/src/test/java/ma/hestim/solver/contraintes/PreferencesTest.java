package ma.hestim.solver.contraintes;

import java.util.Set;

import org.junit.jupiter.api.Test;

import ma.hestim.solver.domain.Creneau;
import ma.hestim.solver.domain.Lecon;
import ma.hestim.solver.domain.Parametres;
import ma.hestim.solver.domain.Salle;

/** Préférences (souples) de la semaine type : campus, rythme de la semaine, journées, salles. */
class PreferencesTest extends GrilleDeTest {

    @Test
    void campusDeLaFiliere() {
        // La filière préfère Gandhi (campus 1) : une salle de Stendhal (campus 2) est pénalisée, une
        // fois par leçon (le vérificateur compte les pénalités, pas leur poids de 2 points souples)
        Lecon ailleurs = lecon(lun1, st, Set.of(10L), Set.of(100L));
        ailleurs.setCampusPrefere(1L);
        verifier.verifyThat(ContraintesEmploiDuTemps::campusDeLaFiliere).given(ailleurs).penalizesBy(1);
        ailleurs.setSalle(g1);
        verifier.verifyThat(ContraintesEmploiDuTemps::campusDeLaFiliere).given(ailleurs).penalizesBy(0);

        // Une filière sans campus préféré, ou une leçon sans salle, ne coûte rien
        Lecon sansPreference = lecon(lun1, st, Set.of(11L), Set.of(101L));
        Lecon sansSalle = lecon(lun1, null, Set.of(12L), Set.of(102L));
        sansSalle.setCampusPrefere(1L);
        verifier.verifyThat(ContraintesEmploiDuTemps::campusDeLaFiliere).given(sansPreference, sansSalle).penalizesBy(0);
    }

    @Test
    void rythmeDeLaSemaine() {
        Lecon s1 = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        Lecon s2 = lecon(lun3, g2, Set.of(10L), Set.of(100L));
        s2.setEnseignementId(s1.getEnseignementId());
        verifier.verifyThat(ContraintesEmploiDuTemps::memeEnseignementMemeJour).given(s1, s2).penalizesBy(1);

        Lecon cm = lecon(mar1, g1, Set.of(10L), Set.of(100L));
        Lecon td = lecon(lun1, g2, Set.of(11L), Set.of(100L));
        td.setType("TD");
        td.setCoursId(cm.getCoursId());
        verifier.verifyThat(ContraintesEmploiDuTemps::cmAvantTd).given(cm, td).penalizesBy(1);

        Lecon samedi = lecon(sam3, g1, Set.of(10L), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::samediApresMidi).given(samedi, new Parametres()).penalizesBy(1);
    }

    @Test
    void trouDansLaJournee() {
        Lecon matin = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        Lecon fin = lecon(new Creneau(4L, 1, 930, 1020, 4, "initiale", null, null), g1, Set.of(11L), Set.of(100L));
        // Rang 1 puis rang 4 : les rangs 2 et 3 sont vides
        verifier.verifyThat(ContraintesEmploiDuTemps::trousDansLaJournee).given(matin, fin).penalizesBy(2);
        Lecon entre = lecon(lun3, g2, Set.of(12L), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::trousDansLaJournee).given(matin, entre, fin).penalizesBy(1);

        // Matin complet puis après-midi complet : la pause de midi n'est pas un trou
        Lecon demiMatin = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        demiMatin.setLongueur(2);
        Lecon demiApresMidi = lecon(lun3, g1, Set.of(11L), Set.of(100L));
        demiApresMidi.setLongueur(2);
        verifier.verifyThat(ContraintesEmploiDuTemps::trousDansLaJournee).given(demiMatin, demiApresMidi).penalizesBy(0);
    }

    @Test
    void pasDeSalleEnDistanciel() {
        // Une séance à distance qui garde une salle la prend à un cours en présentiel
        Lecon aDistance = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        aDistance.setDistanciel(true);
        verifier.verifyThat(ContraintesEmploiDuTemps::salleInutileEnDistanciel).given(aDistance).penalizesBy(1);
        aDistance.setSalle(null);
        verifier.verifyThat(ContraintesEmploiDuTemps::salleInutileEnDistanciel).given(aDistance).penalizesBy(0);

        Lecon enSalle = lecon(lun1, g2, Set.of(11L), Set.of(101L));
        verifier.verifyThat(ContraintesEmploiDuTemps::salleInutileEnDistanciel).given(enSalle).penalizesBy(0);
    }

    @Test
    void salleALaTailleDuGroupe() {
        // 20 étudiants dans une salle de 40 : 20 places vides, 10 de marge, donc une tranche de 10
        Lecon td = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::salleSurdimensionnee).given(td).penalizesBy(1);
        // Dans un amphithéâtre de 120 : 100 places vides, 9 tranches au-delà de la marge
        td.setSalle(new Salle(9L, "G-AMPHI", 120, "Amphithéâtre", 1L));
        verifier.verifyThat(ContraintesEmploiDuTemps::salleSurdimensionnee).given(td).penalizesBy(9);
        // Une salle à peine plus grande, ou pas de salle : rien
        td.setSalle(labo);
        verifier.verifyThat(ContraintesEmploiDuTemps::salleSurdimensionnee).given(td).penalizesBy(0);
        td.setSalle(null);
        verifier.verifyThat(ContraintesEmploiDuTemps::salleSurdimensionnee).given(td).penalizesBy(0);
    }

    @Test
    void memeSallePourDeuxCoursQuiSeSuivent() {
        // 9 h - 10 h 45 puis 11 h : un quart d'heure de pause, deux salles différentes
        Lecon premier = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        Lecon second = lecon(lun2, g2, Set.of(11L), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::changementDeSalle).given(premier, second).penalizesBy(1);
        second.setSalle(g1);
        verifier.verifyThat(ContraintesEmploiDuTemps::changementDeSalle).given(premier, second).penalizesBy(0);

        // Après la pause de midi, changer de salle ne coûte rien
        Lecon apresMidi = lecon(lun3, g2, Set.of(11L), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::changementDeSalle).given(premier, apresMidi).penalizesBy(0);
        // Un TP qui demande un laboratoire justifie le changement
        Lecon tp = lecon(lun2, labo, Set.of(11L), Set.of(100L));
        tp.setTypeSalleRequis("Labo informatique");
        verifier.verifyThat(ContraintesEmploiDuTemps::changementDeSalle).given(premier, tp).penalizesBy(0);
        // Deux groupes différents ne sont pas comparés
        Lecon autreGroupe = lecon(lun2, g2, Set.of(11L), Set.of(101L));
        verifier.verifyThat(ContraintesEmploiDuTemps::changementDeSalle).given(premier, autreGroupe).penalizesBy(0);
    }
}
