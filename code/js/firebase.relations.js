var app = angular.module('egghead', ['firebase']);

app.constant('FIREBASE_URI', 'https://dbs-project.firebaseio.com/');

app.controller('MainCtrl', ['$scope', 'ItemsService', 'UsersService',
    function ($scope, ItemsService, UsersService) {
        $scope.newItem = { name: '', description: '', count: 0 };
        $scope.currentItem = null;
        $scope.currentUser = null;
        $scope.items = null;

        $scope.users = UsersService.getUsers();

        $scope.$watch('currentUser', function () {
            UsersService.setCurrentUser($scope.currentUser);

            if ($scope.currentUser) {
                $scope.items = UsersService.getItemsForCurrentUser();
            }
        });

        $scope.addItem = function () {
            ItemsService.addItem(angular.copy($scope.newItem));
            $scope.newItem = { name: '', description: '', count: 0 };
        };
    }]);

app.directive('item', ['$firebaseObject', 'FIREBASE_URI', 'ItemsService',
    function ($firebaseObject, FIREBASE_URI, ItemsService) {
        var linker = function (scope, element, attrs) {
            scope.itemId = attrs['itemId'];
            scope.myItem = $firebaseObject(new Firebase(FIREBASE_URI + 'items/' + scope.itemId));
        };

        var controller = function ($scope) {
            $scope.updateItem = function () {
                // Update internally since it is a local concern
                $scope.myItem.$save();
            };

            $scope.removeItem = function () {
                // Delegate deletion since it is a global concern
                ItemsService.removeItem($scope.itemId);
            };
        };

        return {
            scope: true,
            link: linker,
            controller: controller
        };
    }]);

app.factory('UsersService', ['$firebaseArray', 'FIREBASE_URI', function ($firebaseArray, FIREBASE_URI) {
    var usersRef = new Firebase(FIREBASE_URI + 'users');
    var users = $firebaseArray(usersRef);
    var currentUser = null;

    var getUsers = function () {
        return users;
    };

    var getCurrentUser = function () {
        return currentUser;
    };

    var setCurrentUser = function (user) {
        currentUser = user;
    };

    var getItemsForCurrentUser = function () {
        return users.$child(currentUser + '/items/');
    };

    var addItemForCurrentUser = function (itemRef) {
        var child = users.$child(currentUser + '/items/' + itemRef.name());
        child.$set(true);
    };

    var removeItemForCurrentUser = function (itemId) {
        users.$remove(currentUser + '/items/' + itemId);
    };

    return {
        getUsers: getUsers,
        getCurrentUser: getCurrentUser,
        setCurrentUser: setCurrentUser,
        getItemsForCurrentUser: getItemsForCurrentUser,
        addItemForCurrentUser: addItemForCurrentUser,
        removeItemForCurrentUser: removeItemForCurrentUser
    }
}]);

app.factory('ItemsService', ['$firebaseObject', 'FIREBASE_URI', 'UsersService',
    function ($firebaseObject, FIREBASE_URI, UsersService) {
        var itemsRef = new Firebase(FIREBASE_URI + 'items');
        var items = $firebaseObject(itemsRef);

        var getItems = function () {
            return items;
        };

        var addItem = function (item) {
            items.$add(item).then(function(ref){
                UsersService.addItemForCurrentUser(ref);
            })
        };

        var removeItem = function (itemId) {
            items.$remove(itemId).then(function(){
               UsersService.removeItemForCurrentUser(itemId);
            });
        };

        return {
            getItems: getItems,
            addItem: addItem,
            removeItem: removeItem
        }
    }]);