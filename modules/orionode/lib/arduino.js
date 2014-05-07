/*global module require*/
var connect = require('connect');
var api = require('./api'),
    write = api.write,
    writeError = api.writeError;
var resource = require('./resource');
var fileUtil = require('./fileUtil');

/*
 *
 * Module begins here
 *
 */
module.exports = function(options) {
    var arduinoRoot = options.root;
    var workspaceDir = options.workspaceDir;


    var getSafeFilePath = fileUtil.safeFilePath.bind(null, workspaceDir);

    /*
     * Handler begins here
     */
    return connect()
        .use(connect.json())
        .use(resource(arduinoRoot, {
        GET: function(req, res, next, rest) {
            write(200, res, {}, {
                hello: 'world'
            });
        },

        POST: function(req, res, next, rest) {
            // Requests look like "/arduino/build?file=xxx.ino"

            var filepath = getSafeFilePath(api.rest('/file', req.body.file));
            var command = req.body.command;

            var exec = require('child_process').exec;

            exec("cd $(dirname " + filepath + ")/.. && ino " + command, function(error, stdout, stderr) {
                write(200, res, {}, {
                    stdout: stdout.toString(),
                    stderr: stderr.toString()
                });
            });



        },
    }));
}