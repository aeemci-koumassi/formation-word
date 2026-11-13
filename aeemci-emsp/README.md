# 🌙 Plateforme Officielle de Recensement — Section AEEMCI EMSP Abidjan

Plateforme web moderne, responsive et sécurisée pour le recensement des élèves, étudiants, auditeurs, stagiaires et membres de la communauté musulmane de l'**École Multinationale Supérieure des Postes (EMSP) Abidjan**.

---

## 📁 Structure des Fichiers

| Fichier | Rôle & Description |
| :--- | :--- |
| **`index.html`** | **Portail public de recensement** : Formulaire interactif en 5 étapes, compteur dynamique, génération instantanée de la **Carte de Membre Digitale avec QR Code** et recherche de carte existante. |
| **`admin.html`** | **Espace Secrétariat Général & Bureau Exécutif** : Tableau de bord protégé par code PIN, statistiques en direct (Frères, Sœurs, Campus, Hors campus), filtres multicritères, assistant d'envoi WhatsApp individuel (1 par 1), modèles de messages officiels et export Excel (CSV). |
| **`base_donnees.js`** | Module de gestion des données : Génération du matricule officiel (`MEM-EMSP-26-XXXX`), synchronisation Supabase Cloud avec cache local automatique (`localStorage`). |
| **`main.js`** | Contrôleur interactif du portail public : validation du formulaire, génération du QR Code, partage WhatsApp. |
| **`supabase.js`** | Configuration du client Supabase Cloud pour la table `recensement_emsp`. |
| **`schema.sql`** | Script SQL officiel pour créer la table et les politiques de sécurité (RLS) dans Supabase en 1 clic. |

---

## 🔑 Code d'Accès Administrateur (admin.html)

Pour accéder au tableau de bord du Secrétaire Général :
- **Code PIN par défaut :** `emsp2026` *(fonctionne aussi avec `aeemci2026` ou `sg2026`)*.

---

## 🗄️ Étape Rapide : Création de la table dans Supabase

1. Rendez-vous sur votre tableau de bord Supabase : **[dashboard.supabase.com](https://supabase.com/dashboard/project/iktoigkruredsudprndu)**
2. Cliquez sur l'icône **SQL Editor** dans le menu à gauche (icône `>_`).
3. Ouvrez le fichier **`schema.sql`**, copiez l'intégralité du code et collez-le dans le SQL Editor.
4. Cliquez sur **« Run »** (ou faites `Ctrl + Entrée`).

> **Note :** Même sans cette étape, la plateforme fonctionne immédiatement grâce au stockage local sécurisé (`localStorage`) !

---

## 🌐 Déploiement en Ligne (GitHub Pages)

Pour donner accès au lien public à tous les étudiants de l'EMSP :
1. Poussez le dossier `recensement-emsp` sur votre dépôt GitHub.
2. Le lien d'accès sera directement :  
   `https://[votre-utilisateur].github.io/[votre-depot]/recensement-emsp/`

---

*Section AEEMCI EMSP Abidjan · Qu'Allah bénisse vos actions au service de la communauté !*
