module.exports = {
  NAME: 'production',
  CLIENT_URL: 'https://popupdelivery.com',
  APP_PORT: process.env.APP_PORT || 3000,
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: process.env.DB_PORT || 27017,
  DB_NAME: process.env.DB_NAME || 'popupdelivery',
  SECRET: 'weloveyou2016',  
  STRIPE_TOKEN: '',
  DB_STRING: ''
};
