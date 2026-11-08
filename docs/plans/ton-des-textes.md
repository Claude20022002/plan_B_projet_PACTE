# Ton des textes de l'interface

Décision du chef de projet, le 20 octobre 2026 : humaniser les textes du site et de l'application, un lot par public (étudiant, puis enseignant, puis administration), groupe B.

## Règles

1. **On parle à une personne.** « Vous », phrases courtes, verbes d'action. Pas de jargon technique : ni « serveur », ni « session », ni « identifiants », ni « réinitialisation » quand un mot courant suffit.
2. **Une erreur dit ce qui s'est passé et quoi faire.** « Votre emploi du temps n'a pas pu s'afficher. Réessayez dans un instant. » plutôt que « Impossible de charger l'emploi du temps. » ou « Une erreur est survenue. »
3. **Pas d'abréviation ni de « (s) ».** « points » et non « pts », « Examen » et non « Exam », « Bonnes réponses : 3 sur 5 » et non « 3 bonne(s) réponse(s) ».
4. **Une liste vide rassure ou propose.** « Aucune alerte pour le moment. », « Aucun retour de stage pour l'instant. Et si vous partagiez le vôtre ? »
5. **Les quiz sont aujourd'hui des jeux en classe.** Côté étudiant : « Envoyer mes réponses », « Réessayer », « Essais restants », et non « Rendre la copie » ou « Tentatives ». Ils deviendront plus tard de petites épreuves : le vocabulaire de l'examen reviendra alors, là où il le faut.
6. **Le même mot partout.** « Adresse e-mail », « Activités », « Bibliothèque », « Quiz » (jamais « PlannerQuiz » ni « ClassQuiz »).

## Où sont les textes

- Site : `frontend/src/i18n/fr.js` (et `en.js`), `studio.fr.js`, `sessionsJeu.fr.js`.
- Application : `mobile/src/i18n.js`.
- Communs aux deux : `shared/i18n/fr.js`.
- Messages renvoyés par le serveur et affichés tels quels : `message` et `error` des réponses, dans `backend/`.

Les parcours Playwright cherchent certains textes à l'écran (`frontend/tests/parcours`) : un texte changé s'y change aussi.

## Avancement

| Lot | Contenu | État |
|---|---|---|
| Étudiant | Application mobile ; site : connexion, mot de passe oublié, notifications, annonces, activités, joueur du Studio quiz, sessions de jeu | Branche `b/textes-etudiant` (commit 3c4a045) |
| Enseignant | Appel, Mes classes, demandes de report, Mes séances, Studio quiz (éditeur, diffusion : « Diffuser ce quiz », « Diffusions » au lieu de « passation »), jeux en classe (« jeu » au lieu de « session ») | Branche `b/textes-enseignant` |
| Administration (site) | Préparation, génération, conflits, statistiques, imports, journal de sécurité, envoi de l'EDT du mois : plus de « (s) » (forme « libellé : nombre », ou singulier et pluriel), erreurs qui disent quoi faire, plus de « session » ; « Retour » et « Gestion des… » retirés de Conflits, Étudiants, Utilisateurs (recette m-1, m-2) | Branche `b/textes-admin` |
| Administration (serveur) | Messages renvoyés par le serveur et affichés tels quels (environ 135 « (s) », une vingtaine d'« Erreur lors de… ») | À faire, avec le groupe A (code du serveur) |
