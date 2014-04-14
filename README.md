rest.js
=======

Interact with a Rest-API. Works on client and server (node.js).

## Installation (not yet)

    $ npm install rest-js

## Running tests

    $ npm install -g jake
    $ jake test-server
    $ jake test-browser

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