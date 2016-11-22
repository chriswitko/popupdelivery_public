(function() {
  'use strict';

  angular
    .module('app')
    .directive('productsTable', function() {
      return {
        restrict: 'E',
        scope: {
          embedded: '=?',
          products: '=',
          selectedProducts: '=?',
          bgColor: '@',
          search: '=?',
          limit: '@',
          handleSearchQuery: '&'
        },
        templateUrl: 'app/components/products/products-table.html',
        controller: ProductsTableCtrl,
        controllerAs: 'productsTableVm',
        bindToController: true
      };
    });

  ProductsTableCtrl.$inject = ['$http'];

  function ProductsTableCtrl($http) {
    var vm = this;

    vm.handleSearchQuery = vm.handleSearchQuery || function() {};
    vm.products = vm.products || [];
    vm.selectedProducts = vm.selectedProducts || [];
    vm.q = '';
    vm.page = 1;
    vm.limit = vm.limit || 25;

    vm.onProductChange = function(product_id) {
      var idx = vm.selectedProducts.indexOf(product_id);

      if (idx > -1) {
        vm.selectedProducts.splice(idx, 1);
      } else {
        vm.selectedProducts.push(product_id);
      }
    };

    vm.searchProducts = function() {
      if(vm.q.length >= 3) {
        vm.page = 1;
        vm.handleSearchQuery({q: vm.q});
      } else if (!vm.q.length) {
        vm.page = 1;
        vm.handleSearchQuery({q: vm.q});
      }
    };

    vm.nextPage = function() {
      vm.page++;
      vm.getProducts();
    };

    vm.prevPage = function() {
      vm.page = vm.page - 1;
      vm.getProducts();
    };
 
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
