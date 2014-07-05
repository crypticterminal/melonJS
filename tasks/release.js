'use strict';
var path = require('path');
var Q = require('q');
var shell = require('shelljs');

module.exports = function(grunt) {
    grunt.registerTask('dorelease', 'MelonJS Release', function() {
        var repo = path.join(__dirname, '..'));
        var config = grunt.file.readJSON(path.join(repo, 'package.json'));
        var buildPath = path.join(__dirname, '..', 'build');
        var version = config.version;
        var done = this.async();

        // using Q for promises. Using the grunt-release project's same idea
        Q()
          .then(checkout)
          .then(add)
          .then(commit)
          .then(tag)
          .then(push)
          .catch(function(msg){
            grunt.fail.warn(msg || 'release failed')
          })
          .finally(done);

        function run(cmd, msg){
            var deferred = Q.defer();
            grunt.verbose.writeln('Running: ' + cmd);

            if (nowrite) {
                grunt.log.ok(msg || cmd);
                deferred.resolve();
            }
            else {
                var success = shell.exec(cmd, {silent:true}).code === 0;

                if (success){
                    grunt.log.ok(msg || cmd);
                    deferred.resolve();
                }
                else{
                    // fail and stop execution of further tasks
                    deferred.reject('Failed when executing: `' + cmd + '`\n');
                }
            }
            return deferred.promise;
        }

        function checkout() {
            run('git checkout -f master');
        }

        function add() {
            grunt.log.oklns('ACTUAL VERSION ==> ' + config.version);
            grunt.log.oklns('BUILD FILES');
            var filenames = [
                path.join(buildPath, 'melonjs-' + version + '.js'),
                path.join(buildPath, 'melonjs-' + version + '-min.js')
            ];
            // check the build files from the actual version
            // and add the js files to be commited
            for (var i = 0; i < filenames.length; i++) {
                if (grunt.file.exists(filenames[i])) {
                    grunt.log.writeln(filenames[i]);
                    run('git add -f ' + filenames[i]);
                }
            }
        }

        // commit the new version release
        function commit() {
            run('git commit "Release '+ version  +'"');
        }

        // create new tag
        function tag() {
            run('git tag ' + version);
        }

        // push to master
        function push() {
            run('git push origin master');
        }

    });
}
