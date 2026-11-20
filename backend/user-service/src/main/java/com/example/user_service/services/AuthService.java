package com.example.user_service.services;

import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.user_service.dto.RegisterRequest;
import com.example.user_service.entities.Auth;
import com.example.user_service.enums.Role;
import com.example.user_service.exception.UserAlreadyExistsException;
import com.example.user_service.repository.AuthRepository;

@Service
public class AuthService {

    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthRepository authRepository, PasswordEncoder passwordEncoder) {
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Auth register(RegisterRequest registerRequest) {
        if (authRepository.existsByUsername(registerRequest.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists");
        }
        if (authRepository.existsByEmail(registerRequest.getEmail())) {
            throw new UserAlreadyExistsException("Email already exists");
        }

        Auth user = Auth.builder()
                .id(UUID.randomUUID().toString())
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(Role.USER)
                .build();

        return authRepository.save(user);
    }
}
