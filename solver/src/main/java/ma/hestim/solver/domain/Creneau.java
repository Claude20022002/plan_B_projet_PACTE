package ma.hestim.solver.domain;

import ai.timefold.solver.core.api.domain.lookup.PlanningId;

/**
 * Créneau de la semaine type (problème fixe) : un rang de la grille d'un régime, un jour donné.
 * Une séance de HESTIM occupe en général deux créneaux consécutifs de la même demi-journée :
 * {@code suivantId} et {@code finAvecSuivant} décrivent le créneau qui suit, s'il existe.
 */
public class Creneau {

    @PlanningId
    private Long id;
    /** 1 = lundi … 6 = samedi */
    private int jour;
    /** Minutes depuis minuit */
    private int debut;
    private int fin;
    private int rang;
    private String regime;
    private Long suivantId;
    private Integer finAvecSuivant;

    public Creneau() {
    }

    public Creneau(Long id, int jour, int debut, int fin, int rang, String regime, Long suivantId, Integer finAvecSuivant) {
        this.id = id;
        this.jour = jour;
        this.debut = debut;
        this.fin = fin;
        this.rang = rang;
        this.regime = regime;
        this.suivantId = suivantId;
        this.finAvecSuivant = finAvecSuivant;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public int getJour() { return jour; }
    public void setJour(int jour) { this.jour = jour; }
    public int getDebut() { return debut; }
    public void setDebut(int debut) { this.debut = debut; }
    public int getFin() { return fin; }
    public void setFin(int fin) { this.fin = fin; }
    public int getRang() { return rang; }
    public void setRang(int rang) { this.rang = rang; }
    public String getRegime() { return regime; }
    public void setRegime(String regime) { this.regime = regime; }
    public Long getSuivantId() { return suivantId; }
    public void setSuivantId(Long suivantId) { this.suivantId = suivantId; }
    public Integer getFinAvecSuivant() { return finAvecSuivant; }
    public void setFinAvecSuivant(Integer finAvecSuivant) { this.finAvecSuivant = finAvecSuivant; }

    @Override
    public String toString() {
        return "Creneau{jour=" + jour + ", " + debut + "-" + fin + ", rang=" + rang + "}";
    }
}
