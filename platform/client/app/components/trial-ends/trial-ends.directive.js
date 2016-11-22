(function() {
  'use strict';

  angular
    .module('app')
    .directive('trialEnds', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/trial-ends/trial-ends.html',
        controller: TrailEndsCtrl,
        controllerAs: 'trialEndsVm',
        bindToController: true
      };
    });

  TrailEndsCtrl.$inject = ['$http'];

  function TrailEndsCtrl($http) {
    var vm = this;

    vm.user = {};
    vm.status = '';

    vm.getUser = function() {
      $http.get('/api/users/me')
        .then(function(response) {
          vm.user = response.data;
        });
    };

    function init() {
      vm.getUser();
    }

    init();  
  }
})();
