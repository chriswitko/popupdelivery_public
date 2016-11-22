(function() {
  'use strict';

  angular
    .module('app')
    .directive('dashboardNav', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/dashboard/dashboard.nav.html',
        controller: DashboardNavCtrl,
        controllerAs: 'dashboardNavVm',
        bindToController: true
      };
    });

  DashboardNavCtrl.$inject = [];

  function DashboardNavCtrl() {
  }
})();
