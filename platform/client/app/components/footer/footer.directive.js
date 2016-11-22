(function() {
  'use strict';

  angular
    .module('app')
    .directive('footer', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/footer/footer.html',
        controller: FooterCtrl,
        controllerAs: 'footerVm',
        bindToController: true
      };
    });

  FooterCtrl.$inject = ['$http', '$translate', 'PUDGlobal'];

  function FooterCtrl($http, $translate, PUDGlobal) {
    // console.log('$translate', $translate.fallbackLanguage());
    var vm = this;

    vm.thing = {};
    vm.status = '';
    vm.currentLanguage = $translate.proposedLanguage() || 'en';

    vm.getThings = function() {
      $http.get('/api/things')
        .then(function(response) {
          vm.thingsList = response.data;
        });
    };

    vm.postThing = function() {
      $http.post('/api/things', vm.thing)
        .then(function() {
          vm.status = 'OK';
        });
    };

    vm.changeLanguage = function(code) {
      $translate.use(code);
      vm.currentLanguage = $translate.proposedLanguage();
    };

    vm.goToSupport = PUDGlobal.goToSupport;
  }
})();
