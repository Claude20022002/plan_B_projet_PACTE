# 14. Les fonctions de Moodle et de Google Classroom pour les enseignants

Demande du chef de projet (25 octobre 2026) : retrouver dans Planner, pour les enseignants, les fonctions de Moodle et de Classroom, « au cas où ». Ce fichier en fait l'inventaire, dit ce que Planner a déjà, et propose l'ordre dans lequel combler les écarts. **Rien n'est activé par ce plan** : chaque fonction nouvelle arrive derrière un interrupteur **par établissement** (fonctionnalités de la Plateforme, D-04), éteint par défaut. Une école qui vient de Moodle l'allume ; HESTIM garde ses décisions.

Il complète `docs/plans/espace-de-cours.md` (sections, supports, appel : faits) et `docs/plans/espace-enseignant.md`. Moodle (GPL v3) et Canvas (AGPL v3) restent des sources d'idées, **jamais de code** (règle du 15 octobre).

## 14.1 Décisions déjà prises qui encadrent ce plan

| Décision | Date | Conséquence ici |
|---|---|---|
| Devoirs masqués, pas supprimés ; seulement des jeux pour le moment | 11 octobre | les devoirs reviennent par l'interrupteur, pour les écoles qui le veulent |
| Le devoir « fichier » (rendu d'un fichier) a été retiré : **on ne le remet pas** (`remarques-par-profil.md`, R-13) | octobre | un devoir est un quiz ou un QCM, jamais un dépôt de fichier, sauf si le chef de projet rouvre la question |
| Pas d'annonces écrites par les enseignants pour le moment ; ne pas ajouter d'entrée au menu | 20 octobre | le code serveur existe ; même règle : interrupteur, éteint chez HESTIM |
| Trois statuts d'appel, pas d'« excusé » | 15 octobre | inchangé |
| Quiz : jeux en classe, plus tard de petites épreuves | 20 octobre | le carnet de notes n'arrive qu'avec des épreuves notées |
| Années closes gardées 5 ans (Q-12) | 24 octobre | remplace, pour les présences, la recommandation « l'année en cours et la suivante » de `espace-de-cours.md`, § 11 |

## 14.2 Inventaire

État : **fait** (dans Planner aujourd'hui), **masqué** (codé, éteint), **partiel**, **absent**.

| Fonction (Moodle / Classroom) | Planner aujourd'hui | État | Proposition |
|---|---|---|---|
| Classe en onglets, sections par semaine ou par thème | espace d'une classe : sections, ordre, visible ou non | fait | — |
| Ressources : fichiers, liens | supports de classe (fichiers dans la Bibliothèque, liens) | fait | — |
| Supports publiés à une date (Moodle « restreindre l'accès », Classroom « programmer ») | une section est visible ou non, sans date | partiel | **EC-1** : date d'ouverture (et de fermeture) d'une section ou d'un support |
| Présence | appel par QR, trois statuts, historique, export, anti-fraude | fait | — |
| Quiz, banque de questions | Studio quiz : questionnaires, IA, diffusion, direct, résultats | fait | **EC-7** : partager des questions entre enseignants d'un même module |
| Devoirs (consigne, échéance, retard, correction, commentaire) | `Devoir` et `DevoirRendu` existent ; le rendu de fichier a été retiré par décision | masqué | **EC-2** : rallumer les devoirs-quiz, et compléter ce qui manque (retard, commentaire privé, nouvelle tentative) ; **pas de rendu de fichier** (décision rappelée au § 14.1) |
| Carnet de notes, export des notes | absent ; l'export CSV des notes d'un devoir est prévu au retour des devoirs (`R-13`, `remarques-par-profil.md`) | absent | R-13 avec EC-2 ; **EC-3** (carnet complet) seulement quand des épreuves comptent, décision de la scolarité nécessaire (§ 14.4) |
| Grilles d'évaluation (rubriques) | absent | absent | **EC-4**, avec EC-2 |
| Fil de la classe, annonces de l'enseignant (Classroom « Flux ») | annonces de l'administration ; annonces d'enseignant codées côté serveur | masqué | **EC-5** : interrupteur, éteint chez HESTIM |
| Questions et commentaires sous un support (Classroom « commentaires de classe », Moodle forum) | absent | absent | **EC-6** : commentaires sous un support, modérés par l'enseignant ; pas de forum complet |
| Liste « À faire » de l'étudiant, échéances au calendrier | agenda et EDT ; pas d'échéance de travail | partiel | avec EC-2 : échéances dans l'agenda et dans « À faire » |
| Achèvement et progression (Moodle « achèvement d'activité ») | progression des jeux ; rien sur les supports | partiel | **EC-8** : « vu » sur un support, taux par étudiant pour l'enseignant |
| Rapports de consultation (Moodle « journaux ») | suivi de l'administration (séances, appel) | partiel | avec EC-8, sans traçage fin : vu ou non vu |
| Réutiliser une classe, un support, un quiz l'année suivante (Classroom « réutiliser », Moodle « importer ») | prévu : « Reprendre mes supports » (ME-19) ; quiz dupliqués | partiel | ME-19 suffit pour les supports ; EC-7 pour les questions |
| Sondages et retours (Moodle « feedback », « sondage ») | retours de séance (`RetourSeance`) | partiel | **EC-9** : un court sondage libre de l'enseignant à sa classe |
| Groupes de travail, travaux en équipe | sous-groupes (TD, TP) | partiel | avec EC-2 : devoir-quiz par équipe |
| Évaluation par les pairs (Moodle « atelier ») | absent | absent | non proposé : complexe, peu demandé dans le supérieur marocain ; à revoir sur demande |
| Messagerie enseignant–étudiant | notifications seulement | absent | **EC-10**, en dernier : modération, conservation et vie privée à trancher (§ 14.4) |
| Visioconférence (Meet, BigBlueButton) | absent | absent | **EC-11** : un lien de visio sur une séance en distanciel (la modalité existe déjà) ; aucune visio hébergée |
| Outils externes (LTI 1.3) | absent | absent | **EC-12** : Planner « consommateur » LTI, plus tard ; le service des jeux comme « outil » LTI (fichier 07) |
| Détecteur de plagiat (Classroom « rapports d'originalité ») | absent | absent | non proposé : envoie les copies des étudiants à un tiers ; à revoir avec un fournisseur et un contrat |
| Badges, certificats | XP des jeux | partiel | non proposé pour le moment |
| Résumés envoyés aux parents (Classroom) | — | — | hors sujet : enseignement supérieur seulement (Q-3) |

## 14.3 Lots proposés, dans l'ordre

| Lot | Contenu | Groupe | Effort | Dépend de |
|---|---|---|---|---|
| EC-1 | Date d'ouverture et de fermeture d'une section ou d'un support | A, B | S | — |
| EC-2 | Devoirs-quiz : rallumer par interrupteur d'établissement, retard, commentaire privé, nouvelle tentative, par équipe, échéances dans l'agenda et « À faire », export CSV des notes (R-13) ; sans rendu de fichier | A, B | L | D-04 (fonctionnalités par établissement) ; avant, l'interrupteur actuel |
| EC-4 | Grilles d'évaluation des devoirs | A, B | M | EC-2 |
| EC-5 | Annonces de l'enseignant à ses classes (code serveur existant) | B | S | D-04 |
| EC-6 | Commentaires sous un support, modérés | A, B | M | — |
| EC-7 | Questions partagées entre enseignants d'un même module | A, B | M | — |
| EC-8 | « Vu » sur un support, taux par étudiant | A, B | M | — |
| EC-9 | Sondage de l'enseignant à sa classe | A, B | S | — |
| EC-11 | Lien de visioconférence sur une séance à distance | A, B | S | — |
| EC-3 | Carnet de notes et export | A, B | L | EC-2, décision de la scolarité |
| EC-10 | Messagerie | A, B | L | décisions du § 14.4 |
| EC-12 | Outils externes LTI 1.3 | A | L | Plateforme (fichier 03) |

Règles pour tous ces lots : un interrupteur par établissement, éteint par défaut ; les écrans suivent la charte des textes (`ton-des-textes.md`) ; chaque fonction nouvelle a sa place dans l'archivage des années (fichier 11 : lecture seule une fois l'année close) et dans l'export d'une école (ME-16).

## 14.4 À trancher avant les lots les plus lourds

| Question | Pourquoi elle compte |
|---|---|
| Des notes officielles entrent-elles un jour dans Planner (EC-3) ? | changerait la durée de conservation (un relevé se garde bien plus de 5 ans), les droits de modification et le journal |
| Une messagerie (EC-10) : qui la modère, combien de temps garde-t-on les messages, les étudiants peuvent-ils s'écrire entre eux ? | vie privée (loi 09-08), harcèlement, charge de modération |
| Les commentaires sous un support (EC-6) sont-ils visibles de toute la classe ou seulement de l'enseignant ? | même question, à plus petite échelle |
