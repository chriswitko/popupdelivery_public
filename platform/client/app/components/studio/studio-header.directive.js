(function() {
  'use strict';

  StudioHeaderCtrl.$inject = [];

  function StudioHeaderCtrl() {
    var vm = this;

    vm.$onInit = function() {
      vm.settings = {edit: false}  
    }

    vm.onSaveApp = function() {
      vm.settings.edit = false;
      vm.onSave();
    }

    vm.onDeployApp = function() {
      vm.onDeploy();
    }

    vm.onDeactivateApp = function() {
      vm.onDeactivate();
    }
  }

  angular
    .module('app')
    .component('studioHeader', {
      restrict: 'E',
      bindings: {
        app: '=',
        onSave: '&',
        onDeploy: '&',
        onDeactivate: '&'
      },
      templateUrl: 'app/components/studio/studio-header.html',
      controller: StudioHeaderCtrl
      // controllerAs: 'studioHeaderVm',
      // bindToController: true
    });  
})();
