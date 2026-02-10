# SokoB2B - E-commerce B2B pour l'Afrique de l'Ouest

SokoB2B est une plateforme de marché B2B conçue pour connecter les commerçants de proximité (boutiques) aux grossistes et fabricants en Afrique de l'Ouest.

![SokoB2B Hero](client/public/images/hero-marketplace.png)

## 🚀 Fonctionnalités Clés

*   **Marketplace B2B** : Catalogue complet de produits avec prix de gros.
*   **Gestion Multi-Rôles** : Interfaces distinctes pour Commerçants, Fournisseurs et Admin.
*   **Paiements Sécurisés** : Intégration Mobile Money (Orange, MTN, Wave) et paiement à la livraison.
*   **Logistique Intégrée** : Suivi des commandes et gestion des livraisons.
*   **Portefeuille Numérique** : Gestion des fonds et transactions directement sur la plateforme.
*   **Statistiques & Rapports** : Tableaux de bord détaillés pour suivre l'activité.

## 🛠️ Stack Technique

*   **Frontend** : React, Vite, TailwindCSS, Shadcn UI.
*   **Backend** : Node.js (Express), TypeScript.
*   **Base de Données** : PostgreSQL (via Supabase).
*   **ORM** : Drizzle ORM.
*   **Authentification** : Passport.js / Sessions.

## 📦 Installation

1.  **Cloner le dépôt** :
    ```bash
    git clone https://github.com/votre-user/sokob2b.git
    cd sokob2b
    ```

2.  **Installer les dépendances** :
    ```bash
    npm install
    ```

3.  **Configurer l'environnement** :
    Copiez le fichier `.env.example` en `.env` et remplissez les variables :
    ```bash
    cp .env.example .env
    ```
    *Vous devez avoir un projet Supabase configuré.*

4.  **Lancer le développement** :
    ```bash
    npm run dev
    ```

## 🚢 Déploiement

Voir le guide complet de déploiement : [DEPLOY.md](DEPLOY.md).

## 📄 Licence

Ce projet est sous licence MIT.
