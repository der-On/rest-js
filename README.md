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

## CRUD methods

```javascript
restApi.read('/cats', [options, callback]); // GET -> /cats

restApi.remove('/cats/10', [options, callback]); // DELETE -> /cats/10

restApi.create('/cats', [options, callback]); // POST -> /cats

restApi.update('/cats/10', [options, callback]); // PUT -> /cats/10
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
var restApi = new rest.Rest('https://api.github.com/', {
    defaultParams: { ... }, // parameters that should be send with every request
    defaultFormat: 'json', // (default = 'json') default file format to use, will be appended as a suffix to the requested path (e.g. /cats -> /cats.json)
    defaultDataType: 'json', // (default = 'json') default expected data type
    crossDomain: false, // (default = false)
    filters: { url: [...], param: [...], ... }, // Object containing lists of initial filters. Each filter is a callback function. See "Filters" below.
    cacheLifetime: 5000, // (default = 0) lifetime of URL based response cache in ms (only GET requests are cached). If set to 0 no caching will happen.
});
```

## Filters

Filters allow transormation or manipulation of request and response data.

Filters are simple callback functions that get passed two parameters:

The first parameter is the data to transform (it must be returned from the filter callback!)
and the second one is the request or response (based on the filter).

Filters are executed in the same order they got appended.
So if a previously appended filter executes you get passed the already transformed data in the next filter.

Example:

```javascript
restApi.addUrlFilter(function(url, request) {
	var transformedUrl = url.replace('bar', 'foo');
	return transformedUrl;
});
```

There are multiple filters available, each one for a certain case.
They are listed in order of execution when a request get's send:

1. **_options_** - callback({...}, request) transform request options
2. **_params_** - callback({...}, request) transform an URL parameter object
3. **_requestData_** - callback({...}, request) transform request data
4. **_param_** - callback({ name: ..., value: ... }, request) transform an URL parameter to a String
5. **_url_** - callback(url, request) transform final URL before request get's send
6. **_reqeuestHeaders_** - callback({...}, request) transform outgoing request headers
7. **_responseData_** - callback(data, response) transform incoming response data (response body)
8. **_error_** - callback(error, response) transform/create errors from the incoming response

You can add filters by passing them to the Rest() constructor or using these methods:

```javascript
restApi.addFilter(type, callback);  // add a filter for any valid filter type

// or use one of the aliases
restApi.addUrlFilter(callback);
restApi.addParamFilter(callback);
restApi.addParamsFilter(callback);
restApi.addOptionsFilter(callback);
restApi.addRequestDataFilter(callback);
restApi.addResponseDataFilter(callback);
restApi.addRequestHeadersFilter(callback);
restApi.addErrorFilter(callback);
```

You can also remove already appended filters:

```javascript
restApi.removeFilter(type, callback); // remove a filter for any valid filter type

// or use one of the aliases
restApi.removeUrlFilter(callback);
restApi.removeParamFilter(callback);
...
```

Rest auto appends the following filters already:

1. **Method-Fallback** filter that adds the '_method' URL parameter containing the method to use for the request. This is an approved convention to workaround the missing capabilities of browsers to send others then GET and POST requests.

2. **JSON Request-Data** filter that tries to stringify outgoing data to JSON if the request data type is 'json'.

3. **JSON Response-Data** filter that tries to parse incoming response data using JSON.stringify() if the expecte response data type is 'json'.

4. **Generic Error** filter that creates an error for each response with a status code >= 400. It tries to detect the error message from the response data.

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