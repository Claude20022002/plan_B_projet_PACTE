# Ce que le solveur actuel ne sait pas faire

Relevé le 4 novembre 2026 dans le code de `main` (`818cebb`), en face du [catalogue](catalogue/README.md). Aucune mesure de performance ici : ME-14a n'a pas encore été fait.

## 1. L'essentiel

Le solveur tient 22 règles. Le catalogue en compte 134. Mais **le nombre de règles n'est pas le vrai problème** : la plupart s'ajoutent. Ce qui limite vraiment, c'est la **forme du modèle** : ce que le calcul a le droit de décider. Aujourd'hui, il choisit **un créneau et une salle pour chaque séance d'une semaine type**, et rien d'autre.

## 2. La forme du modèle

Ces écarts demandent de changer les variables, pas d'ajouter une règle. Ce sont les plus coûteux.

| # | Limite actuelle | Où | Qui en a besoin | Ce que cela bloque |
|---|---|---|---|---|
| F-1 | **Une seule semaine type**, recopiée sur les dates | `Lecon`, `deploiement.js` | collège et lycée (A/B) ; formation (intensif, alternance) | `MAT.VOL.SEMAINE_ALTERNEE`, `MAT.REGLE.PROGRESSION`, `PED.PROG.CHAPITRES`, `PED.PROG.COURS_AVANT_EVALUATION`, `PED.ORG.EXAMENS_NATIONAUX` |
| F-2 | **L'enseignant est imposé avant le calcul** | `Lecon` : `enseignants` n'est pas une variable ; `probleme.js` exclut un enseignement sans principal | primaire, formation | `ENS.REGLE.QUALIFIE`, `PED.ORG.ENSEIGNANT_REFERENT`, `ENS.CHARGE.MIN_H_SEMAINE`, `HUM.REGLE.EQUITE` |
| F-3 | **Une séance couvre 1 ou 2 créneaux** | `probleme.js` : `Math.min(2, creneaux_par_seance)` ; `Lecon.longueur == 2` | primaire (30 min), TP longs, formation (journée) | `MAT.VOL.DUREE_MIN`, `DUREE_MAX`, `HOR.TYPE.FIXE` (créneaux flexibles) |
| F-4 | **Au plus 6 séances par semaine** par enseignement | `probleme.js` : `Math.min(6, ...)` | primaire (français chaque jour, plusieurs fois) | `MAT.VOL.SEANCES_SEMAINE` |
| F-5 | **Conflits par hiérarchie de groupes**, pas par élève | `Lecon.feuilles`, `groupes.js` | lycée (options, langues), université (parcours) | `GRP.REGLE.CONFLIT_ELEVES`, `GRP.REGLE.OPTIONS_INCOMPATIBLES`, `MAT.REGLE.ALIGNEMENT`, `PED.PERIODE.CARTE` |
| F-6 | **Les groupes sont donnés** | données d'entrée | options à sections multiples | `OPT.CALCUL.CHOIX_GROUPE` |
| F-7 | **Une séance mobilise enseignants et salle, rien d'autre** | `Lecon` | laboratoires, sport | `RES.REGLE.PERSONNEL_REQUIS`, `RES.REGLE.MATERIEL_MOBILE`, `SAL.REGLE.MODULABLE` |
| F-8 | **Les examens sont hors du calcul** | `services/planning/examens.js` : saisis, puis contrôlés | tous | toute la famille `EXA.REGLE` |

## 3. Le reste, du moins coûteux au plus coûteux

### Ce qui est écrit en dur, propre à l'école pilote

| Valeur en dur | Où | Devient |
|---|---|---|
| Poids des 10 règles souples | `ContraintesEmploiDuTemps` | `poids`, par valeurs résolues (D-09 : `ConstraintWeightOverrides`) |
| Midi à 12 h 30 | `probleme.js` et `ContraintesEmploiDuTemps.APRES_MIDI`, en double | `HOR.GRILLE.DEBUT_APRES_MIDI` |
| Samedi après-midi, régime « initiale » | `samediApresMidi` | `HOR.REGLE.PLAGES_RESTREINTES` |
| Marge de 10 places, pause courte de 30 min | `UsageDesSalles` | `SAL.REGLE.TAILLE_ADAPTEE`, `HOR.GRILLE.SEUIL_SUITE` |
| Écart de 30 min entre créneaux qui se suivent | `probleme.js` | `HOR.GRILLE.SEUIL_SUITE` |

### Ce que le calcul ignore et que le déploiement découvre trop tard

Une séance sautée à une date n'est pas replacée par le calcul, et le manque n'apparaît que dans le rapport (« x h non planifiées »). Le calcul pense donc avoir réussi alors que le volume n'est pas tenu.

| Connu seulement après le calcul | Où |
|---|---|
| Fériés, vacances, événements | `deploiement.js` |
| Indisponibilités ponctuelles des enseignants | `probleme.js` n'envoie que celles qui couvrent toute la période |
| Réservations et salles indisponibles par dates | `Salle.disponible` seul est envoyé |
| **Volume atteint** (`MAT.REGLE.VOLUME`) | `volume.js`, `rapport.js` |

### Ce qui se contrôle à part du calcul

| Règle | État | Conséquence |
|---|---|---|
| **Plafond hebdomadaire d'un enseignant** | averti avant (`avertissements.js`), inconnu du solveur | le calcul peut le dépasser ; le commentaire du code le dit |
| **Pause du vendredi** | saisie et déploiement seulement (`affectationRules.js`) | sans effet à l'école pilote, dont la grille du vendredi évite déjà la pause ; avec une autre grille, le solveur placerait des séances que le déploiement sauterait ensuite |
| Compétence d'un enseignant | `CompetenceEnseignant` en base, non lue par le calcul | sans effet tant que F-2 n'est pas levé |

### Ce qui manque pour expliquer un échec

Le moteur de validation ne fait que deux contrôles (disponibilités insuffisantes, plafond hebdomadaire) et trois exclusions (sans enseignant, sans groupe, déjà planifié). Quand le calcul ne trouve pas, il dit « pas de place sans conflit pour ces modules », **pas pourquoi**. Plus il y aura de règles strictes, plus ce défaut coûtera cher : c'est le risque que signale D-09.

### Règles nouvelles sur les variables actuelles

Le plus simple à ajouter, sans changer de modèle : pauses (`HUM.REGLE.PAUSE_OBLIGATOIRE`), repas, journées longues, cours tardifs, consécutifs, plafond de matières par jour, charge cognitive, alternance. Mais 57 des 99 règles absentes lisent une donnée elle aussi absente : **la collecte d'abord**.

## 4. Le choix du moteur

La demande cite OR-Tools et CP-SAT. Voici ce qui les distingue pour ce problème. Ces différences sont générales, **aucune n'a été mesurée sur nos données**.

| Critère | Timefold (en place) | OR-Tools CP-SAT |
|---|---|---|
| Méthode | recherche locale : part d'une solution et l'améliore | programmation par contraintes : raisonne et élimine |
| **Prouver qu'il n'y a pas de solution** | non | **oui**, avec un sous-ensemble de règles en cause (hypothèses) : répond au § « expliquer un échec » |
| Écart à l'optimum | inconnu | une borne, donc un écart chiffré |
| Problème très contraint | peut stagner sur des règles dures | souvent son point fort |
| Grande taille | ajoute une règle sans multiplier les variables | variables séance × créneau × salle : **à découper**, sinon la mémoire explose |
| Règles à calculs libres | écrites en Java, directement | à traduire en contraintes linéaires ; certaines sont pénibles |
| Replanifier un peu | naturel : épingler et reprendre | possible (figer, indice de départ) |
| Dans notre dépôt | 22 règles et leurs tests, déjà en service | à écrire ; bibliothèque native à embarquer dans l'image du solveur |
| Licence, langage | Apache 2.0, Java | Apache 2.0, utilisable depuis Java |

### Recommandation : ne pas choisir sur la réputation

Les deux peuvent même se compléter : CP-SAT pour la faisabilité et l'explication, une recherche locale pour affiner. Trois pas, dans cet ordre :

1. **Un modèle neutre** : le problème décrit sans vocabulaire de moteur, compilé depuis le catalogue et les valeurs résolues. Il sert quel que soit le choix.
2. **Un évaluateur indépendant** : une fonction qui note n'importe quel planning (règles strictes tenues, score des règles souples, volumes). Sans lui, on compare le score de l'un au score de l'autre, ce qui ne veut rien dire.
3. **Un essai sur trois jeux** : la vraie semaine de l'école pilote ; le jeu de 20 000 étudiants (**c'est ME-14a**, à faire de toute façon) ; un collège fictif avec semaines A/B et options.

| Critère de décision, fixé avant de lancer l'essai | Mesure |
|---|---|
| Règles strictes tenues | toutes, sinon le jeu est perdu |
| Temps pour une première solution valable, et pour la solution finale | secondes |
| Qualité | score de l'évaluateur, à temps égal |
| Mémoire maximale | Go, à comparer à la mémoire du serveur de production |
| Diagnostic d'un jeu rendu impossible exprès | la cause est-elle nommée ? |
| Coût de portage | jours pour les 22 règles |

## 5. Ordre proposé pour la suite (à valider)

| Lot | Contenu | Dépend de |
|---|---|---|
| MP-1 | Valeurs résolues : profil, trois niveaux, dates (rejoint ME-2b) | décision 1 |
| MP-2 | Moteur de validation : tous les `requiert`, `borne`, `exclut`, avec le message qui dit quoi corriger | MP-1 |
| MP-3 | Modèle neutre et évaluateur indépendant | MP-1 |
| MP-4 | Essai Timefold contre CP-SAT, avec ME-14a | MP-3 |
| MP-5 | Poids et plages lus depuis les valeurs ; retrait de ce qui est en dur (rejoint ME-14) | MP-4 |
| MP-6 | Lever les écarts F-1 à F-8 **dans l'ordre imposé par le profil choisi** | décision 4 |
| MP-7 | Règles nouvelles, famille par famille, chacune avec ses données et son test | MP-5 |

Critère de non-régression de tous ces lots : **sur le jeu de l'école pilote, le planning n'est pas moins bon qu'aujourd'hui**, selon l'évaluateur.
