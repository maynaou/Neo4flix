package com.example.user_service.services;

import java.util.stream.Collectors;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.example.user_service.config.CustomUserDetails;
import com.example.user_service.dto.AuthResponse;
import com.example.user_service.dto.LoginRequest;
import com.example.user_service.dto.RegisterRequest;
import com.example.user_service.entities.Auth;
import com.example.user_service.entities.RefreshToken;
import com.example.user_service.enums.Role;
import com.example.user_service.exception.UserAlreadyExistsException;
import com.example.user_service.exception.UserNotFoundException;
import com.example.user_service.repository.AuthRepository;
import com.example.user_service.repository.RefreshTokenRepository;

@Service
public class AuthService {

    AuthRepository authRepository;
    PasswordEncoder passwordEncoder;
    AuthenticationManager authenticationManager;
    TokenService tokenService;
    RefreshTokenRepository refreshTokenRepository;

    public AuthService(AuthRepository authRepository, PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            TokenService tokenService, RefreshTokenRepository refreshTokenRepository) {
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public void register(RegisterRequest registerRequest) {
        if (authRepository.existsByUsername(registerRequest.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists");
        }

        if (authRepository.existsByEmail(registerRequest.getEmail())) {
            throw new UserAlreadyExistsException("Email already exists");
        }


        Auth authRegister = Auth.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(Role.USER) // Default role is USER
                .build();

        authRepository.save(authRegister);
    }

    public AuthResponse login(LoginRequest loginRequest) {
          Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(loginRequest.getIdentifier(), loginRequest.getPassword()));
          CustomUserDetails user = (CustomUserDetails) authentication.getPrincipal();
          String scopes = user.getAuthorities().stream().map(auth -> auth.getAuthority()).collect(Collectors.joining(" "));

          String accessToken = tokenService.generateToken(user.getId(), scopes);
          RefreshToken refreshToken = tokenService.createRefreshToken(user.getId());

          return AuthResponse.builder()
                             .accessToken(accessToken)
                             .refreshToken(refreshToken.getToken())
                             .build();
    }

    public AuthResponse refresh(String refreshToken) {
          RefreshToken token = tokenService.verifyToken(refreshToken);
          Auth user = authRepository.findById(token.getUserId()).orElseThrow(() -> new UserNotFoundException("User not found"));
          String scopes = "ROLE_" + user.getRole().toString();
          String accessToken = tokenService.generateToken(token.getUserId(), scopes);
          RefreshToken newRefreshToken = tokenService.createRefreshToken(user.getId());
          refreshTokenRepository.deleteById(token.getId());
          return AuthResponse.builder()
                             .accessToken(accessToken)
                             .refreshToken(newRefreshToken.getToken())
                             .build();
    }

}
