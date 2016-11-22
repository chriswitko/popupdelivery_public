(function() {
  'use strict';

  angular
    .module('app')
    .directive('studioDesign', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/studio/studio-design.html',
        controller: StudioDesignCtrl,
        controllerAs: 'studioDesignVm',
        bindToController: true
      };
    });

  StudioDesignCtrl.$inject = [];

  function StudioDesignCtrl() {
  }
})();
