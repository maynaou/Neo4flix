package com.example.user_service.web;

import com.example.user_service.config.CustomUserDetails;
import com.example.user_service.dto.AuthResponse;
import com.example.user_service.dto.RegisterRequest;
import com.example.user_service.entities.Auth;
import com.example.user_service.services.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody @Valid RegisterRequest registerRequest) {
        return ResponseEntity.status(201).body(toResponse(authService.register(registerRequest)));
    }

    @PostMapping("/login")
    public AuthResponse login(@AuthenticationPrincipal CustomUserDetails user) {
        return toResponse(user);
    }

    private AuthResponse toResponse(Auth user) {
        return new AuthResponse(user.getUsername(), user.getEmail(), user.getRole().name());
    }

    private AuthResponse toResponse(CustomUserDetails user) {
        return toResponse(user.getUser());
    }
}