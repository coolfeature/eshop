
var eshopApp = angular.module('EShop', [
  'ngRoute'
  ,'ngAnimate'
  ,'ui.bootstrap'
  ,'xeditable'
  ,'cgBusy'
  ,'eshop.admin.categories.Controllers'
  ,'eshop.admin.categories.Factories'
  ,'eshop.admin.items.Controllers'
  ,'eshop.admin.items.Factories'
  ,'eshop.admin.Controllers'
  ,'eshop.Directives'
  ,'eshop.Factories'
  ,'eshop.Controllers'
]);

eshopApp.config(function($interpolateProvider){
  $interpolateProvider.startSymbol('{[').endSymbol(']}');
});

// Needed for xeditable
eshopApp.run(function(editableOptions) {
  editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
});


// configure our routes
eshopApp.config(function($routeProvider) {
  $routeProvider
    // route for the home page
    .when('/', {
      template : " ",
      controller  : 'ControllerLanding',
      animation : 'slide'
    })
});


