package com.example.user_service.config;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.user_service.entities.Auth;
import com.example.user_service.repository.AuthRepository;

@Service
public class UserDetailService implements UserDetailsService {
    
    private AuthRepository authRepository;

    public UserDetailService(AuthRepository authRepository) {
         this.authRepository = authRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String identifier) {
          Auth user = authRepository.findByEmail(identifier)
            .or(() -> authRepository.findByUsername(identifier))
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
          return new CustomUserDetails(user);
    }
}
