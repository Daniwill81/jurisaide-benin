# JurisAide Bénin - Résumé du Flux de Travail (Étapes 1-4)

Ce document décrit le parcours utilisateur et l'architecture technique mis en place lors des premières étapes de développement de la plateforme JurisAide Bénin.

## 1. Fondation et Authentification (Étape 1)
L'infrastructure de base a été établie pour garantir la sécurité et la persistance des données.
*   **Parcours Utilisateur** : L'utilisateur peut créer un compte (`/auth/register`) ou se connecter (`/auth/login`).
*   **Technique (Backend)** : 
    *   Mise en place de l'API FastAPI et de la base de données MongoDB (Beanie).
    *   Système de hachage sécurisé des mots de passe utilisant `pwdlib` (Argon2) pour une sécurité maximale.
    *   Génération de clés d'authentification uniques pour maintenir les sessions.
*   **Technique (Frontend)** :
    *   Interface de connexion avec bouton de visibilité du mot de passe (Toggle Eye).
    *   Gestion de l'état d'authentification avec un hook `useAuth` personnalisé et `localStorage`.

## 2. Design et Expérience Utilisateur (Étape 2)
Une esthétique premium a été appliquée pour inspirer confiance et professionnalisme.
*   **Visuels** : Utilisation d'une palette de couleurs indigo/ardoise, de flous de fond (backdrop-blur) et d'animations fluides.
*   **Responsive** : L'interface est entièrement adaptative (Mobile-First).
*   **SEO & PWA** : Configuration des métadonnées Next.js, du fichier `manifest.json` et suppression des erreurs d'hydratation liées aux extensions.

## 3. Le Calculateur Juridique (Étape 3)
Le cœur de métier permettant de transformer la loi béninoise en algorithmes de calcul.
*   **Flux de Calcul** :
    1.  **Saisie** : L'utilisateur entre les détails du contrat (CDI/CDD), la catégorie professionnelle, les dates et le salaire.
    2.  **Moteur de Calcul** : Le backend applique les articles de la Loi 98-004 (Art. 44 pour le licenciement, Art. 42 pour le préavis, Art. 113 pour les congés).
    3.  **Résultats** : Affichage d'un tableau détaillé avec les montants en XOF (FCFA) et les citations légales correspondantes.
*   **Interaction** : Formulaire guidé de type "TurboTax" pour simplifier la saisie complexe.

## 4. Gestion des Dossiers et Dashboard (Étape 4)
Passage d'un outil de calcul ponctuel à une solution SaaS complète de gestion de cas.
*   **Dashboard (`/dashboard`)** :
    *   Vue d'ensemble avec statistiques clés (Nombre de dossiers, calculs effectués).
    *   Accès rapide aux derniers dossiers consultés.
*   **Gestion des Dossiers (`/dossiers`)** :
    *   **Création** : L'utilisateur crée un dossier pour un client spécifique.
    *   **Organisation** : Centralisation de l'historique de travail, du détail du litige et des demandes juridiques.
    *   **Détails** : Une page dédiée par dossier (`/dossiers/[id]`) permet de suivre l'évolution du cas et de consulter les simulations de calcul rattachées.

---
*Ce résumé couvre les bases solides sur lesquelles reposeront les futures fonctionnalités d'IA (RAG et Classification).*
