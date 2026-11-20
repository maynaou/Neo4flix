package com.example.user_service.repository;

import java.util.Optional;

import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.stereotype.Repository;

import com.example.user_service.entities.Auth;

@Repository
public interface AuthRepository extends Neo4jRepository<Auth, String> {
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    Optional<Auth> findByEmail(String email);
    Optional<Auth> findByUsername(String username);
}
