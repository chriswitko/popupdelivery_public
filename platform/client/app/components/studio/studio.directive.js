(function() {
  'use strict';

  angular
    .module('app')
    .controller('ModalInstanceCtrl', function ($uibModalInstance) {
      var $ctrl = this;
      $ctrl.ok = function () {
        $uibModalInstance.close();
      };

      $ctrl.cancel = function () {
        $uibModalInstance.dismiss('cancel');
      };
    });

  StudioCtrl.$inject = ['$scope', '$http', '$filter', '$translate', '$sce', '$stateParams', 'Upload', '$uibModal', 'ProductService', 'AppService', 'UserService', '$window', '$state'];

  function StudioCtrl($scope, $http, $filter, $translate, $sce, $stateParams, Upload, $uibModal, ProductService, AppService, UserService, $window, $state) {
    var vm = this;

    vm.$onInit = function() {
      vm.currentPreviewUrl;
      vm.uploadProgress;
      vm.requiredRefresh = false;
      vm.activeTab;

      vm.reloadPreview();
      // vm.getProductsSelectedInApp();
    };

    vm.$onChanges = function (changes) {
      // this.user = changes;
      console.log('changes', changes);
    };    

    vm.reloadPreview = function() {
      vm.currentPreviewUrl = $sce.trustAsResourceUrl('/assets/test4.html?app_id=' + $stateParams.app_id + ($window.popupLang ? '&language=' + $window.popupLang.substring(0, 2) : '') + '&ts=' + new Date().valueOf());
      vm.requiredRefresh = false;
    };

    vm.showConfirmation = function () {
      $uibModal.open({
        animation: true,
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        templateUrl: 'myModalContent.html',
        controller: 'ModalInstanceCtrl',
        controllerAs: '$ctrl',
        size: 'md'
      });
    };

    // vm.getApp = function() {
    //   $http.get('/api/apps/' + $stateParams.app_id)
    //     .then(function(response) {
    //       vm.app = response.data;
          
    //       vm.reloadPreview();
    //     });
    // };

    vm.saveApp = function(options, cb) {
      options = options || {};

      AppService.save(vm.app, {}, function() {
        vm.requiredRefresh = true;
        if(!options.doNotRefresh) {
          vm.reloadPreview();
        }
        if(cb) {
          cb();
        }
      });
    };

    vm.deployApp = function() {
      vm.app.published = true;
      vm.app.activated = true;
      AppService.deploy(vm.app, {}, function() {
        vm.showConfirmation();
      });
    };

    vm.deactivateApp = function() {
      AppService.deactivate(vm.app, {}, function() {
        vm.app.activated = false;
      });
    };

    // vm.getProducts = function(options) {
    //   options = options || {};

    //   if(!options.q) {
    //     return vm.getProductsSelectedInApp(options);
    //   }

    //   ProductService.getAll(options, function(err, data) {
    //     vm.products = data;
    //   });
    // };

    // vm.getProductsSelectedInApp = function(options) {
    //   options = options || {};
    //   options.app_id = $stateParams.app_id;

    //   ProductService.getAllSelectedInApp(options, function(err, data) {
    //     vm.products = data;
    //   });
    // };
  }

  angular
    .module('app')
    .component('studio', {
      restrict: 'E',
      bindings: {
        app: '<'
      },
      templateUrl: 'app/components/studio/studio.html',
      controller: StudioCtrl
      // controllerAs: 'vm',
      // bindToController: true
    });
})();
