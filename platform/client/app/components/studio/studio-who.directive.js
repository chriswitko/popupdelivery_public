(function() {
  'use strict';

  angular
    .module('app')
    .directive('studioWho', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/studio/studio-who.html',
        controller: StudioWhoCtrl,
        controllerAs: 'studioWhoVm',
        bindToController: true
      };
    });

  StudioWhoCtrl.$inject = [];

  function StudioWhoCtrl() {
    var vm = this;

    var defaultRule = {
      field: '',
      condition: 'containes'
    };

    vm.rules = [{
      or: [angular.copy(defaultRule)]
    }];

    vm.segment = {
      rule: ''
    };

    vm.addOr = function(and) {
      and.or.push(angular.copy(defaultRule));
    };

    vm.addAnd = function() {
      vm.rules.push({or: [angular.copy(defaultRule)]});
    };

    vm.removeAnd = function(and) {
      vm.rules.splice(and, 1);
    };

    vm.removeOr = function(and, or) {
      and.or.splice(or, 1);
    };

    vm.customerFields = {
      web_sessions: {name: 'web_sessions', title: 'Number of visits', defaultCondition: 'equals', defaultValue: 0},
      last_seen: {name: 'last_seen', title: 'Last seen', defaultCondition: 'equals', defaultValue: 0, optionalComment: 'days ago'},
      city: {name: 'city', title: 'City', defaultCondition: 'containes', defaultValue: ''},
      country: {name: 'country', title: 'Country', defaultCondition: 'containes', defaultValue: ''},
      seen_products: {name: 'seen_products', title: 'Seen products', defaultCondition: 'containes', defaultValue: '', disabledByDefault: true}
    };

    vm.applyDefaults = function(row) {
      row.condition = vm.customerFields[row.field].defaultCondition;
      row.value = vm.customerFields[row.field].defaultValue;
      row.disabledByDefault = vm.customerFields[row.field].disabledByDefault;
    };
  }
})();
