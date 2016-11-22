(function() {
  'use strict';

  angular
    .module('app')
    .directive('status', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/status/status.html',
        controller: StatusCtrl,
        controllerAs: 'statusVm',
        bindToController: true
      };
    });

  StatusCtrl.$inject = ['$http'];

  function StatusCtrl($http) {
    var vm = this;

    vm.user = {};

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
