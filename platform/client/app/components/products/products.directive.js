(function() {
  'use strict';

  angular
    .module('app')
    .directive('products', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/products/products.html',
        controller: ProductsCtrl,
        controllerAs: 'productsVm',
        bindToController: true
      };
    });

  ProductsCtrl.$inject = ['$http'];

  function ProductsCtrl($http) {
    var vm = this;

    vm.user = {};
    vm.status = '';
    vm.currentTab = 'products';
    vm.currentView = 'default';
    vm.site = {
      product_feed: {
        upload_type: 'scheduled'
      }
    };

    vm.activeTab = function(currentTab) {
      vm.currentTab = currentTab;
    };

    vm.activeView = function(currentView) {
      vm.currentView = currentView;
    };

    vm.activeTab = function(currentTab) {
      vm.currentTab = currentTab;
    };

    vm.getUser = function() {
      $http.get('/api/users/me')
        .then(function(response) {
          vm.user = response.data;
        });
    };

    vm.saveFeed = function() {
      $http.put('/api/users/me/feed', vm.user)
        .then(function(res) {
          if(res.data.success) {
            vm.status = 'OK';
            alert('done');
          } else {
            alert('Error:' + res.data.message);
          }
        });
    };

    function init() {
      vm.getUser();
    }

    init();   


  }
})();
