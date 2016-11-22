(function() {
  'use strict';

  angular
    .module('app')
    .directive('registerAccount', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/register-account/register-account.html',
        controller: RegisterAccountCtrl,
        controllerAs: 'registerAccountVm',
        bindToController: true
      };
    });

  RegisterAccountCtrl.$inject = ['$http', '$state'];

  function RegisterAccountCtrl($http, $state) {
    var vm = this;

    vm.user = {};
    vm.status = '';

    vm.createAccount = function() {
      $http.post('/api/users/create', vm.user)
        .then(function(res) {
          if(res.data.success) {
            vm.status = 'OK';
            $state.go('trial');
          } else {
            alert('Error:' + res.data.message);
          }
        });
    };
  }
})();
