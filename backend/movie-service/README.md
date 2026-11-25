# Movie Service — première étape

Le service expose uniquement `GET /api/movies` sur le port `8082`.
Il retourne une liste de films triée par titre, avec `id`, `title`, `releaseYear`,
`genres` et `actors`. Ce GET est public ; les autres requêtes sont refusées.

## Démarrer et remplir Neo4j

Depuis la racine du projet, démarrer la base existante :

```bash
docker compose -f backend/docker-compose.yml up -d neo4j
```

Puis, dans le même terminal :

```bash
cd backend/movie-service
set -a
source ../.env
set +a
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev -Dmaven.test.skip=true
```

Le profil `dev` charge les 20 films de `src/main/resources/data/movies.json`.
Le chargement est désactivé sans ce profil.

`MovieDataSeeder` crée des contraintes d'unicité pour les identifiants des films
et les noms des genres et acteurs. Il lit le JSON puis exécute une requête
paramétrée avec Neo4jClient :

- `UNWIND $movies` traite les films du JSON un par un.
- `MERGE (movie:Movie {id: movieData.id})` retrouve le film ou le crée.
- `ON CREATE SET` initialise uniquement un film nouvellement créé.
- `FOREACH` parcourt les genres et acteurs de chaque film.
- `MERGE` crée uniquement les nœuds et relations qui manquent.

Relancer l'application ne duplique pas les films ou les relations et ne
supprime aucun utilisateur ou film existant. Les identifiants de démonstration
commencent par `demo-`.

Le graphe utilise `(Movie)-[:HAS_GENRE]->(Genre)` et
`(Actor)-[:ACTED_IN]->(Movie)`. Le constructeur Lombok conserve des listes
vides par défaut grâce à `@Builder.Default`.

Dans `MovieService.getAll()`, `findAll(sort)` lit le catalogue, `stream()`
permet de parcourir la liste, `map(this::toResponse)` transforme les entités
en DTO, et `toList()` construit le tableau retourné par le contrôleur.

## Vérifier le GET

Dans un deuxième terminal :

```bash
curl -i http://localhost:8082/api/movies
```

Pour voir les relations dans Neo4j Browser (`http://localhost:7474`) :

```cypher
MATCH (movie:Movie)
OPTIONAL MATCH (movie)-[genreRelation:HAS_GENRE]->(genre:Genre)
OPTIONAL MATCH (actor:Actor)-[actorRelation:ACTED_IN]->(movie)
RETURN movie, genreRelation, genre, actorRelation, actor
```

Les prochaines étapes du backend sont : détail d'un film, création,
modification, suppression, recherche, pagination, informations complètes,
JWT et autorisations, moyenne des notes via Rating, puis Docker.
La recommandation restera dans le futur Recommendation Service.
