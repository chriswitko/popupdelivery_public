(function() {
  'use strict';

  angular
    .module('app')
    .component('reminderOverview', {
      restrict: 'E',
      templateUrl: 'app/components/app-reminder/reminder-overview.html',
      controller: ReminderOverviewCtrl
    });

  ReminderOverviewCtrl.$inject = ['$http', '$state'];

  function ReminderOverviewCtrl($http, $state) {
    console.log('reminder overview');
    
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
