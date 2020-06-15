var angular = require('angular');
var angularAPP = angular.module('angularAPP');

var AuthorizationFactory = function ($rootScope, $http, $location, $q, $log, UtilsFactory, env) {
    function getUserPermissionsFromServer(){
        var deferred = $q.defer();
        var url = env.SCHEMA_REGISTRY() + '/user/permissions/';
        $log.debug("  curl -X GET " + url);
        var start = new Date().getTime();
        $http.get(url)
            .success(function (data) {
                $log.debug("  curl -X GET " + url + " => in [ " + ((new Date().getTime()) - start) + "] msec");
                deferred.resolve(data)
            })
            .error(function (data, status) {
                deferred.reject("No user info found.")
            });
        return deferred.promise;
    }
    function extractResources(requiredPrivilege){
        var userPrivilege = $rootScope.userPermissions.find(function(element) {
            return element.privilege == requiredPrivilege;
        });
        if(userPrivilege == null)
            return [];
        else
            return userPrivilege.resources;
    }
    function getUserPermissions(requiredPrivilege){
        var deferred = $q.defer();
        if($rootScope.userPermissions == undefined || $rootScope.userPermissions == null){
            getUserPermissionsFromServer().then(
                function success(userPermissions) {
                    $rootScope.userPermissions = userPermissions;
                    deferred.resolve(extractResources(requiredPrivilege));
                  }
            );  
        }
        else{
            deferred.resolve(extractResources(requiredPrivilege));
        }
        return deferred.promise;
    }
    function isAuthorized(privilegeName, resourceName) {
        var deferred = $q.defer();
        getUserPermissions(privilegeName).then(
            function success(permittedResources) {
                if(permittedResources.includes("*"))
                    deferred.resolve(true);
                if(permittedResources.includes(resourceName))
                    deferred.resolve(true);
                else
                    deferred.resolve(false);
            }
        );
        return deferred.promise;
    }

    return{
        loadCache: function(){
            return getUserPermissionsFromServer();
        },
        isAuthorized: function(privilegeName, resourceName){return isAuthorized(privilegeName, resourceName);}
    }
}

AuthorizationFactory.$inject = ['$rootScope', '$http', '$location', '$q', '$log', 'UtilsFactory', 'env'];

angularAPP.factory('AuthorizationFactory', AuthorizationFactory);