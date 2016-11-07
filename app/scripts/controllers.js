(function() {

    var client = 'a0c7eca13be271b6b94e';
    var secret = '10c63964d0e7e50a4d70f22c25c8403ebcc5d32f';
    var oauth = '?client_id=' + client + '&client_secret=' + secret;


    function formatJoinDate(joined) {
        try {
            joined = Date.parse(joined).toString("d MMMM yyyy");
        } catch (e) {
            console.log('Error parsing data : ' + joined + ' ' + e.message)
        }
        return joined;
    };

    var app = angular.module('GitBer', []);


    /**
     * reposController
     * Parent controller for the app.
     *  
     * 
     *
     */
    app.controller('reposController', function($scope) {
        var repoData = this
        $scope.SearchTextField = '';
        repoData.repos = []

        repoData.addUserHist = function() {
            $scope.$broadcast('adduserEv');
            return repoData.SearchTextField;
        }
        repoData.addUserDetails = function() {
                $scope.$broadcast('adduserDet');
                return repoData.SearchTextField;
            }
        /**
         *
         * Function gets user repos and then asynchronusly gets their readmefiles and updates the view 
         * 
         * @param  {username}
         * @param  {oauth}
         * @return {null}
         */
        repoData.getData = function(username, oauth) {
                var url = 'https://api.github.com/users/' + username + '/repos' + oauth;

                $.getJSON(url, function(data) {

                    async.map(
                        data,
                        function(repo, callback) {
                            var url = 'https://api.github.com/repos/' + username + '/' + repo.name + '/readme' + oauth;
                            $.getJSON(url, function(readme) {
                                    repo.readmeFile = $.base64Decode(readme.content);
                                    callback(null, repo);
                                })
                                .error(function(jqxhr, textStatus, error) {
                                    repo.readmeFile = "No readme found";
                                    var err = textStatus + ", " + error;
                                    console.log("Readme request failed: " + err);
                                    callback(null, repo);
                                })

                        },
                        function(error, reposWithReadme) {
                            $(reposWithReadme).each(function(index, value) {
                                var repoDict = {
                                    'name': value.name,
                                    'created': value.created_at,
                                    'repoUrl': value.clone_url,
                                    'language': value.language,
                                    'size': value.size,
                                    'avatar': value.owner.avatar_url,
                                    'owner': value.owner.login,
                                    'readme': value.readmeFile
                                };

                                repoData.repos.push(repoDict)
                                $scope.$apply();

                            });

                        }

                    );
                });
            }
        /**
         * Function for the async parallel function 
         * @return {null}
         */
        $scope.loadrepos = function() {
            repoData.repos = []
            var username = $scope.SearchTextField;


            if (username) {

                async.parallel([
                    repoData.addUserHist(),
                    repoData.addUserDetails(),
                    repoData.getData(username, oauth)
                ], function(err, results) { console.log(err.message) });


            }

        };


    });

    /**
     *
     * recentUsersController
     * 
     * Controller for recent users div
     */
    app.controller('recentUsersController', function($scope) {
        var ruc = this
        ruc.recentUsers = {}
        ruc.addUser = function(name) {
            ruc.recentUsers[name] = name
        };
        ruc.removeUser = function(name) {
            delete ruc.recentUsers[name];
        };
        ruc.searchAgain = function(name) {
            $scope.$parent.SearchTextField = name;
            $scope.$parent.loadrepos();
        };
        ruc.reverse = function() {
            return ruc.recentUsers.toArray().reverse();
        };

        $scope.$on('adduserEv', function(e) {
            ruc.addUser($scope.$parent.SearchTextField);
        });

    });

    /**
     *
     * githubUserController
     * 
     * Controller for GitHub User details div
     */
    app.controller('githubUserController', function($scope) {
        var guc = this;
        guc.userData = {}
        guc.loadUser = function(username) {

            if (username) {
                var url = 'https://api.github.com/users/' + username + '' + oauth;
                // push username to recent user array

                $.getJSON(url, function(data) {

                    $(data).each(function(index, value) {
                        guc.userData = {
                            username: value.login,
                            avatar: value.avatar_url,
                            name: value.name,
                            company: value.company,
                            blog: value.blog,
                            location: value.location,
                            email: value.email,
                            hireable: value.hireable,
                            bio: value.bio,
                            repos: value.public_repos,
                            followers: value.followers,
                            joined: formatJoinDate(value.created_at)
                        };
                        // $scope.$apply();

                    })
                }).error(function(jqxhr, textStatus, error) {
                    var err = textStatus + ", " + error;
                    console.log("Error getting User Details: " + err);
                });
            }
        }

        $scope.$on('adduserDet', function(e) {
            guc.loadUser($scope.$parent.SearchTextField);
        });


    });

    /**
     *
     * organisationUserController
     * 
     * Controller for Organization search  div
     */
    app.controller('organisationUserController', function($scope) {
        var ouc = this
        ouc.orgsData = []
        ouc.orgUsername = ''
        ouc.loadOrganisations = function(organisation) {
                var organisation = ouc.orgUsername;
                if (organisation) {
                    ouc.orgsData = []
                    var url = 'https://api.github.com/orgs/' + organisation + '/members' + oauth;
                    $.getJSON(url, function(data) {
                        $(data).each(function(index, value) {
                            var orgData = {
                                orgUsername: value.login
                            };
                            ouc.orgsData.push(orgData);
                            $scope.$apply();
                        })
                    }).error(function(jqxhr, textStatus, error) {
                        var err = textStatus + ", " + error;
                        console.log("Error looking for Organizations: " + err);
                    });
                }
            },
            ouc.searchOrgUser = function(username) {
                $scope.$parent.SearchTextField = username;
                $scope.$parent.loadrepos();
            }
    });

}());





////////////////////////////////////////////////////////////////////////////////////////////////

// function tempe(repo, callback){
//   var success = false;
//   var url = 'https://api.github.com/repos/'+username+'/'+repo.name+'/readme'+oauth;
//   $.getJSON(url, function(readme){
//     success = true;
//     repo.readmeFile = $.base64Decode(readme.content);
//     callback(null, repo);
//   });
//   setTimeout(function() {
//     if (!success)
//       {
//         repo.readmeFile = "No readme found";
//         callback(null, repo);
//       }
//   }, 2200);
// }



// var github_consts = function(){
//   var consts = {}
//   consts.client='a0c7eca13be271b6b94e';
//   consts.secret='10c63964d0e7e50a4d70f22c25c8403ebcc5d32f';
//   consts.oauth= '?client_id='+client+'&client_secret='+secret;
//   consts.baseurl='https://api.github.com/'
//   return (creds)

// }
