(function() {
  'use strict';

  angular
    .module('app')
    .directive('navs', function() {
      return {
        restrict: 'E',
        scope: {
          wide: '=?'
        },
        templateUrl: 'app/components/navs/navs.html',
        controller: NavCtrl,
        controllerAs: 'navsVm',
        bindToController: true
      };
    });

  NavCtrl.$inject = ['$http', '$state', '$cookies', '$translate', '$window', 'PUDGlobal'];

  function NavCtrl($http, $state, $cookies, $translate, $window, PUDGlobal) {
    var vm = this;

    vm.$state = $state;

    vm.loggedIn = $cookies.get('access_token') ? true : false;
    vm.status = '';
    vm.currentTab = 'products';
    vm.currentView = 'default';
    vm.currentLang = '';

    vm.availableLangs = PUDGlobal.langs;
    vm.goToSupport = PUDGlobal.goToSupport;

    vm.setCurrentLangName = function() {
      switch(vm.currentLang) {
        case 'en_UK': 
          vm.currentLangName = vm.availableLangs['en_UK'];
          break;
        case 'en_US': 
          vm.currentLangName = vm.availableLangs['en_US'];
          break;
        case 'pl_PL':
          vm.currentLangName = vm.availableLangs['pl_PL'];
          break
        default:
          vm.currentLangName = vm.availableLangs['en_US'];
      }
      return vm.currentLangName;
    };

    vm.site = {
      product_feed: {
        upload_type: 'scheduled'
      }
    };

    vm.activeTab = function(currentTab) {
      vm.currentTab = currentTab;
    };

    vm.activeView = function(currentView) {
      vm.currentView = currentView;
    };

    vm.logout = function() {
      $cookies.put('business_email', '');
      $cookies.put('access_token', '');
      $state.reload();
    };

    vm.changeLanguage = function(code) {
      $translate.use(code).then(function() {
        vm.currentLang = $window.popupLang;
        vm.setCurrentLangName();
        $state.reload();
      });
    };

    function init() {
      vm.currentLang = $window.popupLang;
      vm.setCurrentLangName();
    }

    init();
  }
})();
