(function() {
  'use strict';

  angular
    .module('app')
    .directive('register', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/register/register.html',
        controller: RegisterCtrl,
        controllerAs: 'registerVm',
        bindToController: true
      };
    });

  RegisterCtrl.$inject = ['$http', '$translate', '$cookies', '$state', '$window'];

  function RegisterCtrl($http, $translate, $cookies, $state, $window) {
    var vm = this;

    vm.user = {
      language: $translate.proposedLanguage()
    };
    vm.status = '';

    vm.register = function() {
      $http.post('/api/users/register', vm.user)
        .then(function(res) {
          if(res.data.success) {
            var now = new Date();
            var time = now.getTime();
            time += 3600 * 1000 * 2;
            now.setTime(time);
            $cookies.put('business_email', vm.user.email, {expires: now.toUTCString()});
            $cookies.put('access_token', res.data.token, {expires: now.toUTCString()});

            if($window.Intercom) {
              $window.userData.email = vm.user.email;
              $window.userData.language = vm.user.language;
              $window.Intercom('update', $window.userData);
            }

            vm.status = 'OK';
            $state.go('registerAccount', {}, {reload: true, inherit: false, notify: true});
          } else {
            vm.errorMessage = "main.register.error_101"
            vm.status = 'ERROR';
          }
        });
    };
  }
})();
