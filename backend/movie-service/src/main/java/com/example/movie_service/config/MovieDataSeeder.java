package com.example.movie_service.config;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
@Profile("dev")
public class MovieDataSeeder implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(MovieDataSeeder.class);

    private final Neo4jClient neo4jClient;
    private final ObjectMapper objectMapper;

    public MovieDataSeeder(Neo4jClient neo4jClient, ObjectMapper objectMapper) {
        this.neo4jClient = neo4jClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        for (String constraint : List.of(
                "CREATE CONSTRAINT movie_id_unique IF NOT EXISTS FOR (movie:Movie) REQUIRE movie.id IS UNIQUE",
                "CREATE CONSTRAINT genre_name_unique IF NOT EXISTS FOR (genre:Genre) REQUIRE genre.name IS UNIQUE",
                "CREATE CONSTRAINT actor_name_unique IF NOT EXISTS FOR (actor:Actor) REQUIRE actor.name IS UNIQUE")) {
            neo4jClient.query(constraint).run();
        }

        List<Map<String, Object>> movies;
        try (InputStream input = new ClassPathResource("data/movies.json").getInputStream()) {
            movies = objectMapper.readValue(input, new TypeReference<List<Map<String, Object>>>() {});
        }

        String query = new ClassPathResource("data/seed-movies.cypher")
                .getContentAsString(StandardCharsets.UTF_8);
        neo4jClient.query(query).bind(movies).to("movies").run();
        LOGGER.info("Catalogue de démonstration initialisé : {} films disponibles dans le jeu de données.",
                movies.size());
    }
}
