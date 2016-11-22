(function() {
  'use strict';

  angular
    .module('app')
    .component('studioPilot', {
      restrict: 'E',
      bindings: {
        app: '=',
        onSave: '&'        
      },
      templateUrl: 'app/components/studio/studio-pilot.html',
      controller: StudioPilotCtrl
    });

  StudioPilotCtrl.$inject = ['$http', 'Upload'];

  function StudioPilotCtrl($http, Upload) {
    var vm = this;

    vm.$onInit = function() {
      vm.activeSection = 'design'
    }

    vm.$onChanges = function (changes) {
      // this.user = changes;
      console.log('changes2', changes);
    };    

    vm.onSaveApp = function() {
      // vm.settings.edit = false;
      vm.onSave();
    }

    vm.apps = {
      signup: {
        frame_height: 'h1000',
        sections: {
          enabled: ['design', 'where', 'who', 'when'], // name, design, where, who
          where: {
            fields: ['all', 'hp']
          },
          who: {
            fields: ['all']
          },
          when: {
            fields: ['immediately', 'exit', 'timeout']
          },
          design: {
            fields: ['background', 'theme', 'language', 'font', 'image', 'title', 'summary', 'fields', 'buttons', 'footer', 'width', 'animation'],
            is_open: true
          }
        }, 
      },
      coupon: {
        frame_height: 'h1000',
        sections: {
          enabled: ['name', 'design', 'where', 'who', 'when'], // name, design, where, who
          name: {
            is_open: true
          },
          where: {
            fields: ['all', 'hp', 'custom', 'custom_url']
          },
          who: {
            fields: ['all', 'custom']
          },
          when: {
            fields: ['immediately', 'exit', 'timeout']
          },
          design: {
            fields: ['format', 'background', 'theme', 'language', 'font', 'image', 'title', 'summary', 'fields', 'buttons', 'footer', 'width', 'animation']
          }
        }, 
      },
      reminder: {
        frame_height: 'h500',
        sections: {
          enabled: ['design'], // name, design, where, who
          design: {
            fields: ['theme', 'language', 'position', 'size', 'margin'],
            is_open: true
          }
        }, 
      }
    }

    vm.activeteSection = function(name) {
      vm.activeSection = name;
    };

    vm.selectBg = function(background) {
      vm.app.design.background = background;
      vm.onSaveApp();
    };

    vm.selectTheme = function(theme) {
      vm.app.design.theme = theme;
      vm.onSaveApp();
    };

    vm.removeImage = function() {
      vm.app.design.image_url = '';
      vm.onSaveApp();
    };

    vm.onFileSelect = function(files) {
      if (files.length > 0) {
          var filename = files[0].name;
          var type = files[0].type;
          var query = {
              filename: filename,
              type: type
          };
          $http.post('/api/signing', query)
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
                      vm.app.design.image_url = angular.element(data).find('Location').text();
                      console.log('vm.app.design.image_url', vm.app.design.image_url);
                      vm.onSaveApp();
                  }).error(function() {

                  });
              });
      }
    };
  }
})();
