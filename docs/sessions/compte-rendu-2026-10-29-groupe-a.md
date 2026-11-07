# Compte rendu de la session du groupe A, 27 au 29 octobre 2026

À lire en début de la prochaine session du groupe A, après le compte rendu du 26 octobre (`compte-rendu-2026-10-26-groupe-a.md`, PR #129 si elle n'est pas fusionnée), avec le plan validé (`docs/plans/planner-multi-etablissements/15-plan-de-developpement.md`) et la revue d'expert (`16-revue-expert.md`). Les règles de travail restent celles du § 15.6 du plan, plus une nouvelle (§ 4) : **seul le chef de projet pousse le code**.

## 1. L'essentiel

1. **`main` est réparée et maj44 est en ligne depuis le 27 octobre** (`3e36d46` : #120 à #125, #128, #130 ; migrations 0053 à 0055 ; nouvelle image du backend). `main` est depuis à `6d8872e` (#133 du groupe B, parcours seulement : pas de paquet nécessaire).
2. **Les sauvegardes complètes sont en service sur le serveur** (étape 3 du 26 octobre), y compris **R-6** : chiffrement pour une clé publique, phrase retirée du serveur, journaux binaires toutes les 15 minutes, B2 verrouillé 30 jours. Détail au § 3. **Reste le premier essai de restauration complet.**
3. **PR #132** (livraison de tous les scripts d'exploitation dans les paquets) : CI verte, **à fusionner**. Sans elle, un paquet n'installe pas `sauvegarde-commun.sh` ni `essayer-mysql84.sh`.
4. **PR #127 (ME-0e)** : sa CI date d'avant la réparation de `main` (« Test Backend » et parcours rouges) ; à mettre à jour depuis `main` avant la répétition sur le serveur.

## 2. Fait du 27 au 29 octobre

| Quoi | Où | État |
|---|---|---|
| Correctif du banc des requêtes : les groupes de l'étudiant lus une seule fois dans `devoirsDe` (`modulesDuJoueur(user, { groupes })`), budget de `/api/devoirs` ramené à 7 | #128, commit `728709e` | fusionnée (`2761b61`) ; marqueurs de conflit absents de `main` (vérifié) |
| maj44 préparé dans un dossier neuf (`travaux-planner/maj44`), image du backend reconstruite (body-parser 1.20.9, nodemailer 10.2.1), `VERSION` = `3e36d46` | `deploy/vps/paquets/` du dossier | **en ligne le 27 octobre** (appliqué par le chef de projet) |
| Livraison des scripts : `preparer-maj.sh` copie tous les `deploy/vps/*.sh` (sauf lui-même) ; `appliquer-maj.sh` installe tous les `.sh` et `.mjs` du paquet. Essayé sur un paquet d'essai : 8 scripts installés | #132, `a/paquet-scripts-exploitation` | **ouverte, CI verte, à fusionner** |
| Mise en service des sauvegardes complètes et de R-6 sur le serveur | serveur (§ 3) | fait le 29 octobre, commandes lancées par le chef de projet |

## 3. Sauvegardes de la production au 29 octobre

| Élément | État |
|---|---|
| Scripts | `sauvegarde-commun.sh` et `sauvegarder-journaux.sh` posés à la main dans `/opt/hestim/deploy/vps/` (maj44 ne les avait pas livrés : c'est l'objet de #132) |
| Sauvegarde de la nuit | cron 02:15 : bases MySQL, base du quiz, fichiers de la bibliothèque (≈ 129 Mo chiffrés) et du quiz ; essai manuel du 29 octobre : code 0 |
| Chiffrement (R-6) | `CLE_PUBLIQUE=/root/hestim-sauvegarde.pub` ; paire de clés créée sur le PC du chef de projet. **Déchiffrement vérifié sur le PC** (export MySQL, 2,5 Mo en clair). Ancienne phrase copiée hors ligne (empreinte SHA-256 comparée), puis détruite sur le serveur (`shred`) et retirée des réglages |
| Clés hors ligne | clé privée, clé publique et ancienne phrase sur un disque externe du chef de projet ; **seconde copie à faire** ; la phrase de la clé privée est dans son coffre. Les sauvegardes jusqu'au 28 octobre ne se relisent qu'avec l'ancienne phrase |
| Journaux binaires | `log_bin` actif (rétention 30 jours) ; cron `*/15` de `sauvegarder-journaux.sh` ajouté ; premier passage : 2 journaux, code 0 |
| Destination B2 | clé d'**application** limitée au compartiment (le serveur utilisait la clé maîtresse : remplacée, puis clé maîtresse régénérée) ; **verrouillage d'objet avec rétention par défaut de 30 jours** ; règle de cycle de vie ; `SUPPRESSION_DISTANTE=non`. Essai : effacement définitif d'un fichier d'essai **refusé** (401). Ce fichier reste dans `essai/` jusqu'à ce que le cycle de vie le retire |
| Essai de restauration | dernier essai : 25 octobre (ancien mode). **À refaire** avec une sauvegarde à clé publique et les fichiers, à noter dans `docs/recette/essais-restauration.md` |

## 4. Décisions

- **R-6 activé** (il n'était pas retenu le 26 octobre) : le chef de projet a choisi la clé publique, la clé privée reste hors du serveur.
- **Seul le chef de projet pousse le code** (27 octobre). Claude prépare et commite dans le dossier de travail, puis donne la commande `git push` ; il crée et fusionne les PR quand on le lui demande, une fois la branche poussée.
- Les commandes du serveur sont lancées par le chef de projet ; Claude les écrit, enveloppées dans `ssh`, et lit la sortie collée.

## 5. Ordre de travail de la prochaine session

1. **Fusionner #132** (CI verte). Elle prend effet au prochain paquet (maj45).
2. **Premier essai de restauration** selon `DEPLOIEMENT.md`, « Essai de restauration » : une sauvegarde de la nuit (clé publique) et ses fichiers, dans une base jetable, déchiffrés sur le PC ; comptes et nombre de fichiers comparés ; une ligne dans `docs/recette/essais-restauration.md`.
3. **ME-0e** : mettre `a/me0e-mysql84` à jour depuis `main`, CI verte ; poser `essayer-mysql84.sh` sur le serveur (à la main, ou par maj45 après #132) et le lancer ; si « RÉPÉTITION RÉUSSIE », fusionner #127, puis le passage un dimanche matin (`DEPLOIEMENT.md`, « Passer à MySQL 8.4 »).
4. **V1 du groupe A** (fichier 15, § 15.5) : essai réduit de ME-3a et règle de lint sur `config/db.js` (R-2, 33 fichiers en exceptions), ME-0b, ME-21, ME-14a, ME-0c.

## 6. Incidents et leçons

| Incident | Cause | Règle |
|---|---|---|
| « Test Backend » rouge sur #128 | budget du banc des requêtes dépassé (groupes de l'étudiant lus deux fois) | lire la sortie du banc avant de chercher dans les tests |
| `sauvegarder.sh` sans `sauvegarde-commun.sh` sur le serveur | liste fixe de scripts dans `preparer-maj.sh` et `appliquer-maj.sh` | tous les scripts sont livrés (#132) |
| Claude a poussé deux fois sur la foi d'un « oui » à un plan | — | seul le chef de projet pousse |
| Commandes refusées dans PowerShell | syntaxe bash collée dans PowerShell ; variables perdues à chaque nouvelle fenêtre | donner des commandes PowerShell, variables redéfinies en tête de bloc |
| `gpg` de Git en échec depuis PowerShell (`keyboxd` introuvable) ; `bash` seul y lance WSL | le `gpg` de Git ne trouve ses programmes que lancé par le `bash` de Git | `& "C:\Program Files\Git\bin\bash.exe" -lc 'gpg --pinentry-mode loopback …'` |
| Requête MySQL coupée, aide de `mysql` affichée | Windows PowerShell 5.1 retire les guillemets doubles d'un argument passé à `ssh` | dans une commande distante : guillemets simples doublés (`''…''`) et espaces échappés (`select\ @@log_bin`), jamais de `"` |
| Effacement définitif possible sur B2 malgré « Verrouillage d'objet : Activé » | verrouillage activé sans rétention par défaut | régler la rétention par défaut, puis **essayer** l'effacement d'un fichier d'essai |
| Clé maîtresse B2 sur le serveur | `rclone config` fait avec la clé du compte | clé d'application limitée au compartiment (identifiant de 25 caractères) ; clé maîtresse régénérée |

## 7. Questions ouvertes

Inchangées depuis le 26 octobre, sauf R-6 (tranché) : **Q-25** (école pilote, campus dissociés), **Q-23** (hébergement de l'école pilote), **Q-27** (deuxième personne sur la production), **EC-2** (devoirs le jour de l'ouverture), règle de protection de `main` (« Require status checks »), `app.json`.

## 8. Dossiers de travail (`Github Project\travaux-planner\`)

| Dossier | Branche | Suite |
|---|---|---|
| `paquet-scripts-exploitation` | `a/paquet-scripts-exploitation` | garder jusqu'à la fusion de #132 |
| `me0e-mysql84` | `a/me0e-mysql84` | garder jusqu'à la fusion de #127 |
| `compte-rendu-26`, `compte-rendu-29` | comptes rendus | garder jusqu'à leur fusion |
| `maj44` | détaché sur `3e36d46` | à supprimer (paquet appliqué) |
| `correctif-conflit-modeles`, `sauvegardes-b2`, `sauvegardes-cle-publique`, `ci-reparation`, `me17-desactivation`, `me18-annees`, `identite-ecole`, `plan-multi-etablissements` | fusionnées | à supprimer : `git worktree remove --force ..\travaux-planner\<dossier>` depuis `plan_B_projet_PACTE` |
