package com.example.movie_service.repository;

import org.springframework.data.neo4j.repository.Neo4jRepository;

import com.example.movie_service.entities.Movie;

public interface MovieRepository extends Neo4jRepository<Movie, String> {
}
