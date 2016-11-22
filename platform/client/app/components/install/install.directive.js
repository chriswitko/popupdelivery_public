(function() {
  'use strict';

  angular
    .module('app')
    .directive('install', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/install/install.html',
        controller: InstallCtrl,
        controllerAs: 'installVm',
        bindToController: true
      };
    });

  InstallCtrl.$inject = ['$http'];

  function InstallCtrl($http) {
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
