(function() {
  'use strict';

  angular
    .module('app')
    .directive('ngAutoFocus', function() {
      return {
        restrict: 'AC',
        link: function(_scope, _element) {
            _element[0].focus();
        }
      };
    });
})();
