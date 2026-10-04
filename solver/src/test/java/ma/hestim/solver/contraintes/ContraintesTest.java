package ma.hestim.solver.contraintes;

import java.util.Set;

import org.junit.jupiter.api.Test;

import ai.timefold.solver.test.api.score.stream.ConstraintVerifier;
import ma.hestim.solver.domain.Creneau;
import ma.hestim.solver.domain.EmploiDuTemps;
import ma.hestim.solver.domain.Lecon;
import ma.hestim.solver.domain.Parametres;
import ma.hestim.solver.domain.Ressource;
import ma.hestim.solver.domain.Salle;
import ma.hestim.solver.domain.Voeu;

/** Une vérification par règle de la semaine type. */
class ContraintesTest {

    private final ConstraintVerifier<ContraintesEmploiDuTemps, EmploiDuTemps> verifier =
            ConstraintVerifier.build(new ContraintesEmploiDuTemps(), EmploiDuTemps.class, Lecon.class);

    // Lundi matin : rangs 1 et 2 (demi-journée), lundi après-midi : rang 3
    private final Creneau lun1 = new Creneau(1L, 1, 540, 645, 1, "initiale", 2L, 750);
    private final Creneau lun2 = new Creneau(2L, 1, 660, 750, 2, "initiale", null, null);
    private final Creneau lun3 = new Creneau(3L, 1, 810, 915, 3, "initiale", 4L, 1020);
    private final Creneau mar1 = new Creneau(5L, 2, 540, 645, 1, "initiale", 6L, 750);
    private final Creneau sam3 = new Creneau(9L, 6, 810, 915, 3, "initiale", null, null);
    private final Creneau soir = new Creneau(10L, 1, 1080, 1260, 1, "continue", null, null);

    private final Salle g1 = new Salle(1L, "G-S01", 40, "Salle de cours", 1L);
    private final Salle g2 = new Salle(2L, "G-S02", 40, "Salle de cours", 1L);
    private final Salle petite = new Salle(3L, "G-TD01", 10, "Salle TD", 1L);
    private final Salle st = new Salle(4L, "ST-S01", 40, "Salle de cours", 2L);
    private final Salle labo = new Salle(5L, "G-LABO", 30, "Labo informatique", 1L);

    private static int compteur = 0;

    private static Lecon lecon(Creneau creneau, Salle salle, Set<Long> enseignants, Set<Long> groupes) {
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

    @Test
    void salleEnseignantEtGroupeJamaisEnDouble() {
        Lecon a = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        Lecon memeSalle = lecon(lun1, g1, Set.of(11L), Set.of(101L));
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitSalle).given(a, memeSalle).penalizesBy(1);

        Lecon memeProf = lecon(lun1, g2, Set.of(10L), Set.of(101L));
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitEnseignant).given(a, memeProf).penalizesBy(1);

        // Le CM de la promotion (100) occupe aussi le TD 102 : même ensemble « groupes »
        Lecon td = lecon(lun1, g2, Set.of(11L), Set.of(102L, 100L));
        td.setGroupesDirects(Set.of(102L));
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitGroupe).given(a, td).penalizesBy(1);
        // Deux TD frères (102 et 103) de la même promotion peuvent avoir cours en même temps
        Lecon tdFrere = lecon(lun1, g1, Set.of(12L), Set.of(103L, 100L));
        tdFrere.setGroupesDirects(Set.of(103L));
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitGroupe).given(td, tdFrere).penalizesBy(0);

        Lecon autreJour = lecon(mar1, g1, Set.of(10L), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitSalle).given(a, autreJour).penalizesBy(0);
    }

    @Test
    void uneSeanceDeDeuxCreneauxOccupeLaDemiJournee() {
        Lecon demiJournee = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        demiJournee.setLongueur(2);
        Lecon rang2 = lecon(lun2, g1, Set.of(11L), Set.of(101L));
        verifier.verifyThat(ContraintesEmploiDuTemps::conflitSalle).given(demiJournee, rang2).penalizesBy(1);

        Lecon surRang2 = lecon(lun2, g2, Set.of(12L), Set.of(103L));
        surRang2.setLongueur(2);
        verifier.verifyThat(ContraintesEmploiDuTemps::longueurSeance).given(surRang2).penalizesBy(1);
    }

    @Test
    void salleAdaptee() {
        Lecon trop = lecon(lun1, petite, Set.of(10L), Set.of(100L));
        trop.setEffectif(25);
        verifier.verifyThat(ContraintesEmploiDuTemps::capaciteSalle).given(trop).penalizes();

        Lecon tp = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        tp.setTypeSalleRequis("Labo informatique");
        verifier.verifyThat(ContraintesEmploiDuTemps::typeSalle).given(tp).penalizesBy(1);
        tp.setSalle(labo);
        verifier.verifyThat(ContraintesEmploiDuTemps::typeSalle).given(tp).penalizesBy(0);

        Lecon sansSalle = lecon(lun1, null, Set.of(10L), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::salleRequise).given(sansSalle).penalizesBy(1);
        sansSalle.setDistanciel(true);
        verifier.verifyThat(ContraintesEmploiDuTemps::salleRequise).given(sansSalle).penalizesBy(0);
    }

    @Test
    void grilleDuRegimeEtDisponibilites() {
        Lecon initiale = lecon(soir, g1, Set.of(10L), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::grilleDuRegime).given(initiale).penalizesBy(1);

        Lecon a = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        a.setLongueur(2);
        // Indisponible sur le rang 2 : une demi-journée qui commence au rang 1 le touche aussi
        Voeu indisponible = new Voeu(10L, 2L, Voeu.Type.INDISPONIBLE);
        verifier.verifyThat(ContraintesEmploiDuTemps::enseignantIndisponible).given(a, indisponible).penalizesBy(1);
        Voeu eviter = new Voeu(10L, 1L, Voeu.Type.EVITER);
        verifier.verifyThat(ContraintesEmploiDuTemps::voeuEviter).given(a, eviter).penalizesBy(1);
    }

    @Test
    void heuresMaximalesParJour() {
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
    void trajetEntreCampusEtCampusUnique() {
        Parametres parametres = new Parametres();
        // 9 h - 10 h 45 à Gandhi puis 11 h à Stendhal : 15 minutes < 30
        Lecon gandhi = lecon(lun1, g1, Set.of(10L), Set.of(100L));
        Lecon stendhal = lecon(lun2, st, Set.of(11L), Set.of(100L));
        verifier.verifyThat(ContraintesEmploiDuTemps::trajetEntreCampus).given(gandhi, stendhal, parametres).penalizesBy(1);
        verifier.verifyThat(ContraintesEmploiDuTemps::unSeulCampusParJour).given(gandhi, stendhal).penalizesBy(1);
    }

    @Test
    void preferencesDeLaSemaine() {
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
        // 10 h 45 → 15 h 30 : 285 minutes de trou
        verifier.verifyThat(ContraintesEmploiDuTemps::trousDansLaJournee).given(matin, fin).penalizesBy(9);
        Lecon entre = lecon(lun3, g2, Set.of(12L), Set.of(100L));
        entre.setLongueur(1);
        verifier.verifyThat(ContraintesEmploiDuTemps::trousDansLaJournee).given(matin, entre, fin).penalizesBy(5);
    }
}
