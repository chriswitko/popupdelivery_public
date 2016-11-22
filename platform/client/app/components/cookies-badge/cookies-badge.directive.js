(function() {
  'use strict';

  angular
    .module('app')
    .directive('cookiesBadge', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/cookies-badge/cookies-badge.html',
        controller: CookiesBadgeCtrl,
        controllerAs: 'cookiesBadgeVm',
        bindToController: true
      };
    });

  CookiesBadgeCtrl.$inject = ['$cookies'];

  function CookiesBadgeCtrl($cookies) {
    var vm = this;
    
    vm.isOpen = $cookies.get('cookies_badge') === '1' ? false : true;

    vm.closeBadge = function() {
      vm.isOpen = false;
      $cookies.put('cookies_badge', '1');
    };
  }
})();
