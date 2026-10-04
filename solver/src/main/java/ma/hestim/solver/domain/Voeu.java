package ma.hestim.solver.domain;

/**
 * Disponibilité d'un enseignant sur un créneau de la semaine type (problème fixe) :
 * INDISPONIBLE bloque (indisponibilité déclarée, ou créneau non déclaré par un vacataire),
 * EVITER et PREFERE ne sont que des vœux.
 */
public class Voeu {

    public enum Type { INDISPONIBLE, EVITER, PREFERE }

    private Long enseignantId;
    private Long creneauId;
    private Type type;

    public Voeu() {
    }

    public Voeu(Long enseignantId, Long creneauId, Type type) {
        this.enseignantId = enseignantId;
        this.creneauId = creneauId;
        this.type = type;
    }

    public Long getEnseignantId() { return enseignantId; }
    public void setEnseignantId(Long enseignantId) { this.enseignantId = enseignantId; }
    public Long getCreneauId() { return creneauId; }
    public void setCreneauId(Long creneauId) { this.creneauId = creneauId; }
    public Type getType() { return type; }
    public void setType(Type type) { this.type = type; }
}
