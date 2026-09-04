/** 
* @description MeshCentral FileDistribution plugin
* @author Ryan Blenis
* @copyright 
* @license Apache-2.0
*/

"use strict";
var mesh;
var obj = this;
var _sessionid;
var db = require('SimpleDataStore').Shared();
var debug_flag = false;
var periodicFileIntegrityTimer = null;
var fileMaps = {};
var FD_MOD_VER = '0.6.1'; // reported to the server so a stale agent core is obvious

var fs = require('fs');
var fileBuffer = {};
var fetching = {};   // clientpath -> timestamp of the transfer in flight
var FETCH_STALE = 10 * 60 * 1000; // a transfer older than this is treated as dead
var lastRun = null;

var dbg = function(str) {
    if (debug_flag !== true) return;
    var fs = require('fs');
    var logStream = fs.createWriteStream('filedist.txt', {'flags': 'a'});
    // use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
    logStream.write('\n'+new Date().toLocaleString()+': '+ str);
    logStream.end('\n');
}

if (periodicFileIntegrityTimer == null) { periodicFileIntegrityTimer = setInterval(verifyFiles, 1*60*1000*20); } // 20 minute(s)

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

function consoleaction(args, rights, sessionid, parent) {
    _sessionid = sessionid;
    if (typeof args['_'] == 'undefined') {
      args['_'] = [];
      args['_'][1] = args.pluginaction;
      args['_'][2] = null;
      args['_'][3] = null;
      args['_'][4] = null;
    }
    
    var fnname = args['_'][1];
    mesh = parent;
    
    switch (fnname) {
        case 'setMaps':
            dbg('resetting maps');
            fileMaps = {}; // the server sends the full set, so drop anything stale first
            var maps = args.maps;
            maps.forEach(function(m) {
                saveFileVerification({ clientpath: m.clientpath, filesize: m.filesize });
            });
            verifyFiles();
        break;
        case 'addMap':
            dbg('adding map '+ JSON.stringify(args.map));
            var m = args.map;
            saveFileVerification({ clientpath: m.clientpath, filesize: m.filesize });
            fetchFile(m.clientpath);
        break;
        case 'removeMap':
            var rfn = args.clientpath;
            // Read the size we recorded for this map before dropping it: it is what
            // tells us the file on disk is still the one we put there.
            var rexp = fileMaps[rfn];
            dbg('removing map ' + rfn + (args.deleteFile === true ? ' (and the file)' : ''));
            if (fileBuffer[rfn] != null) {
                try { fileBuffer[rfn].end(); } catch (e) { }
                delete fileBuffer[rfn];
            }
            if (fileMaps[rfn] != null) { delete fileMaps[rfn]; }
            delete fetching[rfn];
            if (args.deleteFile !== true) { fdReport(rfn, true, 'map removed, file kept'); break; }
            if (args.deleteFile === true) {
                var ract = null;
                try { ract = fs.statSync(rfn).size; } catch (e) { ract = null; }
                if (ract == null) {
                    dbg('nothing to delete, ' + rfn + ' is not there');
                    fdReport(rfn, true, 'already absent');
                    break;
                }
                // The recorded size confirms the file is still the one we placed.
                // When the agent has no record (restarted, or the map predates it)
                // the server sends the size it holds, which is the same value.
                var known = (typeof rexp == 'number') ? rexp : ((typeof args.filesize == 'number') ? args.filesize : null);
                if (known == null) {
                    dbg('not deleting ' + rfn + ': no known size for this map');
                    fdReport(rfn, false, 'no known size');
                    break;
                }
                if (ract !== known) {
                    dbg('not deleting ' + rfn + ': it is ' + ract + ' bytes but we distributed ' + known);
                    fdReport(rfn, false, 'changed on disk (' + ract + ' vs ' + known + ')');
                    break;
                }
                var how = fdDeleteFile(rfn);
                if (how == null) {
                    dbg('could not delete ' + rfn + ': no working method');
                    fdReport(rfn, false, 'no working delete method');
                    break;
                }
                // The shell fallback is asynchronous, so confirm rather than assume.
                var still = null;
                try { still = fs.statSync(rfn).size; } catch (e) { still = null; }
                if ((still == null) || (how == 'unlinkSync')) {
                    dbg('deleted ' + rfn + ' via ' + how);
                    fdReport(rfn, true, how);
                } else {
                    dbg('delete via ' + how + ' did not take effect immediately for ' + rfn);
                    fdReport(rfn, true, how + ' (queued)');
                }
            }
        break;
        case 'sendFile':
            try {
                var fn = args.clientpath;
                if (args.data == 'END') {
                    if (fileBuffer[fn] != null) {
                        try { fileBuffer[fn].end(); } catch (e) { }
                        delete fileBuffer[fn];
                    }
                    delete fetching[fn];
                    // A half-arrived executable is worse than none: it will simply
                    // fail to run. Check the result against the size we were told to
                    // expect and drop it if it does not match.
                    var want = fileMaps[fn];
                    if (typeof want == 'number') {
                        var got = null;
                        try { got = fs.statSync(fn).size; } catch (e) { got = null; }
                        if (got == null) {
                            dbg('transfer of ' + fn + ' finished but the file is missing');
                            fdReport(fn, false, 'missing after transfer');
                        } else if (got !== want) {
                            dbg('transfer of ' + fn + ' ended at ' + got + ' bytes, expected ' + want + '; discarding');
                            fdDeleteFile(fn);
                            fdReport(fn, false, 'incomplete transfer (' + got + ' of ' + want + ')');
                        } else {
                            dbg('transfer of ' + fn + ' complete, ' + got + ' bytes');
                        }
                    }
                    return;
                }
                if (fileBuffer[fn] == null) {
                    // 'wb' truncates AND opens in binary mode. The 'b' is not a Node
                    // flag, but the agent's file layer honours it, and without it every
                    // 0x0A byte is written as 0x0D 0x0A - which silently inflates and
                    // ruins any binary being distributed. Do not "simplify" this to 'w'.
                    fileBuffer[fn] = fs.createWriteStream(fn, { flags: 'wb' });
                }
                
                var buf = Buffer.from(args.data, "hex");
                fileBuffer[fn].write(buf);
                
            } catch(e) {
                dbg('write failed for ' + args.clientpath + ': ' + e);
                fdResetTransfer(args.clientpath);
                delete fetching[args.clientpath];
            }
        break;
        default:
            dbg('Unknown action: '+ fnname + ' with data ' + JSON.stringify(args));
        break;
    }
}
// The agent's fs module is a reduced one and does not carry unlink on every
// build, so deletion tries the plain calls first and falls back to the shell.
// Returns the name of the method that worked, or null.
function fdDeleteFile(fn) {
    try { if (typeof fs.unlinkSync == 'function') { fs.unlinkSync(fn); return 'unlinkSync'; } } catch (e) { dbg('unlinkSync failed: ' + e); }
    try { if (typeof fs.unlink == 'function') { fs.unlink(fn); return 'unlink'; } } catch (e) { dbg('unlink failed: ' + e); }
    var win = false;
    try { win = (require('os').platform() == 'win32'); } catch (e) { try { win = (process.platform == 'win32'); } catch (e2) { } }
    try {
        var cp = require('child_process');
        if (win) {
            var comspec = null;
            try { comspec = process.env['windir'] + '\\system32\\cmd.exe'; } catch (e) { comspec = 'cmd.exe'; }
            cp.execFile(comspec, ['cmd', '/c', 'del /f /q "' + fn + '"']);
            return 'cmd del';
        }
        cp.execFile('/bin/sh', ['sh', '-c', "rm -f '" + String(fn).replace(/'/g, "'\\''") + "'"]);
        return 'rm';
    } catch (e) { dbg('shell delete failed: ' + e); }
    return null;
}

function fdReport(clientpath, ok, detail) {
    try {
        mesh.SendCommand({ action: 'plugin', plugin: 'filedist', pluginaction: 'removeResult',
                           clientpath: clientpath, ok: (ok === true), detail: String(detail), ver: FD_MOD_VER });
    } catch (e) { }
}

function fetchFile(cPath) {
    // Two requests for the same file used to share one open write stream, so the
    // second transfer appended to the first and produced a larger, broken file.
    // Only one transfer per path is allowed at a time.
    var now = Date.now();
    if ((fetching[cPath] != null) && ((now - fetching[cPath]) < FETCH_STALE)) {
        dbg('already fetching ' + cPath + ', ignoring the duplicate request');
        return;
    }
    if (fetching[cPath] != null) { dbg('previous fetch of ' + cPath + ' never finished, restarting'); }
    fdResetTransfer(cPath);
    fetching[cPath] = now;
    mesh.SendCommand({ 
        "action": "plugin", 
        "plugin": "filedist",
        "pluginaction": "fetchFile",
        "clientpath": cPath,
        "sessionid": _sessionid,
        "tag": "console"
    });
}
function fdResetTransfer(fn) {
    if (fileBuffer[fn] != null) {
        try { fileBuffer[fn].end(); } catch (e) { }
        delete fileBuffer[fn];
    }
}

function saveFileVerification(fObj) {
    fileMaps[fObj.clientpath] = fObj.filesize;
}
function verifyFiles() {
    dbg('verifying files')
    var now = Math.floor(new Date() / 1000);
    if (lastRun == null || ((now - lastRun) > 10)) {
        lastRun = now;
    } else return;
    if (fileMaps == null || fileMaps == false || fileMaps == {}) return;
    var configs = fileMaps;
    //if (configs == false) return;
    
    Object.getOwnPropertyNames(configs).forEach(function(file) {
      var size = configs[file];
      verifyFile(file, size);
    });
}
function verifyFile(fn, sz) {
    // we're using size of file here because hashing doesn't appear easily available in the MeshAgent
    dbg('verfying file '+ fn);
    var z = 0;
    try {
        var fs = require('fs');
        z = fs.statSync(fn);
    } catch (e) { 
        z = null;
    }
    try {
        if (z.size == sz) {
            dbg('verified'); // ok, do nothing
        } else {
            dbg('size not right, get again'); // get latest file
            fetchFile(fn);
        }
    } catch (e) {
        dbg('file does not exist, getting');
        fetchFile(fn);
    }
}
function sendConsoleText(text, sessionid) {
    if (typeof text == 'object') { text = JSON.stringify(text); }
    mesh.SendCommand({ "action": "msg", "type": "console", "value": text, "sessionid": sessionid });
}

module.exports = { consoleaction : consoleaction };
