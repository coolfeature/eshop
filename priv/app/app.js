
var eshopApp = angular.module('EShop', [
  'ngAnimate'
  ,'ui.bootstrap'
  ,'ui.router'
  ,'xeditable'
  ,'cgBusy'
//  ,'eshop.admin.categories.Controllers'
//  ,'eshop.admin.categories.Factories'
//  ,'eshop.admin.items.Controllers'
//  ,'eshop.admin.items.Factories'
//  ,'eshop.admin.Controllers'
//  ,'eshop.Directives'
  ,'eshop.Factories'
  ,'eshop.Services'
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
eshopApp.config(function($stateProvider,$urlRouterProvider) {
  $urlRouterProvider.otherwise('/shop');

  $stateProvider

  .state('shell', {
    abstract : true
    ,template: '<ui-view/>' 
    ,data : { access: 1 }
    ,resolve: {
      authorize: ['FactoryAuth',
        function(FactoryAuth) {
          console.log('AUTHORISATION RUNS');
          return FactoryAuth.authenticate({operation: 'initialize'});
        }
      ]
    }
  })

  .state('shell.register', {
    url: '/register'
    ,templateProvider: function (ServicePartials,$stateParams) {
      console.log('register activated: ',$stateParams.id);
      ServicePartials.fetch('register');
      return ServicePartials.promise.then(function(response) {
        return response.data.partial;
      }); 
    }

  })

  .state('shell.login', {
    url: '/login'
    ,templateProvider: function (ServicePartials,$stateParams) {
      console.log('login activated: ',$stateParams.id);
      ServicePartials.fetch('login');
      return ServicePartials.promise.then(function(response) {
        return response.data.partial;
      }); 
    }
  })
 
  .state('shell.admin', {
    url : '/admin'
    ,data : { access: 5 }
//    ,views : { 
//      "main" : {       
	,templateProvider: function (ServicePartials,$stateParams) {
          console.log('admin activated: ',$stateParams.id);
          ServicePartials.fetch('admin');
          return ServicePartials.promise.then(function(response) {
            return response.data.partial;
          });    
//        }
//      }
    }
  })

  .state('shell.shop', {
    url : '/shop'
    ,templateProvider: function (ServicePartials,$stateParams) {
      console.log('shop activated: ',$stateParams.id);
      ServicePartials.fetch('shop');
      return ServicePartials.promise.then(function(response) {
        return response.data.partial;
      }); 
    }
  })
 
});

eshopApp.run(['$rootScope', '$state', 'FactoryAuth', function ($rootScope, $state, FactoryAuth) {
  $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
    console.log('TO STATE',toState);
    if(!('data' in toState) || !('access' in toState.data)){
      $rootScope.error = "Access undefined for this state";
      console.log('ACCESS UNDEFINED FOR THIS STATE',toState);
      event.preventDefault();
    } else if (toState.data.access > FactoryAuth.user.access) {
      console.log('ACCESS DENIED',toState.access);
      $rootScope.error = "Seems like you tried accessing a route you don't have access to...";
      event.preventDefault();
      if(fromState.url === '^') {
        if(FactoryAuth.isLogged) {
          console.log('GOING TO SHOP');
          $state.go('public.shop');
        } else {
          $rootScope.error = null;
          console.log('GOING TO LOGIN');
          $state.go('public.login');
        }
      }
    } else {
      if (fromState.abstract) {
        console.log('SWITCHING FROM ABSTRACT STATE',fromState.name);
      }
      console.log('USER ACCESS',FactoryAuth.user.access);
      console.log('STATE ACCESS',toState.data.access);
    }
  });
}]);

eshopApp.run(
  function($rootScope) {
      $rootScope.$on('$stateChangeStart',function(event, toState, toParams, fromState, fromParams){
      console.log('$stateChangeStart to '+toState.to+'- fired when the transition begins. toState,toParams : \n',toState, toParams);
    });
    $rootScope.$on('$stateChangeError',function(event, toState, toParams, fromState, fromParams, error){
      console.log('$stateChangeError - fired when an error occurs during transition.');
      console.log(error);
    });
    $rootScope.$on('$stateChangeSuccess',function(event, toState, toParams, fromState, fromParams){
      console.log('$stateChangeSuccess to '+toState.name+'- fired once the state transition is complete.');
    });

    $rootScope.$on('$viewContentLoading',function(event, viewConfig){
     // runs on individual scopes, so putting it in "run" doesn't work.
      console.log('$viewContentLoading - view begins loading - dom not rendered',viewConfig);
    });
    $rootScope.$on('$viewContentLoaded',function(event){
      console.log('$viewContentLoaded - fired after dom rendered',event);
    });
    $rootScope.$on('$stateNotFound',function(event, unfoundState, fromState, fromParams){
      console.log('$stateNotFound '+unfoundState.to+'  - fired when a state cannot be found by its name.');
      console.log(unfoundState, fromState, fromParams);
    });
  }
);