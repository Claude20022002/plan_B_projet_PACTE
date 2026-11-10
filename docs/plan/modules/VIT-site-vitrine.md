# VIT · Site vitrine public et contact

**Objet** : un site public qui présente **le produit Planner**, pas une école. Les écoles et les utilisateurs doivent pouvoir nous y contacter, comme sur les sites des autres outils (demande du 5 novembre).

**Hors module** : la page d'accueil d'une école dans Planner (`pages/Accueil.jsx`, UIX).

## Ce qui existe

- **Rien en code.** Le site vitrine n'existe pas.
- **Ce que font les concurrents**, d'après l'[étude de marché](../../etude-marche/01-concurrents.md) :
  - une page par fonction et par type d'école ;
  - une démonstration ou un essai bien visible ;
  - un contact par formulaire, téléphone et WhatsApp ;
  - une page « sécurité et données » (loi 09-08, CNDP) ;
  - une FAQ ;
  - une version en arabe.
- **Règle des textes** : ne promettre que ce qui existe ou se démontre ([arguments marketing](../../etude-marche/02-arguments-marketing.md)).
- **Vidéo de promotion** : la PR #53 (`video/promo`) est ouverte ; `kit-video-planner/` contient le guide et les captures.

## Fonctions

| ID | Fonction | Ancien nom | Étape | Taille | Dépend de | État |
|---|---|---|---|---|---|---|
| VIT-01 | Conception : arborescence, messages, maquettes, choix technique (site statique séparé de l'application, rapide, référencé), hébergement en conteneur | SP-1 | libre | M | Q-11 | à faire |
| VIT-02 | Une page et un formulaire de contact : nom, école, ville, effectif, besoin, consentement ; WhatsApp et courriel ; accusé de réception ; demandes enregistrées et suivies | SP-3 réduit | libre | M | VIT-01, textes légaux | à faire |
| VIT-03 | Centre d'aide : guides par rôle, questions fréquentes, vidéos courtes, liens depuis l'aide de l'application | SP-4 | libre | M | VIT-01 | à faire |
| VIT-04 | Page d'état du service et journal des nouveautés de chaque version | SP-5 | libre | S | EXP-05 | à faire |
| VIT-05 | Vitrine complète : fonctions par module, solutions par type d'école, sécurité et données, tarifs ; français, puis arabe et anglais | SP-2 | quand la vente reprend | L | VEN | gelé |

## Critères de « terminé »

- **VIT-02** :
  - un formulaire envoyé crée une demande visible par l'équipe et un accusé de réception ;
  - les données recueillies sont listées dans la politique de confidentialité, relue par le juriste (loi 09-08) ;
  - aucune promesse au-delà de ce qui existe.
- **VIT-04** : la page d'état lit la sonde de supervision. Elle ne lit aucune donnée d'école.

## À trancher avant VIT-02

- Le **nom de domaine** (Q-11). Le nom du produit, lui, est décidé : **Planner**.
- Les **mentions légales** et la **politique de confidentialité**, écrites par le juriste.
- **Pas de prix publié** tant que la vente est mise de côté : la page parle de « nous contacter ».

## Références

- Archives : [plan fusionné, § « Site public »](../../archives/plans/plan-produit/04-plan-fusionne.md)
- [Étude de marché](../../etude-marche/README.md)
