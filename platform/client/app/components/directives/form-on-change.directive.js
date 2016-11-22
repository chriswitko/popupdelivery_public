(function() {
  'use strict';

  angular
    .module('app')
    .directive('formOnChange', function($parse, $timeout) {
      return {
        restrict: 'A',
        require: 'form',
        link: function(scope, element, attrs){
          var t_out = null;
          var cb = $parse(attrs.formOnChange);
          element.on("change", function(){
            cb(scope);
          });
          element.bind("keydown keypress", function () {
            if(t_out) {
              $timeout.cancel(t_out);
            }
            t_out = $timeout(function() {
              cb(scope); 
            }, 3000);
          });
        }
      };
    });

})();
