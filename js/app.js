var app = angular.module('twitterModule', ['ui.router']);

app.config(['$stateProvider' , function ($stateProvider) {
    $stateProvider
        .state("sign-in", {
            url: '/sign-in',
            templateUrl: "templates/sign-in.html",
            controller: "signInCtrl",
            controllerAs: "signIn"
        })
        .state('registration', {
            url: '/registration',
            templateUrl: "templates/registration.html",
            controller: "registrationController",
            controllerAs: "reg"
        })
        .state("profile", {
            url: '/profile',
            templateUrl: "templates/profile-page.html",
            controller: "profileCtrl",
            controllerAs: "profile"
        })
        .state('profile.users', {
            url: '/users',
            templateUrl: "templates/users-list.html",
            controller: "userListController",
            controllerAs: "usList"
        })
        .state('profile.posts', {
            url: '/posts',
            templateUrl: "templates/posts.html",
            controller: "postsController",
            controllerAs: "postCtrl"
        });
}]);

app.controller('appCtrl', ['UserService', 'PostsService', function (UserService, PostsService) {
    var vm = this;

    vm.logOut = function () {
        UserService.logOut();
    };

    vm.init = function () {
        UserService.initFakeUsers();
        UserService.checkAuthorization();
        PostsService.initFakePosts();
    };

    vm.init();
}]);

app.controller('postsController', ['PostsService', function (PostsService) {
    var vm = this;
    vm.posts = new Array();
    vm.checkLike = true;

    vm.addPost = function () {
        var post = {
            title: vm.newPost.title,
            message: vm.newPost.message
        };
        PostsService.addPost(post);
        vm.posts = PostsService.getPosts();
    };

    vm.likePost = function (postId) {
        PostsService.likePost(postId)
    };

    vm.init = function () {
        vm.posts = PostsService.getPosts();
    };

    vm.init();
}]);

app.controller('profileCtrl', ['UserService', function (UserService) {
    var vm = this;
    vm.currentUser = new Object();

    vm.addFollowUser = function (id) {
        UserService.addFollowUser(id);
    };

    vm.removeFollowUser = function (id) {
        UserService.removeFollowUser(id);
    };

    vm.checkMySelf = function (user) {
        return user.id !== vm.currentUser.id;
    };

    vm.checkFollowUsers = function (id) {
        return vm.currentUser.followUsers.includes(id);
    };

    vm.init = function () {
        vm.currentUser = UserService.getCurrentUser();
        UserService.checkAuthorization();
    };

    vm.init();
}]);

app.controller('registrationController', ['UserService', '$location', function (UserService, $location) {
    var vm = this;

    vm.registration = function () {
        var user = {
            name: vm.newUser.name,
            sname: vm.newUser.sname,
            phone: vm.newUser.phone,
            mail: vm.newUser.email,
            login: vm.newUser.login,
            password: vm.newUser.password
        };

        UserService.registration(user);
        $location.path('profile');
    }
}]);

app.controller('signInCtrl', ['UserService', '$location', function (UserService, $location) {
    var vm = this;

    vm.signIn = function () {
        if (vm.account) {
            UserService.signIn(vm.account)
                .then(function (check) {
                    if (check) {
                        $location.path('profile');
                    }
                })
                .catch(function (err) {
                    alert(err);
                })

        }
    };
}]);

app.controller('userListController', ['UserService', function (UserService) {
    var vm = this;
    vm.users = new Array();

    vm.init = function () {
        vm.users = UserService.getAllUsers();
    };

    vm.init();
}]);

app.directive('commentDir', ['PostsService', function (PostsService) {
    return {
        restrict: 'E',
        templateUrl: './templates/directives/comment.html',
        scope: {
            post: '=',
            message: '='
        },
        link: function (scope, element, attr) {
            scope.showComments = false;
            scope.toggleComments = function () {
                scope.showComments = !scope.showComments;
                element.css({
                    zIndex: scope.showComments ? 2 : 1
                });
            };
            scope.addComment = function (message) {
                var comment = {
                    message: message,
                    date: new Date(),
                    postId: scope.post.id
                };
                PostsService.addCommentsToPost(comment);
            }

        }
    }
}]);
app.factory('PostsService', ['$q', 'UserService', function ($q, UserService) {
    var fakePosts = [];
    var posts = [];

    function initFakePosts() {
        var postsFromStorage = JSON.parse(localStorage.getItem('fakePosts'));
        if (postsFromStorage) {
            fakePosts = postsFromStorage;
            return;
        };

        fakePostMessage.forEach(function (post) {
            fakePosts.push(new Post(post.title, post.message, post.id, new Date()));
        });

        var postsJson = JSON.stringify(fakePosts);
        localStorage.setItem('fakePosts', postsJson);
    };

    /**
     * Create new post
     * @param title
     * @param message
     * @param userId
     * @param date
     * @constructor
     */
    function Post(title, message, userId, date) {
        this.id = fakePosts.length ? fakePosts[fakePosts.length - 1].id + 1 : 1;
        this.title = title;
        this.message = message;
        this.user = UserService.getUserById(userId);
        this.date = date;
        this.comments = [];
        this.likes = [];
    };

    /**
     * Get the posts belonging to current user
     */
    function initPostsToCurrentUser() {
        posts = [];
        var followUsers = UserService.getCurrentUser().followUsers;
        for (var i = 0; i < followUsers.length; i++) {
            for (var j = 0; j < fakePosts.length; j++) {
                if (followUsers[i] === fakePosts[j].user.id) {
                    posts.push(fakePosts[j]);
                }
            }
        }
    }

    /**
     * Add new post to fakePost array
     * @param post {title, message, date}
     */
    function addPost(post) {
        var userId = UserService.getCurrentUser().id;
        fakePosts.push(new Post(post.title, post.message, userId, new Date()));
        updateStorage();
    }

    /**
     * Update post in local storage
     */
    function updateStorage() {
        var posts = JSON.stringify(fakePosts);
        localStorage.setItem('fakePosts', posts)
    }

    /**
     * @returns {Array}
     */
    function getPosts() {
        initPostsToCurrentUser();
        return posts;
    }

    /**
     * add comment to post for fake posts array
     * @param comment
     */
    function addCommentsToPost(comment) {
        for (var i = 0; i < fakePosts.length; i++) {
            if (fakePosts[i].id === comment.postId) {
                comment.userName = UserService.getUserById(UserService.getCurrentUser().id).name;
                fakePosts[i].comments.push(comment);
                updateStorage();
                return;
            }
        }
    }

    /**
     *  find post and add like to this post
     *  if post has liked from current user, like will be removed
     * @param postId
     */
    function likePost(postId) {
        var currentUserId = UserService.getCurrentUser().id;
        for (var i = 0; i < fakePosts.length; i++) {
            if (fakePosts[i].id === postId) {
                if (fakePosts[i].likes.includes(currentUserId)) {
                    for (var j = 0; j < fakePosts[i].likes.length; j++) {
                        if (fakePosts[i].likes[j] === currentUserId) {
                            fakePosts[i].likes.splice(j, 1);
                            updateStorage();
                            return;
                        }
                    }
                } else {
                    fakePosts[i].likes.push(currentUserId);
                    updateStorage();
                    return;
                }
            }
        }
    }

    return {
        initFakePosts: initFakePosts,
        getPosts: getPosts,
        addPost: addPost,
        addCommentsToPost: addCommentsToPost,
        likePost: likePost
    }
}]);

var fakePostMessage = [
    {
        title: 'De Finibus Bonorum',
        message: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur',
        id: 2
    },
    {
        title: 'Quis autem vel',
        message: ' Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora iniosam, nisi ut aliquid ex ea commodi consequatur?',
        id: 2
    },
    {
        title: 'Modi tempora',
        message: 'am est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt uquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?',
        id: 3
    },
    {
        title: 'Exercitationem ullam',
        message: ' m ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipuatur?',
        id: 1
    },
    {
        title: 'Labore et dolore magnam',
        message: ' Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incieniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?',
        id: 3
    },
    {
        title: 'Voluptatem',
        message: ' Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?',
        id: 2
    },
    {
        title: 'Lincidunt ut',
        message: ' Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?',
        id: 1
    }
];

app.factory('UserService', ['$q', '$location', function ($q, $location) {
    var fakeUsers = [];
    var currentUser = {};

    /**
     * function to create fake user list
     */
    function initFakeUsers() {
        var usersFromStorage = JSON.parse(localStorage.getItem('fakeUsers'));
        if (usersFromStorage) {
            usersFromStorage.forEach(function (user) {
                fakeUsers.push(new User(user.name, user.sname, user.login, user.password, user.age, user.mail, user.followUsers, user.online))
            });
            return;
        };

        allFakeUsers.forEach(function (user) {
            fakeUsers.push(new User(user.name, user.sname, user.login, user.password, user.phone, user.email));
        });

        var usersJson = JSON.stringify(fakeUsers);
        localStorage.setItem('fakeUsers', usersJson);
    };

    /**
     * Create new User
     * @param name
     * @param sname
     * @param login
     * @param password
     * @param phone
     * @param mail
     * @constructor
     */
    function User(name, sname, login, password, phone, mail, followUsers, online) {
        this.name = name;
        this.sname = sname;
        this.login = login;
        this.password = password;
        this.phone = phone;
        this.mail = mail;
        this.followUsers = followUsers ? followUsers : [];
        this.online = online ? online : false;
        this.id = fakeUsers.length ? fakeUsers[fakeUsers.length - 1].id + 1 : 1;
        if (!this.followUsers.includes(this.id)) {
            !this.followUsers.push(this.id);
        }
    };

    /**
     * Get info of users without login and password
     * @returns {{name: *, sname: *, phone: *, mail: *, posts: *, online: *, followUsers: *, id: *}}
     */
    User.prototype.getInfo = function () {
        return {
            name: this.name,
            sname: this.sname,
            phone: this.phone,
            mail: this.mail,
            posts: this.posts,
            online: this.online,
            followUsers: this.followUsers,
            id: this.id
        }
    };

    /**
     * Remove user id from follow users list (when un follow)
     * @param id
     */
    function removeFollowUser(id) {
        for (var i = 0; i < currentUser.followUsers.length; i++) {
            if (currentUser.followUsers[i] === id) {
                currentUser.followUsers.splice(i, 1);
                updateStorage();
                return;
            }
        }
    }

    /**
     * Add id users to current user for follow user list
     * @param id
     */
    function addFollowUser(id) {
        currentUser.followUsers.push(id);
        updateStorage();
    }

    /**
     * Check user in user list
     * @param user {name,login}
     * @returns {Promise}
     */
    function signIn(user) {
        return $q(function (resolve, reject) {
            fakeUsers.forEach(function (element, index) {
                if (user.login === element.login && user.password === element.password) {
                    currentUser = element.getInfo();
                    sessionStorage.setItem('currentUser', JSON.stringify(element.getInfo()));
                    resolve(true);
                }
            });
            reject('wrong login or password');
        });
    };

    /**
     * Registration (add new user to fake users list)
     * @param user {name, sname, login, password, phone, mail}
     */
    function registration(user) {
        fakeUsers.push(new User(user.name, user.sname, user.login, user.password, user.phone, user.mail));
        currentUser = fakeUsers[fakeUsers.length - 1];
        updateStorage();
    }

    /**
     * @param id
     * @returns {{name, sname, phone, mail, posts, online, followUsers, id}}
     */
    function getUserById(id) {
        for (var i = 0; i < fakeUsers.length; i++) {
            if (fakeUsers[i].id === id) {
                return fakeUsers[i].getInfo();
            }
        }
    };

    /**
     *  Current user
     * @returns {{name, sname, phone, mail, posts, online, followUsers, id}}
     */
    function getCurrentUser() {
        return currentUser;
    };

    /**
     * @returns {Array}
     */
    function getAllUsers() {
        return fakeUsers;
    };

    /**
     * Log out from account
     * Set user to offline
     */
    function logOut() {
        toDoUserOffline();
        sessionStorage.removeItem('currentUser');
        currentUser = {};
        checkAuthorization();
    }

    /**
     * check if user is in sessionStorage
     * if user is not, redirect to sing-in page
     */
    function checkAuthorization() {
        var userFromStorage = JSON.parse(sessionStorage.getItem('currentUser'));
        if (userFromStorage) {
            for (var i = 0; i < fakeUsers.length; i++) {
                if (userFromStorage.id === fakeUsers[i].id) {
                    currentUser = fakeUsers[i].getInfo();
                    fakeUsers[i].online = true;
                    updateStorage();
                    break;
                }
            }
            $location.path('profile/users');
            return;
        }
        $location.path('sign-in');
    }

    function updateStorage() {
        var users = JSON.stringify(getAllUsers());
        localStorage.setItem('fakeUsers', users);
    }

    /**
     * find current user in fake users list
     * set prop online for current user in  fake users list to false
     * update local storage
     */
    function toDoUserOffline() {
        for (var i = 0; i < fakeUsers.length; i++) {
            if (fakeUsers[i].id === getCurrentUser().id) {
                fakeUsers[i].online = false;
                updateStorage();
                return;
            }
        }
    }

    return {
        initFakeUsers: initFakeUsers,
        signIn: signIn,
        getCurrentUser: getCurrentUser,
        getAllUsers: getAllUsers,
        getUserById: getUserById,
        addFollowUser: addFollowUser,
        removeFollowUser: removeFollowUser,
        checkAuthorization: checkAuthorization,
        logOut: logOut,
        registration: registration,
        toDoUserOffline: toDoUserOffline
    }
}]);

var allFakeUsers = [
    {
        name: 'Oleh',
        sname: 'Khomyk',
        login: 'oleg',
        password: '111',
        phone: '21',
        email: 'oleh.khomyk@gmail.com'
    },
    {
        name: 'Petro',
        sname: 'Classniy',
        login: 'petya',
        password: '222',
        phone: '33',
        email: 'petya.super@gmail.com'
    },
    {
        name: 'Ivan',
        sname: 'Ivanko',
        login: 'ivanko',
        password: '333',
        phone: '25',
        email: 'ivan.start@gmail.com'
    },
    {
        name: 'Nazar',
        sname: 'Pertyka',
        login: 'nazarko',
        password: '444',
        phone: '29',
        email: 'nazar.best@gmail.com'
    },
    {
        name: 'Andriy',
        sname: 'Chesniy',
        login: 'andruha',
        password: '555',
        phone: '17',
        email: 'andriy.true@gmail.com'
    },
    {
        name: 'Slavik',
        sname: 'Voloshyn',
        login: 'slavko',
        password: '777',
        phone: '23',
        email: 'slavko.cfg@gmail.com'
    },
    {
        name: 'Yura',
        sname: 'Spivak',
        login: 'yurec',
        password: '666',
        phone: '23',
        email: 'yura.songer@gmail.com'
    }
];
