package ma.hestim.solver.domain;

import java.util.HashMap;
import java.util.Map;

/**
 * Paramètres de planification de Planner (problème fixe, une seule instance) : heures maximales
 * par jour, samedi après-midi, temps de trajet entre campus (clé « petitId-grandId »).
 */
public class Parametres {

    private int maxMinutesJourGroupe = 8 * 60;
    private int maxMinutesJourEnseignant = 8 * 60;
    private boolean samediApresMidi = false;
    private int trajetDefautMinutes = 30;
    private Map<String, Integer> trajets = new HashMap<>();

    public Parametres() {
    }

    /** Minutes pour passer d'un campus à l'autre (0 sur le même campus). */
    public int trajet(Long campusA, Long campusB) {
        if (campusA == null || campusB == null || campusA.equals(campusB)) {
            return 0;
        }
        String cle = Math.min(campusA, campusB) + "-" + Math.max(campusA, campusB);
        return trajets.getOrDefault(cle, trajetDefautMinutes);
    }

    public int getMaxMinutesJourGroupe() { return maxMinutesJourGroupe; }
    public void setMaxMinutesJourGroupe(int maxMinutesJourGroupe) { this.maxMinutesJourGroupe = maxMinutesJourGroupe; }
    public int getMaxMinutesJourEnseignant() { return maxMinutesJourEnseignant; }
    public void setMaxMinutesJourEnseignant(int maxMinutesJourEnseignant) { this.maxMinutesJourEnseignant = maxMinutesJourEnseignant; }
    public boolean isSamediApresMidi() { return samediApresMidi; }
    public void setSamediApresMidi(boolean samediApresMidi) { this.samediApresMidi = samediApresMidi; }
    public int getTrajetDefautMinutes() { return trajetDefautMinutes; }
    public void setTrajetDefautMinutes(int trajetDefautMinutes) { this.trajetDefautMinutes = trajetDefautMinutes; }
    public Map<String, Integer> getTrajets() { return trajets; }
    public void setTrajets(Map<String, Integer> trajets) { this.trajets = trajets == null ? new HashMap<>() : trajets; }
}
