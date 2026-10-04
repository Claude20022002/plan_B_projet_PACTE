package ma.hestim.solver.domain;

import java.util.HashSet;
import java.util.Set;

import ai.timefold.solver.core.api.domain.lookup.PlanningId;

/** Salle disponible pour la génération (problème fixe). */
public class Salle {

    @PlanningId
    private Long id;
    private String nom;
    private int capacite;
    private String type;
    private Set<String> equipements = new HashSet<>();
    private Long campusId;

    public Salle() {
    }

    public Salle(Long id, String nom, int capacite, String type, Long campusId) {
        this.id = id;
        this.nom = nom;
        this.capacite = capacite;
        this.type = type;
        this.campusId = campusId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public int getCapacite() { return capacite; }
    public void setCapacite(int capacite) { this.capacite = capacite; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Set<String> getEquipements() { return equipements; }
    public void setEquipements(Set<String> equipements) { this.equipements = equipements == null ? new HashSet<>() : equipements; }
    public Long getCampusId() { return campusId; }
    public void setCampusId(Long campusId) { this.campusId = campusId; }

    @Override
    public String toString() {
        return nom;
    }
}
