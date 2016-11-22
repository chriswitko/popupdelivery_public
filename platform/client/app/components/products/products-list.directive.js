(function() {
  'use strict';

  angular
    .module('app')
    .directive('productsList', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/products/products-list.html',
        controller: ProductsListCtrl,
        controllerAs: 'productsListVm',
        bindToController: true
      };
    });

  ProductsListCtrl.$inject = ['$scope', '$http', 'ProductService'];

  function ProductsListCtrl($scope, $http, ProductService) {
    var vm = this;

    vm.user = {};

    vm.getProducts = function(options) {
      options = options || {};

      ProductService.getAll(options, function(err, data) {
        vm.products = data;
      });
    };

    vm.getUser = function() {
      $http.get('/api/users/me')
        .then(function(response) {
          vm.user = response.data;
        });
    };

    function init() {
      vm.getUser();
      vm.getProducts();
    }

    init();   
  }
})();
