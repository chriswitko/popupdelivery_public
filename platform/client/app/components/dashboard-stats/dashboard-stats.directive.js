(function() {
  'use strict';

  angular
    .module('app')
    .directive('dashboardStats', function() {
      return {
        restrict: 'E',
        scope: {
          wide: '=?'
        },
        templateUrl: 'app/components/dashboard-stats/dashboard-stats.html',
        controller: DashboardStatsCtrl,
        controllerAs: 'dashboardStatsVm',
        bindToController: true
      };
    });

  DashboardStatsCtrl.$inject = ['$http', '$state', '$cookies', '$translate'];

  function DashboardStatsCtrl($http) {
    var vm = this;

    vm.status = '';
    vm.stats = {
      visitors: 0,
      customers: 0
    };

    vm.getStats = function() {
      $http.get('/api/insights/get_user_traffic?summary=get_customers_total')
        .then(function(response) {
          vm.stats.customers = response.data.insights;
        });
      $http.get('/api/insights/get_user_traffic?summary=get_visitors_total')
        .then(function(response) {
          vm.stats.visitors = response.data.insights;
        });
    };

    function init() {
      vm.getStats();
    }

    init();
  }
})();
