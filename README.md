rest.js
=======

[![Build Status](https://travis-ci.org/der-On/rest-js.svg?branch=master)](https://travis-ci.org/der-On/rest-js)

Interact with a Rest-API. Works on client (browser) and server (node.js).

## Installation

    $ npm install rest-js

## Running tests

If not done yet you first need to install the global dependencies:

    $ npm install -g jake browserify brfs istanbul

Then to run the tests do:

    $ jake test

To run the test with code coverage:

    $ istanbul cover jake test

By default Browser-sides tests will run in the chrome browser.
You can override the browser(s) to use by providing a "browser" option containing a comma seperated list of browser executables:

    $ jake test browser=chrome,firefox

To skip browser testing do:

    $ jake test browser=none

## Usage

```javascript
var rest = require('rest-js');

var restApi = rest('https://api.github.com/', {
  crossDomain: true
});

restApi.read('users/der-On/repos', function(error, data) {
  ...
});
```

All methods also return a promise.

## CRUD methods

```javascript
restApi.read('/cats', [options, callback]); // GET -> /cats
restApi.get(/*...*/); // alias to .read

restApi.remove('/cats/10', [options, callback]); // DELETE -> /cats/10
restApi.del(/*...*/); // alias to .remove

restApi.create('/cats', [options, callback]); // POST -> /cats
restApi.post(/*...*/); // alias to .create

restApi.update('/cats/10', [options, callback]); // PUT -> /cats/10
restApi.put(/*...*/); // alias to .update
```

You can also send a rest-request with any available HTTP method using

```javascript
restApi.request(method, path, [option, callback]);
```

## Passing data

You can pass a data-Object within the options.

```javascript
restApi.create('/cats', {
    data: { name: 'Minka', age: 4 }
}, function(error, data) {
    ...
});
```

## Available constructor options

```javascript
var restApi = rest('https://api.github.com/', {
    defaultParams: { ... }, // parameters that should be send with every request
    defaultFormat: 'json', // (default = 'json') default file format to use, will be appended as a suffix to the requested path (e.g. /cats -> /cats.json)
    defaultDataType: 'json', // (default = 'json') default expected data type
    crossDomain: false, // (default = false)
    cacheLifetime: 5000, // (default = 0) lifetime of URL based response cache in ms (only GET requests are cached). If set to 0 no caching will happen.
});
```

## Middlewares

Middlewares or filters allow transormation or manipulation of request and response data.

They are simple callback functions that get passed two or more parameters.

The last parameter is always a callback function that needs to be called, once the filter has done it's work.
If you pass an error to the callback it will be passed to the error middleware.

- if using two parameters: request, next
- if using three parameters: request, response, next
- if using four parameters: error, request, response, next

Middlewares are executed in the same order they got appended.
So if a previously appended middleware executes you get passed the already transformed data in the next middleware.

Example:

```javascript
restApi.use(function(request, next) {
	var transformedUrl = request.url.replace('bar', 'foo');
	nexst();
});
```

You can add middlewares using the `.use()` method:

```javascript
restApi.use(callback);  // add a middleware
```

You can also remove already appended filters:

```javascript
restApi.unuse(callback); // remove a middleware
```

Rest auto appends the following filters already:

1. **Method-Fallback** middleware that adds the '_method' URL parameter containing the method to use for the request. This is an approved convention to workaround the missing capabilities of browsers to send others then GET and POST requests.

2. **JSON Request-Data** middleware that tries to stringify outgoing data to JSON if the request data type is 'json'.

3. **JSON Response-Data** middleware that tries to parse incoming response data using JSON.stringify() if the expecte response data type is 'json'.

4. **Generic Error** middleware that creates an error for each response with a status code >= 400. It tries to detect the error message from the response data.

## Available request options

You can pass in options for each CRUD method or Rest.request(). These options are as follows:

```javascript
restApi.read('/cats', {
	baseUrl: "...", // override the baseUrl passed to the Rest() constructor
	format: "json", // file format (will be attached as suffix to the URL, e.g. /cats -> /cats.json)
	query: {...}, // query object
	sort: {...}, // sort object, keys are property names and values either 'asc' or 'desc'
	limit: 10, // limit number of results, translates to the URL parameter 'limit'
	offset: 100, // skip first N results, translates to the URL parameter 'offset'
	skip: 100, // same as offset, but translates to the URL parameter 'skip'
	page: 10, // display page N of results, when using pagination, translates to the URL parameter 'page'
	perPage: 100, // display N results per page, when using pagination, translates to the URL parameter 'perPage'
	params: {...}, // all additional URL parameters to be send with the request
	headers: {...}, // additional request headers
	nocase: true, // (default = false) if true, case insensitive queries are created, translates to the URL parameter 'nocase'
	data: {...}, // data to be send with the request body (only for POST, PUT, UPDATE requests)
	forceUncached: true, // (default = true) if true a timestamp parameter will be attached to the URL to prevent agressive browser caching
	dataType: 'json', // the datatype to expect from the server, it will try to convert to this datatype. Possible values are: 'xml', 'html', 'json', 'jsonp', 'script', 'text', 'binary'
	crossDomain: true, // (default = false)
    noCache: true, // (default = false) if true the response data will not be cached, even if the request cache is enabled
}, function(error, data) {
	...
});
```
