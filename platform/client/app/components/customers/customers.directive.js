(function() {
  'use strict';

  angular
    .module('app')
    .directive('customers', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/customers/customers.html',
        controller: CustomersCtrl,
        controllerAs: 'customersVm',
        bindToController: true
      };
    });

  CustomersCtrl.$inject = [];

  function CustomersCtrl() {
  }
})();
