(function() {
  'use strict';

  angular
    .module('app')
    .component('settingsPersonal', {
      restrict: 'E',
      require: {
        parent: '^^settings'
      },
      bindings: {
        user: '<'
      },
      templateUrl: 'app/components/settings/settings-personal.html',
      controller: SettingsPersonalCtrl
    });

  SettingsPersonalCtrl.$inject = ['$http', '$translate', '$cookies', '$state', '$window'];

  function SettingsPersonalCtrl($http, $translate, $cookies, $state, $window) {
    var vm = this;

    vm.$onInit = function() {
      console.log('parent', vm.parent);
      console.log('vm.user', vm.user);
      vm.currentTab = 'personal'
      vm.token = $cookies.get('access_token');

      vm.updateIntercom();
    };

    vm.verifyVat = function() {
      vm.saveSettings(function() {
        $http.put('/api/users/me/verify_vat')
          .then(function(res) {
            if(res.data.success) {
              // $state.reload();
            } else {
              alert('Error:' + res.data.message);
            }
          });
      });
    };

    vm.saveSettings = function(cb) {
      $http.put('/api/users/me', vm.user)
        .then(function(res) {
          if(res.data.success) {
            vm.updateIntercom(function() {});
          } else {
            alert('Error:' + res.data.message);
          }
          if(cb) {
            cb();
          }
        });
    };

    vm.changeLanguage = function() {
      $translate.use(vm.user.language);
      vm.currentLanguage = $translate.proposedLanguage();
      vm.saveSettings();
    };    

    vm.updateIntercom = function(cb) {
      cb = cb || function() {};

      if($window.Intercom) {
        $window.userData.email = vm.user.email;
        $window.userData.language = vm.user.language;
        $window.Intercom('update', $window.userData);
        cb();
      }
    };
  }
})();
