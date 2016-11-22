(function() {
  'use strict';

  angular
    .module('app')
    .component('studioTabs', {
      bindings: {
        activeTab: '=?'
      },
      restrict: 'E',
      templateUrl: 'app/components/studio/studio-tabs.html',
      controller: StudioTabsCtrl
    });

  StudioTabsCtrl.$inject = [];

  function StudioTabsCtrl() {
    var vm = this;

    vm.activateTab = function(name) {
      vm.activeTab = name;
    };

    vm.$onInit = function() {
      vm.activateTab('design');
    }
  }
})();
