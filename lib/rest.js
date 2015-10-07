"use strict";

/**
 * @module lib/rest
 */

require('es6-promise').polyfill();
var RestRequest = require('./rest_request');
var RestResponse = require('./rest_response');
var filters = require('./rest_filters');
var utils = require('./utils');

/**
 * @class Rest
 * @constructor
 * @param {String} baseUrl - URL to Rest API
 * @param {Object} opts - Options
 *
 * @options
 * - {Object} defaultParams - parameters that should be send with every request
 * - {String} defaultFormat - (default = 'json') default file format to use
 * - {String} defaultDataType - (default = 'json') default expected data type
 * - {Boolean} crossDomain - (default = false)
 * - {Integer} cacheLifetime - (default = 0) lifetime of URL based response cache in ms (only GET requests are cached)
 */
var Rest = function(baseUrl, opts)
{
  var self = this;

  if (typeof opts !== 'object') {
    var opts = {};
  }

  /**
   * @property {String} baseUrl - URL to Rest API, by default it will take the current url if on the client or http://localhost if on the server side
   */
  this.baseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.href.split('#')[0] : 'http://localhost');

  this.defaultRequestOptions = {
    baseUrl: this.baseUrl,
    params: opts.defaultParams || {},
    format: (typeof opts.defaultFormat !== 'undefined') ? opts.defaultFormat : 'json',
    dataType: opts.defaultDataType || 'json',
    crossDomain: opts.crossDomain || false
  };

  this.filters = {
    request: [filters.REQUEST_DATA_FILTER_JSON],
    response: [filters.RESPONSE_DATA_FILTER_JSON],
    error: [filters.ERROR_FILTER]
  };

  // url based responseData cache
  this.cacheLifetime = opts.cacheLifetime || 0;
  this.cache = {};
  this.cacheStats = {
    total: 0,
    byKey: {}
  };

  if (typeof window !== 'undefined') {
    this.use(filters.PARAMS_FILTER_METHOD_FALLBACK);
  }
};

/**
 * Adds a middleware
 * @name Rest#use
 * @param {Function} callback
 */
Rest.prototype.use = function (callback)
{
  if (callback.length === 2) {
    this.filters.request.push(callback);
  } else if (callback.length === 3) {
    this.filters.response.push(callback);
  } else if (callback.length === 4) {
    this.filters.error.push(callback);
  }
};

/**
 * Removes a middleware
 * @name Rest#unuse
 * @param {Function} callback
 */
Rest.prototype.unuse = function (callback)
{
  var index = this.filters.request.indexOf(callback);

  if (index !== -1) {
    this.filters.request.splice(index, 1);
    return;
  }

  index = this.filters.response.indexOf(callback);

  if (index !== -1) {
    this.filters.response.splice(index, 1);
    return;
  }

  index = this.filters.error.indexOf(callback);

  if (index !== -1) {
    this.filters.error.splice(index, 1);
    return;
  }
};

/**
 * Executes a filter chain
 * @name Rest#executeFilters
 * @param {String} type - filter type. Can be one of: 'url', 'options', 'data', 'error'
 * @param {Error} error
 * @param {Rest.Request} request
 * @param {Rest.Response} response
 * @param {Function} callback
 */
Rest.prototype.executeFilters = function(type, error, request, response, callback)
{
  var filters = (this.filters[type] || []).slice();

  function next(err) {
    if (err) {
      error = err;
    }

    if (filters.length) {
      var filter = filters.shift();

      if (filter.length === 2) {
        filter(request, next);
      } else if (filter.length === 3) {
        filter(request, response, next);
      } else if (filter.length === 4) {
        filter(error, request, response, next);
      }
    } else {
      callback(error);
    }
  }

  next();
};

/**
 * @name Rest#request
 * @param {String} method - HTTP method ('GET','POST','PUT','DELETE')
 * @param {String} path - route/path to request
 * @param {Object} options - (optional)
 * @param {Fuction} callback
 *
 * @options
 * Same as RestRequest Options
 * + {Boolean} noCache - if true, caching will be disabled for this request (only for GET-requests)
 */
Rest.prototype.request = function(/*method, path, [options], callback*/)
{
  var self = this;
  var args = Array.prototype.slice.call(arguments, 0);
  var callback = function() {};
  var options = {};
  if (args.length > 2) {
    callback = args.pop() || function() {};

    if (typeof callback === 'object') {
      options = callback;
      callback = function() {};
    }
  }
  if (args.length === 3) {
    options = args.pop() || {};
  }
  var method = args.shift();
  var path = args.shift();
  var resolve, reject;
  var promise = new Promise(function (_resolve, _reject) {
    resolve = _resolve;
    reject = _reject;
  });

  // prepare request options
  var requestOpts = utils.deepCopy(this.defaultRequestOptions, {});

  // set baseUrl and path
  requestOpts.baseUrl = this.baseUrl;
  requestOpts.path = path;

  // mix in provided options
  // params need mixing on param level
  if (options.params) {
    if (!requestOpts.params) {
      requestOpts.params = {};
    }
    utils.mergeOptions(options.params, requestOpts.params);
    delete options.params; // delete params to prevent mixing them again
  }
  utils.mergeOptions(options, requestOpts);

  // construct full url
  var url = this.baseUrl + path;
  method = method.toUpperCase();

  var request = new RestRequest(method, url, requestOpts);

  request.setOptions(requestOpts);
  request.prepare();

  // attach format to url
  var urlParts = request.url.split('?');

  if (request.format) {
    urlParts[0] += '.' + request.format;
  }

  request.url = urlParts.join('?');

  // apply request middlewares
  this.executeFilters('request', null, request, null, onRequestFilters);

  function onRequestFilters(err) {
    var cachedResponse;
    if (!options.noCache && request.method === 'GET' && self.cacheLifetime > 0) {
      cachedResponse = self.getCached(request.url);
    }

    if (cachedResponse) {
      onResponse(cachedResponse);
    }
    else {
      request.send(onResponse);
    }

    function onResponse(response)
    {
      // apply response middlewares
      self.executeFilters('response', err, request, response, onResponseFilters);

      function onResponseFilters(err) {
        // apply error filters
        self.executeFilters('error', err, request, response, onErrorFilters);
      }

      function onErrorFilters(error) {
        response.error = error;
        finalize();
      }

      function finalize() {
        // cache response, but do not cache already cached response
        if (self.cacheLifetime > 0 && !cachedResponse) {
          self.setCached(request.url, response);
        }

        callback(response.error, response.data);

        if (response.error) {
          return reject(response.error);
        }

        return resolve(response.data);
      }
    }
  }

  return promise;
};

Rest.prototype._getCacheKeyFromUrl = function(url)
{
  // strip "t" param
  var key = url.replace(/[\?|\&]t=\d*/, '');
  return key;
};

Rest.prototype.setCached = function(url, response)
{
  var key = this._getCacheKeyFromUrl(url);
  this.cache[key] = { time: (new Date()).getTime(), response: utils.deepCopy(response) };
};

Rest.prototype.getCached = function(url)
{
  var response = null;
  var now = (new Date()).getTime();
  var key = this._getCacheKeyFromUrl(url);

  if (this.cache[key]) {
    var item = this.cache[key];
    if (now - item.time <= this.cacheLifetime) {
      response = utils.deepCopy(item.response);

      // add some statistics
      this.cacheStats.total++;

      if (!this.cacheStats.byKey[key]) {
        this.cacheStats.byKey[key] = 0;
      }

      this.cacheStats.byKey[key]++;
    }
    // too old remove from cache
    else {
      delete this.cache[key];
    }
  }

  return response;
};

/**
 * Reads data
 * @name Rest#read
 * @param {String} path - route/path to request
 * @param {Object} options - (optional)
 * @param {Fuction} callback
 *
 * @options
 * - {Object} data - Data to send with the request
 * - {Object} query - mongodb-style query object
 * - {Object} sort - contains key value pairs, where values can be 'asc' or 'desc'
 */
Rest.prototype.get = Rest.prototype.read = function(/*path, [options], callback*/)
{
  return this.request.apply(this, ['GET'].concat(Array.prototype.slice.call(arguments, 0)));
};

/**
 * Creates a resource
 * @name Rest#create
 * @param {String} path - route/path to request
 * @param {Object} options - (optional)
 * @param {Fuction} callback
 *
 * @options
 * - {Object} data - Data to send with the request
 */
Rest.prototype.post = Rest.prototype.create = function(/*path, [options], callback*/)
{
  return this.request.apply(this, ['POST'].concat(Array.prototype.slice.call(arguments, 0)));
};

/**
 * Updates a single resource
 * @name Rest#update
 * @param {String} path - route/path to request
 * @param {Object} options - (optional)
 * @param {Fuction} callback
 *
 * @options
 * - {Object} data - Data to send with the request
 */
Rest.prototype.put = Rest.prototype.update = function(/*path, [options], callback*/)
{
  return this.request.apply(this, ['PUT'].concat(Array.prototype.slice.call(arguments, 0)));
};

/**
 * Removes a single resource
 * @name Rest#remove
 * @param {String} path - route/path to request
 * @param {Object} options - (optional)
 * @param {Fuction} callback
 *
 * @options
 * - {Object} data - Data to send with the request
 */
Rest.prototype.del = Rest.prototype.remove = function(/*path, [options], callback*/)
{
  return this.request.apply(this, ['DELETE'].concat(Array.prototype.slice.call(arguments, 0)));
};

module.exports = Rest;
