<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# HOR · Horaires et créneaux

## Grille de la semaine

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `HOR.GRILLE.CRENEAUX` | Créneaux de la grille | Jour, début, fin et rang de chaque créneau, par rythme. | donnee | structure | — | global, pédagogique | oui | — | 1 | — | etablissement | periode | solveur (Creneau) | 7.3 7.4 7.8 |
| `HOR.GRILLE.DUREE_PERIODE` | Durée d'une période | Unité de la grille (de 15 à 120 min). Aujourd'hui, chaque créneau a sa durée, mais une séance ne couvre que 1 ou 2 créneaux. | donnee | duree_min | — | global, pédagogique | non | — | 1 | — | etablissement | periode | base (Creneau.duree_minutes) | 7.5 |
| `HOR.GRILLE.INTERVALLE` | Intervalle entre deux séances | Marge prévue par la grille entre deux créneaux. | donnee | duree_min | `0` | global, pédagogique | non | — | 2 | — | etablissement | periode | absent | 7.7 7.15 |
| `HOR.GRILLE.SEUIL_SUITE` | Écart maximal entre créneaux qui se suivent | Deux créneaux forment une même séance si l'écart reste sous ce seuil (30 min en dur). | donnee | duree_min | `30` | global, pédagogique | non | — | 3 | — | etablissement | periode | solveur (probleme.js, UsageDesSalles.PAUSE_COURTE) | ajout |
| `HOR.GRILLE.DEBUT_APRES_MIDI` | Début de l'après-midi | Sépare matin et après-midi (12 h 30 en dur dans deux fichiers). | donnee | heure | `12:30` | global, pédagogique | non | — | 2 | — | etablissement | periode | solveur (probleme.js, ContraintesEmploiDuTemps.APRES_MIDI) | ajout |
| `HOR.GRILLE.PAUSE_MATIN` | Durée de la pause du matin | Récréation ou pause de la matinée. | donnee | duree_min | — | global, pédagogique | non | — | 2 | — | etablissement | periode | absent | 7.10 16A.5 |
| `HOR.GRILLE.PAUSE_MIDI` | Durée de la pause du midi | Temps de repas à garantir. | donnee | duree_min | — | global, pédagogique | non | — | 2 | — | etablissement | periode | absent | 7.11 16A.9 |
| `HOR.GRILLE.PAUSE_APRES_MIDI` | Durée de la pause de l'après-midi | Pause de l'après-midi. | donnee | duree_min | — | global, pédagogique | non | — | 3 | — | etablissement | periode | absent | 7.12 |
| `HOR.GRILLE.DEJEUNER_DEBUT` | Début de la pause déjeuner | Plage possible du déjeuner, début. | donnee | heure | — | global, pédagogique | non | — | 2 | — | etablissement | periode | absent | 7.13 |
| `HOR.GRILLE.DEJEUNER_FIN` | Fin de la pause déjeuner | Plage possible du déjeuner, fin. | donnee | heure | — | global, pédagogique | non | — | 2 | — | etablissement | periode | absent | 7.14 |
| `HOR.GRILLE.DEPLACEMENT_SALLES` | Temps de déplacement entre salles | Marge entre deux salles d'un même campus. | donnee | duree_min | `0` | global, pédagogique | non | — | 3 | — | etablissement | periode | absent | 7.16 6.52 12.9 |
| `HOR.GRILLE.TRANSITION_AGE` | Temps de transition | Temps de changement d'activité chez les plus jeunes. | donnee | duree_min | `0` | global, pédagogique | non | — | 3 | — | etablissement | periode | absent | 16A.11 |

## Types de créneaux

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `HOR.TYPE.FIXE` | Créneaux fixes ou flexibles | Fixe : grille commune. Flexible : le début d'une séance peut glisser sur des périodes. | donnee | enum : fixe, flexible | `fixe` | global, pédagogique | non | — | 2 | — | etablissement | periode | solveur (toujours fixe aujourd'hui) | 7.19 7.20 |
| `HOR.TYPE.RESERVES_PRINCIPALES` | Réservés aux matières principales | Plages à garder pour les matières principales. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | periode | absent | 7.21 |
| `HOR.TYPE.RESERVES_SPORT` | Réservés aux activités sportives | Plages à garder pour le sport. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | periode | absent | 7.22 |
| `HOR.TYPE.RESERVES_TP` | Réservés aux TP | Plages à garder pour les TP. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | periode | absent | 7.23 |
| `HOR.TYPE.RESERVES_TD` | Réservés aux TD | Plages à garder pour les TD. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | periode | absent | 7.24 |
| `HOR.TYPE.RESERVES_EXAMENS` | Réservés aux examens | Plages à garder pour les examens. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | periode | absent | 7.25 |
| `HOR.TYPE.RESERVES_EXTRA` | Réservés aux activités extrascolaires | Plages libres de cours pour ces activités. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | periode | absent | 7.26 |
| `HOR.TYPE.RESERVES_REUNIONS` | Réservés aux réunions | Plages communes, libres pour que les enseignants se réunissent. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | periode | absent | 7.27 |
| `HOR.TYPE.RESERVES_FORMATIONS` | Réservés aux formations | Plages de formation du personnel. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | periode | absent | 7.28 |
| `HOR.TYPE.RESERVES_SOUTIEN` | Réservés au soutien | Plages de cours de soutien. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | periode | absent | 7.29 8.27 16B.8 |
| `HOR.TYPE.RESERVES_PROJETS` | Réservés aux projets | Plages de projet. | donnee | structure | — | global, pédagogique | non | — | 3 | — | etablissement | periode | absent | 7.30 8.25 16C.12 16E.14 |

## Règles de la journée

| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd'hui | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `HOR.REGLE.GRILLE_RYTHME` | Grille du rythme | Une séance reste sur la grille du rythme de sa filière. | regle | booleen | `true` | global | oui | strict | 1 | — | non | periode | solveur (grilleDuRegime) | ajout |
| `HOR.REGLE.HEURES_AUTORISEES` | Heures autorisées | Aucune séance hors des heures et jours d'ouverture. | regle | booleen | `true` | global | oui | strict | 1 | — | non | periode | absent | 17B.16 |
| `HOR.REGLE.MAX_H_JOUR_GROUPE` | Maximum d'heures par jour | Plafond quotidien d'un groupe, en minutes (règle du solveur commune avec les enseignants). | regle | duree_min | `480` | global, pédagogique, individuel (groupe) | non | strict * | 2 | — | etablissement | periode | solveur (max_heures_jour_groupe, maxHeuresJour) | 7.31 14.8 |
| `HOR.REGLE.MIN_H_JOUR_GROUPE` | Minimum d'heures par jour | Évite les journées presque vides. | regle | duree_min | — | global, pédagogique, individuel (groupe) | non | souple * | 3 | 5 | etablissement | periode | absent | 7.32 7.40 |
| `HOR.REGLE.MAX_CONSECUTIVES` | Maximum d'heures consécutives | Temps de cours continu à ne pas dépasser sans pause. | regle | duree_min | — | global, pédagogique, individuel (groupe) | non | souple * | 2 | 25 | etablissement | periode | absent | 7.33 |
| `HOR.REGLE.JOURNEE_LONGUE` | Éviter les journées trop longues | Amplitude entre la première et la dernière séance d'un groupe. | regle | duree_min | — | global, pédagogique, individuel (groupe) | non | souple * | 3 | 10 | etablissement | periode | absent | 7.39 18B.3 14.2 |
| `HOR.REGLE.TROUS` | Éviter les trous | Pas de rang vide entre deux cours d'un groupe. Le midi n'en est pas un. | regle | booleen | `true` | global, pédagogique, individuel (groupe) | non | souple * | 3 | 5 | etablissement | periode | solveur (trousDansLaJournee) | 7.41 18B.2 14.1 14.9 17D.4 |
| `HOR.REGLE.CHANGEMENT_SALLE` | Éviter les changements de salle | Deux cours qui se suivent restent dans la même salle. | regle | booleen | `true` | global, pédagogique, individuel (groupe) | non | souple * | 3 | 2 | etablissement | periode | solveur (UsageDesSalles.changementsDeSalle) | 7.42 18B.9 14.17 17D.12 |
| `HOR.REGLE.CHANGEMENT_BATIMENT` | Éviter les changements de bâtiment | Deux cours qui se suivent restent dans le même bâtiment. | regle | booleen | `false` | global, pédagogique, individuel (groupe) | non | souple * | 3 | 4 | etablissement | periode | absent | 7.43 |
| `HOR.REGLE.UN_CAMPUS_PAR_JOUR` | Un seul campus par jour | Un groupe reste sur un campus dans sa journée. | regle | booleen | `true` | global, pédagogique, individuel (groupe) | non | souple * | 3 | 10 | etablissement | periode | solveur (unSeulCampusParJour) | ajout |
| `HOR.REGLE.COURS_TARDIFS` | Limiter les cours tardifs | Heure après laquelle une séance est pénalisée. | regle | heure | — | global, pédagogique, individuel (groupe) | non | souple * | 3 | 8 | etablissement | periode | absent | 7.44 18B.7 14.6 14.10 17D.9 |
| `HOR.REGLE.COURS_TOT` | Limiter les cours trop tôt | Heure avant laquelle une séance est pénalisée. | regle | heure | — | global, pédagogique, individuel (groupe) | non | souple * | 3 | 4 | etablissement | periode | absent | 14.6 |
| `HOR.REGLE.PLAGES_RESTREINTES` | Plages restreintes | Jour et heures interdits ou à éviter, par rythme (ex-« samedi après-midi », poids 50 ; ex-« pause du vendredi », hors du solveur aujourd'hui). | regle | structure | — | global, pédagogique, individuel (groupe) | non | souple * | 2 | 50 | etablissement | periode | solveur (samedi_apres_midi_initiale, pause_vendredi ; D-09) | 7.46 |
| `HOR.REGLE.TRANSPORT_SCOLAIRE` | Respecter les horaires de transport | Les cours finissent à temps pour les cars. | regle | structure | — | global, pédagogique, individuel (groupe) | non | strict * | 3 | — | etablissement | periode | absent | 7.45 12.5 |
| `HOR.REGLE.REPAS` | Respecter le temps de repas | Une pause de la durée demandée reste libre dans la plage du déjeuner. | regle | booleen | `true` | global, pédagogique, individuel (groupe) | non | souple * | 2 | 30 | etablissement | periode | absent | 7.47 14.13 |
| `HOR.REGLE.EQUILIBRE_SEMAINE` | Équilibre des heures sur la semaine | Heures réparties également sur les jours. | regle | booleen | `false` | global, pédagogique, individuel (groupe) | non | souple * | 3 | 6 | etablissement | periode | absent | 17D.6 |
