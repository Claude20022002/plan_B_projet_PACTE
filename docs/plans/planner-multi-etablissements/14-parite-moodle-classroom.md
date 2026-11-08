# 14. Les fonctions de Moodle et de Google Classroom pour les enseignants

Demande du chef de projet (25 octobre 2026) : retrouver dans Planner, pour les enseignants, les fonctions de Moodle et de Classroom, « au cas où ». Ce fichier en fait l'inventaire, dit ce que Planner a déjà, et propose l'ordre dans lequel combler les écarts. **Rien n'est activé par ce plan** : chaque fonction nouvelle arrive derrière un interrupteur **par établissement** (fonctionnalités de la Plateforme, D-04), éteint par défaut. Une école qui vient de Moodle l'allume ; HESTIM garde ses décisions.

Il complète `docs/plans/espace-de-cours.md` (sections, supports, appel : faits) et `docs/plans/espace-enseignant.md`. Moodle (GPL v3) et Canvas (AGPL v3) restent des sources d'idées, **jamais de code** (règle du 15 octobre).

## 14.1 Décisions déjà prises qui encadrent ce plan

| Décision | Date | Conséquence ici |
|---|---|---|
| Devoirs masqués, pas supprimés ; seulement des jeux pour le moment | 11 octobre | les devoirs reviennent par l'interrupteur, pour les écoles qui le veulent |
| ~~Le devoir « fichier » a été retiré : on ne le remet pas~~ (`remarques-par-profil.md`, R-13) : **remplacé le 25 octobre** | 25 octobre | un devoir est **un quiz ou un QCM, ou un rendu de fichier** : rapport, compte rendu de TP, projet, code, tout fichier de type scolaire |
| **Des notes officielles pourront entrer dans Planner** | 25 octobre | le carnet de notes (EC-3) devient un objectif, avec ses exigences propres (§ 14.5) |
| **Commentaires sous un support : l'enseignant choisit** s'ils sont visibles de toute la classe ou de lui seul | 25 octobre | EC-6 |
| Pas d'annonces écrites par les enseignants pour le moment ; ne pas ajouter d'entrée au menu | 20 octobre | le code serveur existe ; même règle : interrupteur, éteint chez HESTIM |
| Trois statuts d'appel, pas d'« excusé » | 15 octobre | inchangé |
| Quiz : jeux en classe, plus tard de petites épreuves | 20 octobre | complété le 25 octobre : des notes officielles viendront aussi des devoirs et des examens |
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
| Devoirs (consigne, énoncé, échéance, rendu de fichier ou quiz, retard, correction, note, commentaire) | `Devoir` (type quiz ou fichier), `DevoirRendu` (note sur 20, commentaire, retard) et la table `FichiersDevoirs` existent ; les services des devoirs-fichiers ont été retirés | masqué | **EC-2** : devoirs-quiz **et** devoirs-fichiers (§ 14.6), retard, commentaire privé, nouvelle tentative ou nouveau rendu |
| Carnet de notes, export des notes | absent ; l'export CSV des notes d'un devoir est prévu au retour des devoirs (`R-13`) ; `Cours.coefficient` et `Cours.ects` existent | absent | R-13 avec EC-2 ; **EC-3** : carnet de notes officiel (§ 14.5) |
| Grilles d'évaluation (rubriques) | absent | absent | **EC-4**, avec EC-2 |
| Fil de la classe, annonces de l'enseignant (Classroom « Flux ») | annonces de l'administration ; annonces d'enseignant codées côté serveur | masqué | **EC-5** : interrupteur, éteint chez HESTIM |
| Questions et commentaires sous un support (Classroom « commentaires de classe », Moodle forum) | absent | absent | **EC-6** : commentaires sous un support ; **l'enseignant choisit, support par support**, s'ils sont visibles de toute la classe ou de lui seul ; il les modère ; pas de forum complet |
| Liste « À faire » de l'étudiant, échéances au calendrier | agenda et EDT ; pas d'échéance de travail | partiel | avec EC-2 : échéances dans l'agenda et dans « À faire » |
| Achèvement et progression (Moodle « achèvement d'activité ») | progression des jeux ; rien sur les supports | partiel | **EC-8** : « vu » sur un support, taux par étudiant pour l'enseignant |
| Rapports de consultation (Moodle « journaux ») | suivi de l'administration (séances, appel) | partiel | avec EC-8, sans traçage fin : vu ou non vu |
| Réutiliser une classe, un support, un quiz l'année suivante (Classroom « réutiliser », Moodle « importer ») | prévu : « Reprendre mes supports » (ME-19) ; quiz dupliqués | partiel | ME-19 suffit pour les supports ; EC-7 pour les questions |
| Sondages et retours (Moodle « feedback », « sondage ») | retours de séance (`RetourSeance`) | partiel | **EC-9** : un court sondage libre de l'enseignant à sa classe |
| Groupes de travail, travaux en équipe | sous-groupes (TD, TP) | partiel | avec EC-2 : devoir rendu par équipe (un rendu, une note pour chaque membre, modifiable) |
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
| EC-2 | Devoirs : quiz et rendu de fichier (§ 14.6), interrupteur d'établissement, retard, commentaire privé, nouveau rendu, par équipe, échéances dans l'agenda et « À faire », export CSV des notes (R-13) | A, B | L | D-04 (fonctionnalités par établissement) ; avant, l'interrupteur actuel |
| EC-4 | Grilles d'évaluation des devoirs | A, B | M | EC-2 |
| EC-5 | Annonces de l'enseignant à ses classes (code serveur existant) | B | S | D-04 |
| EC-6 | Commentaires sous un support : visibles de la classe ou de l'enseignant seul, au choix de l'enseignant ; modération | A, B | M | — |
| EC-7 | Questions partagées entre enseignants d'un même module | A, B | M | — |
| EC-8 | « Vu » sur un support, taux par étudiant | A, B | M | — |
| EC-9 | Sondage de l'enseignant à sa classe | A, B | S | — |
| EC-11 | Lien de visioconférence sur une séance à distance | A, B | S | — |
| EC-3 | Carnet de notes officiel (§ 14.5) : saisie, coefficients, moyennes, publication, verrouillage, historique, relevés, import et export Excel | A, B | L | EC-2 ; règles de calcul et de conservation validées par la scolarité et le juriste |
| EC-10 | Messagerie | A, B | L | décisions du § 14.4 |
| EC-12 | Outils externes LTI 1.3 | A | L | Plateforme (fichier 03) |

Règles pour tous ces lots : un interrupteur par établissement, éteint par défaut ; les écrans suivent la charte des textes (`ton-des-textes.md`) ; chaque fonction nouvelle a sa place dans l'archivage des années (fichier 11 : lecture seule une fois l'année close) et dans l'export d'une école (ME-16).

## 14.4 À trancher avant les lots les plus lourds

| Question | Pourquoi elle compte |
|---|---|
| ~~Des notes officielles entrent-elles un jour dans Planner ?~~ **Oui (25 octobre)** | voir § 14.5 |
| Une messagerie (EC-10) : qui la modère, combien de temps garde-t-on les messages, les étudiants peuvent-ils s'écrire entre eux ? | vie privée (loi 09-08), harcèlement, charge de modération |
| ~~Les commentaires sous un support sont-ils visibles de toute la classe ?~~ **Au choix de l'enseignant (25 octobre)** | EC-6 |

## 14.5 Le carnet de notes officiel (décision du 25 octobre)

Des notes **officielles** changent la nature des données : une note fonde un diplôme, elle se conteste, elle se garde longtemps. Exigences, avant tout code :

| Exigence | Règle |
|---|---|
| Qui saisit | l'enseignant du module, pour ses classes ; un co-enseignant pour sa composante |
| Qui voit | l'enseignant, le responsable de filière, l'administration ; l'**étudiant seulement après publication** (même principe que l'emploi du temps, décision du 21 octobre) |
| Calcul | notes sur 20 ; coefficients (`Cours.coefficient` existe) et crédits ECTS (`Cours.ects` existe) ; moyenne de module, de semestre ; session de rattrapage. **Les règles de calcul de chaque école** (compensation, note éliminatoire, rattrapage plafonné) sont des réglages du panneau de configuration, à faire valider par la scolarité |
| Verrouillage | après la délibération (jury), les notes sont **verrouillées** ; une correction ensuite passe par une demande motivée, validée par l'administration |
| Historique | chaque saisie et chaque correction gardent l'auteur, la date, l'ancienne et la nouvelle note, et le motif ; rien ne s'efface |
| Documents | procès-verbal de délibération, relevé de notes par étudiant (modèle de document de l'école, comme l'EDT du mois) |
| Excel | import d'une feuille de notes (avec aperçu et contrôles, § 5.4 : note hors de 0 à 20, étudiant absent de la classe…) et export |
| Conservation | **les notes officielles ne suivent pas la purge des 5 ans** (Q-12) : un relevé doit pouvoir être produit bien plus tard. Durée à fixer avec la scolarité et le juriste (souvent sans limite pour les relevés et les procès-verbaux) |
| Effacement (loi 09-08) | **contradiction à trancher par le juriste** : l'anonymisation d'un compte (fichier 11) efface l'identité, or un relevé de notes doit rester rattaché à une personne. Proposition : une obligation légale de conservation l'emporte sur l'effacement ; l'anonymisation d'un compte qui a des notes officielles garde l'identité **sur les relevés seulement**, archivés à part, et l'efface partout ailleurs |
| Sécurité | les routes de saisie et de correction sont journalisées (journal de sécurité) ; la double authentification est exigée pour verrouiller ou corriger une note verrouillée |

## 14.6 Les devoirs avec rendu de fichier (décision du 25 octobre)

| Point | Règle proposée |
|---|---|
| Ce qu'on rend | rapport, compte rendu de TP, projet, présentation, tableur, code, image, archive d'un projet |
| Types acceptés | liste de l'école, réglable dans le panneau ; par défaut : pdf, doc, docx, odt, xls, xlsx, ods, ppt, pptx, odp, txt, md, csv, jpg, png, zip, et les fichiers de code courants (py, java, c, cpp, js, ts, sql, ipynb). Le type réel est vérifié sur le contenu, pas sur l'extension |
| Taille | 20 Mo par fichier par défaut (comme la Bibliothèque), réglable par devoir ; plusieurs fichiers par rendu ; une archive est mesurée à sa taille décompressée réelle (comme les supports de l'IA, #111) |
| Où sont les fichiers | **pas dans la base** (aujourd'hui `FichiersDevoirs.contenu`, un BLOB de 10 Mo au plus) : dans le **stockage objet** déjà en place (MinIO), sous un préfixe par établissement, la base ne gardant que la fiche (nom, type, taille, empreinte). Sinon chaque école verrait sa base, ses sauvegardes de nuit (B2) et ses restaurations grossir de tous les rapports de l'année |
| Accès | l'étudiant (son rendu), son équipe, l'enseignant de la classe, l'administration ; lien de téléchargement de courte durée ; jamais ouvert dans la page (téléchargement seulement), pour qu'un fichier piégé ne s'exécute pas dans Planner |
| Retard | signalé, pas refusé (comme le code existant), sauf si l'enseignant ferme le dépôt à la date limite |
| Correction | note sur 20, commentaire, fichier annoté en retour ; la note d'un devoir peut alimenter le carnet de notes (§ 14.5) |
| Antivirus | une analyse des fichiers rendus est souhaitable ; ClamAV demande environ 1 Go de mémoire, que le serveur actuel n'a pas (`espace-de-cours.md`, § 10) : à prévoir avec le serveur de données (fichier 03, § 3.7) |
| Plagiat | non proposé (envoie les copies à un tiers), comme au § 14.2 |
| Archivage | lecture seule à la clôture de l'année ; conservés avec l'année (5 ans), sauf ce qui fonde une note officielle, qui suit la règle du § 14.5 |
