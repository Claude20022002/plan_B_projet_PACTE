package ma.hestim.solver.domain;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

import com.fasterxml.jackson.annotation.JsonIgnore;

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
    /**
     * Intervalles élémentaires couverts (seul, ou avec le créneau suivant). Un jour est découpé aux
     * bornes de tous ses créneaux, toutes grilles confondues : deux créneaux se chevauchent si et
     * seulement s'ils partagent un intervalle. Identifiant : jour × 1440 + minute de début.
     */
    @JsonIgnore
    private List<Integer> atomes = List.of();
    @JsonIgnore
    private List<Integer> atomesAvecSuivant = List.of();

    public static void calculerAtomes(Collection<Creneau> creneaux) {
        Map<Integer, TreeSet<Integer>> bornes = new HashMap<>();
        for (Creneau c : creneaux) {
            TreeSet<Integer> jour = bornes.computeIfAbsent(c.jour, j -> new TreeSet<>());
            jour.add(c.debut);
            jour.add(c.fin);
            if (c.finAvecSuivant != null) {
                jour.add(c.finAvecSuivant);
            }
        }
        for (Creneau c : creneaux) {
            TreeSet<Integer> jour = bornes.get(c.jour);
            c.atomes = jour.subSet(c.debut, true, c.fin, false).stream().map(b -> c.jour * 1440 + b).toList();
            c.atomesAvecSuivant = c.finAvecSuivant == null ? c.atomes
                    : jour.subSet(c.debut, true, c.finAvecSuivant, false).stream().map(b -> c.jour * 1440 + b).toList();
        }
    }

    @JsonIgnore
    public List<Integer> getAtomes() { return atomes; }
    @JsonIgnore
    public List<Integer> getAtomesAvecSuivant() { return atomesAvecSuivant; }

    public Integer getFinAvecSuivant() { return finAvecSuivant; }
    public void setFinAvecSuivant(Integer finAvecSuivant) { this.finAvecSuivant = finAvecSuivant; }

    @Override
    public String toString() {
        return "Creneau{jour=" + jour + ", " + debut + "-" + fin + ", rang=" + rang + "}";
    }
}
