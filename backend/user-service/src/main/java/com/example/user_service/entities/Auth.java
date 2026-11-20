package com.example.user_service.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.neo4j.core.schema.Node;

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
     private String id;
     private String username;
     private String email;
     private String password;
     private Role role;
}
