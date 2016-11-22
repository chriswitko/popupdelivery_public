(function() {
  'use strict';

  angular
    .module('app')
    .component('reminder', {
      restrict: 'E',
      templateUrl: 'app/components/app-reminder/reminder.html',
      controller: ReminderCtrl
    });

  ReminderCtrl.$inject = [];

  function ReminderCtrl() {
  }
})();
