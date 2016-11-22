(function() {
  'use strict';

  angular
    .module('app')
    .component('settings', {
      restrict: 'E',
      templateUrl: 'app/components/settings/settings.html',
      controller: SettingsCtrl
    });

  SettingsCtrl.$inject = ['$http', '$translate'];

  function SettingsCtrl($http, $translate) {
    var vm = this;

    vm.user = {};
    vm.status = '';
    vm.currentTab = 'personal'

    vm.activeTab = function(currentTab) {
      vm.currentTab = currentTab;
    };

    vm.getUser = function() {
      $http.get('/api/users/me')
        .then(function(response) {
          vm.user = response.data;
        });
    };

    vm.saveSettings = function() {
      $http.put('/api/users/me', vm.user)
        .then(function(res) {
          if(res.data.success) {
            vm.status = 'OK';
            alert('done');
          } else {
            alert('Error:' + res.data.message);
          }
        });
    };

    vm.changeLanguage = function() {
      $translate.use(vm.user.language);
      vm.currentLanguage = $translate.proposedLanguage();
    };    

    function init() {
      vm.getUser();
    }

    init();    
  }
})();
