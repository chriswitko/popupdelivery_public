(function() {
  'use strict';

  angular
    .module('app')
    .directive('popupsIndex', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/app-coupons/popups-index.html',
        controller: PopupsIndexCtrl,
        controllerAs: 'popupsIndexVm',
        bindToController: true
      };
    });

  PopupsIndexCtrl.$inject = ['$http', '$state'];

  function PopupsIndexCtrl($http, $state) {
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
