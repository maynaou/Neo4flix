package com.example.user_service.repository;

import java.util.Optional;

import org.springframework.data.neo4j.repository.Neo4jRepository;

import com.example.user_service.entities.RefreshToken;

public interface RefreshTokenRepository extends Neo4jRepository<RefreshToken, String> {
    Optional<RefreshToken> findByToken(String token);
}
