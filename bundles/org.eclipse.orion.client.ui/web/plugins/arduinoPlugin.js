/*global define eclipse document*/

define([
    "orion/bootstrap",
    "orion/status",
    "orion/progress",
    'orion/operationsClient',
    "orion/xhr",
    "orion/plugin",
    "orion/operation",
    "orion/Deferred",
    'orion/commandRegistry',
    'orion/commands',
    "domReady!"], function(mBootstrap, mStatus, mProgress, mOperationsClient, xhr, PluginProvider, Operation, Deferred, mCommandRegistry, mCommands) {
    mBootstrap.startup().then(function(core) {
        var serviceRegistry = core.serviceRegistry;
        var preferences = core.preferences;

        var headers = {
            name: "Arduino for Orion",
            version: "1.0.2",
            description: "This plugin provides a way to deploy Arduino sketches to an Arduino board"
        };

        var provider = new PluginProvider(headers);

        var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
        var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

        var serviceImpl = {
            run: function(item) {
                xhr("POST", "/arduino", { //$NON-NLS-0$
                    headers: {
                        "Orion-Version": "1", //$NON-NLS-0$
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify({
                        "command": "build",
                            "file": item.Location
                    }),
                    timeout: 15000
                }).then(function(result) {
                    buildResult = result.response ? JSON.parse(result.response) : null;
                    window.alert(buildResult.stdout + '\n' + buildResult.stderr);
                    return buildResult;
                }, function(error) {
                    return error.response ? JSON.parse(error.response) : null;
                });
            }
        };
        var serviceProps = {
            image: "http://arduino.cc/favicon.ico",
            name: "Arduino Build",
            id: "arduino.commands.build",
            forceSingleItem: true,
            tooltip: "Build an Arduino project",
            validationProperties: [{
                source: "Name",
                match: ".ino$"
            }]
        };
        provider.registerService("orion.navigate.command", serviceImpl, serviceProps);


        provider.registerService('orion.shell.command', {}, {
            name: 'arduino',
            description: 'Commands to manage Arduino scripts.'
        });

        var createArduinoShellCommand = function(commandName, commandDescription, fileExists) {

            provider.registerService('orion.shell.command', {
                callback: function(args, context) {
                    console.log('args: ' + args);
                    console.log('context: ' + context);


                    var deferred = new Deferred();

                    xhr("POST", "/arduino", { //$NON-NLS-0$
                        headers: {
                            "Orion-Version": "1", //$NON-NLS-0$
                            "Content-Type": "application/json"
                        },
                        data: JSON.stringify({
                            "command": commandName,
                                "file": context.cwd + '/' + args.inoFile.path
                        }),
                        timeout: 15000
                    }).then(function(result) {
                        buildResult = result.response ? JSON.parse(result.response) : null;
                        deferred.resolve(buildResult.stdout + '\n' + buildResult.stderr);
                        return;
                    }, function(error) {
                        deferred.resolve(error);
                        return;
                    });

                    return deferred;
                }
            }, {
                name: 'arduino ' + commandName,
                description: commandDescription,
                parameters: [{
                    name: 'inoFile',
                    type: {
                        name: "file",
                        file: true,
                        exist: true
                    },
                    description: 'The sketch to compile.'
                }],
                returnType: "text" //$NON-NLS-0$
            });
        }

        createArduinoShellCommand("build", "Builds an Arduino sketch.");
        createArduinoShellCommand("upload", "Uploads an Arduino sketch to the board.");
        createArduinoShellCommand("clean", "Cleans a compiled Arduino sketch.");
        //createArduinoShellCommand("init", "Inits an Arduino sketch.");


        provider.connect();
    })
});