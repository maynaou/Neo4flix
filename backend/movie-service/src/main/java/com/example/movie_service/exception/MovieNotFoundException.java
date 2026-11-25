package com.example.movie_service.exception;

public class MovieNotFoundException extends RuntimeException {

    public MovieNotFoundException(String id) {
        super("Film introuvable : " + id);
    }
}
