(function() {
  'use strict';

  angular
    .module('app')
    .run(run);

  run.$inject = ['$rootScope', '$state', '$cookies', '$http', '$translate', '$location', '$window'];

  function run($rootScope, $state, $cookies, $http, $translate, $location, $window) {

    // $http.defaults.headers.common['x-access-token'] = $cookies.get('access_token');
    
    $rootScope.$on('$stateChangeStart', function(e, to) {
      // $http.defaults.headers.common['x-access-token'] = $cookies.get('access_token');
      // console.log('$http.defaults.headers', $http.defaults.headers);

      if (to.data && to.data.authenticated && !$cookies.get('access_token')) {
        e.preventDefault();
        $state.go('login');
      }

      $window.popupLang = $translate.proposedLanguage() || $translate.use();

      if($window.Intercom) {
        if($cookies.get('business_email')) {
          $window.userData.email = $cookies.get('business_email');
        }

        if($window.intercomSettings) {
          $window.intercomSettings.language_override = $window.popupLang.substring(0, 2) || 'en';
        }

        if($window.userData.email) {
          $window.Intercom('update', $window.userData);
        }
      }
    });
  }
})();
