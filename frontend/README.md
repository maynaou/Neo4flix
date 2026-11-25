# Neo4flix — frontend Angular

Interface française responsive : catalogue, recherche, genres, fiches de films,
watchlist, inscription et connexion. L'identité utilise Cotton `#EDEBDD`,
Cherry Red `#810100`, Maroon `#630000` et Noir Black `#1B1717`, avec Inter
pour les textes et Space Grotesk pour les titres.

## Lancer le frontend

Node.js 22.22.3 minimum dans la branche 22 est requis par Angular 22.

Le catalogue utilise **TMDB par défaut**. Le jeton de lecture est déjà configuré
localement dans `.env.local`. Pour une nouvelle installation, copier
`.env.example` vers `.env.local` et renseigner `TMDB_READ_ACCESS_TOKEN` avec
le **API Read Access Token** fourni par TMDB. La clé API v3 n'est pas nécessaire.
Ne pas ajouter ce jeton dans le code Angular.

```bash
cd frontend
npm install
npm start
```

Ouvrir `http://localhost:4200`. La navigation dans le catalogue TMDB fonctionne
indépendamment des services Spring Boot. Ceux-ci doivent être démarrés séparément
pour la connexion et l'inscription. Aucun fichier du backend n'est modifié.

Le proxy Angular évite les appels entre origines différentes :

| Route          | Service par défaut             |
| -------------- | ------------------------------ |
| `/api/tmdb/**` | `https://api.themoviedb.org/3` |
| `/api/movies`  | `http://127.0.0.1:8082`        |
| `/api/auth`    | `http://127.0.0.1:8080`        |

Pour changer les ports, sans modifier les fichiers Spring Boot :

```bash
MOVIE_API_URL=http://127.0.0.1:8082 USER_API_URL=http://127.0.0.1:8081 npm start
```

Le proxy lit `.env.local` côté Node.js et transmet le jeton à TMDB dans
un en-tête `Authorization: Bearer …`. Le navigateur appelle uniquement
`/api/tmdb/...` et reçoit des données publiques : le jeton ne fait pas partie
du bundle Angular. Seules les routes de lecture utilisées par le catalogue
sont autorisées. `.env.local` est exclu de Git et du contexte Docker.
Redémarrer `npm start` après tout changement du proxy ou de `.env.local`.

## Organisation du code

```text
src/app/
  core/
    api.config.ts       # Endpoints REST, source du catalogue et langue TMDB
    data/               # Enrichissements locaux du catalogue Neo4flix
    interceptors/       # Traitement transversal des requêtes HTTP
    models/             # Contrats TypeScript : films et authentification
    services/           # TMDB, catalogue, session, watchlist et notifications
  features/
    auth/               # Connexion et inscription
    catalog/            # Exploration, genres et filtrage
    movies/             # Fiche d'un film
  shared/               # Icônes et cartes réutilisables
  app.component.ts      # Logique de la navigation principale
  app.component.html    # Template de la navigation principale
  app.routes.ts         # Routes et chargement des pages
```

Chaque grande page sépare son TypeScript de son template HTML. Les modèles
décrivent les données, les services gèrent les appels et l'état, et les pages
coordonnent l'affichage. Le filtrage du catalogue est une fonction pure dans
`features/catalog/catalog.filters.ts`. Les URLs d'API et le timeout sont
définis dans `core/api.config.ts`.

Prettier assure un formatage cohérent :

```bash
npm run format
npm run format:check
```

## Fonctionnement

- `TmdbService` utilise les routes TMDB de configuration des images, genres,
  films populaires, découverte, recherche, détails avec casting et films
  similaires. Les affiches et fonds proviennent de son CDN HTTPS, avec des
  tailles adaptées (`w500` et `w1280`). Les données sont demandées en français.
- `CatalogService` gère le catalogue TMDB paginé, la recherche différée de
  280 ms et l'annulation des requêtes lors d'un changement de filtre.
  Les filtres par genre et année et les tris sont transmis à TMDB.
  La recherche par titre peut être combinée avec une année ; le filtre de
  genre et le tri des recherches s'appliquent aux résultats de chaque page,
  car la route de recherche TMDB ne les prend pas en charge.
  En cas d'erreur,
  l'interface affiche un message et un bouton pour réessayer ; aucun faux
  catalogue n'est substitué à la réponse de l'API.
- Les fiches `/films/tmdb-<id>` chargent leurs propres détails, indépendamment
  de la page du catalogue. Les films apparentés viennent de TMDB : il ne
  s'agit pas de recommandations personnalisées calculées par Neo4j.
- La page `/genres` organise les genres disponibles dans une grille bento.
  Chaque carte ouvre `/genres/<slug>` : le genre reste fixé sur cette page,
  avec les filtres d'année et de tri. Les liens fonctionnent aussi en accès
  direct, dans un nouvel onglet et avec le retour du navigateur.
  Les 19 visuels éditoriaux viennent de films dont le genre a été vérifié
  dans TMDB ; ils sont servis depuis `public/assets/genres`. Le fichier
  `sources.json` conserve les films et les URLs d'origine, sans credentials.
  Le dégradé de marque reste au-dessus de l'image. GSAP anime le survol
  et un volet illustré entre la carte et sa page. Le mouvement réduit
  supprime cette animation et les effets ne se déclenchent pas sur un appui tactile.
- Pour garder les films du backend comme catalogue principal, définir
  `CATALOG_CONFIG.source` à `'neo4flix'` dans `core/api.config.ts`.
  Ce mode utilise le `GET /api/movies` existant et conserve ses identifiants,
  genres et acteurs ; TMDB enrichit les visuels, résumés et durées quand
  une correspondance est trouvée. Les enrichissements éditoriaux et affiches
  locales servent de repli. Le filtrage du catalogue Neo4flix est local.
- Les films TMDB ne sont pas importés dans Neo4j. Aucune synchronisation ni
  modification du backend n'est ajoutée.
- Les polices et les visuels décoratifs de la page d'authentification restent
  dans `public/assets`. Un film sans affiche reçoit un visuel typographique.
- `AuthService` utilise les routes existantes : `POST /api/auth/register`,
  `POST /api/auth/login`, `POST /api/auth/refresh/{token}`. Les tokens sont
  conservés dans `sessionStorage`, et le renouvellement utilise le contrat
  actuel du service utilisateur. La déconnexion efface la session frontend ;
  le backend n'expose pas encore de révocation.
- La watchlist est stockée dans `localStorage`, par utilisateur ou invité,
  sur cet appareil uniquement. Elle n'est pas synchronisée avec Neo4j.
  Un cache de métadonnées publiques conserve les films enregistrés et les
  150 derniers films consultés, pour retrouver la liste après un rechargement
  et en dehors de la page courante du catalogue.
- Le partage d'une fiche utilise le partage natif du navigateur, ou copie
  son lien. Les routes `/films/:id` peuvent être ouvertes directement.
- Les notes, moyennes et recommandations personnalisées restent à raccorder
  quand leurs endpoints seront disponibles.

`Ctrl+K` / `⌘+K` ouvre le champ de recherche. La navigation est utilisable au
clavier et les effets respectent `prefers-reduced-motion`. Aucun test n'est ajouté.

## Animations GSAP

Le bouton à côté du logo replie la barre latérale en une colonne d'icônes de
80 px, ou la rouvre. Le mode ouvert utilise des groupes de liens alignés et un
pied de navigation simplifié. Les liens gardent leurs noms accessibles et
leurs infobulles en mode compact ; le choix est mémorisé sur cet appareil.
`SidebarMotionDirective` utilise une timeline GSAP pour synchroniser la largeur,
le fondu des libellés et la rotation du chevron. Le bouton reste au même endroit
dans les deux modes, et les icônes gardent leur taille réelle. Un clic pendant
la transition repart de sa position courante. Les positions de ScrollTrigger
sont recalculées à la fin du mouvement. Le mouvement réduit est respecté et
la navigation mobile garde sa barre basse.

Les directives de `src/app/shared/motion.directives.ts` ajoutent les mouvements
aux pages existantes, sans changer les appels aux API :

- `nfxPageMotion` anime le fondu d'entrée des pages en 0,4 seconde. Sa clé
  relance le fondu quand une route réutilise le même composant.
- `nfxReveal` fait apparaître les titres, sections et affiches quand ils
  atteignent 93 % de la hauteur de l'écran. Le déplacement est de 24 px sur
  ordinateur et 14 px sur mobile, avec un petit décalage entre les affiches.
- `nfxHeroMotion` anime le changement de film à la une et ajoute une légère
  parallaxe au visuel sur ordinateur. `ScrollTrigger` lie sa position au
  défilement natif ; aucun défilement personnalisé n'est imposé.

`gsap.matchMedia()` désactive les animations JavaScript lorsque l'utilisateur
demande un mouvement réduit. Les éléments restent visibles avant leur
apparition animée ; le focus clavier ou un clic termine immédiatement l'effet.
`media.revert()` nettoie les animations et les déclencheurs quand une directive
disparaît. Les positions de scroll sont recalculées après les changements de
catalogue, de filtres ou de disposition.

## Compiler

```bash
npm run build
```

Le résultat se trouve dans `dist/neo4flix/browser`.

## Conteneur frontend

```bash
docker build -t neo4flix-ui .
docker run --rm --env-file .env.local -p 4200:80 --add-host=host.docker.internal:host-gateway neo4flix-ui
```

Nginx sert Angular et transmet les API aux services existants. Utiliser
`-e MOVIE_API_URL=http://movie-service:8082` et
`-e USER_API_URL=http://user-service:8080` si les conteneurs partagent un réseau.
Le jeton TMDB est injecté dans Nginx au démarrage du conteneur via
`--env-file`, jamais pendant la construction de l'image. La valeur par défaut
du Dockerfile est vide. Éviter de copier les ports locaux de `.env.example`
dans l'environnement Docker : utiliser les valeurs `host.docker.internal`
ci-dessus ou les noms des services sur le réseau Docker.
Cette configuration n'ajoute pas HTTPS : le certificat et la terminaison TLS
appartiennent au déploiement de l'application.
