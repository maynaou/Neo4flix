# Neo4flix — identité de l'application

Ces adaptations s'appliquent à toutes les pages Angular et prennent priorité
sur les exemples génériques du système généré par UI/UX Pro Max.

- Direction : catalogue cinéma, sombre, éditorial et centré sur les affiches.
- Palette de référence : Cotton `#EDEBDD`, Cherry Red `#810100`,
  Maroon `#630000` et Noir Black `#1B1717`.
- Fond : Noir Black ; navigation : `#211A1A`, une nuance chaude du noir.
- Surfaces : `#281D1D` et `#382222` ; bordures : `#513130`.
- Texte principal : Cotton ; secondaire : `#C4B9AE`.
- Actions : Cherry Red avec du texte Cotton ; état actif : Maroon.
- Menus sélectionnés, avatars et panneaux éditoriaux : Maroon.
- Liens, icônes et focus sur fond sombre : Cotton, pour garder un contraste
  lisible. Les survols et séparateurs utilisent des nuances dérivées de la palette.
- Titres et logo : Space Grotesk ; contenu et contrôles : Inter.
- Affiches et grands visuels photographiques ; pas de faux scores ou de
  prétendues recommandations personnalisées.
- Navigation latérale sur ordinateur, navigation basse sur mobile.
- Interactions : navigation réelle, filtres réactifs, carousel manuel,
  watchlist locale et retours d'action accessibles.
- Mouvement GSAP : fondu d'entrée des pages, apparitions progressives au
  défilement et parallaxe discrète du visuel principal sur ordinateur.
- Aucune vidéo ou lecture n'est simulée : le bouton principal ouvre la fiche.
- Les images et polices sont servies localement. Les mouvements sont désactivés
  lorsque `prefers-reduced-motion` est demandé.

Les tokens exportés sont alignés sur cette identité. `src/styles.css` contient
les variables sémantiques de l'interface.
