# Site de collecte de demandes de prêt

Petite application Node.js autonome :
- vos clients créent un compte (e-mail, date de naissance, pays européen, mot de passe) puis remplissent un formulaire de demande de prêt (nom, prénom, montant, durée) ;
- le montant s'affiche automatiquement dans la devise du pays choisi (€, £, CHF, zł, kr…) ;
- vous consultez toutes les inscriptions et demandes sur `/admin.html` (protégé par un mot de passe), avec le nombre total d'inscrits et un export CSV des e-mails.

## 1. Installer et lancer en local

Il faut [Node.js](https://nodejs.org) version 18 ou plus, installé sur votre ordinateur.

```bash
cd loan-app
npm install
cp .env.example .env
```

Ouvrez `.env` et changez au minimum :
- `ADMIN_PASSWORD` : le mot de passe pour accéder à `/admin.html`.
- `SESSION_SECRET` : une longue chaîne aléatoire quelconque.

Puis lancez :

```bash
npm start
```

Le site est accessible sur `http://localhost:3000`. Pages :
- `/signup.html` — inscription client
- `/login.html` — connexion
- `/form.html` — formulaire de demande (protégé, redirige vers la connexion si besoin)
- `/admin.html` — votre tableau de bord

## 2. Mettre le site en ligne (pour envoyer un vrai lien à vos clients)

Cette appli garde ses données dans un fichier (`data/db.json`) sur le serveur, donc choisissez un hébergeur qui garde vos fichiers entre les requêtes (pas un hébergement "serverless" comme Vercel). Deux options simples et gratuites pour démarrer :

**Railway.app** ou **Render.com** :
1. Créez un compte, créez un nouveau service "Web Service" à partir de ce dossier (ou d'un dépôt GitHub où vous l'aurez déposé).
2. Renseignez les variables d'environnement `ADMIN_PASSWORD` et `SESSION_SECRET` dans les paramètres du service (mêmes valeurs que dans `.env`, sans envoyer le fichier `.env` lui-même).
3. Commande de démarrage : `npm start`.
4. Une fois déployé, vous obtenez une URL du type `https://votre-site.up.railway.app` — c'est ce lien que vous envoyez à vos clients (ex: `https://votre-site.up.railway.app/signup.html`), et `https://votre-site.up.railway.app/admin.html` pour votre tableau de bord.

Sur Render/Railway, pensez à activer un "disque persistant" (persistent volume) pointant sur le dossier `data/` si l'option existe, sinon les données pourraient être perdues lors d'un redéploiement.

## 3. Sécurité et limites à connaître

- Les mots de passe sont chiffrés (bcrypt) avant d'être stockés — vous ne pouvez pas les voir, et l'admin ne les affiche jamais.
- Les données sont stockées dans un simple fichier JSON. Cela convient à un volume modeste (quelques centaines/milliers de clients). Pour un usage à plus grande échelle, il faudra migrer vers une vraie base de données (PostgreSQL par exemple) — je peux vous aider à faire cette migration si besoin.
- Le site tourne en HTTP par défaut en local ; en production (Railway/Render), le HTTPS est fourni automatiquement par l'hébergeur.
- Puisque vous collectez des données personnelles et financières de citoyens européens, pensez à vos obligations RGPD (mentions légales, politique de confidentialité, base légale du traitement, droit à l'effacement) — ce n'est pas couvert par ce code.

## 4. Personnaliser

- Couleurs et police : `public/css/style.css`.
- Liste des pays / devises : `public/js/countries.js`.
- Textes des pages : directement dans les fichiers `.html` du dossier `public/`.
