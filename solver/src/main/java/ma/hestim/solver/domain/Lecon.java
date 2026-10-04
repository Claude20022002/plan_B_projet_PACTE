package ma.hestim.solver.domain;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

import ai.timefold.solver.core.api.domain.entity.PlanningEntity;
import ai.timefold.solver.core.api.domain.entity.PlanningPin;
import ai.timefold.solver.core.api.domain.lookup.PlanningId;
import ai.timefold.solver.core.api.domain.valuerange.ValueRangeProvider;
import ai.timefold.solver.core.api.domain.variable.PlanningVariable;

/**
 * Une séance de la semaine type d'un enseignement. L'enseignant (et les co-enseignants) et les
 * groupes sont déjà connus (services de Planner) : seuls le créneau et la salle sont choisis.
 * {@code groupes} contient les groupes occupés, hiérarchie comprise (un CM de promotion occupe
 * aussi ses TD et TP) ; {@code groupesDirects} ceux qui suivent la séance ; {@code feuilles} les
 * groupes les plus fins concernés (la journée vue par les étudiants : heures, trous, campus).
 * Une leçon épinglée représente une occupation déjà publiée : elle ne bouge pas.
 */
@PlanningEntity
public class Lecon {

    @PlanningId
    private String id;
    private Long enseignementId;
    private Long coursId;
    private String type;
    private String regime;
    /** 1 ou 2 créneaux consécutifs (demi-journée à HESTIM) */
    private int longueur = 2;
    private Set<Long> enseignants = new HashSet<>();
    private Set<Long> groupes = new HashSet<>();
    private Set<Long> groupesDirects = new HashSet<>();
    private Set<Long> feuilles = new HashSet<>();
    private int effectif;
    private String typeSalleRequis;
    private Set<String> equipementsRequis = new HashSet<>();
    private boolean distanciel;
    private Long campusPrefere;

    @PlanningPin
    private boolean epinglee;

    @JsonIgnore
    private List<Creneau> creneauxPossibles = new ArrayList<>();
    @JsonIgnore
    private List<Salle> sallesPossibles = new ArrayList<>();
    @PlanningVariable(valueRangeProviderRefs = "creneauxPossibles")
    private Creneau creneau;

    @PlanningVariable(valueRangeProviderRefs = "sallesPossibles", allowsUnassigned = true)
    private Salle salle;

    public Lecon() {
    }

    // ── Calculs utilisés par les contraintes ─────────────────────────────

    public int getJour() {
        return creneau == null ? 0 : creneau.getJour();
    }

    public int getDebut() {
        return creneau == null ? 0 : creneau.getDebut();
    }

    /** Fin réelle : celle du créneau suivant pour une leçon de deux créneaux. */
    public int getFin() {
        if (creneau == null) {
            return 0;
        }
        if (longueur == 2 && creneau.getFinAvecSuivant() != null) {
            return creneau.getFinAvecSuivant();
        }
        return creneau.getFin();
    }

    public int getDuree() {
        return getFin() - getDebut();
    }

    /** Instant dans la semaine (pour ordonner CM et TD). */
    public int getInstantSemaine() {
        return getJour() * 24 * 60 + getDebut();
    }

    public boolean chevauche(Lecon autre) {
        return creneau != null && autre.creneau != null && getJour() == autre.getJour()
                && getDebut() < autre.getFin() && autre.getDebut() < getFin();
    }

    /** Minutes entre deux leçons du même jour qui ne se chevauchent pas. */
    public int ecartAvec(Lecon autre) {
        return Math.max(autre.getDebut() - getFin(), getDebut() - autre.getFin());
    }

    public boolean partageEnseignant(Lecon autre) {
        return intersecte(enseignants, autre.enseignants);
    }

    /**
     * Conflit de groupes : un groupe qui suit l'une des séances est occupé par l'autre. Deux TD
     * frères ne sont pas en conflit (leur promotion commune n'est qu'occupée, pas suivie), mais un
     * CM de promotion l'est avec chacun de ses TD et TP.
     */
    public boolean partageGroupe(Lecon autre) {
        return intersecte(groupesDirects, autre.groupes) || intersecte(autre.groupesDirects, groupes);
    }

    public boolean partageGroupeDirect(Lecon autre) {
        return intersecte(groupesDirects, autre.groupesDirects);
    }

    /** Le créneau (ou, pour deux créneaux, le suivant) est-il celui donné ? */
    public boolean occupeCreneau(Long creneauId) {
        if (creneau == null || creneauId == null) {
            return false;
        }
        return creneauId.equals(creneau.getId()) || (longueur == 2 && creneauId.equals(creneau.getSuivantId()));
    }

    /**
     * Valeurs que le solveur peut essayer : créneaux de la grille du régime (avec un suivant pour
     * une séance de deux créneaux), salles du bon type, assez grandes et équipées. Une leçon en
     * distanciel n'a pas de salle ; une leçon sans aucune salle adaptée reste sans salle et le
     * score le signale. Une leçon épinglée garde ses valeurs.
     */
    public void calculerValeursPossibles(List<Creneau> creneaux, List<Salle> salles) {
        if (epinglee) {
            creneauxPossibles = creneau == null ? List.of() : List.of(creneau);
            sallesPossibles = salle == null ? List.of() : List.of(salle);
            return;
        }
        creneauxPossibles = creneaux.stream()
                .filter(c -> (regime == null || regime.equals(c.getRegime())) && (longueur == 1 || c.getSuivantId() != null))
                .toList();
        if (creneauxPossibles.isEmpty()) {
            // Grille absente pour ce régime : toute la grille, le score signalera l'écart
            creneauxPossibles = creneaux;
        }
        sallesPossibles = distanciel ? List.of() : salles.stream()
                .filter(s -> (typeSalleRequis == null || typeSalleRequis.equals(s.getType()))
                        && s.getCapacite() >= effectif
                        && s.getEquipements().containsAll(equipementsRequis))
                .toList();
    }

    @ValueRangeProvider(id = "creneauxPossibles")
    @JsonIgnore
    public List<Creneau> getCreneauxPossibles() {
        return creneauxPossibles;
    }

    @ValueRangeProvider(id = "sallesPossibles")
    @JsonIgnore
    public List<Salle> getSallesPossibles() {
        return sallesPossibles;
    }

    /** Groupes les plus fins concernés ; à défaut (problème ancien ou test), les groupes directs. */
    @JsonIgnore
    public Set<Long> getFeuillesEffectives() {
        return feuilles.isEmpty() ? groupesDirects : feuilles;
    }

    /** Créneaux occupés : le créneau, et son suivant pour une leçon de deux créneaux. */
    @JsonIgnore
    public List<Long> getCreneauxOccupes() {
        if (creneau == null) {
            return List.of();
        }
        if (longueur == 2 && creneau.getSuivantId() != null) {
            return List.of(creneau.getId(), creneau.getSuivantId());
        }
        return List.of(creneau.getId());
    }

    /** Étudiants (groupes les plus fins) et enseignants dont la journée compte cette leçon. */
    @JsonIgnore
    public List<Ressource> getRessources() {
        List<Ressource> ressources = new ArrayList<>();
        getFeuillesEffectives().forEach(g -> ressources.add(new Ressource(Ressource.Nature.GROUPE, g)));
        enseignants.forEach(e -> ressources.add(new Ressource(Ressource.Nature.ENSEIGNANT, e)));
        return ressources;
    }

    /** Rangs de la grille couverts (pour les trous de la journée). */
    @JsonIgnore
    public int getRangDebut() {
        return creneau == null ? 0 : creneau.getRang();
    }

    @JsonIgnore
    public int getRangFin() {
        return getRangDebut() + getCreneauxOccupes().size() - 1;
    }

    public Long getCampusId() {
        return salle == null ? null : salle.getCampusId();
    }

    private static boolean intersecte(Collection<Long> a, Collection<Long> b) {
        for (Long x : a) {
            if (b.contains(x)) {
                return true;
            }
        }
        return false;
    }

    // ── Accesseurs ───────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Long getEnseignementId() { return enseignementId; }
    public void setEnseignementId(Long enseignementId) { this.enseignementId = enseignementId; }
    public Long getCoursId() { return coursId; }
    public void setCoursId(Long coursId) { this.coursId = coursId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getRegime() { return regime; }
    public void setRegime(String regime) { this.regime = regime; }
    public int getLongueur() { return longueur; }
    public void setLongueur(int longueur) { this.longueur = longueur; }
    public Set<Long> getEnseignants() { return enseignants; }
    public void setEnseignants(Set<Long> enseignants) { this.enseignants = enseignants == null ? new HashSet<>() : enseignants; }
    public Set<Long> getGroupes() { return groupes; }
    public void setGroupes(Set<Long> groupes) { this.groupes = groupes == null ? new HashSet<>() : groupes; }
    public Set<Long> getGroupesDirects() { return groupesDirects; }
    public void setGroupesDirects(Set<Long> groupesDirects) { this.groupesDirects = groupesDirects == null ? new HashSet<>() : groupesDirects; }
    public Set<Long> getFeuilles() { return feuilles; }
    public void setFeuilles(Set<Long> feuilles) { this.feuilles = feuilles == null ? new HashSet<>() : feuilles; }
    public int getEffectif() { return effectif; }
    public void setEffectif(int effectif) { this.effectif = effectif; }
    public String getTypeSalleRequis() { return typeSalleRequis; }
    public void setTypeSalleRequis(String typeSalleRequis) { this.typeSalleRequis = typeSalleRequis; }
    public Set<String> getEquipementsRequis() { return equipementsRequis; }
    public void setEquipementsRequis(Set<String> equipementsRequis) { this.equipementsRequis = equipementsRequis == null ? new HashSet<>() : equipementsRequis; }
    public boolean isDistanciel() { return distanciel; }
    public void setDistanciel(boolean distanciel) { this.distanciel = distanciel; }
    public Long getCampusPrefere() { return campusPrefere; }
    public void setCampusPrefere(Long campusPrefere) { this.campusPrefere = campusPrefere; }
    public boolean isEpinglee() { return epinglee; }
    public void setEpinglee(boolean epinglee) { this.epinglee = epinglee; }
    public Creneau getCreneau() { return creneau; }
    public void setCreneau(Creneau creneau) { this.creneau = creneau; }
    public Salle getSalle() { return salle; }
    public void setSalle(Salle salle) { this.salle = salle; }

    @Override
    public String toString() {
        return id + "@" + creneau + "/" + salle;
    }
}
