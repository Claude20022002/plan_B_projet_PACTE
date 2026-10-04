# HESTIM Planner — application mobile étudiant

Expo SDK 54 · expo-router 6 · JavaScript. Android d'abord (APK EAS, puis Play Store).

L'application lit l'emploi du temps et les alertes dans **Planner**, et les supports de cours,
avis de stage et idées de projets dans **StudyLib** (`/biblio`), avec le même jeton de connexion.
La logique des séances, les couleurs et une partie des traductions viennent de `../shared`
(communs avec le site web).

## Écrans

| Route | Écran |
|---|---|
| `connexion` | Connexion (comptes créés par l'école ; réservée aux étudiants) |
| `(onglets)/index` | Tableau : prochaine séance, aujourd'hui, prochain jour, changements |
| `(onglets)/semaine` | Semaine : séances par jour, navigation de semaine en semaine |
| `(onglets)/bibliotheque` | Mes modules et leurs supports, avis de stage, idées de projets |
| `(onglets)/compte` | Profil, langue FR/EN, notifications, déconnexion |
| `alertes` | Alertes (cloche du Tableau, ou en touchant une notification) |
| `module/[code]` | Documents publiés d'un module (lien signé de 5 minutes) |
| `stage/partager` | Partager mon stage (accord explicite de publication) |

## Développement

```bash
npm install
# Adresse de la plateforme vue depuis le téléphone (même réseau Wi-Fi que le PC)
EXPO_PUBLIC_API_URL=http://192.168.1.10 npx expo start
npm test            # Jest (jest-expo) : logique partagée, client HTTP, normalisation
npx expo lint
npx expo-doctor
```

Les notifications push ne fonctionnent pas dans Expo Go sur Android : il faut une version
de développement (`npx eas-cli@latest build --profile development`).

## Construire l'APK et publier

1. Une fois, avec le compte Expo de l'école : `npx eas-cli@latest init` (ajoute l'identifiant
   de projet dans `app.json`, nécessaire aux notifications push), puis activer la
   « sécurité renforcée des push » et créer un jeton d'accès Expo → `EXPO_ACCESS_TOKEN` de Planner.
2. Démonstration (APK installable) : `npx eas-cli@latest build --platform android --profile preview`.
3. Play Store (AAB) : `npx eas-cli@latest build --platform android --profile production`.

L'adresse de production (`EXPO_PUBLIC_API_URL`) est fixée dans `eas.json`.

## Sécurité

- Jetons dans le trousseau sécurisé (`expo-secure-store`, déverrouillage requis, cet appareil seulement).
- HTTPS obligatoire hors développement ; jeton de renouvellement envoyé dans le corps, jamais dans l'URL.
- Un jeton expiré est renouvelé une seule fois ; un renouvellement refusé (vol présumé détecté
  par Planner) ferme la session et efface le cache.
- Déconnexion : désinscription des notifications, révocation de la session Planner, cache effacé.
- Seuls des liens HTTPS (URL signées de la bibliothèque) sont ouverts ; une notification ne mène
  qu'à des écrans internes.
