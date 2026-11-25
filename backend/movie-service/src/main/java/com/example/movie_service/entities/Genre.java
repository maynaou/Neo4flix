package com.example.movie_service.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.neo4j.core.schema.Node;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Node("Genre")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Genre {

    @Id
    private String name;
}
