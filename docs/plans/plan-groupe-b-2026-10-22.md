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

## 3. Ensuite, dans cet ordre

| Ordre | Lot | Contenu | Dépend de |
|---|---|---|---|
| 2 | **SC-1b puis SC-1c** | Ouvrir la PR de `b/sc1b-quiz-direct-ecrans` (écrans web du quiz en direct) **après** la fusion de #90 (SC-1a, serveur), en la remettant à jour de `main` ; puis SC-1c : le joueur du direct dans l'application (scanner d'une diffusion en direct, écran natif) | #90 |
| 3 | **R-9** | « Créer un quiz » sans classe ni module : le sujet ou le document suffit | Groupe A : la génération par l'IA accepte une demande sans `id_groupe` ni `id_cours` |
| 4 | **Textes de l'administration** | Gestion, génération, préparation, suivi, réservations, messages du serveur, selon la charte | Rien |
| 5 | **R-1** | Report « à une date ultérieure » : troisième choix de l'administration, liste « Séances à reprogrammer », « Reportée · date à venir » | Groupe A : état « à reprogrammer » |
| 6 | **R-4** | Génération sans réglage de durée, écran d'attente, résumé court, exploration des classes une à une (format de l'école ou tableau, PDF) | Groupe A : durée choisie par le serveur, étapes lisibles |
| 7 | **Publication des changements** | Dans « EDT du mois », montrer qu'un mois publié a des changements non publiés et les republier | Groupe A : serveur de la publication des changements |
| 8 | **M-13 (2e partie)**, **M-3** (affichage du rapport), mineurs m-1 à m-18 | Voir `docs/recette/recette-2026-10-20.md` | M-3 : rapport côté serveur (A) |
| — | **R-3 (données)** | La liste réelle des filières (hestim.ma), noms d'usage, **sans campus** ; à faire valider par le chef de projet avant tout changement | Validation |

## 4. Règles de travail (rappel)

- Un dossier de travail par lot : `Github Project\travaux-planner\<lot>` (git worktree), jonctions `node_modules` vers le dépôt principal, **retirées avant de supprimer le dossier**.
- Une base de test par série de tests (conteneur `hestim_mysql_test_cours`, port 3311).
- PR empilées : pour fusionner une chaîne, **passer la PR suivante sur `main` (`gh pr edit <n> --base main`) avant** de fusionner la précédente avec `--delete-branch`. Le 21 octobre, `--delete-branch` sur une chaîne a fermé #79 et #75 et fait fusionner #80 dans une branche au lieu de `main`.
- Une PR reprise (fermée puis rouverte) se relit contre les décisions du jour avant d'être fusionnée : #88 a été refusionnée « contenu inchangé » alors que la décision sur les campus l'avait rendue fausse.
- Le chef de projet commite et fusionne ; les commandes lui sont données prêtes à copier.
