/**
* @description MeshCentral File Distribution Plugin
* @author Ryan Blenis
* @license Apache-2.0
*
* Fork notes
* ----------
* Upstream (0.0.5) did not check any rights in serveraction: an authenticated
* user could map an arbitrary server file onto an arbitrary node, including
* nodes they cannot see. Every user-facing action now resolves the node and
* verifies the caller's rights on it before touching the database.
*/

"use strict";

module.exports.filedist = function (parent) {
    var obj = {};
    obj.parent = parent; // keep a reference to the parent
    obj.meshServer = parent.parent;
    obj.debug = obj.meshServer.debug;
    obj.db = null;
    obj.VIEWS = __dirname + '/views/';
    obj.path = require('path');
    obj.intervalTimer = null;
    obj.exports = [
      'onDeviceRefreshEnd',
      'mapData'
    ];
    var PLUGIN_L = 'filedist';
    var PLUGIN_C = 'FileDist';

    var MESHRIGHT_MANAGECOMPUTERS = 4;
    var FULLRIGHTS = 0xFFFFFFFF;

    obj.sendAllMaps = function(comp, maps) {
        const command = {
            action: 'plugin',
            plugin: 'filedist',
            pluginaction: 'setMaps',
            maps: maps
        };
        try {
            obj.debug('PLUGIN', PLUGIN_C, 'Sending file maps to ' + comp);
            obj.meshServer.webserver.wsagents[comp].send(JSON.stringify(command));
        } catch (e) {
            obj.debug('PLUGIN', PLUGIN_C, 'Could not send file maps to ' + comp);
        }
    };

    obj.sendMap = function(comp, map) {
        const command = {
            action: 'plugin',
            plugin: 'filedist',
            pluginaction: 'addMap',
            map: map
        };
        try {
            obj.debug('PLUGIN', PLUGIN_C, 'Sending file map to ' + comp);
            obj.meshServer.webserver.wsagents[comp].send(JSON.stringify(command));
        } catch (e) {
            obj.debug('PLUGIN', PLUGIN_C, 'Could not send file map to ' + comp);
        }
    };

    // ------------------------------------------------------------------
    //  Authorisation
    // ------------------------------------------------------------------

    // Resolves the node and decides whether this user may distribute files to it.
    // Anything it cannot positively confirm is refused.
    obj.userCanManageNode = function (user, nodeid, func) {
        if ((user == null) || (typeof nodeid != 'string') || (nodeid.indexOf('node//') != 0)) { func(false, null); return; }
        if (user.siteadmin == FULLRIGHTS) {
            obj.meshServer.db.Get(nodeid, function (err, docs) {
                if ((err != null) || !Array.isArray(docs) || (docs.length == 0)) { func(false, null); return; }
                func(true, docs[0]);
            });
            return;
        }
        obj.meshServer.db.Get(nodeid, function (err, docs) {
            if ((err != null) || !Array.isArray(docs) || (docs.length == 0)) { func(false, null); return; }
            var node = docs[0];
            if (node.domain != user.domain) { func(false, null); return; }
            var rights = 0;
            if (user.links != null) {
                if ((node.meshid != null) && (user.links[node.meshid] != null)) { rights |= (user.links[node.meshid].rights | 0); }
                if (user.links[nodeid] != null) { rights |= (user.links[nodeid].rights | 0); }
            }
            var ok = ((rights == FULLRIGHTS) || ((rights & MESHRIGHT_MANAGECOMPUTERS) != 0));
            func(ok, ok ? node : null);
        });
    };

    // The server path arrives from the browser, so it is checked before it is
    // turned into a filesystem path. Segments that could climb out of the files
    // folder are refused outright rather than escaped.
    obj.isSafeServerPath = function (path) {
        if ((typeof path != 'string') || (path.length == 0) || (path.length > 1024)) return false;
        if (path.indexOf('\0') != -1) return false;
        var p = path.split('/');
        if (p.length < 4) return false;
        if ((p[0] != 'user') && (p[0] != 'mesh')) return false;
        for (var i = 0; i < p.length; i++) {
            if (i == 1) continue; // domain segment, empty on the default domain
            if ((p[i] == '') || (p[i] == '.') || (p[i] == '..')) return false;
            if (p[i].indexOf('\\') != -1) return false;
        }
        return true;
    };

    // The client path is written by the agent, so it only gets sanity checks here.
    obj.isSaneClientPath = function (path) {
        return (typeof path == 'string') && (path.trim().length > 0) && (path.length <= 1024) && (path.indexOf('\0') == -1);
    };

    obj.hook_agentCoreIsStable = function(myparent, gp) { // check for remaps when an agent logs in
        obj.db.getFileMapsForNode(myparent.dbNodeKey)
        .then((maps) => {
            if (maps.length) {
                obj.sendAllMaps(myparent.dbNodeKey, maps);
            }
        })
    };

    obj.checkFileSizes = function() {
        // check files to see if they've changed for linked maps
        var onlineAgents = Object.keys(obj.meshServer.webserver.wsagents);
        var checked = [];
        obj.db.getServerFiles()
        .then((maps) => {
            if (maps.length) {
                maps.forEach(function(m) {
                    if (checked.indexOf(m.serverpath) == -1) {
                        checked.push(m.serverpath);
                        var real = obj.isSafeServerPath(m.serverpath) ? obj.getServerFilePath(m.serverpath) : null;
                        if (real == null) {
                            obj.debug('PLUGIN', PLUGIN_C, 'Skipping map with an unusable server path: ' + m.serverpath);
                            return;
                        }
                        var sz = 0;
                        try {
                            var fs = require('fs');
                            sz = fs.statSync(real.fullpath).size;
                        } catch (e) {
                            sz = null;
                        }
                        if (m.filesize != sz) {
                            obj.db.updateMany({ type: 'map', serverpath: m.serverpath }, { filesize: sz })
                            .then(() => {
                                // only online nodes; offline ones get fresh maps when they reconnect
                                obj.db.getNodesForServerPath(m.serverpath, onlineAgents)
                                .then((maps) => {
                                    if (maps.length) {
                                        maps.forEach(function(ma) {
                                            obj.sendMap(ma.node, ma);
                                        });
                                    }
                                });
                            })
                        }
                    }
                })
            }
        })
    };

    obj.resetQueueTimer = function() {
        if (obj.intervalTimer != null) { clearInterval(obj.intervalTimer); }
        obj.intervalTimer = setInterval(obj.checkFileSizes, 1 * 60 * 1000 * 20); // every 20 minutes
    };

    obj.server_startup = function() {
        obj.meshServer.pluginHandler.filedist_db = require (__dirname + '/db.js').CreateDB(obj.meshServer);
        obj.db = obj.meshServer.pluginHandler.filedist_db;
        obj.resetQueueTimer();
    };

    obj.onDeviceRefreshEnd = function() {
        pluginHandler.registerPluginTab({
            tabTitle: 'File Distribution ',
            tabId: 'pluginFileDist'
        });
        QA('pluginFileDist', '<iframe id="pluginIframeFileDist" style="width: 100%; height: 800px;" scrolling="no" frameBorder=0 src="/pluginadmin.ashx?pin=filedist&user=1&node='+ currentNode._id +'" />');
    };

    obj.mapData = function (message) {
        if (typeof pluginHandler.filedist.loadMaps == 'function') pluginHandler.filedist.loadMaps(message);
    };

    obj.handleAdminReq = function(req, res, user) {
        if ((user == null) || (user.siteadmin == null)) { res.sendStatus(401); return; }
        var isAdmin = (user.siteadmin == FULLRIGHTS);

        if (req.query.admin == 1) {
            if (!isAdmin) { res.sendStatus(401); return; }
            res.render(obj.VIEWS + 'admin', {});
            return;
        } else if (req.query.user == 1) {
            // The device page asks for its own file maps. Only hand them over if
            // this user is allowed to manage that device.
            obj.userCanManageNode(user, req.query.node, function (ok) {
                if (!ok) { res.sendStatus(401); return; }
                obj.db.getFileMapsForNode(req.query.node)
                .then(maps => {
                    res.render(obj.VIEWS + 'user', { filemaps: JSON.stringify(maps) });
                })
                .catch(() => { res.sendStatus(500); });
            });
            return;
        } else if (req.query.include == 1) {
            switch (req.query.path.split('/').pop().split('.').pop()) {
                case 'css':     res.contentType('text/css'); break;
                case 'js':      res.contentType('text/javascript'); break;
            }
            res.sendFile(__dirname + '/includes/' + req.query.path); // don't freak out. Express covers any path issues.
            return;
        }
        res.sendStatus(401);
        return;
    };

    obj.getServerFilePath = function (path) {
        if (!obj.isSafeServerPath(path)) return null;
        var splitpath = path.split('/'), serverpath = obj.meshServer.path.join(obj.meshServer.filespath, 'domain'), filename = '';
        if (splitpath[1] != '') { serverpath += '-' + splitpath[1]; } // Add the domain if needed
        serverpath += ('/' + splitpath[0] + '-' + splitpath[2]);
        for (var i = 3; i < splitpath.length; i++) { if (obj.meshServer.common.IsFilenameValid(splitpath[i]) == true) { serverpath += '/' + splitpath[i]; filename = splitpath[i]; } else { return null; } } // Check that each folder is correct
        var full = obj.meshServer.path.resolve(obj.meshServer.filespath, serverpath);
        // Final guard: whatever the segments were, the result must stay inside the files folder.
        var root = obj.meshServer.path.resolve(obj.meshServer.filespath);
        if ((full != root) && (full.indexOf(root + obj.path.sep) != 0)) return null;
        return { fullpath: full, path: serverpath, name: filename };
    };

    obj.sendFile = function(comp, serverpath, clientpath, size) {
        const command = {
            action: 'plugin',
            plugin: PLUGIN_L,
            pluginaction: 'sendFile',
            clientpath: clientpath
        };
        var realPath = obj.getServerFilePath(serverpath);
        if (realPath == null) {
            obj.debug('PLUGIN', PLUGIN_C, 'Refusing to send an unusable server path (' + serverpath + ') to ' + comp);
            return;
        }
        try {
            obj.debug('PLUGIN', PLUGIN_C, 'Sending file to ' + comp);
            var fs = require('fs');
            var path = realPath.fullpath;
            try {
                fs.statSync(path);
                var readStream = fs.createReadStream(path, { encoding: "hex" });
                readStream.on('data', function (chunk) {
                    command.data = chunk;
                    obj.meshServer.webserver.wsagents[comp].send(JSON.stringify(command));
                })
                readStream.on('end', function (chunk) {
                    command.data = 'END';
                    obj.meshServer.webserver.wsagents[comp].send(JSON.stringify(command));
                })
            } catch (e) {
                obj.debug('PLUGIN', PLUGIN_C, 'Could not send file (' + serverpath + ') to ' + comp + '. File may be missing. Info: ' + e.stack);
            }
        } catch (e) {
            obj.debug('PLUGIN', PLUGIN_C, 'Could not send file to ' + comp + e.stack);
        }
    };

    obj.updateFrontEnd = async function(ids){
        if (ids.maps != null) {
            obj.db.getFileMapsForNode(ids.nodeId)
            .then((nodeMaps) => {
                var targets = ['*', 'server-users'];
                obj.meshServer.DispatchEvent(targets, obj, { nolog: true, action: 'plugin', plugin: PLUGIN_L, pluginaction: 'mapData', nodeId: ids.nodeId, mapData: nodeMaps });
            });
        }
    };

    obj.serveraction = function(command, myparent, grandparent) {
        var user = myparent.user;
        switch (command.pluginaction) {
            case 'addFileMap': {
                if (!obj.isSafeServerPath(command.spath) || !obj.isSaneClientPath(command.cpath)) {
                    obj.debug('PLUGIN', PLUGIN_C, 'Refused addFileMap with an unusable path');
                    return;
                }
                obj.userCanManageNode(user, command.currentNodeId, function (ok) {
                    if (!ok) { obj.debug('PLUGIN', PLUGIN_C, 'Refused addFileMap: no rights on ' + command.currentNodeId); return; }
                    var realPath = obj.getServerFilePath(command.spath);
                    if (realPath == null) { return; }
                    var sz = 0;
                    try {
                        var fs = require('fs');
                        sz = fs.statSync(realPath.fullpath).size;
                    } catch (e) {
                        sz = null;
                    }
                    obj.db.addFileMap(command.currentNodeId, command.spath, command.cpath, sz)
                    .then(() => obj.updateFrontEnd({ maps: true, nodeId: command.currentNodeId }))
                    .then(() => {
                        obj.sendMap(command.currentNodeId, { clientpath: command.cpath, filesize: sz });
                    })
                    .catch(e => console.log('PLUGIN: FileDistribution: Unable to send map'))
                });
                break;
            }
            case 'deleteMap': {
                // The node is taken from the stored map, not from the message, so a
                // caller cannot name a node they do have rights on to delete a map
                // belonging to one they do not.
                obj.db.get(command.id)
                .then(maps => {
                    if (!Array.isArray(maps) || (maps.length == 0)) return;
                    var map = maps[0];
                    obj.userCanManageNode(user, map.node, function (ok) {
                        if (!ok) { obj.debug('PLUGIN', PLUGIN_C, 'Refused deleteMap: no rights on ' + map.node); return; }
                        obj.db.delete(command.id)
                        .then(() => { obj.updateFrontEnd({ maps: true, nodeId: map.node }); })
                        .catch(e => console.log('PLUGIN: FileDistribution: Unable to delete map'))
                    });
                })
                .catch(e => console.log('PLUGIN: FileDistribution: Unable to look up map'))
                break;
            }
            case 'fetchFile': {
                // This one comes from an agent, not a browser: the node is the
                // authenticated connection itself, so no user rights apply.
                if (myparent.dbNodeKey == null) return;
                obj.db.findFileForNode(myparent.dbNodeKey, command.clientpath)
                .then(maps => {
                    if (!Array.isArray(maps) || (maps.length == 0)) return;
                    var map = maps[0];
                    obj.sendFile(map.node, map.serverpath, map.clientpath, map.filesize);
                })
                .catch(e => console.log('PLUGIN: FileDistribution: Could not complete fetchFile', e.stack))
                break;
            }
            default:
                console.log('PLUGIN: FileDistribution: unknown action');
            break;
        }
    };

    return obj;
}
