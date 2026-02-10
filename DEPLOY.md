# Guide de Déploiement - SokoB2B

Ce guide explique comment déployer l'application SokoB2B en ligne.

## Pré-requis

Avant de commencer, assurez-vous d'avoir :
1.  **Un compte GitHub** (pour héberger votre code).
2.  **Un compte Supabase** (votre base de données est déjà là).
3.  **Un compte sur un hébergeur** (nous recommandons **Render** ou **Railway** pour la simplicité).

---

## Option 1 : Déploiement sur Render (Recommandé)

Render est une plateforme Cloud qui détecte automatiquement les applications Node.js. C'est la méthode la plus simple.

### Étape 1 : Préparer GitHub
1.  Si ce n'est pas déjà fait, poussez votre code sur un nouveau dépôt GitHub public ou privé.

### Étape 2 : Créer le Web Service sur Render
1.  Allez sur [dashboard.render.com](https://dashboard.render.com/).
2.  Cliquez sur **"New +"** puis **"Web Service"**.
3.  Connectez votre compte GitHub et sélectionnez votre dépôt SokoB2B.

### Étape 3 : Configurer le Service
Render va détecter la configuration, mais vérifiez les points suivants :

*   **Name** : `soko-b2b` (ou autre).
*   **Region** : Choisissez la plus proche (ex: Frankfurt).
*   **Branch** : `main` (ou master).
*   **Root Directory** : `.` (laisser vide).
*   **Runtime** : `Node`.
*   **Build Command** : `npm install && npm run build`
    *   *Note : Render lance `npm install` par défaut, mais ajoutez `&& npm run build` pour être sûr que le script de build se lance.*
*   **Start Command** : `npm start`
    *   *Cela correspond à la commande définie dans package.json : `NODE_ENV=production node dist/index.cjs`.*

### Étape 4 : Variables d'Environnement
Dans la section "Environment Variables", ajoutez les clés suivantes (copiez-les depuis votre fichier `.env` ou `.env.example`) :

| Clé | Valeur (Exemple) |
| :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres.[ref]:[pass]@...` (Connection String de Supabase) |
| `SESSION_SECRET` | Une longue chaîne aléatoire (ex: `super-secret-key-123`) |
| `SUPABASE_URL` | `https://[votre-projet].supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5c...` |
| `VITE_SUPABASE_URL` | Identique à `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY`| Identique à `SUPABASE_ANON_KEY` |
| `NODE_ENV` | `production` |

### Étape 5 : Déployer
1.  Cliquez sur **"Create Web Service"**.
2.  Render va cloner, installer les dépendances, construire (`build`) et lancer l'application.
3.  Une fois terminé, vous aurez une URL du type `https://soko-b2b.onrender.com`.

---

## Option 2 : Déploiement sur VPS (Ubuntu / DigitalOcean)

Pour les utilisateurs avancés souhaitant un contrôle total.

### 1. Préparer le serveur
Connectez-vous à votre VPS et installez Node.js 20+ :
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Cloner et Installer
```bash
git clone https://github.com/[votre-user]/[votre-repo].git /var/www/soko-b2b
cd /var/www/soko-b2b
npm install
```

### 3. Construire
```bash
npm run build
```
Cela va créer le dossier `dist/`.

### 4. Configurer l'environnement
Créez un fichier `.env` avec vos variables (voir Option 1).
```bash
nano .env
```

### 5. Lancer avec PM2
Installez PM2 pour garder l'app active :
```bash
sudo npm install -g pm2
pm2 start npm --name "soko-b2b" -- start
pm2 save
pm2 startup
```

### 6. Configurer Nginx (Proxy Inverse)
Installez Nginx et configurez-le pour rediriger le port 80 vers le port 5000 (ou celui défini par votre app).
```bash
sudo apt install nginx
# Configurer /etc/nginx/sites-available/default pour proxy_pass http://localhost:5000
```

---

## Vérifications après déploiement

1.  **Base de données** : Vérifiez que votre application arrive à se connecter à Supabase. Si vous avez des erreurs de connexion, vérifiez que votre VPS/Render est autorisé dans les paramètres réseau de Supabase (généralement "Allow all" ou whitelist IP).
2.  **Migrations** : Si vous utilisez Drizzle, assurez-vous que la base est à jour. Vous pouvez lancer `npm run db:push` depuis votre poste local pour mettre à jour la structure de la BDD si besoin.
