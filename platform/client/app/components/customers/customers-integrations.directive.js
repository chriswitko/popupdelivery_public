(function() {
  'use strict';

  angular
    .module('app')
    .controller('ModalIntegrationCtrl', function ($uibModalInstance, $http, integration) {
      var $ctrl = this;

      $ctrl.error = false;

      $ctrl.integration = integration;  

      $ctrl.ok = function () {
        $uibModalInstance.close();
      };

      $ctrl.cancel = function () {
        $uibModalInstance.dismiss('cancel');
      };

      $ctrl.enable = function() {
        $ctrl.error = false;

        $ctrl.ping(function(status) {
          if(status) {
            $ctrl.integration.session_id = new Date().getTime().toString();
            $ctrl.integration.status = true;
            $ctrl.integration.active = true;
            $ctrl.ok();
          } else {
            $ctrl.error = true;
          }
        });
      }

      $ctrl.ping = function(cb) {
        $http.post('/api/integrations/' + $ctrl.integration.code + '/ping', $ctrl.integration)
          .then(function(res) {
            if(res.data.success) {
              if(cb) {
                cb(true);
              } else {
                cb(false)
              }
            } else {
              cb(false);
            }
          });
      };

    });

  angular
    .module('app')
    .directive('customersIntegrations', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/customers/customers-integrations.html',
        controller: CustomersIntegrationsCtrl,
        controllerAs: 'customersIntegrationsVm',
        bindToController: true
      };
    });

  CustomersIntegrationsCtrl.$inject = ['$http', '$cookies', '$window', '$uibModal'];

  function CustomersIntegrationsCtrl($http, $cookies, $window, $uibModal) {
    var vm = this;

    vm.user = {};
    vm.availableIntegrations = {};
    
    vm.availableIntegrations.mailchimp = {
      code: 'mailchimp',
      name: 'MailChimp',
      description: 'mail.customers.integrate_mailchimp_desc',
      icon: '/assets/integrations/mailchimp.png',
      client_lib: 'https://github.com/gomfunkel/node-mailchimp',
      active: false,
      enabled: true,
      status: false,
      last_update_at: '',
      session_id: '',
      fields: {
        apiKey: {
          type: 'text',
          value: '',
          label: 'API Key',
          placeholder: '',
          order: 1,
          required: true,
          readonly: false
        },
        listID: {
          type: 'text',
          value: '',
          label: 'List ID',
          placeholder: '',
          order: 2,
          required: true,
          readonly: false
        }
      }
    };

    vm.availableIntegrations.campaignmonitor = {
      code: 'campaignmonitor',
      name: 'Campaign Monitor',
      description: 'Connect to Campaign Monitor to keep your mailing lists in sync',
      icon: '/assets/integrations/campaignmonitor.png',
      client_lib: 'https://github.com/nufyoot/createsend-node',
      active: false,
      enabled: true,
      status: false,
      last_update_at: '',
      session_id: '',
      fields: {
        apiKey: {
          type: 'text',
          value: '',
          label: 'API Key',
          placeholder: '',
          order: 1,
          required: true,
          readonly: false
        },     
        listID: {
          type: 'text',
          value: '',
          label: 'List ID',
          placeholder: '',
          order: 1,
          required: true,
          readonly: false
        }
      }
    };

    vm.availableIntegrations.freshmail = {
      code: 'freshmail',
      name: 'FreshMail',
      description: 'Connect to FreshMail to keep your mailing lists in sync',
      icon: '/assets/integrations/freshmail.png',
      client_lib: 'http://10s.pl/post/How_to_implement_Freshmail_form_on_your_website/',
      active: false,
      enabled: true,
      status: false,
      last_update_at: '',
      session_id: '',
      fields: {
        listID: {
          type: 'text',
          value: '',
          label: 'List ID',
          placeholder: '',
          order: 1,
          required: true,
          readonly: false
        }
      }
    };

    vm.availableIntegrations.getresponse = {
      code: 'getresponse',
      name: 'GetResponse',
      description: 'Connect to GetResponse to keep your mailing lists in sync',
      icon: '/assets/integrations/getresponse.png',
      client_lib: 'https://github.com/dogusev/getresponse-nodejs-api',
      active: false,
      enabled: true,
      status: false,
      last_update_at: '',
      session_id: '',
      fields: {
        apiKey: {
          type: 'text',
          value: '',
          label: 'API Key',
          placeholder: '',
          order: 1,
          required: true,
          readonly: false
        },
        campaignID: {
          type: 'text',
          value: '',
          label: 'Campaign ID',
          placeholder: '',
          order: 2,
          required: true,
          readonly: false
        }
      }
    };    

    vm.enableIntegration = function (integration) {
      var modalInstance = $uibModal.open({
        animation: true,
        resolve: {
          integration: function() {
            return integration;
          }
        },
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        templateUrl: 'integrationModal.html',
        controller: 'ModalIntegrationCtrl',
        controllerAs: '$ctrl',
        size: 'md'
      });

      modalInstance.result.then(function () {
        vm.saveIntegrations();
      }, function () {
      });      
    };    

    vm.disableIntegration = function(integration) {
      integration.active = false;
      integration.session_id = '';
      vm.saveIntegrations();
    };

    vm.saveIntegrations = function(cb) {
      cb = cb || function() {};

      vm.user.integrations = vm.availableIntegrations;

      $http.put('/api/users/me/integrations', vm.user)
        .then(function(res) {
          if(res.data.success) {
            if(cb) {
              cb();
            }
          }
        });
    };    

    vm.getUser = function(cb) {
      $http.get('/api/users/me')
        .then(function(response) {
          vm.user = response.data;
          cb();
        });
    };

    function init() {
      vm.enabledIntegrations = {};
      angular.copy(vm.availableIntegrations, vm.enabledIntegrations);

      vm.getUser(function() {
        angular.merge(vm.availableIntegrations, vm.user.integrations);
        for(var integration in vm.enabledIntegrations) {
          if(!vm.availableIntegrations[integration].active) {
            vm.availableIntegrations[integration].enabled = vm.enabledIntegrations[integration].enabled;
            vm.availableIntegrations[integration].fields = vm.enabledIntegrations[integration].fields;
          }
        }
      });
    }

    init();      
  }
})();
