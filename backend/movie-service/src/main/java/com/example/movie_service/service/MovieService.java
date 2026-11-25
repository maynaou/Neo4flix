package com.example.movie_service.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.example.movie_service.dto.MovieResponse;
import com.example.movie_service.entities.Actor;
import com.example.movie_service.entities.Genre;
import com.example.movie_service.entities.Movie;
import com.example.movie_service.repository.MovieRepository;

@Service
public class MovieService {

    private final MovieRepository movieRepository;

    public MovieService(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    public List<MovieResponse> getAll() {
        Sort sort = Sort.by("title").ascending().and(Sort.by("id").ascending());
        return movieRepository.findAll(sort).stream()
                .map(this::toResponse)
                .toList();
    }

    private MovieResponse toResponse(Movie movie) {
        List<String> genres = movie.getGenres().stream()
                .map(Genre::getName)
                .sorted()
                .toList();
        List<String> actors = movie.getActors().stream()
                .map(Actor::getName)
                .sorted()
                .toList();

        return new MovieResponse(
                movie.getId(),
                movie.getTitle(),
                movie.getReleaseYear(),
                genres,
                actors);
    }
}
