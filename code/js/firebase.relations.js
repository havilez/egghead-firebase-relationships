var app = angular.module('egghead', ['firebase']);

app.constant('FIREBASE_URI', 'https://dbs-project.firebaseio.com/');

app.controller('MainCtrl', ['$scope', 'ItemsService', 'UsersService', 'OrganizationsService',
    function ($scope, ItemsService, UsersService,OrganizationsService) {
        $scope.newItem = { name: '', description: '', count: 0 };
        $scope.currentItem = null;
        $scope.currentUser = null;
        $scope.items = null;
        $scope.currentOrg = null;
        $scope.currentUserOrg = null;

        $scope.organizations = OrganizationsService.getOrganizations();

        $scope.users = UsersService.getUsers();

        $scope.$watch('currentOrg', function () {
            OrganizationsService.setCurrentOrganization($scope.currentOrg);

           if ($scope.currentOrg) {
                $scope.users = OrganizationsService.getUsersForCurrentOrganization();
           }
        });

        $scope.$watch('currentUser', function () {
            UsersService.setCurrentUser($scope.currentUser);

            if ($scope.currentUser) {
                $scope.currentUserOrg = UsersService.getOrganizationForCurrentUser();
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

app.factory('UsersService', ['$firebaseArray', '$firebaseObject','FIREBASE_URI', function ($firebaseArray,$firebaseObject, FIREBASE_URI) {
    var ref = new Firebase(FIREBASE_URI);
    var usersRef = ref.child('users');
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

    var getOrganizationForCurrentUser = function () {
        //var org = $firebaseArray(usersRef.child(currentUser.user_id).child('users'));
        var org = null;
         org = $firebaseObject( usersRef.child(currentUser.user_id).child('organizations'));
        org.$loaded().then(function() {
            console.log("loaded record:", org.$id);
            return org;
        });




    };

    var getItemsForCurrentUser = function () {
        return $firebaseArray(usersRef.child(currentUser.user_id).child('items'));

    };

    var addItemForCurrentUser = function (itemRef) {
        //FIX-ME  add name from item ref to firebase array of item references
        var child = users.$child(currentUser + '/items/' + itemRef.name()); // old code
        child.$set(trueegg);                                                // old code

        var items = $firebaseArray(usersRef.child(currentUser.user_id).child('items'));
        var mychild = $firebaseObject(users.child(currentUser + '/items/' + itemRef.name()) );
        mychild.$set(true);
    };

    var removeItemForCurrentUser = function (itemId) {
        users.$remove(currentUser + '/items/' + itemId);
    };

    return {
        getUsers: getUsers,
        getCurrentUser: getCurrentUser,
        setCurrentUser: setCurrentUser,
        getOrganizationForCurrentUser: getOrganizationForCurrentUser,
        getItemsForCurrentUser: getItemsForCurrentUser,
        addItemForCurrentUser: addItemForCurrentUser,
        removeItemForCurrentUser: removeItemForCurrentUser
    }
}]);

app.factory('OrganizationsService', ['$firebaseArray', '$firebaseObject','FIREBASE_URI', function ($firebaseArray,$firebaseObject, FIREBASE_URI) {
    var ref = new Firebase(FIREBASE_URI);
    var organizationsRef = ref.child('organizations');
    var organizations = $firebaseArray(organizationsRef);

    var currentOrg = null;

    var getOrganizations = function () {
        return organizations;
    };

    var getCurrentOrganization = function () {
        return currentOrg;
    };

    var setCurrentOrganization = function (organization) {
        currentOrg = organization;
    };


    var getUsersForCurrentOrganization = function () {
        var users = $firebaseArray(organizationsRef.child(currentOrg.org_id).child('users'));
        // var users = $firebaseObject(organizationsRef.child(currentOrg.org_id).child('organizations'));
        return users;

    };


    return {
        getOrganizations: getOrganizations,
        getCurrentOrganization: getCurrentOrganization,
        setCurrentOrganization: setCurrentOrganization,
        getUsersForCurrentOrganization : getUsersForCurrentOrganization

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