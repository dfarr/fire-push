
var format = require('string-format');
var uuid = require('node-uuid');
var exec = require('child_process').exec;

var localGitRepos = [
    {dir: '.', remote: 'origin', branch: 'fire/' + uuid.v4()}
];

var cmd = 'cd {0}; git add . && git commit -m "fire commit" && git push -f {1} HEAD:{2};';

var firebase = new Firebase('wss://developer-api.nest.com');

firebase.authWithCustomToken(process.env.TOKEN, function() {});

firebase.once('value', function(snapshot) {

    var alarms = snapshot.child('devices/smoke_co_alarms');

    for(var id in alarms.val()) {

        var alarm = alarms.child(id);

        alarm.child('smoke_alarm_state').ref().on('value', function(state) {

            console.log(state.val());

            if(state.val() === 'emergency') {

                // fire push each repo
                localGitRepos.forEach(function(repo) {
                    exec(format(cmd, repo.dir, repo.remote, repo.branch), function(err, stdout, stderr) {
                        console.log(err, stdout, stderr);
                    });
                });
            }

        });
    }
});
