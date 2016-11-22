(function() {
  'use strict';

  angular
    .module('app')
    .component('popupsOverview', {
      restrict: 'E',
      templateUrl: 'app/components/app-coupons/popups-overview.html',
      controller: PopupsIndexCtrl
    });

  PopupsIndexCtrl.$inject = ['$http', '$state'];

  function PopupsIndexCtrl($http, $state) {
    console.log('popups overview');
    
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
