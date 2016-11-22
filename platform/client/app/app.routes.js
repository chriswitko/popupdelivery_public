(function() {
  'use strict';

  angular
    .module('app')
    .config(routes);

  routes.$inject = ['$stateProvider', '$urlRouterProvider', 'StripeCheckoutProvider'];

  function routes($stateProvider, $urlRouterProvider, StripeCheckoutProvider) {

    $stateProvider
      .state('en', {
        url: '/en',
        controller: function($translate, $state) {
          $translate.use('en_US').then(function() {
            $state.go('home');
          });            
        }
      })
      .state('pl', {
        url: '/pl',
        controller: function($translate, $state) {
          $translate.use('pl_PL').then(function() {
            $state.go('home');
          });            
        }
      })
      .state('home', {
        abstract: true,
        url: '/',
        template: '<dashboard></dashboard>',
        data: {
          authenticated: true
        },
        resolve: {
          isPaid: function(IsUserPaid) {
            return IsUserPaid.verify();
          }
        }
      })
      .state('home.index', {
        url: '',
        template: '<dashboard-index class="dashboard-index"></dashboard-index>',
        data: {
          authenticated: true
        },
        resolve: {
          isPaid: function(IsUserPaid) {
            return IsUserPaid.verify();
          }
        }
      })
      .state('popups', {
        abstract: true,
        parent: 'home',
        url: 'popups',
        template: '<popups></popups>',
        data: {
          authenticated: true
        },
        resolve: {
          isPaid: function(IsUserPaid) {
            return IsUserPaid.verify();
          }
        }
      })
      .state('popups.overview', {
        url: '',
        parent: 'popups',
        template: '<popups-overview></popups-overview>'
      })
      .state('reminder', {
        abstract: true,
        parent: 'home',
        url: 'reminder',
        template: '<reminder></reminder>',
        data: {
          authenticated: true
        },
        resolve: {
          isPaid: function(IsUserPaid) {
            return IsUserPaid.verify();
          }
        }
      })
      .state('reminder.overview', {
        url: '',
        parent: 'reminder',
        template: '<reminder-overview></reminder-overview>'
      })
      .state('studio', {
        parent: 'home',
        url: 'studio/:app_id',
        template: '<studio app="vm.app"></studio>',
        data: {
          authenticated: true
        },
        resolve: {
          // isPaid: function(IsUserPaid) {
          //   return IsUserPaid.verify();
          // },
          app: function($stateParams, AppService) {
            return AppService.findOne($stateParams.app_id);
          }
        },
        controller: function(isPaid, app, $state) {
          console.log('HELLO', app);
          if(!app.data) {
            $state.go('popups.index');
          }
          this.app = app.data;
        },
        controllerAs: 'vm'
      })
      .state('settings', {
        abstract: true,
        parent: 'home',
        url: 'settings',
        template: '<settings></settings>',
        data: {
          authenticated: true
        }
      })
      .state('settings.personal', {
        url: '',
        parent: 'settings',
        template: '<settings-personal user="vm.me"></settings-personal>',
        resolve: {
          me: function(UserService) {
            return UserService.me();
          }
        },
        controller: function(me) {
          this.me = me.data;
        },
        controllerAs: 'vm'
      })
      .state('settings.billing', {
        url: '/billing',
        parent: 'settings',
        template: '<settings-billing user="vm.me"></settings-billing>',
        resolve: {
          stripe: StripeCheckoutProvider.load,
          me: function(UserService) {
            return UserService.me();
          }
        },
        controller: function(me) {
          this.me = me.data;
        },
        controllerAs: 'vm'
      })
      .state('customers', {
        abstract: true,
        parent: 'home',
        url: 'customers',
        template: '<customers></customers>',
        data: {
          authenticated: true
        },
        resolve: {
          isPaid: function(IsUserPaid) {
            return IsUserPaid.verify();
          }
        }
      })
      .state('customers.overview', {
        url: '',
        template: '<customers-overview></customers-overview>',
        parent: 'customers'
      })
      .state('customers.leads', {
        url: '/leads',
        template: '<customers-list></customers-list>',
        parent: 'customers'
      })
      .state('customers.integrations', {
        url: '/integrations',
        template: '<customers-integrations></customers-integrations>',
        parent: 'customers'
      })
      .state('thankyou', {
        url: '/t/:template_id',
        template: '<thankyou></thankyou>'
      })
      .state('help', {
        url: '/help',
        template: '<help></help>'
      })
      .state('terms', {
        url: '/terms',
        template: '<terms></terms>'
      })
      .state('privacy', {
        url: '/privacy',
        template: '<privacy></privacy>'
      })
      .state('login', {
        url: '/login',
        template: '<login></login>'
      })
      .state('register', {
        url: '/register',
        template: '<register></register>'
      })
      .state('registerAccount', {
        url: '/register/account',
        template: '<register-account></register-account>',
        data: {
          authenticated: true
        }
      })
      .state('trial', {
        url: '/trial',
        template: '<trial></trial>',
        data: {
          authenticated: true
        }
      })
      .state('install', {
        url: '/install',
        template: '<install></install>',
        data: {
          authenticated: true
        }
      })
      .state('start', {
        url: '/start',
        template: '<start></start>',
        data: {
          authenticated: true
        },
        resolve: {
          isPaid: function(IsUserPaid) {
            return IsUserPaid.verify();
          }
        }
      })
      .state('platform', {
        url: '/platform',
        template: '<dashboard></dashboard>',
        data: {
          authenticated: true
        },
        resolve: {
          isPaid: function(IsUserPaid) {
            return IsUserPaid.verify();
          }
        }
      })
      .state('products', {
        url: 'products',
        parent: 'home',
        abstract: true,
        template: '<products></products>',
        data: {
          authenticated: true
        }
      })
      .state('products.overview', {
        url: '',
        parent: 'products',
        template: '<products-overview search="true" selected-products="[]"></products-overview>'
      })
      .state('products.list', {
        url: '/list',
        parent: 'products',
        template: '<products-list search="true" selected-products="[]"></products-list>'
      })
      .state('products.feed', {
        url: '/feed',
        parent: 'products',
        template: '<products-feed></products-feed>'
      })
      ;

    $urlRouterProvider.otherwise('/');
  }
})();
