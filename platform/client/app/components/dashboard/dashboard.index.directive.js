(function() {
  'use strict';

  angular
    .module('app')
    .directive('dashboardIndex', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/dashboard/dashboard.index.html',
        controller: DashboardIndexCtrl,
        controllerAs: 'dashboardIndexVm',
        bindToController: true
      };
    });

  DashboardIndexCtrl.$inject = [];

  function DashboardIndexCtrl() {
  }
})();
