# Projet : Plateforme des Jeux Pédagogiques HESTIM

Ce projet est une plateforme web modulaire de jeux pédagogiques.

## Architecture

- **Backend** : NestJS + TypeORM
- **Base de données** : MySQL/MariaDB, consultable avec phpMyAdmin
- **Frontend** : React + Vite + Tailwind CSS

## Préparer la base de données avec phpMyAdmin

1. Lancez **XAMPP** ou **WAMP**.
2. Démarrez **Apache** et **MySQL**.
3. Ouvrez phpMyAdmin : <http://localhost/phpmyadmin>
4. Créez une base de données nommée : `jeux_hestim`
5. Par défaut, le backend utilise :
   - serveur : `localhost`
   - port : `3306`
   - utilisateur : `root`
   - mot de passe : vide
   - base : `jeux_hestim`

Vous pouvez modifier ces valeurs avec les variables d’environnement indiquées dans `backend/.env.example`.

## Lancer le backend

```bash
cd backend
npm install
npm run start:dev
```

Le backend démarre sur : <http://localhost:3000>

Les tables sont créées automatiquement par TypeORM quand le backend démarre.

## Lancer le frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend démarre généralement sur : <http://localhost:5173>

## Pages utiles

- Inscription : <http://localhost:5173/>
- Tableau de bord enseignant : <http://localhost:5173/dashboard>
- Accès base de données/phpMyAdmin : <http://localhost:5173/database>

## Remarque importante

Le projet utilisait avant une base SQLite (`backend/database.sqlite`). phpMyAdmin ne peut pas afficher une base SQLite. Le backend a donc été configuré pour utiliser MySQL/MariaDB afin que la base soit visible dans phpMyAdmin.
