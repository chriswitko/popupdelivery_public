(function() {
  'use strict';

  angular
    .module('app')
    .directive('start', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/start/start.html',
        controller: StartCtrl,
        controllerAs: 'startVm',
        bindToController: true
      };
    });

  StartCtrl.$inject = ['$http', '$state'];

  function StartCtrl($http, $state) {
    var vm = this;

    vm.apps = {};
    vm.status = '';
    vm.user = {};

    vm.getUser = function(cb) {
      $http.get('/api/users/me')
        .then(function(response) {
          vm.user = response.data;
          if(cb) {
            cb();
          }
        });
    };    

    vm.getApps = function() {
      $http.get('/api/apps')
        .then(function(response) {
          vm.apps = response.data;
          vm.status = 'LOADED';
        });
    };

    vm.createApp = function(params) {
      $http.post('/api/apps', params)
        .then(function(response) {
          $state.go('studio', {app_id: response.data._id});
        });      
    };

    vm.createAppListReminder = function() {
      var params = {
        app_type: 'signup', 
        'design': {
          template: 'popup.default', 
          font: 'lato', 
          background: 'light', 
          theme: 'black', 
          language: vm.user.language.substring(0, 2), 
          fields: {
            email: true
          }
        }
      };

      vm.createApp(params);
    };

    vm.createAppCoupon = function() {
      var params = {
        app_type: 'coupon', 
        'design': {
          template: 'popup.default', 
          font: 'lato', 
          background: 'light', 
          theme: 'black', 
          language: vm.user.language.substring(0, 2)
        }
      };

      vm.createApp(params);
    };

    vm.createAppReminder = function() {
      var params = {
        app_type: 'reminder', 
        'design': {
          template: 'reminder.default', 
          background: 'light', 
          theme: 'black', 
          language: vm.user.language.substring(0, 2)
        }
      };

      vm.createApp(params);
    };    

    var init = function() {
      vm.getUser(function() {
        vm.getApps();
      });
    };

    init();
  }
})();
