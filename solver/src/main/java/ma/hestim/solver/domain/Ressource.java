package ma.hestim.solver.domain;

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
        return nature == Nature.GROUPE ? lecon.getGroupesDirects().contains(id) : lecon.getEnseignants().contains(id);
    }

    public Nature getNature() { return nature; }
    public void setNature(Nature nature) { this.nature = nature; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
}
