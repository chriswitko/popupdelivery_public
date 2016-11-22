(function() {
  'use strict';

  angular
    .module('app')
    .directive('productsFeed', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/products/products-feed.html',
        controller: ProductsFeedCtrl,
        controllerAs: 'productsFeedVm',
        bindToController: true
      };
    });

  ProductsFeedCtrl.$inject = ['$http', '$state', 'Upload'];

  function ProductsFeedCtrl($http, $state, Upload) {
    var vm = this;

    vm.user = {};
    vm.status = '';
    vm.currentTab = 'products';
    vm.currentView = 'default';
    vm.uploadProgress = '';
    vm.site = {
      product_feed: {
        upload_type: 'scheduled'
      }
    };

    vm.replaceFile = function() {
      vm.user.feed.url = '';
    };

    vm.onFileSelect = function(files) {
      if (files.length > 0) {
          var filename = files[0].name;
          var type = files[0].type;
          var query = {
              filename: filename,
              type: type
          };
          // Upload.setDefaults({ngfMinSize: 2, ngfMaxSize:20000000})
          $http.post('/api/signing_feed', query)
              .success(function(result) {
                  Upload.upload({
                      url: result.url, //s3Url
                      transformRequest: function(data, headersGetter) {
                          var headers = headersGetter();
                          delete headers.Authorization;
                          return data;
                      },
                      fields: result.fields, //credentials
                      method: 'POST',
                      file: files[0]
                  }).progress(function(evt) {
                      vm.uploadProgress = (parseInt(100.0 * evt.loaded / evt.total)) + '%';
                  }).success(function(data) {
                      // file is uploaded successfully
                      vm.uploadProgress = '';
                      vm.user.feed.url = angular.element(data).find('Location').text();
                      vm.saveFeed(function() {
                        $state.reload();
                      });
                  }).error(function() {
                  });
              })
              .error(function() {
                  // called asynchronously if an error occurs
                  // or server returns response with an error status.
              });
      }
    };

    vm.setManualUpload = function() {
      vm.user.feed.url = '';
    }

    vm.activeTab = function(currentTab) {
      vm.currentTab = currentTab;
    };

    vm.activeView = function(currentView) {
      vm.currentView = currentView;
    };

    vm.activeTab = function(currentTab) {
      vm.currentTab = currentTab;
    };

    vm.getUser = function() {
      $http.get('/api/users/me')
        .then(function(response) {
          vm.user = response.data;
        });
    };

    vm.saveFeed = function(cb) {
      cb = cb || function() {};

      $http.put('/api/users/me/feed', vm.user)
        .then(function(res) {
          if(res.data.success) {
            vm.status = 'OK';
            if(cb) {
              cb();
            }
          }
        });
    };

    function init() {
      vm.getUser();
    }

    init();   


  }
})();
