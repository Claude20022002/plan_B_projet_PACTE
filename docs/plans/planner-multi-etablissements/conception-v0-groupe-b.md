# Conception V0 : groupe B

26 octobre 2026, groupe A pour le groupe B. Vague V0 du plan de développement (fichier 15, § 15.5).

En vague V0, le groupe B construit les écrans de deux lots dont le serveur est fait (ME-17 désactivation, ME-18 année des groupes) et essaie l'identité de l'école sur téléphone (ME-11). Le groupe A a figé les routes ci-dessous ; elles ne changent plus sans relecture par B.

## Ce que B livre en V0

Trois lots, environ 3 jours bruts. Jalon de la vague : maj44 en ligne (migrations 0053, 0054, 0055), HESTIM inchangée à l'écran sauf le panneau « Identité et marque ».

| Lot | Ce que B fait | Effort | Partir de la branche serveur |
| --- | --- | --- | --- |
| ME-17 | Écrans de désactivation : aperçu, date programmée, préavis, lot, réactivation, anonymisation, suppression refusée ; libellés des nouveaux événements du journal | M (2 j) | `a/me17-desactivation` (ffa8eeb) |
| ME-18 | Sélecteur d'année sur les pages de gestion et de suivi | S (0,5 j) | `a/me18-annees` (bed33d7) |
| ME-11 | Essai de l'application mobile sur un vrai téléphone, avec une identité de démonstration | S (0,5 j) | `a/identite-ecole` (3859703) |

Chaque lot B part de la branche A correspondante, dans son propre dossier `travaux-planner\<lot>`, branche `b/<lot>`. Le libellé des événements du journal était prévu chez A, mais il vit dans `frontend/src/i18n/fr.js` et `en.js` : B le prend avec les écrans ME-17.

## ME-17 : contrat d'API

Toutes les routes sont réservées à l'administration, sous `/api/users`. Les erreurs suivent le format commun `{ message, code }` : afficher `message` tel quel, réagir sur `code`.

| Route | Corps ou paramètres | Réponse |
| --- | --- | --- |
| `GET /:id/desactivation` | `?date=AAAA-MM-JJ` (aujourd'hui par défaut) | Aperçu, rien n'est modifié (détail ci-dessous) |
| `POST /:id/desactivation` | `{ motif, date?, preavis?, seances? }` | `{ statut: "desactive" \| "programmee", effet_le, preavis?, seances_annulees }` |
| `DELETE /:id/desactivation` | — | Annule une programmation : `{ statut: "actif" }` |
| `POST /:id/reactivation` | — | `{ statut: "actif", a_verifier }` (texte à rappeler, ou `null`) |
| `POST /:id/anonymisation` | — | `{ statut: "anonymise" }`, irréversible |
| `GET /desactivations/apercu` | `?ids=1,2,3` ou `?id_groupe=`, `&date=` | Aperçu d'un lot, rien n'est modifié : `{ date_effet, comptes: [{ id_user, nom, prenom, role, prevu, seances? }], a_desactiver, refuses }` ; `prevu` vaut `a_desactiver`, `deja_desactive`, `anonymise`, `soi_meme` ou `seances_a_traiter` (ajout du 26 octobre) |
| `POST /desactivations` | `{ ids?: [], id_groupe?, motif, date?, preavis? }` | `{ bilan: [{ id_user, statut, code?, message? }], desactives, programmes, refuses }` |
| `POST /reactivations` | `{ ids?: [], id_groupe? }` | Rétablit un lot fait par erreur : réactive les comptes désactivés, annule les désactivations programmées. `{ bilan, reactives, programmations_annulees, inchanges, refuses }` (ajout du 26 octobre) |
| `DELETE /:id` (existe) | — | Refusé si le compte a un historique |
| `PUT /:id` (existe) | `{ actif }` | Passe par les mêmes règles, motif « autre », effet immédiat |

**Valeurs.** `motif` : `depart`, `fin_contrat`, `diplome`, `exclusion`, `autre`. `date` : jamais passée ; aujourd'hui = immédiat, plus tard = programmé. `preavis` : `true` par défaut, courriel 5 jours avant (le jour même si la date est plus proche). `seances: "annuler"` annule toutes les séances à venir de l'enseignant et prévient ses étudiants. `id_groupe` prend le groupe et ses sous-groupes.

**Aperçu** (`GET /:id/desactivation`) :

- toujours : `compte` (`id_user`, `nom`, `prenom`, `role`, `actif`, `desactivation_prevue_le`, `desactivation_motif`), `date_effet`, `a_traiter` ;
- enseignant : `seances` (`id_affectation`, `date`, `heure_debut`, `heure_fin`, `module`, `groupe`), `services` (`module`, `nature`, `periode`, `statut`), `responsabilites.filieres` et `responsabilites.modules`, `demandes_report_en_cours` (un nombre) ; `a_traiter` = nombre de séances à venir ;
- étudiant : `groupes` (`id_groupe`, `nom_groupe`, `effectif`, `annee_scolaire`).

**Codes d'erreur** à traiter dans les écrans :

| Code | Statut | Ce que l'écran fait |
| --- | --- | --- |
| `SEANCES_A_TRAITER` | 409 | Proposer « Confier à un remplaçant » (lien vers `/gestion/imprevus`) ou « Annuler les séances » (renvoyer avec `seances: "annuler"`) |
| `SOI_MEME` | 409 | Bouton masqué sur son propre compte |
| `DERNIER_ADMIN` | 409 | Message, aucune action |
| `DEJA_DESACTIVE`, `DEJA_ACTIF` | 409 | Rafraîchir la ligne |
| `RIEN_A_ANNULER` | 409 | Rafraîchir la ligne |
| `ANONYMISE`, `COMPTE_ACTIF` | 409 | Réactiver et anonymiser refusés : masquer le bouton selon l'état |
| `A_UN_HISTORIQUE` | 409 | Remplacer « Supprimer » par « Désactiver » |

**Liste des comptes.** `GET /api/users` renvoie déjà les nouveaux champs : `desactivation_prevue_le`, `desactivation_motif`, `desactivation_preavis`, `preavis_envoye_le`, `anonymise_le`. Aucune route ne lit encore l'historique (table `Desactivations`) : pas nécessaire en V0.

**Journal de sécurité.** Six événements nouveaux à libeller dans `JournalSecurite.jsx` et `i18n` : `compte_desactive`, `compte_reactive`, `desactivation_programmee`, `desactivation_annulee`, `compte_anonymise`, et `identite_ecole_modifiee` (venu de ME-11).

## ME-17 : écrans à concevoir

Tout part de la page Utilisateurs (`/gestion/utilisateurs`, `Utilisateurs.jsx`). Principe : **aperçu puis appliquer**, jamais de désactivation sans avoir vu ce qu'elle touche.

1. **Liste.** Chaque ligne montre l'état : actif, « désactivation le [date] » (si `desactivation_prevue_le`), « compte désactivé », « ancien compte » (si `anonymise_le`). Filtre par état.
2. **Action « Désactiver »** sur une ligne (masquée sur son propre compte). Elle ouvre une fenêtre avec motif (liste fermée), date d'effet (aujourd'hui par défaut) et case « Prévenir la personne 5 jours avant » (cochée, visible seulement si la date est plus tard).
3. **Aperçu**, rechargé à chaque changement de date (`GET /:id/desactivation?date=`) :
    - enseignant : liste des séances à venir, services, responsabilités, demandes de report. Si des séances restent, deux choix explicites : « Confier à un remplaçant » (vers les imprévus) ou « Annuler les séances et prévenir les étudiants ». Le bouton final reste grisé tant qu'aucun choix n'est fait ;
    - étudiant : ses groupes et leur effectif saisi, avec la proposition de baisser l'effectif (la route `PUT /api/groupes/:id` existe) ;
    - autre rôle : rien à traiter.
4. **Confirmation.** Le bouton dit ce qui va se passer : « Désactiver maintenant » ou « Programmer pour le [date] ». Retour : bandeau de résultat, ligne mise à jour.
5. **Désactivation programmée.** Sur la ligne : date et motif, action « Annuler la programmation » (`DELETE /:id/desactivation`).
6. **Réactivation** d'un compte désactivé : un bouton, puis afficher le rappel `a_verifier` (« services et séances de l'année en cours » ou « groupes de l'année en cours »).
7. **Anonymisation** d'un compte désactivé seulement : double confirmation (taper le nom ou « ANONYMISER »), texte qui dit que c'est irréversible.
8. **En lot.** Sélection de plusieurs lignes, ou « Désactiver la promotion » depuis un groupe. Même fenêtre motif + date + préavis, **avec l'aperçu du lot** (`GET /desactivations/apercu` : nombre de comptes touchés et refus prévus) avant le bouton, puis un **bilan ligne par ligne** : désactivé, programmé, refusé avec son message. Un refus ne bloque pas les autres. Dans le bilan, un bouton « Défaire » (`POST /reactivations` avec les mêmes `ids` ou le même `id_groupe`).
9. **Supprimer.** Proposer « Supprimer » seulement pour un compte sans historique ; sur `A_UN_HISTORIQUE`, basculer vers « Désactiver ».

**Ailleurs dans le site.** Un nom de compte désactivé garde sa place dans l'historique, avec la mention « compte désactivé » (listes de séances passées, résultats). Textes en français et en anglais.

## ME-18 : sélecteur d'année

L'administration voit tout, filtré par défaut sur l'année en cours, et choisit une autre année dans un sélecteur commun aux pages de gestion et de suivi. Côté serveur, chaque groupe porte maintenant `id_annee` (migration 0054), rempli depuis `annee_scolaire`.

**Ce qui existe :**

| Besoin | Route | Paramètre d'année |
| --- | --- | --- |
| Liste des années | `GET /api/calendrier/annees` | — (triées de la plus récente à la plus ancienne, `active` marque l'année en cours) |
| Statistiques | `GET /api/statistiques/*` (périmètre commun) | `?id_annee=` |
| Charges des enseignants | `GET /api/enseignants/charges`, `GET /api/enseignants/:id/charge` | `?id_annee=` |
| Groupes, arbre des groupes | `GET /api/groupes`, `GET /api/groupes/arbre` | `?annee_scolaire=` (le libellé texte, pas l'identifiant) |

**Le manque, pris par A :** `GET /api/groupes` et l'arbre ne filtrent pas encore par `id_annee`. A l'ajoute (lot S) avant que B branche le sélecteur sur Groupes ; en attendant, B peut passer le libellé de l'année choisie dans `annee_scolaire`.

**À concevoir :**

- un composant `SelecteurAnnee` partagé, placé dans l'en-tête des pages Groupes, Étudiants, Enseignements, Suivi et Statistiques ;
- valeur par défaut : l'année `active`, sinon celle qui contient aujourd'hui ;
- le choix suit l'administrateur d'une page à l'autre pendant la session (et dans l'adresse, pour qu'un lien partagé montre la même année) ;
- une année autre que l'année en cours est signalée par un bandeau. La lecture seule d'une année close vient avec ME-19, pas en V0.

Étudiants et enseignants ne voient rien de nouveau : le serveur ne leur montre déjà plus que l'année en cours.

## ME-11 : essai sur un vrai téléphone

Le site et l'application sont déjà faits par A sur `a/identite-ecole` ; B vérifie l'application sur un téléphone réel, Android et iPhone si possible.

**Comment l'application lit l'identité.** Au lancement, `mobile/src/ecole.js` lit `GET /api/etablissement` (public) et garde une copie sur le téléphone (`planner.ecole`). Elle s'ouvre avec la copie, sinon attend le serveur 2,5 s au plus, sinon s'ouvre en « Planner » neutre. Le logo vient de `GET /api/etablissement/logo?v=<version>`.

**Scénario d'essai :**

- [ ] Serveur de démonstration local (`npm run demo`), identité réglée dans `/gestion/identite` avec une école fictive (ORION, NOVA ou HORIZON), logo et deux couleurs
- [ ] Premier lancement en réseau : nom, couleurs et logo de l'école sur la connexion et dans l'application
- [ ] Changer les couleurs et le logo : visibles au lancement suivant
- [ ] Lancement en mode avion : la copie s'affiche tout de suite
- [ ] Premier lancement sans serveur joignable : « Planner » neutre après 2,5 s au plus
- [ ] Logo retiré : le nom seul s'affiche, sans image cassée
- [ ] L'intro animée n'apparaît que pour HESTIM
- [ ] Contraste lisible des deux couleurs en thème clair et sombre

Relever les écarts dans la PR de A, ou dans une branche `b/me11-essai-mobile` si une correction d'écran s'impose. Le nom et l'identifiant de l'application dans les stores (`app.json`) ne changent pas en V0 : décision du chef de projet attendue.

## Passage de relais

A ouvre trois PR serveur ; B relit les migrations et les contrats, puis construit ses écrans sur la branche A.

1. **Ordre de fusion** : ME-17 (migration 0053), puis ME-18 (0054), puis ME-1 et ME-11 (0055).
2. **Conflit connu** : après ME-17, `a/identite-ecole` entre en conflit dans `backend/models/index.js` (une ligne ajoutée par chacun, à deux endroits : garder les deux). A le règle en fusionnant `main` dans sa branche avant la fusion.
3. **Relecture croisée** : chaque PR de A est relue par une personne de B sur les migrations et les routes. Une route qui change après relecture repasse par B.
4. **Branches B** : `b/me17-ecrans` part de `a/me17-desactivation`, `b/me18-selecteur-annee` de `a/me18-annees`. Une fois la PR A fusionnée, la PR B se rebase sur `main`.
5. **Mise en ligne** : maj44 se prépare quand les PR A et B de V0 sont fusionnées ; le chef de projet l'applique.

**Terminé veut dire** : parcours Playwright et tests d'intégration verts, lint sans erreur, `verifier:neutre` vert (aucun « HESTIM » en dur), textes en français et en anglais, fichiers sous 300 lignes (règles du § 6 de `assainissement.md`). Pour ME-17, un parcours `desactivation.spec.cjs` qui couvre : désactiver un étudiant, refus `SEANCES_A_TRAITER` puis annulation pour un enseignant, programmation puis annulation, lot avec un refus, réactivation.

## Questions ouvertes

- [ ] B : l'anonymisation est-elle proposée dès V0 dans l'écran, ou cachée jusqu'à la règle des 5 ans (ME-19) ? Proposition de A : proposée, avec double confirmation.
- [ ] B : faut-il une route qui lise l'historique d'un compte (table `Desactivations`) pour la fiche ? A peut l'ajouter (lot S) si l'écran en a besoin.
- [ ] A : ajouter `?id_annee=` à `GET /api/groupes` et à l'arbre, avant le branchement du sélecteur sur Groupes.
- [ ] Chef de projet : nom et identifiant de l'application dans les stores (`app.json`).
