(function() {
  'use strict';

  angular
    .module('app')
    .directive('trial', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/trial/trial.html',
        controller: TrailCtrl,
        controllerAs: 'trialVm',
        bindToController: true
      };
    });

  TrailCtrl.$inject = [];

  function TrailCtrl() {
  }
})();
