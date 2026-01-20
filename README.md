# BrocaWeb API - Backend

Ceci est l'API RESTful et le serveur WebSocket qui alimentent la plateforme BrocaWeb. Le serveur gère l'authentification, la persistance des données, le stockage des images et les communications en temps réel.

---

## 🛠 Stack Technique

* **Runtime :** Node.js
* **Framework :** Express (v5)
* **Base de données :** MongoDB via Mongoose
* **Temps réel :** Socket.io
* **Authentification :** JWT (JSON Web Tokens) & Bcryptjs
* **Gestion des médias :** Cloudinary via Multer
* **Tests :** Jest, Supertest & MongoDB Memory Server
* **Gestionnaire de paquets :** Yarn (4.x)

---

## 🚀 Fonctionnalités

* **Gestion des Objets :** CRUD complet pour les articles du grenier.
* **Authentification Sécurisée :** Inscription, connexion et protection des routes via JWT.
* **Upload d'Images :** Gestion des photos des objets via Cloudinary.
* **Temps Réel :** WebSocket activé pour les mises à jour instantanées ou le chat.
* **Environnement de Test :** Suite de tests automatisés avec base de données en mémoire.

---

## 💻 Installation et Lancement

### Prérequis

* Node.js (LTS)
* Un compte Cloudinary (pour l'upload d'images)
* Une instance MongoDB (locale ou Atlas)

### Étapes

1.  **Cloner le dépôt**
    ```bash
    git clone <URL_DU_REPO>
    cd backendbroca
    ```

2.  **Installer les dépendances**
    ```bash
    yarn install
    ```

3.  **Configuration des variables d'environnement**
    Crée un fichier `.env` à la racine et ajoute :
    ```env
    PORT=5000
    MONGO_URI=ton_lien_mongodb
    JWT_SECRET=ta_cle_secrete
    CLOUDINARY_CLOUD_NAME=ton_nom
    CLOUDINARY_API_KEY=ta_cle_api
    CLOUDINARY_API_SECRET=ton_secret_api
    ```

4.  **Lancer le serveur**
    * **Mode développement (Nodemon) :**
        ```bash
        yarn dev
        ```
    * **Mode production :**
        ```bash
        yarn start
        ```

5.  **Exécuter les tests**
    ```bash
    yarn test
    ```

---

## 📁 Structure du Projet

* `server.js` : Point d'entrée de l'application et configuration Express/Socket.io.
* `models/` : Schémas Mongoose (Utilisateurs, Objets).
* `routes/` : Définition des points de terminaison de l'API.
* `controllers/` : Logique métier de l'application.
* `middleware/` : Authentification et gestion des erreurs.
* `tests/` : Tests unitaires et d'intégration.

---

## 📝 Licence

Ce projet est privé. Toute utilisation sans autorisation est interdite.
