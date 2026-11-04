# Conception de MP-1 : les valeurs résolues

Statut : **écrit et testé ; table unique et migration 0061 validées par le chef de projet le 4 novembre 2026.** Rien n'est encore lu par la génération : `ParametresPlanning` en reste la source jusqu'à MP-5.

MP-1 répond à une question : **pour cette cible, à cette date, quelle valeur s'applique, avec quelle force et quel poids, et d'où vient-elle ?** Il rejoint ME-2b (versions datées, D-07).

## 1. Ce qui est fait

| Fichier | Rôle |
|---|---|
| `backend/services/moteur/valeurs/resolution.js` | `lignesEnVigueur`, `resoudreParametre`, `resoudreTout`, `regleActive` : fonctions pures, sans base |
| `backend/services/moteur/valeurs/ecriture.js` | `controlerEcriture` : droits, portée, type, force, poids, bornes ; chaque refus a un code et une phrase |
| `backend/services/moteur/valeurs/anciensParametres.js` | correspondance entre `ParametresPlanning` et le catalogue, unités comprises |
| `backend/services/moteur/valeurs/lecture.js` | lignes en base, valeurs comptées (`ETA.TAILLE`), valeurs en vigueur pour une cible et une date |
| `backend/services/moteur/valeurs/versions.js` | créer, appliquer, abandonner, annuler une version |
| `backend/migrations/0061-valeurs-parametres.js`, `models/VersionParametres.js`, `models/ValeurParametre.js` | les deux tables |
| `backend/routes/moteurValeursRoutes.js`, `controllers/moteurValeursController.js` | les routes du § 7 |
| `backend/tests/utils/valeursMoteur.test.js`, `tests/integration/valeursMoteur.test.js` | règles ci-dessous, cycle d'une version, non-régression de l'école d'origine |

## 2. Qui l'emporte

```mermaid
flowchart LR
    C["Catalogue"] --> P["Profil<br/>celui de la cible"]
    P --> E["Établissement"]
    E --> CY["Cycle"]
    CY --> N["Niveau"]
    N --> F["Filière"]
    F --> I["Individuel<br/>groupe, enseignant, salle, matière"]
    I --> R{"Bornes et loi"}
    R -->|tenues| V["Valeur retenue"]
    R -->|dépassées| A["Alerte au calcul,<br/>refus à l'écriture"]
```

- **Le profil se résout d'abord** : `ETA.ID.PROFIL` est un paramètre comme un autre, réglable par niveau. Une école de la maternelle au lycée suit le profil du niveau concerné. Aucun profil ne peut le régler : sinon, il dépendrait de lui-même.
- **Une portée ne s'applique qu'à sa cible** : un réglage de la filière 3 n'existe pas pour la filière 4.
- **La trace est gardée** : chaque résultat dit d'où vient sa valeur. Le rapport de génération et les écrans pourront l'expliquer (P-21 du groupe B).

## 3. Force et poids (D-09 amendée)

| Qui | Valeur, seuil, poids | Force |
|---|---|---|
| Catalogue | par défaut | par défaut ; **26 règles verrouillées** |
| Profil | oui | oui, si `force_reglable` ; si une règle stricte devient souple, le profil doit lui donner un poids (test) |
| Plateforme | oui | oui, si `force_reglable` |
| Établissement, responsable, personne | oui, selon `modifiable` | **non** : l'école choisit « indispensable », un poids très fort |

Une règle stricte n'a jamais de poids. Le passage de « peu, normal, beaucoup, indispensable » aux poids reste à fixer (MP-5).

## 4. Règles actives

Une règle n'entre pas dans le calcul si sa valeur la désactive, si son seuil n'est pas renseigné, ou si une condition `active_si` n'est pas remplie (un seul campus : pas de règle de trajet). Les valeurs comptées (nombre de campus) sont passées en `faits`, car elles ne se saisissent pas.

## 5. L'école pilote ne change pas

Avec le profil université, des tests vérifient :

- les 6 anciens réglages convertis gardent leur valeur (attention aux unités : heures en minutes, ratio en pourcentage) ; les 2 autres (`pause_vendredi`, `samedi_apres_midi_initiale`) deviennent des plages restreintes avec ME-2a ;
- les **10 poids du code Java** sont identiques, relus dans le fichier source ;
- les **12 règles strictes** du solveur restent actives.

Ces tests ne prouvent pas encore que **le problème envoyé au solveur** reste identique : ce critère de ME-2a sera à tenir quand `probleme.js` lira ces valeurs (MP-5).

## 6. La base de données

```mermaid
erDiagram
    VERSION_PARAMETRES ||--o{ VALEUR_PARAMETRE : fixe
    VERSION_PARAMETRES {
        int id_version PK
        date date_effet
        string statut "brouillon, appliquee, annulee"
        json impact "ME-2b"
        int id_auteur
        datetime appliquee_le
    }
    VALEUR_PARAMETRE {
        int id_version PK
        string cle PK "ENS.CHARGE.MAX_H_JOUR"
        string portee PK "etablissement, niveau, enseignant..."
        string id_portee PK "chaîne vide pour l'établissement"
        json valeur
        string force "plateforme seulement"
        int poids
        boolean retiree
    }
```

**Écart validé avec le fichier 04, mis à jour** : `VALEUR_PARAMETRE` gagne la portée, et `REGLAGE_CONTRAINTE` disparaît. Une règle est un paramètre comme un autre, et deux tables obligeraient à résoudre deux fois.

| Sujet | Choix |
|---|---|
| Numéro de migration | **0061**. 0059 est pris par EC-9 et 0060 réservé au socle neutre (#150) |
| `id_portee` | `VARCHAR`, chaîne vide pour l'établissement : MySQL n'applique pas l'unicité sur un `NULL`. Les identifiants sont lus en chaîne, à normaliser côté `cible`, car la comparaison est stricte |
| Immuabilité (I-D5) | pas de route de modification ; annuler crée une version avec `retiree` |
| École d'origine | migration : une version initiale datée du jour, profil `universite`, plus les valeurs **modifiées** de `ParametresPlanning`, converties. Une base sans compte n'a aucune ligne (même test que 0057) |
| Lectures | `lireParametres` et `affectationRules.js` ne bougent pas : un seul chemin à la fois. Ils basculent avec MP-5 |

## 7. Le contrat pour le groupe B

Réservé à l'administration, qui écrit au niveau « établissement ». Tout refus suit le format de l'API : `{ message, code, violations: [{ cle, portee, id_portee, code, message }] }`.

| Route | Rôle |
|---|---|
| `GET /api/moteur/valeurs?date=&niveau=&filiere=&enseignant=...` | `{ date, profil, valeurs: [{ id, valeur, force, poids, origine }], actives, alertes }` |
| `GET /api/moteur/versions` | les 100 dernières, avec leurs réglages |
| `POST /api/moteur/versions` | `{ libelle, date_effet, lignes: [{ cle, portee, id_portee, valeur, poids, retiree }] }` : crée un brouillon, sans effet |
| `POST /api/moteur/versions/:id/appliquer` | applique d'un coup, après avoir refait les contrôles ; 409 si ce n'est pas un brouillon |
| `POST /api/moteur/versions/:id/abandonner` | abandonne un brouillon, qui reste dans l'historique |
| `POST /api/moteur/versions/:id/annuler` | crée la version inverse ; 409 si une version plus récente touche le même réglage, ou si elle est déjà annulée |

Codes de refus : `non_modifiable`, `droit_insuffisant`, `portee_interdite`, `type_invalide`, `hors_liste`, `regle_obligatoire`, `force_figee`, `force_interdite`, `poids_interdit`, `poids_invalide`, `borne_depassee`, `parametre_inconnu`, `doublon`, `cible_invalide`, `ligne_vide`. Hors liste : `DATE_EFFET_PASSEE`, `DATE_EFFET_INVALIDE`, `VERSION_VIDE`.

**Limites connues** : le niveau « plateforme » (force d'une règle, règles d'un pays) n'a pas de route, faute de Plateforme : ces réglages attendent ME-4. L'existence de la cible (`id_portee`) n'est pas contrôlée : une valeur orpheline est sans effet. Le relevé du code a aussi montré que **Planner ne connaît pas les bâtiments** (`Salle.batiment` n'est qu'un alias du campus) : le catalogue est corrigé, et un test vérifie désormais chaque colonne qu'il cite.

L'aperçu d'impact (quelles séances bougent) reste à ME-2b. Les trois classes de D-07 (présentation, prospectif, structurel) ne sont pas encore dans le catalogue : à ajouter pour que l'aperçu ne s'applique qu'aux réglages structurels.

## 8. Suite

1. Relecture du contrat par le groupe B, avant ses écrans.
2. MP-5 : `probleme.js` et `affectationRules.js` lisent ces valeurs, avec le test du problème identique. D'ici là, un seul chemin de lecture.
3. Ajouter au catalogue les trois classes de D-07 (§ 7), pour l'aperçu de ME-2b.
