(function() {
  'use strict';

  angular
    .module('app')
    .directive('studioWhere', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/studio/studio-where.html',
        controller: StudioWhereCtrl,
        controllerAs: 'studioWhereVm',
        bindToController: true
      };
    });

  StudioWhereCtrl.$inject = [];

  function StudioWhereCtrl() {
  }
})();
