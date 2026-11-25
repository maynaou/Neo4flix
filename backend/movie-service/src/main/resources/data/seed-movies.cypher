UNWIND $movies AS movieData
MERGE (movie:Movie {id: movieData.id})
ON CREATE SET movie.title = movieData.title,
              movie.releaseYear = movieData.releaseYear,
              movie.version = 0
FOREACH (genreName IN movieData.genres |
    MERGE (genre:Genre {name: genreName})
    MERGE (movie)-[:HAS_GENRE]->(genre)
)
FOREACH (actorName IN movieData.actors |
    MERGE (actor:Actor {name: actorName})
    MERGE (actor)-[:ACTED_IN]->(movie)
)
