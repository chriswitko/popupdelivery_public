(function() {
  'use strict';

  angular
    .module('app')
    .directive('popups', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/app-coupons/popups.html',
        controller: PopupsCtrl,
        controllerAs: 'popupsVm',
        bindToController: true
      };
    });

  PopupsCtrl.$inject = [];

  function PopupsCtrl() {
  }
})();
