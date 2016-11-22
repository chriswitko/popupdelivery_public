(function() {
  'use strict';

  angular
    .module('app')
    .component('customersOverview', {
      restrict: 'E',
      templateUrl: 'app/components/customers/customers-overview.html',
      controller: CustomersListCtrl
    });

  CustomersListCtrl.$inject = ['$http', '$cookies', '$window'];

  function CustomersListCtrl($http, $cookies, $window) {
    var vm = this;

    vm.customers = [];
    vm.selectedCustomers = vm.selectedCustomers || [];
    vm.q = '';
    vm.page = 1;
    vm.limit = 25;

    vm.onCustomerChange = function(customer_id) {
      var idx = vm.selectedCustomers.indexOf(customer_id);

      if (idx > -1) {
        vm.selectedCustomers.splice(idx, 1);
      } else {
        vm.selectedCustomers.push(customer_id);
      }
    };

    vm.getCustomers = function() {
      $http.get('/api/customers?page=' + vm.page + (vm.q ? '&q=' + vm.q : ''))
        .then(function(response) {
          vm.customers = response.data;
        });
    };

    vm.removeCustomers = function() {
      $http.post('/api/customers/remove', {customer_ids: vm.selectedCustomers})
        .then(function() {
          vm.getCustomers();
        });
    };

    vm.exportCustomers = function() {
      $window.top.location.href = 'https://api.popupdelivery.com/api/customers/export?token=' + $cookies.get('access_token');
    };

    vm.searchCustomers = function() {
      if(vm.q.length >= 3) {
        vm.page = 1;
        vm.getCustomers();
      } else if (!vm.q.length) {
        vm.page = 1;
        vm.getCustomers();
      }
    };

    vm.nextPage = function() {
      vm.page++;
      vm.getCustomers();
    };

    vm.prevPage = function() {
      vm.page = vm.page - 1;
      vm.getCustomers();
    };

    function init() {
      vm.getCustomers();
    }

    init();   
  }
})();
