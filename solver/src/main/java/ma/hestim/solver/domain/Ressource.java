package ma.hestim.solver.domain;

import java.util.Objects;

/**
 * Groupe ou enseignant présent dans le problème (problème fixe) : sert à compter les heures
 * par jour de chacun (contrainte des heures maximales).
 */
public class Ressource {

    public enum Nature { GROUPE, ENSEIGNANT }

    private Nature nature;
    private Long id;

    public Ressource() {
    }

    public Ressource(Nature nature, Long id) {
        this.nature = nature;
        this.id = id;
    }

    public boolean concerne(Lecon lecon) {
        return nature == Nature.GROUPE ? lecon.getFeuillesEffectives().contains(id) : lecon.getEnseignants().contains(id);
    }

    @Override
    public boolean equals(Object o) {
        return o instanceof Ressource r && nature == r.nature && Objects.equals(id, r.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(nature, id);
    }

    public Nature getNature() { return nature; }
    public void setNature(Nature nature) { this.nature = nature; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
}
