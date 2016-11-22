(function() {
  'use strict';

  angular
    .module('app')
    .directive('langsBar', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/langs-bar/langs-bar.html',
        controller: LangsBarCtrl,
        controllerAs: 'langsBarVm',
        bindToController: true
      };
    });

  LangsBarCtrl.$inject = ['PUDGlobal', '$translate', '$state'];

  function LangsBarCtrl(PUDGlobal, $translate, $state) {
    var vm = this;
    
    vm.availableLangs = PUDGlobal.langs;

    vm.changeLanguage = function(code) {
      $translate.use(code).then(function() {
        $state.reload();
      });
    };
  }
})();
