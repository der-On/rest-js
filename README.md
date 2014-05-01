rest.js
=======

[![Build Status](https://travis-ci.org/der-On/rest-js.svg?branch=master)](https://travis-ci.org/der-On/rest-js)

Interact with a Rest-API. Works on client and server (node.js).

## Installation (not yet)

    $ npm install rest-js

## Running tests

If not done yet you first need to install the global dependencies:

    $ npm install -g jake browserify brfs

Then to run the tests do:

    $ jake test

By default Browser-sides tests will run in the chrome browser.
You can override the browser(s) to use by providing a "browser" option containing a comma seperated list of browser executables:

    $ jake test browser=chrome,firefox

To skip browser testing do:

    $ jake test browser=none

## Browser side dependencies

You'll need jQuery for full browser support.
If jQuery is not present it will fallback to make requests using [browser-request](https://www.npmjs.org/package/browser-request).
This is however not fully compatible to all browser yet.

## Usage

```javascript
var rest = require('rest-js');

var restApi = new rest.Rest('https://api.github.com/', {
  crossDomain: true
});

restApi.read('users/der-On/repos', function(error, data) {
  ...
});
```