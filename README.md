espruino-tools
==============

Node module to allow command-line access to Espruino

**Note:** This is in development and is currently not usable. Please use the great [espruino-cli](https://www.npmjs.org/package/espruino-cli) instead.

Why?
----

While espruino-cli is very cool, it's basically a reimplementation of the code that's already in the Web IDE - and as such it doesn't have anywhere near as many features, and has some issues that have already been worked around in the Web IDE.

This is an attempt to use the [EspruinoTools](https://github.com/espruino/EspruinoTools) repository (also used by the Web IDE) to provide a command-line tool that can leverage the Web IDE's code.


### Getting Started

This expects the (https://github.com/espruino/EspruinoTools)[EspruinoTools] repository to be in `espruino-tools/EspruinoTools`. If you're using Git, make sure you add it using the command:

```
git submodule add git@github.com:espruino/EspruinoTools.git
```

