# Relecture du contrat de MP-1 par le groupe B

5 novembre 2026. Objet : le § 7 de `docs/plans/moteur-planification/conception-mp1.md` (branche `a/mp1-valeurs`, c36e835). La relecture porte sur la conception et sur le code des routes (`moteurValeursRoutes.js`, `moteurValeursController.js`, `services/moteur/valeurs/`), avant que le groupe B écrive les écrans des réglages du moteur.

**Rien de bloquant pour le serveur tel qu'il est.** Les points 1 à 3 bloquent en revanche les écrans : sans eux, l'écran devrait embarquer une copie du catalogue ou recréer un brouillon à chaque modification.

## Ce qui va bien

- **Refus codés, rattachés à leur réglage** : `violations: [{ cle, portee, id_portee, code, message }]`. L'écran peut afficher chaque erreur sous son champ et la traduire par son code.
- **La date du jour est celle de l'école** (`aujourdhui()` au fuseau de l'école). Le piège du fuseau du navigateur est évité.
- **Versions immuables** : brouillon, application, abandon et annulation par version inverse. L'historique se lit sans ambiguïté.
- **Application dans une transaction avec verrou** sur la version.
- **La trace de chaque valeur** (`origine`) permettra d'expliquer d'où vient un réglage (P-21, exigence EP-4 du plan fusionné).
- **Migration 0061**, cohérente avec la réservation de la 0060 pour le socle neutre.

## Demandes

| N° | Sujet | Constat | Demande | Pour les écrans |
| --- | --- | --- | --- | --- |
| R-1 | **Métadonnées du catalogue** | aucune route ne donne le nom, la description, le type, la liste des valeurs, l'unité, les bornes, la famille, la priorité et le niveau `modifiable` des paramètres. Le catalogue est dans `backend/services/moteur/catalogue/`, que le site ne peut pas lire | `GET /api/moteur/catalogue?modifiable=etablissement` : les paramètres réglables par l'école, groupés par famille, avec ces propriétés ; les textes en français et en anglais, ou une clé de traduction stable | **bloquant** : sans elle, l'écran recopie le catalogue et le désynchronise |
| R-2 | **Modifier un brouillon** | aucune route : il faut abandonner, puis recréer | `PUT /api/moteur/versions/:id` (brouillon seulement, 409 sinon), qui remplace les lignes et le libellé. Sinon, décider que le brouillon vit dans l'écran jusqu'à « Enregistrer », et l'écrire dans le contrat | **bloquant** pour un écran d'édition |
| R-3 | **Liste des versions** | `GET /versions` renvoie les 100 dernières **avec toutes leurs lignes** | la liste sans les lignes (libellé, date d'effet, statut, auteur, nombre de réglages), plus `GET /versions/:id` pour le détail | **bloquant** pour un historique rapide (EP-2, EP-10) |
| R-4 | **Version de base** | deux brouillons ouverts en même temps : le second appliqué écrase le premier sans prévenir | à la création, garder la version appliquée de référence ; à l'application, 409 `VERSION_DEPASSEE` si une version plus récente touche les mêmes réglages, comme pour l'annulation | l'écran propose de recharger |
| R-5 | **Formes de `actives` et `alertes`** | non décrites au § 7 | écrire leur forme dans le contrat. Pour `alertes` : `{ cle, portee, code, message }` | afficher les alertes à côté des réglages |
| R-6 | **Journal de sécurité** | appliquer, abandonner et annuler une version ne sont pas journalisés, alors que la modification de l'identité de l'école l'est (`identite_ecole_modifiee`) | événements `parametres_version_appliquee` et `parametres_version_annulee`, avec l'auteur et les clés touchées | écran du journal de sécurité |
| R-7 | **Langue des messages** | les messages sont en français seulement | garder les **codes stables** : le site traduit par code (fr, en, puis ar). Le `message` reste une aide en français | textes traduits |
| R-8 | **Les cibles** | `id_portee` n'est pas contrôlé : une valeur orpheline est sans effet | à garder en limite connue, mais l'écran ne doit proposer que des cibles existantes. Pour les portées `niveau` et `cycle` du scolaire, il n'existe pas encore de table (modèle de données du scolaire, C-5) | les listes de choix |
| R-9 | **Responsable de filière** | `requireAdmin` sur toutes les routes, alors que le catalogue prévoit `modifiable: responsable` | à garder pour MP-1 ; à ouvrir avec les habilitations à portée (ME-12) | rien pour l'instant |
| R-10 | **Classes de D-07** | présentation, prospectif, structurel : absentes du catalogue (§ 7, déjà noté) | à ajouter avant ME-2b, pour que l'écran dise « s'applique à la prochaine génération » ou « aperçu nécessaire » | message sous chaque réglage |

## Suite proposée

1. Le groupe A répond sur R-1 à R-4, qui conditionnent les écrans, et dit ce qu'il garde de R-5 à R-10.
2. Le groupe B écrit ensuite la conception des écrans des réglages du moteur. Le panneau de configuration (ME-2c, F-05) a une section « Règles de génération ».
