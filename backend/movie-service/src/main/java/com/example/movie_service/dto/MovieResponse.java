package com.example.movie_service.dto;

import java.util.List;

public record MovieResponse(
        String id,
        String title,
        Integer releaseYear,
        List<String> genres,
        List<String> actors) {
}
