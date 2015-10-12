
var module = angular.module('app', ['firebase', 'ui.bootstrap']);
var format = require('string-format');
var uuid = require('node-uuid');
var exec = require('child_process').exec;
var Firebase = require('firebase');

angular.element(document).ready(function() {
    angular.bootstrap(document, ['app']);
});

module.controller('AppCtrl', ['$scope', function($scope) {

    $scope.state = 'ok';

    $scope.repos = [];

    try {
        $scope.repos = JSON.parse(localStorage.repos) || [];
    } catch(ex) {}

    $scope.cmd = localStorage.cmd || 'cd {0} && git add . && git commit -m "fire commit" && git push -f {1} HEAD:{2}/{3}';

    var firebase = new Firebase('wss://developer-api.nest.com');

    firebase.authWithCustomToken(process.env.TOKEN, function() {});

    firebase.once('value', function(snapshot) {

        var alarms = snapshot.child('devices/smoke_co_alarms');

        for(var id in alarms.val()) {

            var alarm = alarms.child(id);

            alarm.child('smoke_alarm_state').ref().on('value', function(state) {

                $scope.$apply(function() {
                    $scope.state = state.val();
                });

                if(state.val() === 'emergency') {

                    // fire push each repo
                    $scope.repos.forEach(function(repo) {
                        exec(format($scope.cmd, repo.path, repo.remote, repo.branch, repo.uuid), function(err, stdout, stderr) {
                            $scope.$apply(function() {
                                repo.stdout = stdout;
                                repo.stderr = stderr;
                                repo.uuid = uuid.v4();
                            });
                        });
                    });
                }
            });
        }
    });

    //
    // Actions
    //

    $scope.add = {};

    $scope.addRepo = function() {
        $scope.repos.push({
            path: $scope.add.path, 
            remote: $scope.add.remote, 
            branch: $scope.add.branch, 
            uuid: uuid.v4()
        });

        $scope.add = {};
    };

    $scope.rmvRepo = function(i) {
        $scope.repos.splice(i, 1);
    };

    //
    // Watches
    //

    $scope.$watch('repos', function(repos) {
        localStorage.repos = JSON.stringify(repos);
    }, true);

    $scope.$watch('cmd', function(cmd) {
        localStorage.cmd = cmd;
    });

}]);
