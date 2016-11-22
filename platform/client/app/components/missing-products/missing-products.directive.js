(function() {
  'use strict';

  angular
    .module('app')
    .directive('missingProducts', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/missing-products/missing-products.html',
        controller: MissingProductsCtrl,
        controllerAs: 'vm',
        bindToController: true
      };
    });

  MissingProductsCtrl.$inject = ['$http'];

  function MissingProductsCtrl($http) {
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
