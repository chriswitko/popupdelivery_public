(function() {
  'use strict';

  angular
    .module('app')
    .directive('settingsBilling', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/settings/settings-billing.html',
        controller: SettingsBillingCtrl,
        controllerAs: 'settingsBillingVm',
        bindToController: true
      };
    });

  SettingsBillingCtrl.$inject = ['$http', '$state', '$translate', 'StripeCheckout', 'PUDGlobal'];

  function SettingsBillingCtrl($http, $state, $translate, StripeCheckout, PUDGlobal) {
    var vm = this;


    vm.stripeHandler;

    vm.user = {};
    vm.status = '';
    vm.currentTab = 'personal'
    vm.inProgress = false;

    vm.plans = PUDGlobal.plans;

    vm.changeCurrency = function(currency) {
      vm.user.currency = currency;
      vm.defaultCurrency = currency;
      vm.user.currency = currency;
      vm.saveSettings();
    }

    vm.activeTab = function(currentTab) {
      vm.currentTab = currentTab;
    };

    vm.getUser = function() {
      $http.get('/api/users/me')
        .then(function(response) {
          vm.user = response.data;
          vm.defaultCurrency = vm.user.currency || 'USD'
          vm.user.currency = vm.defaultCurrency;
        });
    };

    vm.saveSettings = function(cb) {
      $http.put('/api/users/me', vm.user)
        .then(function(res) {
          if(res.data.success) {
            vm.status = 'OK';
          } else {
            alert('Error:' + res.data.message);
          }
          if(cb) {
            cb();
          }
        });
    };

    vm.unsubscribe = function() {
      vm.inProgress = true;
      $http.put('/api/users/me/unsubscribe')
        .then(function(res) {
          if(res.data.success) {
            vm.status = 'OK';
            $state.reload();
          } else {
            alert('Error:' + res.data.message);
          }
          vm.inProgress = false;
        });
    };

    vm.subscribeNow = function(plan, plan_name, frequency, currency, price) {
      vm.inProgress = true;
      vm.saveSettings(function() {
        var tax = 1 + (vm.user.vat_rate / 100);

        var options = {
          name: 'PopUpDelivery',
          image: 'https://s3.amazonaws.com/popupdelivery/assets/logo_1_200.png',
          description: 'PopUpDelivery' + ' (' + frequency + ')',
          email: vm.user.email || '',
          currency: currency,
          amount: (price * tax) * 100,
          panelLabel: '',
          allowRememberMe: false
        };

        $translate('main.settings.btn_subscribe').then(function(btn_subscribe) {
          options.panelLabel = btn_subscribe;

          var billing = {
            metadata: {
              country: vm.user.country,
              vat_id: vm.user.vat_id,
              customer_valid_vat_number: false,
              price: (price * tax),
              currency: currency,
              user_id: vm.user._id,
              package: plan + '_' + frequency
            },
            plan: plan_name,
            email: vm.user.email
          };

          if(vm.user.paid && vm.user.stripe_subs_id) {
            $http.put('/api/users/me/subscribe', billing)
              .then(function(res) {
                if(res.data.success) {
                  vm.status = 'OK';
                  $state.reload();
                } else {
                  alert('Error:' + res.data.message);
                }
                vm.inProgress = false;
              });
          } else {
            vm.stripeHandler.open(options)
              .then(function(result) {
                if(result[0].id) {
                  billing.stripe_token = result[0].id;
                  $http.put('/api/users/me/subscribe', billing)
                    .then(function(res) {
                      if(res.data.success) {
                        vm.status = 'OK';
                        $state.reload();
                      } else {
                        alert('Error:' + res.data.message);
                      }
                      vm.inProgress = false;
                    });
                } else {
                  alert('Payment Error');
                  vm.inProgress = false;
                }
              },function() {
                // alert("Stripe Checkout closed without making a sale :(");
                vm.inProgress = false;
              });      
          }   


        });

      });
   
    }

    function init() {
      vm.stripeHandler = StripeCheckout.configure({
          token: function() {
            // console.debug("Got stripe token: " + token.id);
          }
      });

      vm.getUser();
    }

    init();    
  }
})();
