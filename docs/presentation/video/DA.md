# Direction artistique de PactePromo (phase 1)

Demande : `../PROMPT_VIDEO_PACTE.md`, phase 1. Code : `src/promo/theme.ts`.

## Références

Les quatre vidéos fournies (ClickUp 4.0, trois vidéos animées d'Asana) ont en commun :
- un fond blanc cassé et beaucoup d'air ;
- des **personnages illustrés en aplats**, élancés, à petite tête ;
- des fragments d'interface qui flottent et glissent ;
- le plan du « trop d'applications » avant la réponse.

PactePromo reprend ces codes avec trois avatars qui **parlent avec leur propre voix**.

## Règles

| Sujet | Règle | Où |
|---|---|---|
| Fond | `#F7F7F5` | `P.fond` |
| Encre | `#0E0F12` | `P.encre` |
| Accent | **`#001861`**, le marine du logo HESTIM et de l'interface | `P.accent` |
| Typographie | **Manrope**, 500 (phrases, sous-titres) et 800 (titres) ; titres de 72 à 104 px en 16:9, jamais plus de 7 mots | `POLICE`, `Titre` |
| Mouvement | Courbe `Easing.bezier(0.22, 1, 0.36, 1)`, ressorts amortis ; chaque scène entre et sort par fondu et translation de 24 à 32 px ; zoom lent de 1,00 à 1,06 sur les captures | `DOUX`, `Plan`, `Navigateur` |
| Captures | Dans une fenêtre arrondie de navigateur ou un téléphone, ombre douce ; un halo assombrit le reste pour montrer la zone clé | `components/Cadre.tsx` |
| Rythme | Scènes de 4 à 12 s, aucun plan sous 3 s | `timing.ts` |
| Sous-titres | Bas centré, 44 px en 16:9, fond `rgba(14,15,18,0.72)`, 7 mots au plus par ligne | `components/SousTitres.tsx` |
| Interdits | Images de banque, emojis, clipart, glitch, texte long, plus de 3 animations à la fois | — |

## Exceptions assumées à la règle des trois couleurs

- **Les avatars** ont des teintes de peau, des cheveux et des vêtements. Les vêtements restent dans la palette : marine, teintes de marine, orange HESTIM pour Salma.
- **Les captures** gardent leurs couleurs réelles.
- **L'emblème HESTIM** garde ses quatre couleurs.
- **Le statut « Reportée »** et l'alerte « Cours reporté » sont en orange `#F26322`, la couleur de ce statut dans l'application. Il n'est jamais employé pour décorer.

## Les avatars (`components/Personnage.tsx`)

| Avatar | Rôle | Voix | Signes |
|---|---|---|---|
| Nadia | Responsable de la scolarité | `fr-FR-DeniseNeural` | voile bleu clair, veste marine, tablette |
| Youssef | Enseignant | `fr-FR-RemyMultilingualNeural` | lunettes, barbe, chemise claire |
| Salma | Étudiante | `fr-FR-VivienneMultilingualNeural` | queue de cheval, sweat orange, téléphone |
| Narrateur | — | `fr-FR-HenriNeural` | pas d'avatar |

Ce qui les anime :
- la bouche suit l'enveloppe sonore de leur réplique, image par image (`voix.json`) ;
- le bras fait un geste pendant qu'ils parlent ;
- leur nom apparaît au-dessus de leur tête ;
- ils clignent des yeux et respirent.

Ce sont des personnages fictifs : aucun ne représente une personne réelle.
