(function() {
  'use strict';

  angular
    .module('app')
    .config(config);

  config.$inject = ['$locationProvider', '$translateProvider', 'tmhDynamicLocaleProvider', '$httpProvider', '$compileProvider', 'StripeCheckoutProvider', 'ChartJsProvider'];

  function config($locationProvider, $translateProvider, tmhDynamicLocaleProvider, $httpProvider, $compileProvider, StripeCheckoutProvider, ChartJsProvider) {
    if(!window.location.host.match(/\:300/)) {
      $locationProvider.html5Mode(true);
    }

    $compileProvider.debugInfoEnabled(false);
    
    StripeCheckoutProvider.defaults({
      key: ""
    });

    ChartJsProvider.setOptions({ colors : [ '#1FB6FF', '#7E5BEF', '#FF49DB', '#FF7849', '#13CE66', '#FFC82C', '#E0E6ED'] });

    // Angular perfs best practices
    $httpProvider.useApplyAsync(true);

    $httpProvider.interceptors.push(function ($q, $window, $location) {
      return {
        request: function (config) {
          var url = config.url;

          var API_URL = $window.API_URL;

          // ignore template requests
          if (url.substr(url.length - 5) === '.html' || url.substr(url.length - 5) === '.json' || url.indexOf('s3.amazonaws.com') > -1) {
            return config || $q.when(config);
          }

          config.url = API_URL + config.url;
          return config || $q.when(config);
        }
      }
    });

    $httpProvider.interceptors.push('APIInterceptor');
    $compileProvider.debugInfoEnabled(true);

    // $translateProvider.fallbackLanguage('en');

    $translateProvider
      .useCookieStorage()
      .uniformLanguageTag('bcp47')
      .useSanitizeValueStrategy(null)
      .useStaticFilesLoader({
        prefix: 'i18n/app-locale_',
        suffix: '.json'
      })
      .registerAvailableLanguageKeys(['en_US', 'en_UK', 'pl_PL'], {
        'en_US': 'en_US',
        'en_UK': 'en_UK',
        'pl_PL': 'pl_PL',
        'en*': 'en_US',
        'pl*': 'pl_PL',
        '*': 'en_US'
      })
      .fallbackLanguage('en_US')
      .preferredLanguage('en_US')
      .determinePreferredLanguage();

    // i18n angular-dynamic-locale
    tmhDynamicLocaleProvider.localeLocationPattern('/i18n/angular/angular-locale_{{locale}}.js');
  }
})();
