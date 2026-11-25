package com.example.movie_service.entities;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Node("Movie")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Movie {

    @Id
    private String id;
    private String title;
    private Integer releaseYear;
    @Version
    private Long version;
    @Builder.Default
    @Relationship(type = "HAS_GENRE", direction = Relationship.Direction.OUTGOING)
    private List<Genre> genres = new ArrayList<>();
    @Builder.Default
    @Relationship(type = "ACTED_IN", direction = Relationship.Direction.INCOMING)
    private List<Actor> actors = new ArrayList<>();
}
