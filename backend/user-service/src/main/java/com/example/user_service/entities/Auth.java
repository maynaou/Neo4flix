package com.example.user_service.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.support.UUIDStringGenerator;

import com.example.user_service.enums.Role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Node("User")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Auth {
     @Id
     @GeneratedValue(UUIDStringGenerator.class)
     private String id;
     private String username;
     private String email;
     private String password;
     private Role role;
}
