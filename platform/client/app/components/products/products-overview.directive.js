(function() {
  'use strict';

  angular
    .module('app')
    .component('productsOverview',{
      restrict: 'E',
      templateUrl: 'app/components/products/products-overview.html',
      controller: ProductsListCtrl
    });

  ProductsListCtrl.$inject = ['$scope', '$http', 'ProductService'];

  function ProductsListCtrl($scope, $http, ProductService) {
    var vm = this;

    vm.user = {};

    vm.segments = [
      {name: 'All Products', products: 11, views: 0}
    ];

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
