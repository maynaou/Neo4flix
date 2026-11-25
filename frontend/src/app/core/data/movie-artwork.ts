import { Movie, MovieArtwork, MovieView } from '../models/movie.model';

const artwork: Record<string, MovieArtwork> = {
  'demo-interstellar': {
    poster: 'interstellar',
    backdrop: 'interstellar',
    duration: '2 h 49',
    description:
      'Alors que la Terre devient inhabitable, un ancien pilote traverse un trou de ver à la recherche d’un nouveau foyer pour l’humanité. Un voyage au-delà des étoiles, porté par un lien qui défie le temps.',
  },
  'demo-inception': {
    poster: 'inception',
    backdrop: 'inception',
    duration: '2 h 28',
    description:
      'Dom Cobb s’introduit dans les rêves pour dérober des secrets. Une dernière mission lui propose l’impossible : implanter une idée. Mais ses propres souvenirs menacent de faire vaciller la frontière entre rêve et réalité.',
  },
  'demo-the-matrix': {
    poster: 'the-matrix',
    backdrop: 'the-matrix',
    duration: '2 h 16',
    description:
      'Un programmeur découvre que le monde qu’il connaît est une simulation. Guidé par Morpheus et Trinity, Neo doit choisir entre une vie rassurante et une vérité qui pourrait tout changer.',
  },
  'demo-the-dark-knight': {
    poster: 'the-dark-knight',
    duration: '2 h 32',
    description:
      'Batman tente de libérer Gotham de ses organisations criminelles. L’arrivée du Joker transforme cette lutte en un affrontement où chaque choix met à l’épreuve les limites de la justice.',
  },
  'demo-the-shawshank-redemption': {
    poster: 'the-shawshank-redemption',
    duration: '2 h 22',
    description:
      'Condamné à la prison à perpétuité, Andy Dufresne trouve auprès d’un autre détenu une amitié et une raison de garder espoir. Une histoire de patience, de dignité et de liberté.',
  },
  'demo-forrest-gump': {
    poster: 'forrest-gump',
    duration: '2 h 22',
    description:
      'Forrest traverse plusieurs décennies de l’histoire américaine avec une simplicité désarmante. Au fil de ses aventures, une chose demeure : son amour pour Jenny.',
  },
  'demo-pulp-fiction': {
    poster: 'pulp-fiction',
    duration: '2 h 34',
    description:
      'À Los Angeles, les chemins de deux tueurs, d’un boxeur et de la femme d’un gangster s’entrecroisent dans une succession de rencontres aussi imprévisibles que mémorables.',
  },
  'demo-the-godfather': {
    poster: 'the-godfather',
    duration: '2 h 55',
    description:
      'Michael Corleone souhaitait rester à l’écart des affaires de sa famille. Une guerre entre clans l’entraîne pourtant au cœur d’un monde où le pouvoir se paie au prix de la loyauté.',
  },
  'demo-fight-club': {
    poster: 'fight-club',
    duration: '2 h 19',
    description:
      'Un employé insomniaque rencontre Tyler Durden. Ensemble, ils fondent un club de combat clandestin qui prend bientôt une dimension qu’aucun des deux ne semble pouvoir maîtriser.',
  },
  'demo-gladiator': {
    poster: 'gladiator',
    duration: '2 h 35',
    description:
      'Trahi par le nouvel empereur, le général Maximus devient gladiateur. Dans l’arène, sa quête de justice le rapproche de l’homme qui lui a tout pris.',
  },
  'demo-titanic': {
    poster: 'titanic',
    duration: '3 h 14',
    description:
      'À bord du Titanic, Rose et Jack se rencontrent malgré les barrières sociales qui les séparent. Leur histoire d’amour se noue alors que le navire avance vers son destin.',
  },
  'demo-avatar': {
    poster: 'avatar',
    duration: '2 h 42',
    description:
      'Sur Pandora, un ancien marine découvre la vie des Na’vi à travers un avatar. Entre sa mission et ses nouveaux liens, il doit choisir quel monde il est prêt à défendre.',
  },
  'demo-jurassic-park': {
    poster: 'jurassic-park',
    duration: '2 h 07',
    description:
      'Un parc insulaire donne vie à des dinosaures recréés grâce à la génétique. Lorsqu’une panne fait tomber les protections, les visiteurs découvrent la puissance d’une nature impossible à dompter.',
  },
  'demo-back-to-the-future': {
    poster: 'back-to-the-future',
    duration: '1 h 56',
    description:
      'Projeté en 1955 par une DeLorean, Marty McFly rencontre ses parents avant leur première histoire d’amour. Pour retrouver son époque, il doit d’abord préserver sa propre existence.',
  },
  'demo-the-fellowship-of-the-ring': {
    poster: 'the-fellowship-of-the-ring',
    duration: '2 h 58',
    description:
      'Frodon hérite d’un anneau dont le pouvoir menace la Terre du Milieu. Une communauté se forme pour l’accompagner dans un voyage où l’amitié devient aussi essentielle que le courage.',
  },
  'demo-harry-potter-philosophers-stone': {
    poster: 'harry-potter',
    duration: '2 h 32',
    description:
      'Harry découvre qu’il est un sorcier et rejoint l’école de Poudlard. Entre nouvelles amitiés, cours de magie et mystères, il entrevoit le secret qui entoure son passé.',
  },
  'demo-toy-story': {
    poster: 'toy-story',
    duration: '1 h 21',
    description:
      'Woody est le jouet préféré d’Andy, jusqu’à l’arrivée de Buzz l’Éclair. Leur rivalité se transforme en aventure lorsqu’ils doivent retrouver ensemble le chemin de la maison.',
  },
  'demo-finding-nemo': {
    poster: 'finding-nemo',
    duration: '1 h 40',
    description:
      'Lorsque Nemo est capturé, son père traverse l’océan pour le retrouver. Avec Dory, une compagne inattendue, il apprend que protéger quelqu’un, c’est aussi lui faire confiance.',
  },
  'demo-spirited-away': {
    poster: 'spirited-away',
    duration: '2 h 05',
    description:
      'Chihiro se retrouve dans un monde peuplé d’esprits où ses parents ont été ensorcelés. Pour les sauver, elle doit trouver sa place dans un établissement de bains aussi merveilleux qu’inquiétant.',
  },
  'demo-parasite': {
    poster: 'parasite',
    duration: '2 h 12',
    description:
      'Une famille précaire s’introduit peu à peu dans la vie d’un foyer aisé. Leurs deux mondes se rapprochent, jusqu’à ce qu’un secret fasse basculer cet équilibre fragile.',
  },
};

export const editorialOrder = [
  'demo-interstellar',
  'demo-inception',
  'demo-the-matrix',
  'demo-fight-club',
  'demo-parasite',
  'demo-spirited-away',
  'demo-the-dark-knight',
  'demo-the-shawshank-redemption',
  'demo-pulp-fiction',
  'demo-the-fellowship-of-the-ring',
  'demo-gladiator',
  'demo-forrest-gump',
];

export function enrichMovie(movie: Movie): MovieView {
  const details = artwork[movie.id] ?? {};
  return {
    ...movie,
    genres: movie.genres ?? [],
    actors: movie.actors ?? [],
    ...details,
    poster: details.poster ? `/assets/posters/${details.poster}.jpg` : undefined,
    backdrop: details.backdrop ? `/assets/backdrops/${details.backdrop}.jpg` : undefined,
  };
}
