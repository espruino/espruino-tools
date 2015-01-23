espruino-tools
============

Node module to allow command-line access to Espruino. It can be used as follows:

```
# Load a file into Espruino
./espruinotool -p /dev/ttyACM1 mycode.js

# Load a file into Espruino and save
./espruinotool -p /dev/ttyACM1 mycode.js -e "save()"

# Execute a single command on the default serial device
./espruinotool -e "digitalWrite(LED1,1);"
```

**Note:** This is still in development. You can also use [espruino-cli](https://www.npmjs.org/package/espruino-cli) of [node-espruino](https://www.npmjs.com/package/node-espruino).

Why?
----

While espruino-cli and node-espruino work well, but are basically a reimplementation of the code that's already in the Web IDE - and as such they doesn't have anywhere near as many features (eg, the assembler, compiler, module loader, minification), and have some issues that have already been worked around in the Web IDE.

This uses the [EspruinoTools](https://github.com/espruino/EspruinoTools) repository (also used by the Web IDE) to provide a command-line tool that can leverage the Web IDE's code.


Installation
-----------

Until I put this in NPM, it has to be installed manually.

Go to the directory you'd like espruino-tools installed in, and type:

```
# get this code
git clone https://github.com/espruino/espruino-tools.git
cd espruino-tools
# get the EspruinoTools library we need to run this
git submodule add https://github.com/espruino/EspruinoTools.git
# get npm to link this in globally
sudo npm link -g
```

