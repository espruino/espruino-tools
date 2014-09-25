
var fs = require("fs");

/* load all files in EspruinoTools... we do this so we can still
use these files normally in the Web IDE */
function loadJS(filePath) {
  console.log(filePath);
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
/*var $ = function(f) {
  return {
    ready:function(readyFunc) {
      stuffToRun.push(readyFunc);
    }
  };
};*/
var env = require('jsdom').env;
var html = "<html></html>";
var Espruino;
var $,document;
env(html, function (errors, window) {
    console.log(errors);

    $ = require('jquery')(window);    
    document = window.document;

    // ---------------
    //console.log(__dirname);
    Espruino = loadJS(__dirname+"/EspruinoTools/espruino.js");
    loadDir(__dirname+"/EspruinoTools/core");
    loadDir(__dirname+"/EspruinoTools/plugins");

    $(main);
});


function main() {
  console.log("espruino-tools");
  if (Espruino.Core.Serial === undefined) {
    console.error("No serial driver found");
    return;
  }
  console.log("Searching for serial ports...");
  Espruino.Core.Serial.getPorts(function(ports) {
    console.log(ports);
    if (ports.length>0) {

      Espruino.Core.Serial.startListening(function(data) {
        console.log("> "+data);
      });
      Espruino.Core.Serial.open(ports[0], function() {
        console.log("Connected");
      }, function() {
        console.log("Disconnected");
      });
    }
  });
}
