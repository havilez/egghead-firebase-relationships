var app = angular.module('egghead', ['ui.grid','firebase']);

app.constant('FIREBASE_URI', 'https://dbs-project.firebaseio.com/');

app.controller('MainCtrl', ['$scope', 'EntitlementsService','ItemsService', 'UsersService', 'OrganizationsService',
    function ($scope, EntitlementsService, ItemsService, UsersService,OrganizationsService) {
        $scope.newItem = { name: '', description: '', count: 0 };
        $scope.currentItem = null;
        $scope.currentUser = null;
        $scope.items = null;
        $scope.currentOrg = null;
        $scope.currentUserOrg = null;
        $scope.currentOrgUsers = [];
        $scope.currentUserRoleEntitlements =[];

        $scope.gridOptions1 = {
            columnDefs: [
                {name: 'firstName', field:'first_name'},
                {name: 'lastName',  field: 'last_name'},
                {name: 'Email' , field:'email'},
                {name: 'phoneNumber', field: 'phone'}
            ]
        };
      $scope.gridOptions1.data = 'currentOrgUsers';

    $scope.gridOptions2 = {
        columnDefs: [
            {name: 'Entitlement', field: 'name'},
            {name: 'Delete', field: 'delete'},
            {name: 'Read',   field: 'read'},
            {name: 'Write', field: 'write'}

        ]
    };

    $scope.gridOptions2.data = 'currentUserEntitlements';

        $scope.organizations = OrganizationsService.getOrganizations();

        $scope.users = UsersService.getUsers();

        $scope.$watch('currentOrg', function () {

            if ($scope.currentOrg && $scope.currentOrg.$id )
                OrganizationsService.setCurrentOrgName($scope.currentOrg.$id)


                OrganizationsService.setCurrentOrganization($scope.currentOrg);


                if ($scope.currentOrg) {
                    $scope.currentOrgUsers = OrganizationsService.getUsersForCurrentOrganization();

                    //FIX-ME
                    // join users with their roles and entitlements

                }


        });

        $scope.$watch('currentUser', function () {
            if ( $scope.currentUser ) {
                UsersService.setCurrentUser($scope.currentUser);

                var userOrg = null;

                if ($scope.currentUser) {
                    userOrg = UsersService.getOrganizationForCurrentUser();
                    OrganizationsService.getCurrentOrgName()


                    // retrieve user org object and display details

                    // set current org to update org list box
                    $scope.currentOrg = userOrg;

                    //FIX-ME
                    // join users with their roles an entitlements
                    // first just retrieve corresponding entitlements for a given user
                    // second try using firebaseutil to implemt a join between user roles and roles and entitlements
                  $scope.currentUserRoleEntitlements = EntitlementsService.getCurrentUserRoleEntitlements($scope.currentUser);
                    $scope.currentUserEntitlements =  $scope.currentUserRoleEntitlements[0].entitlement;;
                }
            }
            else {
                $scope.users = UsersService.getUsers();
            }

        })


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

app.factory('UsersService', ['$firebaseArray', '$firebaseObject','OrganizationsService','$timeout','FIREBASE_URI', function ($firebaseArray,$firebaseObject,OrganizationsService, $timeout,FIREBASE_URI) {
    var ref = new Firebase(FIREBASE_URI);
    var usersRef = ref.child('users');
    var organizationsRef = ref.child('organizations');
    var users = $firebaseArray(usersRef);

    var currentUser = null;
    var currentOrg = null;
    var currentOrgUsersList = [];

    var getUsers = function () {
        return users;
    };

    var getUser = function( userName ) {
        var userRef  =  organizationsRef.child( userName);
        var userKey = null;
        var userData =  null;


        userRef.once('value', function (snapshot) {
            // $timeout(function () {
            userKey = snapshot.key();
            userData = snapshot.val();
            //  })

        });

        return(userData);

    }

    var getCurrentUser = function () {
        return currentUser;
    };

    var setCurrentUser = function (user) {
        currentUser = user;
    };

    var getOrganizationForCurrentUser = function () {
        var currentUserOrgName= null;
        var currentUserOrg=null;
        var userOrgRef = usersRef.child(currentUser.$id).child('organizations');


        var childKey = null;
        var childData = null;

        Firebase.util.logLevel('debug');
        userOrgRef.once('value', function (snapshot) {
          //  $timeout(function () {
            var snapShotkey  = snapshot.key();
            var snapShotData = snapshot.val();

            var childSnapshot = null;

          //  if ( snapshot.hasChildren())
                snapshot.forEach(function (childSnapshot) {
                    childKey = childSnapshot.key();
                    // childData will be the actual contents of the child
                    childData = childSnapshot.val();

                })

               console.log('key= ', childKey);
               console.log('data= ',childData);


                 currentUserOrgName = childKey;
           // })
        
        });

        //FIX-ME: shd use key to call org service getorg to retieve org object
        OrganizationsService.setCurrentOrgName( currentUserOrgName );
        currentUserOrg = OrganizationsService.getOrganization(currentUserOrgName);

  /**
        var coll = new Firebase.util.NormalizedCollection(
            usersRef.child(currentUser.user_id).child('organization'),
            organizationsRef
        );
        coll.select( 'organization', 'organizations.name', {"key":"organizations.$value"} ).ref()

        coll.on('value', function (orgName) {
            console.log('orgName =',orgName);
        })

**/


    return currentUserOrg;

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
        getUser: getUser,
        getCurrentUser: getCurrentUser,
        setCurrentUser: setCurrentUser,
        getOrganizationForCurrentUser: getOrganizationForCurrentUser,
        getItemsForCurrentUser: getItemsForCurrentUser,
        addItemForCurrentUser: addItemForCurrentUser,
        removeItemForCurrentUser: removeItemForCurrentUser
    }
}]);

app.factory('OrganizationsService', ['$firebaseArray', '$firebaseObject','FIREBASE_URI', function ($firebaseArray,$firebaseObject,  FIREBASE_URI) {
    var ref = new Firebase(FIREBASE_URI);
    var organizationsRef = ref.child('organizations');
    var usersRef = ref.child('users');
    var organizations = $firebaseArray(organizationsRef);
    var currentOrgUsersList = [];


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
        // retrieve org object via reference then find list of users if any
        var snapShotRef = null, snapShotData= null, userListRef = null, userRef = null;






        userListRef = organizationsRef.child(getCurrentOrgName()).child('users');
        // var users = $firebaseObject(organizationsRef.child(currentOrg.org_id).child('organizations'));

        userListRef.once('value', function (snapshot) {
            //  $timeout(function () {
            var snapShotkey  = snapshot.key();
            var snapShotData = snapshot.val();

            var childSnapshot = null;
            var userObj = null;
            currentOrgUsersList.length = 0;

            //  if ( snapshot.hasChildren())
            snapshot.forEach(function (childSnapshot) {
                childKey = childSnapshot.key();
                // childData will be the actual contents of the child
                childData = childSnapshot.val();

                // retrieve each user name in list and get corresponding firebase users object and add to list

               userObj =  getUser( childKey );
               currentOrgUsersList.push( userObj );

            })


            // })

        });
        if ( !currentOrgUsersList.length )
            return null;

        return currentOrgUsersList;

    };

    var getUser = function( userName ){
        var userRef  =  usersRef.child( userName);
        var userKey = null;
        var userData =  null;


        userRef.once('value', function (snapshot) {
            // $timeout(function () {
            userKey = snapshot.key();
            userData = snapshot.val();
            //  })

        });

        return(userData);
    }

    var getOrganization = function( orgName ) {
        // now that you have organization name for user
        // find corresponding organization object and return it
        var currentOrgRef  =  organizationsRef.child( orgName);
        var orgKey = null;
        var orgData =  null;


        currentOrgRef.once('value', function (snapshot) {
           // $timeout(function () {
                orgKey = snapshot.key();
                orgData = snapshot.val();
          //  })

        });

        return(orgData);

    };

    var setCurrentOrgName= function( orgName) {
        organizationName = orgName;
    };

    var getCurrentOrgName = function() {
        return organizationName;
    };



    return {
        getOrganizations: getOrganizations,
        getCurrentOrganization: getCurrentOrganization,
        setCurrentOrganization: setCurrentOrganization,
        getUsersForCurrentOrganization : getUsersForCurrentOrganization,
        getOrganization: getOrganization,
        getCurrentOrgName: getCurrentOrgName,
        setCurrentOrgName: setCurrentOrgName

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



app.factory('EntitlementsService',  ['$firebaseArray', '$firebaseObject','FIREBASE_URI',
    function ($firebaseArray,$firebaseObject, FIREBASE_URI) {

        var ref = new Firebase(FIREBASE_URI);
        var usersRef = ref.child('users');
        var roleEntitlementsRef = ref.child('userRoleEntitlements');
        var users = $firebaseArray(usersRef);
        var roleEntitlements = $firebaseArray(roleEntitlementsRef);
        var currentUserEntitlementsList = null;


        var  getCurrentUserRoleEntitlements = function(currentUser) {
            var currentUserEntitlementsList = [];

            //get list of roles from current user
            var userRolesRef = usersRef.child(currentUser.$id).child('roles');

            // loop thru user roles and resolve its reference in rolest and entitlements collecton
            //  if ( snapshot.hasChildren())
            userRolesRef.once('value', function (snapshot) {
                //  $timeout(function () {
                var snapShotkey  = snapshot.key();
                var snapShotData = snapshot.val();

                var childSnapshot = null;
                var rolesEntitlementObj = null;
                currentUserEntitlementsList.length = 0;

                //  if ( snapshot.hasChildren())
                snapshot.forEach(function (childSnapshot) {
                    childKey = childSnapshot.key();
                    // childData will be the actual contents of the child
                    childData = childSnapshot.val();

                    // retrieve each user name in list and get corresponding firebase users object and add to list


                    rolesEntitlementObj =  getRoleEntitlements( childKey );



                    currentUserEntitlementsList.push( rolesEntitlementObj );

                })


                // })

            });

            //if (! currentUserEntitlementsList.length)
              //  return null;

            //FIX-ME: index containing set of objects matches index in roles array for current user
            // user.roles[i] is has entitlements[i]
            return   currentUserEntitlementsList;
        }

        var getRoleEntitlements = function (roleName) {
            var roleEntitlementRef = roleEntitlementsRef.child(roleName);
            var roleKey = null;
            var roleData = null;

            var tempObj = new Object(); // used to flatten out role and entitlement structure
            tempObj.role = roleName;
            tempObj.entitlement = [];


            roleEntitlementRef.once('value', function (snapshot) {
                // $timeout(function () {
                roleKey = snapshot.key();
                roleData = snapshot.val();
                //  })
                // retrieve list of entitlements
                var i = 0;
                snapshot.forEach(function (childSnapshot) {
                    var entitlementObj = {};
                    childKey = childSnapshot.key();
                    // childData will be the actual contents of the child
                    childData = childSnapshot.val();
                    var name = 'name';

                    entitlementObj['name'] = childKey;


                    Object.keys(childData).forEach(function (key) {
                        console.log(key);
                        entitlementObj[key]  =  childData[key];
                    })

                    tempObj.entitlement.push( entitlementObj);
                })

                });



            return (tempObj);

        }


        return {
            getCurrentUserRoleEntitlements : getCurrentUserRoleEntitlements,
            getRoleEntitlements :  getRoleEntitlements

    }

}]);

