/* 
 espruino-tools
 --------------

 https://github.com/espruino/espruino-tools

 Copyright 2015 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

*/
var fs = require("fs");

// override default console.log
var log = console.log;
console.log = function() {
  if (args.verbose)
    log.apply(console, arguments);
}
// Parse Arguments
var args = {
  ports: []
};
var isNextInvalid = function(next) {
  return !next || next.indexOf("-") !== -1 || next.indexOf(".js") !== -1;
}
for (var i=2;i<process.argv.length;i++) {
  var arg = process.argv[i];
  var next = process.argv[i+1];
  if (arg[0]=="-") {
    if (arg=="-h" || arg=="--help") args.help = true;
    else if (arg=="-v" || arg=="--verbose") args.verbose = true;
    else if (arg=="-q" || arg=="--quiet") args.quiet = true;
    else if (arg=="-c" || arg=="--color") args.color = true;
    else if (arg=="-m" || arg=="--minify") args.minify = true;
    else if (arg=="-p" || arg=="--port") { 
      args.ports.push(next); 
      var j = (++i) + 1;
      while (!isNextInvalid(process.argv[j])) {
        args.ports.push(process.argv[j++]);
        i++;
      }
      if (isNextInvalid(next)) throw new Error("Expecting a port argument to -p, --port"); 
    } else if (arg=="-e") { 
      i++; args.expr = next; 
      if (isNextInvalid(next)) throw new Error("Expecting an expression argument to -e"); 
    } else if (arg=="-f") { 
      i++; args.updateFirmware = next; 
      if (isNextInvalid(next)) throw new Error("Expecting a filename argument to -f"); 
    } else throw new Error("Unknown Argument '"+arg+"', try --help");
  } else {
    if ("file" in args)
      throw new Error("File already specified as '"+args.file+"'");
    args.file = arg;
  }
}
// if nothing, show help and exit
if (process.argv.length==2) 
  args.help = true;
// Extra argument stuff
args.espruinoPrefix = args.quiet?"":"--]";
args.espruinoPostfix = "";
if (args.color) {
  args.espruinoPrefix = "\033[32m";
  args.espruinoPostfix = "\033[0m";
}
// this is called after Espruino tools are loaded, and
// sets up configuration as requested by the command-line options
function setupConfig(Espruino) {
  if (args.minify) Espruino.Config.MINIFICATION_LEVEL = "SIMPLE_OPTIMIZATIONS";
}

// header
if (!args.quiet) {
  log(
    "espruino-tools\n"+
    "--------------\n"+
    "");
}

// Help
if (args.help) {
  ["USAGE: ./espruinotool ...options... [file_to_upload.js]",
   "",
   "  -h,--help               : Show this message",
   "  -v,--verbose            : Verbose",
   "  -q,--quiet              : Quiet - apart from Espruino output",
   "  -m,--minify             : Minify the code before sending it",
   "  -p,--port /dev/ttyX     : Specify port(s) to connect to",
   "  -f firmware.bin         : Update Espruino's firmware to the given file",
   "                              Espruino must be in bootloader mode",
   "  -e command              : Evaluate the given expression on Espruino",
   "                              If no file to upload is specified but you use -e,",
   "                              Espruino will not be reset", 
   "",
   "Please report bugs via https://github.com/espruino/espruino-tools/issues",
   ""].
    forEach(function(l) {log(l);});  
  process.exit(1);
}


/* load all files in EspruinoTools... we do this so we can still
use these files normally in the Web IDE */
function loadJS(filePath) {
  console.log("Found "+filePath);
  var contents = fs.readFileSync(filePath, {encoding:"utf8"});
  return eval(contents);
}
function loadDir(dir) {
  var files = fs.readdirSync(dir);
  for (var i in files) {
    if (files[i].substr(-3)==".js")
      loadJS(dir+"/"+files[i]);
  }
}

// ---------------
var stuffToRun = [];
// ---------------
var navigator = { userAgent : "node" };
var document = {};
var env = require('jsdom').env;
var $,document;
var Espruino;

try {
  var acorn = require("acorn");
  acorn.walk = require("acorn/util/walk");
} catch(e) {
  console.log("Acorn library not found - you'll need it for compiled code");
}

env("<html></html>", function (errors, window) {
  // Fixing up to fake web browser
  $ = require('jquery')(window);        
  XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
  $.support.cors = true;
  $.ajaxSettings.xhr = function() {
      return new XMLHttpRequest();
  };
  document = window.document;

  // ---------------
  //console.log(__dirname);
  loadDir(__dirname+"/EspruinoTools/libs");
  Espruino = loadJS(__dirname+"/EspruinoTools/espruino.js");
  loadDir(__dirname+"/EspruinoTools/core");
  loadDir(__dirname+"/EspruinoTools/plugins");

  Espruino.Core.Notifications = {
    success : function(e) { log(e); },
    error : function(e) { console.error(e); },
    warning : function(e) { console.warn(e); },
    info : function(e) { console.log(e); }, 
  };

  $(main);
});

function connect(port, exitCallback) {
  if (!args.quiet) log("Connecting to '"+port+"'");
  var currentLine = "";
  var exitCallback, exitTimeout;
  Espruino.Core.Serial.startListening(function(data) {
   currentLine += data;
   while (currentLine.indexOf("\n")>=0) {
     var i = currentLine.indexOf("\n");
     log(args.espruinoPrefix + currentLine.substr(0,i)+args.espruinoPostfix);
     currentLine = currentLine.substr(i+1);
   }
   // if we're waiting to exit, make sure we wait until nothing has been printed
   if (exitTimeout && exitCallback) {
     clearTimeout(exitTimeout);
     exitTimeout = setTimeout(exitCallback, 500);
   }   
  });
  Espruino.Core.Serial.open(port, function() {
    if (!args.quiet) log("Connected");
    // figure out what code we need to send
    var code = "";
    if (args.file) {
      code = fs.readFileSync(args.file, {encoding:"utf8"});
    }
    if (args.expr) {  
      if (code) {
        if (code[code.length-1]!="\n")
          code += "\n";        
      } else
        Espruino.Config.RESET_BEFORE_SEND = false;
      code += args.expr+"\n";
    }
    // Do we need to update firmware?
    if (args.updateFirmware) {
      if (code) throw new Error("Can't update firmware *and* upload code right now.");
      Espruino.Core.Flasher.flashBinaryToDevice(fs.readFileSync(args.updateFirmware, {encoding:"binary"}), function(err) {
        log(err ? "Error!" : "Success!");
        exitTimeout = setTimeout(exitCallback, 500);
      });
    }
    // send code over here...
    if (code)
      Espruino.callProcessor("transformForEspruino", code, function(code) {
        Espruino.Core.CodeWriter.writeToEspruino(code, function() {
          exitTimeout = setTimeout(exitCallback, 500);
        }); 
      });
    //
    // ---------------------- 
   }, function() {
     log("Disconnected");
   });
}

function main() {
  setupConfig(Espruino);

  if (Espruino.Core.Serial === undefined) {
    console.error("No serial driver found");
    return;
  }
  if (args.ports.length > 0) {
    //closure for stepping through each port 
    //and connect + upload (use timout callback [iterate] for proceeding)
    (function (ports, connect) {
      this.ports = ports;
      this.idx = 0;
      this.connect = connect;
      this.iterate = function() {
        (idx>=ports.length?process.exit(0):connect(ports[idx++],iterate));
      }
      iterate();
    })(args.ports, connect); 
  } else {    
    log("Searching for serial ports...");
    Espruino.Core.Serial.getPorts(function(ports) {
      console.log(ports);
      if (ports.length>0) 
        connect(ports[0], function() { process.exit(0); });
      else
        throw new Error("No Ports Found");        
    });
  }
}
