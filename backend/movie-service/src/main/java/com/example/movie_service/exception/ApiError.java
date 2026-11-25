package com.example.movie_service.exception;

public record ApiError(int status, String message) {
}
