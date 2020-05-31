var angular = require('angular');
var angularAPP = angular.module('angularAPP');

var AuthorizationFactory = function ($rootScope, $http, $location, $q, $log, UtilsFactory, env) {
    function isAuthorized(privilegeName, resourceName) {
        var deferred = $q.defer();
        if(privilegeName=="write" && resourceName == "Test1")
            deferred.resolve(false);
        else
            deferred.resolve(true);;
        return deferred.promise;
    }

    return{
        isAuthorized: function(privilegeName, resourceName){return isAuthorized(privilegeName, resourceName);}
    }
}

AuthorizationFactory.$inject = ['$rootScope', '$http', '$location', '$q', '$log', 'UtilsFactory', 'env'];

angularAPP.factory('AuthorizationFactory', AuthorizationFactory);