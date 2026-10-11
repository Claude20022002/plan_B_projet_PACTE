package ma.hestim.solver.contraintes;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import ma.hestim.solver.domain.Lecon;

/**
 * Bon usage des salles : les calculs des deux préférences « Salle à la taille du groupe » et
 * « Même salle pour deux cours qui se suivent » (ContraintesEmploiDuTemps).
 *
 * Sans elles, toute salle assez grande se vaut pour le solveur : un TD de 20 étudiants peut
 * prendre l'amphithéâtre et en priver un CM de 120, et un groupe peut changer de salle entre
 * deux cours qui se suivent sans aucune raison.
 */
final class UsageDesSalles {

    /** Places laissées vides sans pénalité : une salle un peu trop grande ne coûte rien. */
    static final int MARGE_PLACES = 10;

    /** Pause au-delà de laquelle deux cours ne « se suivent » plus (la pause de midi est plus longue). */
    static final int PAUSE_COURTE = 30;

    private UsageDesSalles() {
    }

    /**
     * Places perdues par une leçon dans sa salle, par tranches de 10 au-delà de la marge : à
     * capacité suffisante, la plus petite salle l'emporte, et les grandes restent libres.
     */
    static int placesPerdues(Lecon l) {
        return Math.max(0, (l.getSalle().getCapacite() - l.getEffectif() - MARGE_PLACES + 9) / 10);
    }

    /**
     * Changements de salle dans la journée d'un groupe : deux cours qui se suivent, à une pause
     * courte près, dans deux salles différentes. Une salle de type imposé (un laboratoire) justifie
     * le changement, et une leçon à distance n'a pas de salle : ni l'une ni l'autre ne compte.
     */
    static int changementsDeSalle(List<Lecon> lecons) {
        List<Lecon> journee = lecons.stream().sorted(Comparator.comparingInt(Lecon::getDebut)).toList();
        int changements = 0;
        for (int i = 1; i < journee.size(); i++) {
            Lecon a = journee.get(i - 1);
            Lecon b = journee.get(i);
            boolean libresDeRester = a.getSalle() != null && b.getSalle() != null
                    && a.getTypeSalleRequis() == null && b.getTypeSalleRequis() == null;
            if (libresDeRester && !a.chevauche(b) && b.getDebut() - a.getFin() <= PAUSE_COURTE
                    && !Objects.equals(a.getSalle().getId(), b.getSalle().getId())) {
                changements++;
            }
        }
        return changements;
    }
}
