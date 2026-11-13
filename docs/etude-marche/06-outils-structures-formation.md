# Outils des établissements et modules à créer

11 novembre 2026 · branche `doc/inventaire-outils-formation` · demandé par le chef de projet.

Ce document résume l'inventaire et liste les décisions à prendre. Le détail, avec une source par affirmation, est dans le rapport [Outils scolaires et besoins par pays](<reports/Outils scolaires et besoins par pays.md>). Ses neuf fichiers de notes sont dans [research_notes/Outils scolaires et besoins par pays/](<research_notes/Outils scolaires et besoins par pays/>).

**Ce qui est couvert** :
- maternelle, primaire, collège, lycée, supérieur, formation professionnelle et continue ;
- public et privé ;
- Maghreb, Afrique de l'Ouest, centrale, de l'Est et australe, Europe francophone et reste de l'Europe ;
- une grille commune de 18 besoins (A à R).

**Ce qui n'a pas été fait** : aucun entretien, aucun produit essayé. Rien n'est décidé : tout ce qui suit est proposé.

## 1. Ce qu'il faut retenir

1. **L'État prend le dossier de l'élève, l'école garde le reste.** Les plateformes d'État couvrent les inscriptions, les notes et l'accès des familles : Massar, « Vie scolaire » en Tunisie, l'espace parents algérien, PLANETE 3, cartescolaire.cm, KEMIS, ONDE et LSU. Elles s'imposent souvent au privé. Elles ne gèrent ni l'argent, ni le personnel, ni l'emploi du temps, ni les services. L'école les gère avec des espèces, Excel, WhatsApp, l'argent mobile ou un petit éditeur local.
2. **Les pertes documentées viennent d'une donnée saisie sans trace :**
   - élèves fictifs (Kenya) et agents payés à tort (Ghana, Cameroun) ;
   - caisses détournées (Dublin, Pretoria) ;
   - vacataires payés 6 à 12 mois en retard (Sénégal, France) ;
   - bulletins bloqués par une panne (Afrique du Sud, Tunisie) ;
   - comptes volés (ENT en France, PowerSchool).
3. **Le module qui déclenche l'achat change selon le marché :**
   - frais et familles en Afrique et au Maroc ;
   - données pour l'État au Royaume-Uni ;
   - vie scolaire et emploi du temps en France ;
   - preuve d'émargement pour les financeurs dans la formation continue.
4. **La force de Planner : la séance planifiée, puis tenue, visée, reportée ou annulée, est une donnée traçable.** Bien prolongée, elle produit l'état de paie des vacataires, l'export des absences vers l'État et la preuve de présence demandée par les financeurs. Les éditeurs centrés sur la caisse n'ont pas cela.
5. **Ce qui fait rejeter un outil :**
   - le rendre obligatoire avant qu'il soit stable (grèves contre Massar, « Vie scolaire » et la plateforme algérienne en 2025-2026) ;
   - faire payer les familles pour voir les informations de leur enfant (XGEST interdit au Gabon) ;
   - empêcher l'école de partir avec ses données (le conflit autour de SIMS au Royaume-Uni).

## 2. Couverture de Planner par besoin

| Besoin | Planner aujourd'hui |
|---|---|
| C. Emploi du temps, salles, remplacements | **oui**, en avance sur le marché |
| D. Assiduité, appel | en partie (appel par QR code) ; pas d'émargement signé |
| I. Pédagogie | en partie (espace de cours, quiz, Bibliothèque) |
| O. Sécurité, sauvegardes | en partie (une base par école en cours, sauvegardes chiffrées) |
| P. Plusieurs sites | en partie (campus, temps de trajet) ; pas de groupe d'écoles |
| E. Notes, bulletins | prévu (`VSC-04`) |
| F. Finance | prévu (`FIN-01` à `FIN-03`) |
| H. Familles | prévu (`MOB-05`, `ADM-05`) |
| N. Échanges avec l'État | prévu pour Massar seulement (`VSC-05`) |
| A. Admissions et prospects, G. Personnel au-delà des heures, J. Cantine, transport et internat, L. Stages, M. Formation continue, Q. Stocks, R. Pilotage | **absent** |

## 3. Les douze modules proposés

Ces codes ne sont pas utilisés par les seize modules actuels. Le contenu détaillé de chaque module est dans le rapport, section « Douze modules à proposer ».

| Code | Module | Priorité proposée | Construire ou s'intégrer |
|---|---|---|---|
| **COM** | Communication et notifications : application, courriel, SMS, WhatsApp ; plages de silence (20 h-7 h, obligatoire en France) ; compte famille pour plusieurs enfants | indispensable pour vendre | construire les règles ; s'intégrer aux fournisseurs de SMS et de WhatsApp |
| **PAI** | Paiements en ligne et rapprochement : une référence par élève ; argent mobile, carte, CMI ou virement ; rapprochement automatique | indispensable en Afrique subsaharienne, différenciant au Maroc | s'intégrer aux opérateurs ; construire le rapprochement |
| **ETA** | Échanges avec l'État : un connecteur par pays, avec contrôle avant envoi et envoi qu'on peut refaire ; Massar en premier | indispensable pour vendre | construire le cadre ; formats à obtenir des États |
| **INS** | Admissions et prospects : formulaire, pièces, liste d'attente, contrat annuel, réinscription | différenciant | construire |
| **RHP** | Personnel, vacataires et paie : chaîne « prévu, fait, visé, payé », cumul public-privé, état mensuel signé | différenciant | construire ; s'intégrer à la paie locale |
| **FOR** | Formation continue et financeurs : sessions, conventions, émargement signé, attestations, dossiers CSF, FDFP, 3FPT, OPCO | différenciant | construire |
| **DOC** | Documents vérifiables : attestations et diplômes avec QR de vérification | différenciant | construire |
| **STA** | Stages et alternance | plus tard | construire une version légère |
| **SER** | Services annexes : cantine, transport, internat | plus tard | construire une version légère sur FIN |
| **GRP** | Groupes et réseaux d'écoles : vue consolidée | plus tard (différenciant pour les réseaux) | construire |
| **PIL** | Pilotage : encaissé, attendu, en retard ; masse due aux vacataires | différenciant | construire |
| **STK** | Stocks et achats | plus tard | s'intégrer de préférence |

**Ordre proposé** :
- **Étape 4** (pack « École privée ») : COM avant `MOB-05` et `VSC-03` ; ETA conçu comme un cadre général dès `VSC-05` ; une première version de PAI pour le Maroc (virements et CMI).
- **Étape 5** : RHP, puis FOR, DOC et INS, qui forment ensemble le pack de la formation professionnelle et du supérieur privé.
- **Plus tard** : PAI avec l'argent mobile, le hors ligne et les SMS, quand l'Afrique subsaharienne sera visée. PIL, GRP, STA, SER et STK attendent la reprise de la vente.

## 4. Vente et liaison entre modules

- **Six packs à tester** : Emploi du temps (seul) ; École privée (Maghreb) ; École Afrique ; Supérieur privé ; Formation professionnelle et continue ; Groupe. La composition de chacun est dans le rapport.
- **Modèle économique** :
  - un socle commun inclus ;
  - des modules à prix public ;
  - des packs moins chers que la somme de leurs modules ;
  - les consommables au prix unitaire publié (SMS, WhatsApp, paiement, IA, stockage), en crédits prépayés avec une alerte avant épuisement ;
  - l'accès des familles gratuit ;
  - la liaison entre nos propres modules gratuite ; seuls les connecteurs vers d'autres logiciels sont payants, à prix public.
- **Neuf garanties à écrire avant de vendre** :
  1. une seule connexion pour tous les modules, et un compte famille ;
  2. un seul modèle de données ;
  3. la liaison entre modules incluse ;
  4. un export complet, gratuit, à tout moment ;
  5. des connecteurs vers les systèmes d'État ;
  6. des normes ouvertes (ICS, CSV, OneRoster, LTI) ;
  7. des règles de notification ;
  8. des paiements traçables ;
  9. la sécurité et la continuité de service.

## 5. Limites

Le quota de recherches web s'est épuisé chez chacun des neuf chercheurs. Conséquences :
- **avis des magasins d'applications et réseaux sociaux** : presque absents ;
- **plaintes contre les éditeurs marocains et africains** : introuvables ;
- **pratiques du privé africain** (espèces, impayés) : connues surtout par les éditeurs eux-mêmes ;
- **non couverts** : plusieurs pays (Mali, Burkina Faso, Togo, Tchad, Portugal…) et plusieurs produits, dont aSc et Hyperplanning, nos concurrents directs sur l'emploi du temps.

La liste complète est dans la dernière section du rapport.

## 6. Décisions à prendre

**Réponses du chef de projet, le 13 novembre** (écrites dans [decisions.md](../plan/decisions.md)) :
- **I-1** : les douze modules entrent dans le plan. COM, ETA et PAI vont à l'étape 4 ; RHP, FOR, DOC et INS à l'étape 5 ; les autres sont reportés.
- **I-2** : oui. Trois fonctions sont aussi déplacées : FIN-03 devient RHP-01, VSC-05 devient ETA-02, COU-07 devient STA-01.
- **I-3** et **I-5** : oui.
- **I-4** : couvert par le modèle économique du 11 novembre (#169).

| N° | Question | Proposition | Bloque |
|---|---|---|---|
| I-1 | Quels modules proposés entrent dans le plan (`docs/plan/modules/`) ? | COM, ETA et PAI tout de suite, puisqu'ils conditionnent le pack « École privée » ; RHP, FOR, DOC et INS à l'étape 5 ; les autres notés « reporté » | la mise à jour du plan |
| I-2 | COM avant `MOB-05` et `VSC-03`, et ETA conçu comme un cadre dès `VSC-05` ? | oui | l'ordre de l'étape 4 |
| I-3 | Seconde passe de recherche, ciblée sur ce qui manque (avis des magasins d'applications, aSc, Hyperplanning, paiement des frais au Maroc, pays non couverts) ? | oui, dans une session à part, avec un quota neuf et des questions resserrées | la fiabilité des avis d'utilisateurs |
| I-4 | Les règles commerciales (accès des familles gratuit, liaison entre modules gratuite, export garanti, hausse annuelle plafonnée) vont-elles dans `decisions.md` ? | oui, pour qu'elles s'imposent à VEN | VEN-01 |
| I-5 | Faire confirmer par les cinq entretiens de `VEN-02` le module d'achat de chaque marché, avant de construire FIN et COM ? | oui | l'étape 4 |
