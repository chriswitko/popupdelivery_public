(function() {
  'use strict';

  angular
    .module('app')
    .directive('taglineGetStarted', function() {
      return {
        restrict: 'E',
        scope: {
          textClass: '@'
        },
        templateUrl: 'app/components/tagline-get-started/tagline-get-started.html',
        controller: TaglineGetStartedCtrl,
        controllerAs: 'taglineGetStartedVm',
        bindToController: true
      };
    });

  TaglineGetStartedCtrl.$inject = ['$http'];

  function TaglineGetStartedCtrl($http) {
    var vm = this;

    vm.thing = {};
    vm.status = '';

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
  }
})();
