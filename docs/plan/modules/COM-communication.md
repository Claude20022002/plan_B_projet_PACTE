# COM · Communication et notifications

**Objet** : un **service d'envoi commun à tous les modules** :
- canaux : application (notification et push), courriel, SMS, WhatsApp ;
- modèles de messages et journal des envois ;
- règles de silence, envoi différé, canal d'urgence, résumé ;
- compte famille pour plusieurs enfants ;
- crédits de messages.

Un module qui prévient quelqu'un (report, absence, frais, annonce) **passe par COM**. Il n'écrit pas ses propres envois.

**Hors module** :
- le contenu métier des messages : chaque module le fournit (EDT, VSC, FIN…) ;
- l'espace parents de l'application (MOB-05), qui affiche ce que COM envoie ;
- le lien prouvé entre un parent et un enfant (ADM-05).

**Tables possédées** : modèles de messages, envois et leur journal, préférences de canal, crédits de messages (à concevoir).

**Origine** : inventaire du 11 novembre ([06-outils-structures-formation.md](../../etude-marche/06-outils-structures-formation.md), [rapport](<../../etude-marche/reports/Outils scolaires et besoins par pays.md>), besoin H), décision du 13 novembre.

## Ce qui existe

- **Notifications dans l'application** : modèle `Notification` (titre, message, type, lien interne, lu ou non).
- **Push** : `services/push.js`. Chaque `Notification` part aussi vers les téléphones du destinataire par Expo ; un jeton d'appareil désinstallé est supprimé.
- **Courriel** : `utils/sendEmail.js` (nodemailer), avec un compteur d'échecs pour la supervision.
- **Annonces** : `services/annonces/` (destinataires, pièces jointes, interrupteur par école).
- **Envoi de l'emploi du temps par courriel** : `services/calendrier/envoiEdt.js`.
- **Absent** :
  - aucun SMS, aucun WhatsApp ;
  - aucune plage de silence ni aucun résumé : EP-7 n'est pas codée ;
  - aucun service commun : chaque module crée ses `Notification` lui-même.

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| COM-01 | Service commun d'envoi (application, push, courriel, SMS) : modèles, journal, plages de silence par défaut réglables par l'école (20 h-7 h en semaine et le week-end), envoi différé, canal d'urgence, résumé quotidien ; les envois existants y passent | EP-7 | 4 | L | PLA-01, VEN-02 | à faire |
| COM-02 | Compte famille : plusieurs enfants, et plusieurs écoles plus tard ; canal préféré par personne ; accusé de lecture ; numéro de l'école à la place des numéros personnels | — | 4 | M | COM-01, ADM-05 | à faire |
| COM-03 | WhatsApp et crédits de messages : quota inclus, puis crédits prépayés au prix unitaire publié, alerte avant épuisement ; SMS réservé aux alertes et aux familles sans smartphone | — | 4 | M | COM-01, VEN-02 | à faire |

## Critères de « terminé »

- **COM-01** :
  - aucun message non urgent ne part pendant une plage de silence : il est différé, et un test le prouve ;
  - un parent reçoit au plus un résumé par jour hors alerte (EP-7) ;
  - les notifications existantes (reports, annonces, envoi de l'emploi du temps) passent par le service ;
  - chaque envoi est journalisé (canal, heure, résultat).
- **COM-02** : un parent de deux enfants, dans deux classes, reçoit un seul fil, classé par enfant ; l'accusé de lecture est visible par l'expéditeur.
- **COM-03** : quand les crédits sont épuisés, aucun envoi n'est perdu en silence (il est refusé avec un message, ou reporté) ; l'alerte part avant l'épuisement.

## Exigences produit

EP-7. Règle commerciale proposée par l'inventaire : l'accès des familles aux informations sur leur enfant reste **gratuit** ; seuls les consommables (SMS, WhatsApp) se paient, au prix unitaire publié.

## Références

- [Inventaire du 11 novembre, rapport](<../../etude-marche/reports/Outils scolaires et besoins par pays.md>) : besoin H, garantie 7 (règles de notification), consommables.
- France : décret n° 2025-1165 (coupure des notifications de 20 h à 7 h).
