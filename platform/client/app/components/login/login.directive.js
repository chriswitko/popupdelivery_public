(function() {
  'use strict';

  angular
    .module('app')
    .directive('login', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/login/login.html',
        controller: LoginCtrl,
        controllerAs: 'loginVm',
        bindToController: true
      };
    });

  LoginCtrl.$inject = ['$http', '$cookies', '$state'];

  function LoginCtrl($http, $cookies, $state) {
    var vm = this;

    vm.user = {};
    vm.status = '';

    vm.login = function() {
      $http.post('/api/authenticate', vm.user)
        .then(function(res) {
          if(res.data.success) {
            $cookies.put('access_token', res.data.token);
            var now = new Date();
            var time = now.getTime();
            time += 3600 * 1000 * 2;
            now.setTime(time);
            $cookies.put('business_email', vm.user.email, {expires: now.toUTCString()});
            $cookies.put('access_token', res.data.token, {expires: now.toUTCString()});
            vm.status = 'OK';
            $state.go('home.index', {}, {reload: true, inherit: false, notify: true});
          } else {
            vm.errorMessage = 'main.signin.error_401';
          }
        });
    };
  }
})();
