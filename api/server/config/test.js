module.exports = {
  NAME: 'test',
  CLIENT_URL: 'http://localhost:' + (process.env.APP_PORT || 3000),
  APP_PORT: 3000,
  DB_HOST: '127.0.0.1',
  DB_PORT: 27017,
  DB_NAME: 'mean-starter-kit-db',
  SECRET: '',
  STRIPE_TOKEN: ''
};
