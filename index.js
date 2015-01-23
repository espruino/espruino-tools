var fs = require("fs");
// override default console.log
var log = console.log;
console.log = function() {
  if (args.verbose)
    log.apply(console, arguments);
}
// logo
log(
  "espruino-tools\n"+
  "--------------\n"+
  "");
// Parse Arguments
var args = {};
for (var i=2;i<process.argv.length;i++) {
  var arg = process.argv[i];
  var next = process.argv[i+1];
  if (arg[0]=="-") {
    if (arg=="-h" || arg=="--help") args.help = true;
    else if (arg=="-v" || arg=="--verbose") args.verbose = true;
    else if (arg=="-q" || arg=="--quiet") args.quiet = true;
    else if (arg=="-c" || arg=="--color") args.color = true;
    else if (arg=="-p" || arg=="--port") { i++; args.port = next; if (!next) throw new Error("Expecting a port argument"); }
    else if (arg=="-e") { i++; args.expr = next; if (!next) throw new Error("Expecting an expression argument"); }
    else throw new Error("Unknown Argument '"+arg+"', try --help");
  } else {
    if ("file" in args)
      throw new Error("File already specified as '"+args.file+"'");
    args.file = arg;
  }
}
// Extra argument stuff
args.espruinoPrefix = args.quiet?"":"--]";
args.espruinoPostfix = "";
if (args.color) {
  args.espruinoPrefix = "\033[32m";
  args.espruinoPostfix = "\033[0m";
}

// Help
if (args.help) {
  ["USAGE: ./espruinotool file_to_upload.js",
   "",
   "  -h,--help               : show this message",
   "  -v,--verbose            : verbose",
   "  -q,--quiet              : quiet - apart from Espruino output",
   "  -p,--port /dev/ttyX     : specify port to connect to",
   "  -e command              : evaluate the given expression on Espruino",
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
  var contents = fs.readFileSync(filePath).toString();
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

env("<html></html>", function (errors, window) {
    $ = require('jquery')(window);    
    document = window.document;

    // ---------------
    //console.log(__dirname);
    Espruino = loadJS(__dirname+"/EspruinoTools/espruino.js");
    loadDir(__dirname+"/EspruinoTools/core");
    loadDir(__dirname+"/EspruinoTools/plugins");

    $(main);
});

function connect(port) {
  log("Connecting to '"+port+"'");
  var currentLine = "";
  Espruino.Core.Serial.startListening(function(data) {
   currentLine += data;
   while (currentLine.indexOf("\n")>=0) {
     var i = currentLine.indexOf("\n");
     log(args.espruinoPrefix + currentLine.substr(0,i)+args.espruinoPostfix);
     currentLine = currentLine.substr(i+1);
   }
  });
  Espruino.Core.Serial.open(port, function() {
    log("Connected");
    // figure out what code we need to send
    var code = "";
    if (args.file) {
      code = fs.readFileSync(args.file).toString();
    }
    if (args.expr) {  
      if (code && code[code.length-1]!="\n")
        code += "\n";
      code += args.expr+"\n";
    }
    // send code over here...
    if (code)
      Espruino.Core.CodeWriter.writeToEspruino(code, function() {
        console.log("Finished.");
        process.exit(0);
      }); 
    //
    // ---------------------- 
   }, function() {
     log("Disconnected");
   });
}

function main() {
  if (Espruino.Core.Serial === undefined) {
    console.error("No serial driver found");
    return;
  }
  if (args.port) {
    connect(args.port);
  } else {    
    log("Searching for serial ports...");
    Espruino.Core.Serial.getPorts(function(ports) {
      console.log(ports);
      if (ports.length>0) 
        connect(ports[0]);
      else
        throw new Error("No Ports Found");        
    });
  }
}
