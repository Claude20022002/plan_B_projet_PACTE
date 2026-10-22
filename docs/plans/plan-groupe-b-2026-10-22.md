# Plan du groupe B à partir du 22 octobre 2026

Écrit par le groupe A le 21 octobre au soir, à la demande du chef de projet. À lire avec `docs/sessions/compte-rendu-2026-10-21.md` (groupe B) et `compte-rendu-2026-10-21-groupe-a.md`. Règles de code : `docs/plans/assainissement.md`, § 6. Ton des textes : `docs/plans/ton-des-textes.md`.

## 1. Ce qui a changé depuis le compte rendu du groupe B

| Sujet | Décision du chef de projet (21 octobre) | Conséquence pour B |
|---|---|---|
| Report | Le système propose, l'administration valide, **l'enseignant confirme** ; s'il refuse, **il propose un autre créneau**, que le serveur vérifie (étudiants, enseignant, salles). Les étudiants ne sont prévenus qu'une fois le report confirmé | Lot **B-R1** ci-dessous. Le serveur est fait (PR #86, brouillon) |
| Campus | **Ni filière ni classe n'a de campus.** Les salles se répartissent selon l'effectif, la capacité et la disponibilité, dans n'importe quel bâtiment | #88 (R-3) a été fusionnée par erreur ; le groupe A l'a corrigée (branche `a/sans-campus-prefere`). **Ne plus réintroduire de campus sur les filières ni sur les groupes**. Le campus préféré d'un **enseignant** reste |
| Volume | Un reste plus court qu'un créneau est placé : dépassement de moins d'un créneau accepté | Rien à faire côté écrans (fusionné, #85) |
| Publication | Un changement fait après publication reste invisible des étudiants tant qu'il n'est pas republié | Le groupe A fait le serveur ; un lot écrans suivra (§ 3) |
| Import ClassQuiz | Images et durées reprises, copiées chez nous | Groupe A ; rien côté écrans pour l'instant |

## 2. Lot B-R1 : les écrans du report confirmé par l'enseignant (priorité 1)

**Partir de la branche `a/report-validation-prof`** (PR #86), à jour de `main`. La PR ne se fusionne qu'avec ces écrans : sans eux, l'enseignant ne peut pas confirmer et le parcours `report.spec` échoue.

### 2.1 Le contrat du serveur

| Étape | Appel | Résultat |
|---|---|---|
| L'administration valide | `PATCH /api/demandes-report/:id/traiter` `{ action: "approuver" }` (inchangé, avec `forcer`/`justification` ou `id_creneau`/`id_salle`/`date` comme avant) | La demande passe **`a_confirmer`**. **La séance ne bouge pas.** Notification à l'enseignant « Report à confirmer », lien `/demandes-report?demande=<id>` |
| L'enseignant accepte | `PATCH /api/demandes-report/:id/confirmer` `{ action: "accepter" }` | `approuve`, séance déplacée, étudiants et administration prévenus. **409 `CRENEAU_PLUS_LIBRE`** si la place a été prise entre-temps : la demande reste `a_confirmer`, la réponse donne `propositions` et `dates_proches` |
| L'enseignant propose | `PATCH /api/demandes-report/:id/confirmer` `{ action: "proposer", nouvelle_date, id_creneau }` | Libre : `approuve`, séance déplacée (salle choisie par le serveur). Pris : **422 `AUCUN_CRENEAU_LIBRE`** avec `propositions` (ce qui est libre ce jour-là) et `dates_proches` |
| Erreurs communes | 400 `PAS_A_CONFIRMER` (déjà confirmée), 404 (pas sa demande) | |

Une demande `a_confirmer` bloque une nouvelle demande sur la même séance (409), et l'enseignant ne peut plus la modifier ni la supprimer. L'administration peut encore la **refuser** (le retrait d'une proposition), pas la revalider.

### 2.2 Ce qu'il faut changer

| Fichier | Changement |
|---|---|
| `services/api.js` | `demandeReportAPI.confirmer(id, corps)` → `PATCH /demandes-report/:id/confirmer` |
| `components/reports/StatutDemande.jsx` | Statut `a_confirmer` (couleur `info`), libellé « À confirmer » |
| `components/reports/format.js` | `origineDe` : une demande `a_confirmer` lit la séance telle qu'elle est, comme `en_attente` (la séance n'a pas encore bougé) |
| `components/reports/ListeDemandesEnseignant.jsx` | Pour `a_confirmer` : la place proposée bien visible (date, heure, salle) et deux boutons **« Accepter »** et **« Proposer un autre créneau »**, en tableau comme en cartes sur téléphone |
| Nouveau `components/reports/ProposerCreneauDialog.jsx` | Reprend `RechercheCreneaux` comme `DemandeReportDialog` (`imprevuAPI.creneauxSeance`, `garder_salle: true`, à partir de demain), puis `confirmer({ action: "proposer", … })`. Erreur 422 : afficher le message et les créneaux libres renvoyés, la fenêtre reste ouverte |
| `pages/DemandesReport.jsx` | Brancher accepter et proposer ; après un 409 `CRENEAU_PLUS_LIBRE`, ouvrir directement « Proposer un autre créneau ». `?demande=<id>` (lien de la notification) : mettre la demande en évidence ou ouvrir son action |
| `components/reports/useDemandesAdmin.js`, `TableDemandesAdmin.jsx` | Le message après validation dit que l'enseignant doit confirmer. Une demande `a_confirmer` n'a plus « Approuver » ; « Refuser » peut rester (retirer la proposition) |
| `pages/dashboard/EnseignantDashboard.jsx` | Compter aussi les reports `a_confirmer` : ils attendent l'enseignant |
| `i18n/fr.js`, `en.js` | Voir § 2.3 |

### 2.3 Textes proposés (charte : « vous », dire quoi faire)

| Clé | Français |
|---|---|
| `reports.statuts.a_confirmer` | À confirmer |
| `reports.aConfirmer` | L’administration propose le {{jour}} à {{heure}}, salle {{salle}}. |
| `reports.accepter` | Accepter |
| `reports.proposer` | Proposer un autre créneau |
| `reports.acceptee` | Report confirmé : vos étudiants sont prévenus. |
| `reports.plusLibre` | Ce créneau vient d’être pris. Choisissez-en un autre. |
| `reports.proposee` | Nouveau créneau retenu : vos étudiants sont prévenus. |
| `reportsAdmin.approuvee` | Report validé : l’enseignant doit maintenant le confirmer. |

### 2.4 Parcours `report.spec.cjs`

1. Scénario 1 : après « Approuver », la ligne de l'administration affiche « À confirmer » ; l'enseignante recharge, voit « À confirmer », clique « Accepter » → « Approuvée » des deux côtés.
2. Scénario 2 : après « Approuver ici », « À confirmer » ; l'enseignante choisit « Proposer un autre créneau », prend le premier créneau libre → « Approuvée ».
3. Scénario 3 (refus avec raison) : inchangé.

Contrôles attendus avant la PR : lint du site sans erreur, unitaires du site, construction, parcours complets (`report` compris). Le serveur de #86 est déjà testé (intégration 433/433).

## 3. Ensuite, dans cet ordre (mis à jour le 21 octobre au soir)

Fait depuis : B-R1 (#93), SC-1b (#95, avec le serveur de #90), textes de l'administration (#96, PR ouverte). Le groupe A a livré ou ouvert la partie serveur de tous les lots ci-dessous : chaque ligne dit ce que le serveur rend.

| Ordre | Lot | Ce qu'il faut faire à l'écran | Serveur (groupe A) |
|---|---|---|---|
| 2 | **SC-1c** | Le joueur du quiz en direct dans l'application : le scanner reconnaît une diffusion en direct, écran natif (attente, question, chrono, résultat, classement) | Fait (`/api/quiz-direct`, #95). Le chrono suit `duree_s` de la vue, qui est maintenant la durée de **la question** si elle en a une (branche `a/direct-duree-question`) |
| 3 | **R-1** | Dans la demande, un troisième choix « Approuver, date ultérieure » ; une liste « Séances à reprogrammer » avec l'assistant de créneaux libres ; « Reportée · date à venir » chez l'étudiant et le prof (séance au statut `a_reprogrammer`) | PR #97 : `PATCH /api/demandes-report/:id/plus-tard`, puis `PATCH /:id/reprogrammer { date, id_creneau? }` → la demande passe `a_confirmer` et l'enseignant confirme comme d'habitude. Liste : `GET /api/demandes-report/statut/a_reprogrammer`, créneaux libres : `GET /:id/propositions?date=` |
| 4 | **R-4 et M-3** | Plus de réglage « Durée de calcul » ; un écran d'attente qui montre l'étape (préparation, calcul, placement) ; le rapport : le résumé (`rapport.resume`) puis la liste « À corriger » (`rapport.a_corriger`, chaque point avec son `lien`) ; retirer les cases « règles dures » et « violations » ; l'exploration des classes une à une (format de l'école ou tableau, PDF) | PR #98 : sans `duree_secondes`, la durée suit la taille du problème ; `config.etape` pendant le calcul ; `rapport.resume`, `rapport.a_corriger`, `rapport.duree_calcul_s`. Les anciens champs restent le temps de changer l'écran (`regles_dures_enfreintes` vaut 0) |
| 5 | **Publication des changements** | Dans « EDT du mois », les classes qui ont des changements non publiés (`classes_a_republier` de l'état des envois) et le bouton pour les republier ; dire à l'administration qu'une régénération ne se voit qu'après publication | Branche `a/publication-changements` : les étudiants lisent la version publiée ; changement ponctuel = publié aussitôt ; rappel du soir à l'administration |
| 6 | **M-6** | Date d'origine d'une demande : lire `date_seance_origine` et l'heure de `creneauOrigine` (format.js, `origineDe`), à la place de la date de la séance ou de `date_seance_initiale` | Branche `a/report-date-origine` (migration 0050) |
| 7 | **Durée par question** | Dans l'éditeur du Studio, un champ facultatif « Temps en direct (secondes) », 5 à 120 (`duree_s`) ; vide : la durée de la diffusion | Branche `a/import-classquiz-complet` (migration 0051), qui reprend aussi les durées et les images des quiz de ClassQuiz |
| 8 | **R-9** | « Créer un quiz » passe par le générateur du Studio (sujet ou document, sans classe ni module) au lieu de l'ancien dialogue ClassQuiz | **Rien à faire** : `/api/studio-quiz/ia/generations` génère déjà sans classe |
| 9 | **M-13 (2e partie)**, mineurs m-3 à m-18 (m-8 : plus d'étiquettes « CLIQUABLE » dans les notifications) | Voir `docs/recette/recette-2026-10-20.md` | m-7 (notifications en anglais) : plus tard, côté serveur |
| — | **R-3 (données)** | La liste réelle des filières (hestim.ma), noms d'usage, **sans campus** ; à faire valider par le chef de projet avant tout changement | La page Filières n'a plus de campus (#94) |

## 4. Règles de travail (rappel)

- Un dossier de travail par lot : `Github Project\travaux-planner\<lot>` (git worktree), jonctions `node_modules` vers le dépôt principal, **retirées avant de supprimer le dossier**.
- Une base de test par série de tests (conteneur `hestim_mysql_test_cours`, port 3311).
- PR empilées : pour fusionner une chaîne, **passer la PR suivante sur `main` (`gh pr edit <n> --base main`) avant** de fusionner la précédente avec `--delete-branch`. Le 21 octobre, `--delete-branch` sur une chaîne a fermé #79 et #75 et fait fusionner #80 dans une branche au lieu de `main`.
- Une PR reprise (fermée puis rouverte) se relit contre les décisions du jour avant d'être fusionnée : #88 a été refusionnée « contenu inchangé » alors que la décision sur les campus l'avait rendue fausse.
- Le chef de projet commite et fusionne ; les commandes lui sont données prêtes à copier.
