FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:alpine
ENV MOVIE_API_URL=http://host.docker.internal:8082
ENV USER_API_URL=http://host.docker.internal:8080
ENV TMDB_READ_ACCESS_TOKEN=""
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/neo4flix/browser /usr/share/nginx/html
EXPOSE 80
