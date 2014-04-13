rest.js
=======

Interact with a Rest-API. Works on client and server (node.js).

## Installation (not yet)

    $ npm install rest-js

## Running tests

    $ npm install -g jake
    $ jake test

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