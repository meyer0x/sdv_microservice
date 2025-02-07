# SDV Microservices Architecture

Ce projet implémente une architecture de microservices pour gérer les écoles et les étudiants, avec authentification.

## Architecture

Le système est composé de 4 microservices principaux :

- **Gateway Service** (Port 3000) : Point d'entrée unique de l'API
- **School Service** (Ports 3001/3011) : Gestion des écoles
- **Student Service** (Ports 3002/3012) : Gestion des étudiants
- **Auth Service** (Port 3003) : Authentification et gestion des utilisateurs

### Technologies Utilisées

- **Node.js** avec TypeScript
- **Hono** pour les API REST
- **Consul** pour la découverte de services
- **PostgreSQL** pour les services School et Auth
- **MongoDB** pour le service Student
- **Docker** et Docker Compose pour le déploiement

## Installation

1. Clonez le repository
2. Assurez-vous d'avoir Docker et Docker Compose installés
3. Lancez les services :

```bash
npm run docker-start
```

## Structure des Services

### Gateway Service

Point d'entrée unique qui route les requêtes vers les services appropriés. Implémente :

- Routage des requêtes
- Authentification via middleware
- Load balancing simple (round-robin)

### School Service

Gère les informations des écoles avec :

- CRUD complet des écoles
- Base de données PostgreSQL
- Réplication (2 instances)

### Student Service

Gère les informations des étudiants avec :

- CRUD complet des étudiants
- Base de données MongoDB
- Réplication (2 instances)
- Liaison avec les écoles

### Auth Service

Gère l'authentification avec :

- Inscription/Connexion des utilisateurs
- Génération/Vérification de JWT
- Base de données PostgreSQL partagée

## API Endpoints

### Auth

- `POST /api/auth/register` : Inscription
- `POST /api/auth/login` : Connexion

Il faut donner en body :

```json
{
  "email": "test@test.com",
  "password": "password"
}
```

### Schools

- `GET /api/schools` : Liste des écoles
- `GET /api/schools/:id` : Détails d'une école
- `POST /api/schools` : Création d'une école

### Students

- `GET /api/students` : Liste des étudiants
- `GET /api/students/:id` : Détails d'un étudiant
- `POST /api/students` : Création d'un étudiant

Toutes ces routes sont protégées par le middleware d'authentification.

## Configuration

Les variables d'environnement sont définies dans le `docker-compose.yml` pour chaque service. Les principales configurations incluent :

- Ports des services
- Connexions aux bases de données
- Configuration Consul
- Clé JWT

## Scalabilité

Le projet supporte la scalabilité horizontale :

- Services School et Student répliqués (2 instances chacun)
- Load balancing via Consul
- Bases de données persistantes avec volumes Docker

## Monitoring

- Healthchecks sur tous les services
- Consul UI accessible sur `http://localhost:8500`
- Logs Docker pour chaque service

## Sécurité

- Authentification JWT
- Middleware de protection des routes
- Hachage des mots de passe (bcrypt)
- Isolation des services via Docker networks
