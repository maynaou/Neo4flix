export interface GenreProfile {
  name: string;
  slug: string;
  description: string;
}

export const genreProfiles: readonly GenreProfile[] = [
  {
    name: 'Science-fiction',
    slug: 'science-fiction',
    description: 'L’imagination n’a pas de frontières.',
  },
  { name: 'Action', slug: 'action', description: 'De l’adrénaline à chaque scène.' },
  {
    name: 'Animation',
    slug: 'animation',
    description: 'Des mondes dessinés pour vous émerveiller.',
  },
  { name: 'Drame', slug: 'drame', description: 'Des histoires qui restent avec vous.' },
  { name: 'Thriller', slug: 'thriller', description: 'Le suspense, jusqu’à la dernière image.' },
  { name: 'Aventure', slug: 'aventure', description: 'Laissez le quotidien derrière vous.' },
  { name: 'Fantastique', slug: 'fantastique', description: 'Un pas de l’autre côté du réel.' },
  { name: 'Crime', slug: 'crime', description: 'Les règles sont faites pour être brisées.' },
  { name: 'Comédie', slug: 'comedie', description: 'Une bonne raison de sourire.' },
  { name: 'Familial', slug: 'familial', description: 'Le cinéma se partage à tout âge.' },
  { name: 'Horreur', slug: 'horreur', description: 'Frissons garantis, lumière facultative.' },
  { name: 'Romance', slug: 'romance', description: 'Les rencontres qui changent tout.' },
  { name: 'Mystère', slug: 'mystere', description: 'Chaque détail peut tout révéler.' },
  { name: 'Histoire', slug: 'histoire', description: 'Le passé prend vie à l’écran.' },
  { name: 'Guerre', slug: 'guerre', description: 'Des destins au cœur des conflits.' },
  { name: 'Musique', slug: 'musique', description: 'Des histoires qui donnent le rythme.' },
  { name: 'Documentaire', slug: 'documentaire', description: 'Le réel a tant à raconter.' },
  { name: 'Téléfilm', slug: 'telefilm', description: 'De belles histoires à la maison.' },
  { name: 'Western', slug: 'western', description: 'L’horizon appartient aux audacieux.' },
];

export function genreImage(profile: GenreProfile): string {
  return `/assets/genres/${profile.slug}.jpg`;
}
