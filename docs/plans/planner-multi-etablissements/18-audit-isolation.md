# 18. Audit d'isolation entre écoles

29 octobre 2026, groupe A, après l'essai réduit de ME-3a (fichier 17). Question du chef de projet : l'environnement de chaque école est-il bien isolé ? On a relu, canal par canal, le code de `main` au 29 octobre (base, mémoire du serveur, tâches, jetons, fichiers, courriels, services voisins, déploiement, sauvegardes), et ajouté une preuve quand un test court suffisait.

## 18.1 Verdict

**Non, pas encore.** Aujourd'hui une seule école est en production, et rien ne fuit. Mais une deuxième école ouverte tel quel verrait des données de la première, ou lui en enverrait. L'essai de ME-3a a montré que le mécanisme d'isolation fonctionne (§ 18.3) ; l'audit trouve **15 canaux à fermer**, dont **4 critiques**. La plupart sont déjà prévus par le plan (ME-3a, ME-3b, D-05, ME-2e, D-16) ; trois n'y figuraient pas : I-3 (identité gardée en mémoire), I-5 pour l'adresse interne par laquelle StudyLib appelle Planner, et I-8 (adresses des courriels). Et le fichier 03 (§ 3.8) dit que le verrou des tâches périodiques « fonctionne déjà par établissement » : ce n'est vrai qu'une fois le nom de la base lu dans le contexte (I-7).

Gravité :
- **critique** : des données personnelles d'une école lues, écrites ou envoyées chez une autre ;
- **élevée** : une action d'une école agit sur une autre, ou une obligation légale n'est pas tenue pour une école ;
- **moyenne** : une fonction ne marche pas pour la deuxième école, sans fuite ;
- **faible** : confort d'exploitation.

## 18.2 Les canaux à fermer

| N° | Canal | Constat (où) | Effet avec deux écoles | Gravité | Preuve | Lot |
|---|---|---|---|---|---|---|
| I-1 | Transactions et requêtes prises sur `config/db.js` | 23 fichiers figés par la règle de lint (dont `services/mfa.js`, `services/desactivation/*`, `services/annonces/annonces.js`, `services/planning/*`) | Les écritures de B partent dans la base de A, sans erreur, même en mode strict | critique | test « une transaction ouverte sur la connexion de A… » (`contexteEtablissement.test.js`) | ME-3a |
| I-2 | File des notifications | `services/push.js`, lignes 39 à 61 : une file et une minuterie pour tout le serveur, vidée dans le contexte de la première requête | Titre et texte d'une notification de B envoyés aux appareils du compte de même numéro chez A | critique | à écrire (faux client Expo de `push.test.js`, deux écoles) | ME-3b |
| I-3 | Identité de l'école en mémoire | `services/etablissement/identite.js`, ligne 23 : `let cache` unique | B affiche le nom, les couleurs et le logo de A ; ses courriels partent au nom de A | élevée | `test.failing` « chaque école lit sa propre identité » : B reçoit « HESTIM Engineering & Business School » | ME-3a |
| I-4 | Jetons sans école | `utils/jetons.js` : même clé, même émetteur, pas de revendication `tid` | Planner refuse un jeton de B sur A (sessions par base, testé) ; StudyLib et ClassQuiz, qui se fient au `sub`, prendraient le compte n° 5 de B pour le n° 5 de A | critique dès qu'un service voisin sert deux écoles | à écrire avec ME-2e | ME-3b (`tid`, premier temps de D-05), ME-2e |
| I-5 | StudyLib | `docker-compose.yml` : une base `studylib`, un seau MinIO `studylib` ; StudyLib appelle Planner par l'adresse interne (`PLANNER_API_URL: http://backend:5000/api`, ligne 218) avec un jeton d'intégration unique | La bibliothèque est commune sans filtre par école ; le référentiel qu'elle reçoit est toujours celui de l'école par défaut | critique | à écrire avec ME-2e | ME-2e |
| I-6 | Générations en cours | `services/generation/timefold/generation.js`, lignes 17, 102 et 123 : carte unique rangée par numéro de session | Une génération à la fois pour tout le serveur ; B lit la progression ou arrête le calcul de A quand leurs sessions ont le même numéro | élevée | à écrire (test prévu par D-03 : « deux écoles, même numéro de session ») | ME-3b |
| I-7 | Tâches périodiques | `server.js`, lignes 63 à 87 ; `services/taches/periodiques.js`, ligne 13 (verrou nommé d'après la base par défaut) | Pour B : pas de séances marquées réalisées, pas de désactivations programmées, pas de rappels d'appel, pas de renvoi des emplois du temps, **pas de purge du journal de sécurité** (durée de conservation, loi 09-08) | élevée | lecture du code ; en mode strict elles échoueraient | ME-3b |
| I-8 | Adresses dans les courriels et les codes | `FRONTEND_URL` dans `controllers/authController.js`, `services/comptes.js`, `services/calendrier/envoiEdt.js`, `services/presences/appel.js`, `services/oidc/provider.js` | Liens de réinitialisation, d'invitation et d'appel de B vers le site de A : le jeton n'y existe pas (pas de fuite), mais la fonction est cassée et la confusion favorise l'hameçonnage | moyenne | lecture du code | ME-3a (adresse de l'école dans son contexte) |
| I-9 | ClassQuiz | `services/oidc/provider.js`, ligne 76 : un fournisseur, un émetteur, un client ; le webhook arrive par l'adresse interne (`docker-compose.yml`, ligne 371) | Comptes de quiz confondus par numéro ; parties de B rattachées à l'école par défaut | élevée si ClassQuiz sert deux écoles | lecture du code | ME-0c (ClassQuiz éteint pour toute nouvelle école, D-04) |
| I-10 | Limiteur de l'API en mémoire | `middleware/rateLimiterMiddleware.js`, ligne 195 : clé `user:<id>` | Les comptes de même numéro des deux écoles partagent leur quota (une école peut bloquer quelqu'un de l'autre) | moyenne | lecture du code | ME-3b (clé préfixée par l'école) |
| I-11 | Sauvegardes | `deploy/vps/sauvegarder.sh`, ligne 83 : un seul export de toutes les bases | Restaurer une école seule demande d'extraire son morceau ; une école partie reste 30 jours dans les archives verrouillées ; l'essai de restauration ne compte que HESTIM | moyenne | lecture du code | sauvegarde par établissement (préalable bloquant de D-16, fichier 02) |
| I-12 | Application mobile | `mobile/src/config.js`, ligne 6 : adresse de l'API fixée à la construction | L'application ne sert qu'une école | moyenne | lecture du code | D-05 |
| I-13 | Adresse du site | `deploy/Caddyfile` : une seule `SITE_ADDRESS` | Un seul nom d'hôte, donc une seule école reconnue | moyenne | lecture du code | D-04 (registre de la Plateforme) |
| I-14 | Journaux du serveur | `middleware/loggerMiddleware.js` : pas de nom d'école | Diagnostic difficile ; l'équipe voit les lignes de toutes les écoles ensemble | faible | lecture du code | ME-21 |
| I-15 | Clé d'IA commune | `services/ia/client.js` : une clé, un fournisseur | Coûts non séparés par école (l'usage, lui, est compté dans la base de chaque école) | faible | lecture du code | ME-24 |

## 18.3 Ce qui est déjà isolé (vérifié)

- **Les données en base** : avec les résolveurs de l'essai, chaque requête lit et écrit la base de son école ; trois routes réelles et 20 requêtes mêlées le vérifient (fichier 17).
- **Les transactions par `models/acces.js`** et **les crochets de modèles** (celui de `Groupe` a été corrigé par l'essai).
- **Les sessions** : un jeton de B rejoué sur A est refusé (401).
- **Les limiteurs de connexion** (par adresse et par compte) : leur magasin est en base, donc dans celle de l'école.
- **Les quotas d'IA** : comptés dans la base de l'école (`UsageIaQuiz`).
- **Les fichiers** : le serveur n'écrit rien sur disque ; devoirs, médias du Studio et logo sont en base, les supports de cours dans StudyLib (voir I-5).
- **L'échec fermé** : en mode strict, un accès hors de toute école échoue, et un hôte inconnu reçoit 404.

## 18.4 Ordre proposé

1. **Avant toute deuxième école, même d'essai** : I-1, I-3 et I-8 dans ME-3a ; I-2, I-6, I-7 et I-10 dans ME-3b ; I-9 par ME-0c (ClassQuiz éteint) ; I-11 (sauvegarde par établissement) ; I-13 (au moins une liste d'hôtes). Puis le mode strict par défaut.
2. **Avant d'ouvrir la bibliothèque à une deuxième école** : I-4 et I-5 (`tid` de ME-3b, puis ME-2e). D'ici là, la deuxième école n'a pas StudyLib.
3. **Avant la mise en vente à plusieurs écoles** : I-12 (D-05), I-14 (ME-21), I-15 (ME-24).

Chaque canal fermé reçoit un test à deux écoles dans `contexteEtablissement.test.js` (ou son successeur de ME-3a) : un `test.failing` écrit d'abord, changé en test ordinaire avec la correction. C'est la « suite d'isolation » qu'attend l'exigence EX-06 (fichier 10).
