(function() {
  'use strict';

  angular
    .module('app')
    .directive('appCoupons', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/app-coupons/app-coupons.html',
        controller: AppCouponsCtrl,
        controllerAs: 'appCouponsVm',
        bindToController: true
      };
    });

  AppCouponsCtrl.$inject = ['$http', '$state'];

  function AppCouponsCtrl($http, $state) {
    var vm = this;

    vm.apps = {};
    vm.status = '';

    vm.getApps = function() {
      $http.get('/api/apps?app_type=coupon')
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

    var init = function() {
      vm.getApps();
    };

    init();
  }
})();
