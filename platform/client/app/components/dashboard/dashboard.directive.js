(function() {
  'use strict';

  angular
    .module('app')
    .directive('dashboard', function() {
      return {
        restrict: 'E',
        templateUrl: 'app/components/dashboard/dashboard.html',
        controller: DashboardCtrl,
        controllerAs: 'dashboardVm',
        bindToController: true
      };
    });

  DashboardCtrl.$inject = ['$http', '$window', '$cookies', '$state'];

  function DashboardCtrl($http, $window, $cookies, $state) {
    var vm = this;

    vm.user = {};

    vm.override = [
      {fill: true, borderWidth: 1},
      {fill: true, borderWidth: 1},
      {fill: true, borderWidth: 1}
    ];
    vm.options = { legend: { display: true } };
    vm.labels = [];
    vm.series = ['Product Reminder', 'Product Popup', 'Welcome Popup'];

    vm.data = [
      [],
      [],
      []
    ];

    vm.stats = {
      reminder: [],
      coupons: [],
      welcoms: []
    };

    vm.popularProducts = [];

    vm.settingsNavHtml = '<ul class="list-unstyled list-popup-menu"><li><a href ng-click="dashboardVm.logout()">Logout</a></li></ul>';
    vm.dynamicPopover = {
      content: 'Hello, World!',
      templateUrl: 'myPopoverTemplate.html',
      title: 'Title'
    };

    vm.logout = function() {
      $cookies.put('business_email', '');
      $cookies.put('access_token', '');
      $state.reload();
    };

    vm.getPopularProducts = function() {
      $http.get('/api/insights/get_product_traffic')
        .then(function(response) {
          vm.popularProducts = response.data.insights;
        });
    };

    vm.getStats = function() {
      $http.get('/api/apps')
        .then(function(response) {
          vm.apps = response.data;

          var app_reminder_ids = [];
          var app_coupon_ids = [];
          var app_signup_ids = [];

          if(vm.apps.reminder) {
            vm.apps.reminder.forEach(function(app) {
              app_reminder_ids.push(app._id);
            });
          }

          if(vm.apps.coupon) {
            vm.apps.coupon.forEach(function(app) {
              app_coupon_ids.push(app._id);
            });
          }

          if(vm.apps.signup) {
            vm.apps.signup.forEach(function(app) {
              app_signup_ids.push(app._id);
            });
          }

          var app_ids = [].concat(app_reminder_ids).concat(app_coupon_ids).concat(app_signup_ids);

          var app_reminder_data = {};
          var app_coupon_data = {};
          var app_signup_data = {};

          $http.get('/api/insights/get_app_traffic?app_id=' + app_ids.join(','))
            .then(function(response) {
              if(response && response.data && response.data.insights) {
                response.data.insights.forEach(function(row) {
                  var day = row._id.day + '-' + row._id.month + '-' + row._id.year;
                  if(vm.labels.indexOf(day) < 0) {
                    vm.labels.push(day);
                  }
                  // console.log('day', day, row.total);
                  if(app_reminder_ids.indexOf(row._id.app) > -1) {
                    app_reminder_data[day] = row.total;
                  } else if(app_coupon_ids.indexOf(row._id.app) > -1) {
                    app_coupon_data[day] = row.total;
                  } else if(app_signup_ids.indexOf(row._id.app) > -1) {
                    app_signup_data[day] = row.total;
                  }
                });

                vm.labels.forEach(function(day) {
                  if(app_reminder_data[day]) {
                    vm.data[0].push(app_reminder_data[day]);  
                  } else {
                    vm.data[0].push(0);
                  }
                  if(app_coupon_data[day]) {
                    vm.data[1].push(app_coupon_data[day]);  
                  } else {
                    vm.data[1].push(0);
                  }
                  if(app_signup_data[day]) {
                    vm.data[2].push(app_signup_data[day]);  
                  } else {
                    vm.data[2].push(0);
                  }
                });
              }
            });
        });
    };

    vm.getUser = function() {
      $http.get('/api/users/me')
        .then(function(response) {
          vm.user = response.data;
          if($window.Intercom) {
            $window.userData.email = vm.user.email;
            $window.Intercom('update', $window.userData);
          }
        });
    };

    function init() {
      vm.getUser();
      vm.getStats();
      vm.getPopularProducts();
    }

    init();

  }
})();
