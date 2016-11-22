(function() {
  'use strict';

  angular
    .module('app')
    .service('APIInterceptor', APIInterceptor)
    .service('PUDGlobal', PUDGlobal)
    .service('ProductService', ProductService)
    .service('AppService', AppService)
    .service('UserService', UserService)
    .factory('IsUserPaid', IsUserPaid);

  UserService.$inject = ['$http'];

  AppService.$inject = ['$http'];
  
  ProductService.$inject = ['$http'];

  function UserService($http, PUDGlobal) {
    var service = this;
    var currentUser;

    service.me = function(cb) {
      cb = cb || function() {};
      return $http.get('/api/users/me')
    }
  }

  function AppService($http) {
    var service = this;

    service.findOne = function(id) {
      return $http.get('/api/apps/' + id).then(
        function(data) {
          return data;
        }, function () {
          return false;
        }
      );
    }

    service.deactivate = function(app, options, cb) {
      options = options || {};
      cb = cb || function() {};
      $http.put('/api/apps/' + app._id + '/deactivate')
        .then(function() {
          cb();
        });
    }

    service.save = function(app, options, cb) {
      options = options || {};
      cb = cb || function() {};

      $http.put('/api/apps/' + app._id, app)
        .then(function() {
          cb();
        });      
    }

    service.deploy = function(app, options, cb) {
      options = options || {};
      cb = cb || function() {};

      service.save(app, options, function() {
        $http.get('/api/deploy?app_id=' + app._id)
          .then(function() {
            cb();
          });
      });
    }
  }

  function ProductService($http) {
    var service = this;

    service.getAll = function(options, cb) {
      options.page = options.page || 1;

      var url = '/api/products?page=' + options.page + (options.q ? '&q=' + options.q : '') + (options.limit ? '&limit=' + options.limit : '');
      
      $http.get(url)
        .then(function(response) {
          cb(null, response.data);
        });
    };

    service.getAllSelectedInApp = function(options, cb) {
      options.page = options.page || 1;

      var url = '/api/products/selected_in_app?app_id=' + options.app_id + '&page=' + options.page + (options.q ? '&q=' + options.q : '') + (options.limit ? '&limit=' + options.limit : '');
      
      $http.get(url)
        .then(function(response) {
          cb(null, response.data);
        });
    };
  }

  PUDGlobal.$inject = ['$translate'];

  function PUDGlobal($translate) {
    var service = this;

    service.plans = {};
    service.plans['GBP'] = {monthly: 'pud_basic_monthly_gbp', yearly: 'pud_basic_yearly_gbp', price_per_month: 19.00, price_per_year: 190.00, price_sign: '£', price_per_month_text: '£19', price_per_year_text: '£190'};
    service.plans['EUR'] = {monthly: 'pud_basic_monthly_eur', yearly: 'pud_basic_yearly_eur', price_per_month: 20.00, price_per_year: 200.00, price_sign: '€', price_per_month_text: '€20', price_per_year_text: '€200'};
    service.plans['USD'] = {monthly: 'pud_basic_monthly_usd', yearly: 'pud_basic_yearly_usd', price_per_month: 22.00, price_per_year: 220.00, price_sign: '$', price_per_month_text: '$22', price_per_year_text: '$220'};
    service.plans['PLN'] = {monthly: 'pud_basic_monthly_pln', yearly: 'pud_basic_yearly_pln', price_per_month: 79.00, price_per_year: 790.00, price_sign: 'zł', price_per_month_text: '79 zł', price_per_year_text: '790 zł'};

    service.langs = {};
    service.langs['en_UK'] = {code: 'en_UK', name: 'English (UK)', flag: '/assets/flags/gb.png'};
    service.langs['en_US'] = {code: 'en_US', name: 'English (US)', flag: '/assets/flags/us.png'};
    service.langs['pl_PL'] = {code: 'pl_PL', name: 'Polski', flag: '/assets/flags/pl.png'};


    service.goToSupport = function() {
      var url = 'http://support.popupdelivery.com/hc/';
      var lang = $translate.proposedLanguage() || $translate.use();
      if(lang === 'pl_PL') {
        top.location.href = url + 'pl';
      } else {
        top.location.href = url + 'en-gb';
      }
    };

  }

  APIInterceptor.$inject = ['$rootScope', '$cookies'];
  
  function APIInterceptor($rootScope, $cookies) {
    var service = this;

    service.request = function(config) {
      if(config.url.indexOf('/api/') > -1) {
        config.url = config.url.replace('http://localhost:3001', 'http://localhost:3000');
      }

      var access_token = $cookies.get('access_token') ? $cookies.get('access_token') : null;

      if (access_token) {
        config.headers['x-access-token'] = access_token;
      }
      return config;
    };
    
    service.response = function(response) {
      return response;
    };

    service.responseError = function(response) {
      if (response.status === 401) {
        $rootScope.$broadcast('unauthorized');
      }
      return response;
    };
  }

  IsUserPaid.$inject = ['$q', '$http', '$state'];
  
  function IsUserPaid($q, $http, $state) {

    function verify() {
      return $http.get('/api/users/me')
        .then(function(response) {
          if(response.data.days_left < 0 && !response.data.paid) {
            return $q.reject();
          } else {
            return $q.resolve(true);
          }
        });
    }

    return {
      verify: verify
    }
  }

})();