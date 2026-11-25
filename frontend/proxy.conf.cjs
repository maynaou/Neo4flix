const { existsSync } = require('node:fs');
const { join } = require('node:path');

const localEnvironment = join(__dirname, '.env.local');
if (existsSync(localEnvironment)) process.loadEnvFile(localEnvironment);

const tmdbToken = process.env.TMDB_READ_ACCESS_TOKEN?.trim();
const tmdbRoutes =
  /^\/(?:configuration|genre\/movie\/list|movie\/(?:popular|top_rated|\d+(?:\/similar)?)|discover\/movie|search\/movie)$/;

module.exports = {
  '/api/tmdb/**': {
    target: 'https://api.themoviedb.org/3',
    secure: true,
    changeOrigin: true,
    headers: {
      Authorization: tmdbToken ? `Bearer ${tmdbToken}` : '',
      Cookie: '',
    },
    pathRewrite: { '^/api/tmdb': '' },
    bypass(request, response) {
      const route = new URL(request.url, 'http://localhost').pathname.replace(/^\/api\/tmdb/, '');
      const status =
        request.method !== 'GET' ? 405 : !tmdbRoutes.test(route) ? 404 : !tmdbToken ? 503 : 0;
      if (!status) return undefined;
      response.writeHead(status, { 'Content-Type': 'application/json', Allow: 'GET' });
      response.end(JSON.stringify({ message: 'Movie provider unavailable' }));
      return request.url;
    },
  },
  '/api/movies': {
    target: process.env.MOVIE_API_URL || 'http://127.0.0.1:8082',
    secure: false,
    changeOrigin: true,
  },
  '/api/auth': {
    target: process.env.USER_API_URL || 'http://127.0.0.1:8080',
    secure: false,
    changeOrigin: true,
  },
};
