# 16. Revue d'expert : viabilité et logique du plan

Demandée le 26 octobre 2026 par le chef de projet, rôle tenu : **expert logiciel et sécurité**. Le plan (fichiers 01 à 15, surtout le plan de développement du fichier 15) est relu contre le code des branches de V0 (`a/me17-desactivation`, `a/me18-annees`, `a/identite-ecole`) et contre `main`. Chaque constat cite le fichier qui le prouve.

Statut : **proposé**. Aucun autre fichier du plan n'est modifié ; les décisions demandées sont au § 16.5.

## 16.1 Verdict

**L'architecture est viable** et ses choix de fond sont les bons : une base par école (MySQL n'a pas de sécurité par ligne), des cookies liés à l'hôte de l'école, un monolithe modulaire, une boîte d'envoi transactionnelle, des migrations « étendre puis contracter », une école pilote sur sa propre installation avant la plateforme commune.

**Le plan de développement est logique dans son ordre général.** Il demande six corrections d'ordre ou de contenu (§ 16.2), dont un lot manquant (A-3), et sept corrections de sécurité (§ 16.3), dont deux à faire dès V0 (B-1, B-7).

## 16.2 Logique du plan de développement

| # | Constat | Risque | Recommandation | Suite |
|---|---|---|---|---|
| A-1 | Le jalon V3 porte des lots inutiles le jour de l'ouverture du pilote. ME-19 (clôture d'une année) ne sert qu'à la fin de son année. ME-15 (facturation) ne sert qu'après l'essai gratuit de 60 jours (§ 13.15). ME-25 (campus dissociés) ne sert que si le pilote a des campus séparés. ME-2b complet ne sert pas : un pilote se règle avant sa première génération | le jalon recule d'environ 12 jours bruts de A, le groupe sur le chemin critique | sortir ME-19 et ME-15 du chemin du jalon (ME-15 avant J+60, ME-19 avant la fin de l'année du pilote) ; ME-25 seulement si Q-25 désigne une école à campus dissociés ; pour le pilote, ME-2b se réduit à « changement structurel refusé une fois des séances générées » (S), le lot complet passe en V4 | à décider |
| A-2 | Le pari technique le plus risqué, le contexte d'établissement (ME-3a, D-03), n'arrive qu'en V4, après trois vagues de code neuf qui l'ignorent. Mesuré le 26 octobre : **33** fichiers hors `models/` importent `config/db.js` (26 le 23 octobre) ; `models/Groupe.js` importe `AnneeUniversitaire` directement (ME-18) ; `services/desactivation/*` ouvre ses transactions par `sequelize.transaction` (ME-17) | si ME-3a échoue en V4, l'injection explicite (`req.modeles`) reprend aussi tout le code des V1 à V3 ; chaque vague agrandit l'écart | **essai réduit de ME-3a dès V1** (environ 2 j) : un résolveur, `AsyncLocalStorage`, trois routes, une transaction, un crochet de modèle, deux bases de test. Et, dès V1, une **règle de lint** `no-restricted-imports` sur `config/db.js` et sur l'import direct d'un modèle par un autre, la liste des exceptions actuelles figée dans la configuration | à décider |
| A-3 | **Lot manquant** : l'installation de l'école pilote. Serveur, DNS, certificats, sauvegardes B2 de cette deuxième installation, supervision, secrets propres, mise à jour de deux installations au lieu d'une. Il n'est ni au fichier 09 ni au fichier 15, alors que ME-22 fait le test d'intrusion « sur l'installation de l'école pilote » | le jalon V3 suppose une machine que personne n'a prévu de monter | nouveau lot A en V3 : M chez Hetzner, L si l'hébergement est au Maroc (Q-23, nouveau fournisseur). ME-0b doit savoir déployer vers plusieurs installations | à décider |
| A-4 | « Les lots EC sont portés par B de bout en bout, serveur compris » (§ 15.4) contredit le fichier 14 (lots EC attribués à A et B) et le § 15.1 (« A possède les contrats d'API »). EC-2 (rendus de fichiers dans MinIO) et EC-3 (notes officielles) sont les lots les plus sensibles du plan | téléversement mal contrôlé (fichier piégé, quota absent, fichier d'une école lisible par une autre) ; note officielle modifiable après jury | B reste propriétaire, mais **revue de sécurité par A obligatoire** sur EC-2 et EC-3 : type réel du fichier lu dans ses octets (comme le logo, `identite.js`), taille et quota par école, analyse antivirus, adresses signées de courte durée, préfixe par établissement, journal des accès. Aligner le fichier 14 sur le fichier 15 | à décider |
| A-5 | La charge (127 jours bruts, 190 à 255 réels avec la règle du § 12.7) n'a pas de calendrier : l'effectif des groupes n'est écrit nulle part. A porte 76 jours bruts ; avec deux personnes à mi-temps, cela fait déjà 5 à 7 mois pour A seul | aucun jalon ne peut être promis à une école | demander l'effectif et les jours par semaine de chaque groupe, puis dater chaque jalon dans le fichier 15 | à décider |
| A-6 | Points mineurs. EC-12 (LTI) n'est dans aucune vague. La restitution des données en fin de contrat, qu'un contrat de sous-traitance exige (ME-23), n'arrive qu'avec ME-16 en V5. ME-0d dit « deux fois de suite » dans sa description et « dix sur dix » dans son critère | incohérences de lecture ; promesse contractuelle sans moyen | EC-12 : écrire « après V5 ». Pour le pilote, une procédure écrite d'export par la sauvegarde suffit en V3. ME-0d : une seule règle, dix passages verts sur dix | à corriger à la prochaine révision |

## 16.3 Sécurité

| # | Constat (vérifié dans le code) | Risque | Recommandation | Quand |
|---|---|---|---|---|
| B-1 | Les sauvegardes sont chiffrées en GPG **symétrique** avec une phrase stockée sur le serveur (`PHRASE=/root/hestim-sauvegarde.cle`, `deploy/vps/sauvegarder.sh`, ligne 57), et la clé B2 a encore le droit d'effacer. Le § 12.5 indique « corrigé » : ce n'est vrai que de la copie hors ligne de la phrase | un attaquant qui prend le serveur lit **et** efface toutes les sauvegardes (rançongiciel) | chiffrement **à clé publique** (`gpg --encrypt -r` ou `age -r`) : le serveur ne garde que la clé publique, la clé privée reste hors ligne chez le chef de projet ; clé B2 sans `deleteFiles` (déjà prévu) ; **verrouillage d'objet B2** (Object Lock, mode conformité) de 30 jours sur le compartiment | V0 (ME-0a) |
| B-2 | La clé de la double authentification est dérivée d'un secret commun du serveur, avec repli sur `CSRF_SECRET` puis `JWT_SECRET` (`backend/services/mfa.js`, ligne 37) | un même secret sert à deux usages ; sur l'instance commune, une seule clé pour toutes les écoles | `MFA_KEY` obligatoire en production, sans repli. Sur l'instance commune : dérivation par école (HKDF, information = `uid` de l'établissement) pour les nouvelles écoles ; HESTIM garde sa dérivation actuelle (identifiant figé, D-11) | V1, puis ME-3b |
| B-3 | La seule politique de contenu posée est `frame-ancestors 'none'` (`deploy/vps/Caddyfile.vps`, ligne 51) ; le plan n'en parle nulle part | ME-26 (vidéos en iframe), EC-2 (fichiers déposés), les sous-domaines par école et les jeux de niveau 2 élargissent la surface d'injection de script | nouveau lot S en V1 : politique complète (`default-src 'self'`, `script-src 'self'`, `object-src 'none'`, `frame-src` limité aux lecteurs YouTube nocookie et Vimeo), d'abord en `Content-Security-Policy-Report-Only`, appliquée avant le jalon V3 | V1, puis V3 |
| B-4 | L'anonymisation de ME-17 (`services/desactivation/anonymisation.js`) efface l'identité dans `Users`, mais le journal de sécurité garde le courriel et l'adresse IP pendant 365 jours (`services/journalSecurite.js`), et StudyLib garde ses copies (nom, courriel) | effacement incomplet au sens de la loi 09-08 | écrire la durée et la base légale du journal (sécurité du service) dans les documents de ME-23 ; propager l'anonymisation à StudyLib par un événement (ME-2d) ; d'ici là, une procédure manuelle écrite | ME-23, ME-2d |
| B-5 | Les données de HESTIM sont hébergées hors du Maroc (VPS Hetzner à Helsinki). Le dossier de transfert à la CNDP n'est qu'une ligne de ME-23 et n'apparaît pas dans les décisions qui bloquent (§ 15.7) | ouverture du pilote retardée par les délais de la CNDP, ou refus d'une école publique | ajouter au § 15.7 : « déclaration ou autorisation du transfert à la CNDP », condition du jalon V3, à lancer dès maintenant avec le juriste | maintenant |
| B-6 | Le serveur d'application tient les secrets de toutes les bases (§ 12.5, « noté »), mais aucun lot ne prévoit d'en changer un | une fuite oblige à tout changer d'un coup, avec coupure | critère ajouté à ME-4 : changer le mot de passe MySQL d'une école sans coupure, par une commande, journalisé | V4 |
| B-7 | Code de V0, à corriger avant maj44. Le courriel de préavis de ME-17 écrit « Planner » en dur au lieu du nom de l'école (`services/desactivation/programmation.js`). `GET /api/groupes` et `/api/groupes/arbre` ne filtrent pas par `id_annee` (ME-18), alors que le sélecteur d'année en a besoin | texte non neutre ; sélecteur incomplet | après la fusion de l'identité de l'école : préavis au nom de l'école ; filtre `?id_annee=` sur les deux routes (S) | V0 |

## 16.4 Ce qui tient (vérifié)

- **D-02** : les cookies n'ont pas d'attribut `Domain` ; ils restent liés à l'hôte, donc à l'école.
- **D-05** : l'authentification unique d'une école n'ouvre que cette école (I-14) ; une invitation est toujours créée.
- **Logo de l'école** : type contrôlé sur les octets réels, SVG refusé, 512 Ko au plus, en-tête `nosniff` (`services/etablissement/identite.js`).
- **Double authentification obligatoire** pour les administrateurs (`mfaObligatoire`, `services/mfa.js`).
- **Désactivation** : refus de son propre compte et du dernier administrateur, y compris le jour de l'échéance ; séances orphelines refusées (409 `SEANCES_A_TRAITER`) ; suppression réservée aux comptes sans historique.
- **Exploitation** : migrations « étendre puis contracter », boîte d'envoi idempotente, découpage en trois tranches (§ 12.11), sauvegardes hors serveur en service avec une restauration d'essai réussie.

## 16.5 Décisions demandées

| Question | Proposition | Réponse |
|---|---|---|
| R-1 | Alléger le jalon V3 : ME-19 et ME-15 après l'ouverture, ME-25 selon Q-25, ME-2b réduit (A-1) | |
| R-2 | Essai réduit de ME-3a et règle de lint dès V1 (A-2) | |
| R-3 | Créer le lot « installation de l'école pilote » en V3 (A-3) | |
| R-4 | Revue de sécurité par A sur EC-2 et EC-3 (A-4) | |
| R-5 | Effectif et jours par semaine de chaque groupe, pour dater les jalons (A-5) | |
| R-6 | Sauvegardes à clé publique et verrouillées dès V0 (B-1) | |
| R-7 | Politique de contenu en V1, appliquée avant V3 (B-3) | |
| R-8 | Dossier CNDP lancé maintenant, condition du jalon V3 (B-5) | |

Une fois tranchées, les réponses se reportent dans les fichiers 09 et 15, dans la même PR, avec leurs diagrammes.
