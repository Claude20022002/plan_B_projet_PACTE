package ma.hestim.solver.domain;

import java.util.ArrayList;
import java.util.List;

import ai.timefold.solver.core.api.domain.solution.PlanningEntityCollectionProperty;
import ai.timefold.solver.core.api.domain.solution.PlanningScore;
import ai.timefold.solver.core.api.domain.solution.PlanningSolution;
import ai.timefold.solver.core.api.domain.solution.ProblemFactCollectionProperty;
import ai.timefold.solver.core.api.domain.solution.ProblemFactProperty;
import ai.timefold.solver.core.api.score.buildin.hardsoft.HardSoftScore;
import ai.timefold.solver.core.api.solver.SolverStatus;

/**
 * Problème et solution : la semaine type des enseignements à placer, avec les créneaux de la
 * grille, les salles, les disponibilités des enseignants et les paramètres de Planner.
 */
@PlanningSolution
public class EmploiDuTemps {

    @ProblemFactCollectionProperty
    private List<Creneau> creneaux = new ArrayList<>();

    @ProblemFactCollectionProperty
    private List<Salle> salles = new ArrayList<>();

    @ProblemFactCollectionProperty
    private List<Voeu> voeux = new ArrayList<>();

    @ProblemFactCollectionProperty
    private List<Ressource> ressources = new ArrayList<>();

    @ProblemFactProperty
    private Parametres parametres = new Parametres();

    @PlanningEntityCollectionProperty
    private List<Lecon> lecons = new ArrayList<>();

    @PlanningScore
    private HardSoftScore score;

    /** Durée maximale du calcul demandée par Planner (secondes) */
    private Integer dureeSecondes;

    private SolverStatus statut;

    public EmploiDuTemps() {
    }


    /** Après lecture du problème : valeurs que chaque leçon peut prendre (créneaux, salles). */
    public void preparerValeursPossibles() {
        Creneau.calculerAtomes(creneaux);
        lecons.forEach(l -> l.calculerValeursPossibles(creneaux, salles));
    }

    public List<Creneau> getCreneaux() { return creneaux; }
    public void setCreneaux(List<Creneau> creneaux) { this.creneaux = creneaux; }
    public List<Salle> getSalles() { return salles; }
    public void setSalles(List<Salle> salles) { this.salles = salles; }
    public List<Voeu> getVoeux() { return voeux; }
    public void setVoeux(List<Voeu> voeux) { this.voeux = voeux; }
    public List<Ressource> getRessources() { return ressources; }
    public void setRessources(List<Ressource> ressources) { this.ressources = ressources; }
    public Parametres getParametres() { return parametres; }
    public void setParametres(Parametres parametres) { this.parametres = parametres == null ? new Parametres() : parametres; }
    public List<Lecon> getLecons() { return lecons; }
    public void setLecons(List<Lecon> lecons) { this.lecons = lecons; }
    public HardSoftScore getScore() { return score; }
    public void setScore(HardSoftScore score) { this.score = score; }
    public Integer getDureeSecondes() { return dureeSecondes; }
    public void setDureeSecondes(Integer dureeSecondes) { this.dureeSecondes = dureeSecondes; }
    public SolverStatus getStatut() { return statut; }
    public void setStatut(SolverStatus statut) { this.statut = statut; }
}
