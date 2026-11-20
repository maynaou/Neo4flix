package com.example.user_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
     @NotBlank(message = "Username is required")
     @Size(min = 3, max = 20, message = "Username must be between 3 and 20 characters")
     @Pattern(regexp = "^\\w+$" , message = "Username must contain only letters, numbers, and underscore")
     private String username;
     @NotBlank(message = "Email is required")
     @Email(message = "Email is not valid")
     private String email;
     @NotBlank(message = "Password is required")
     @Size(min = 8, message = "Password must be at least 8 characters")
     private String password;
}
