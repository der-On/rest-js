"use strict";

/**
 * @module lib/rest
 */

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
 * - {Object} filters - (optional) Object containing initial filters. Each filter is a callback function.
 * - {Integer} cacheLifetime - (default = 0) lifetime of URL based response cache in ms (only GET requests are cached)
 *
 * Filters
 *
 *      {
 *        url: [...],
 *        param: [...],
 *        params: [...],
 *        options: [...],
 *        requestData: [...],
 *        responseData: [...],
 *        reqeuestHeaders: [...],
 *        error: [...]
 *      }
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
    format: opts.defaultFormat || 'json',
    dataType: opts.defaultDataType || 'json',
    crossDomain: opts.crossDomain || false
  };

  this.filters = {
    url: [],
    param: [],
    params: [],
    options: [],
    requestData: [filters.REQUEST_DATA_FILTER_JSON],
    responseData: [filters.RESPONSE_DATA_FILTER_JSON],
    requestHeaders: [],
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
    this.addParamsFilter(filters.PARAMS_FILTER_METHOD_FALLBACK);
  }

  // add initial filters
  if (opts.filters) {
    for(var type in opts.filters) {
      opts.filters[type].forEach(function(filter) {
        self.addFilter(type, filter);
      });
    }
  }
};

/**
 * Adds a filter callback to the filter chain
 * @name Rest#addFilter
 * @param {String} type - type of the filter. Can be one of: 'url', 'param', 'params', 'options', 'requestData', 'responseData', 'error'
 * @param {Function} callback
 */
Rest.prototype.addFilter = function(type, callback)
{
  if (this.filters[type] && this.filters[type].indexOf(callback) === -1) {
    this.filters[type].push(callback);
  }
};

/**
 * Adds an 'url' filter
 * @name Rest#addUrlFilter
 * @param {Function} callback({String} url, {RestRequest} request) - must return an URL string
 */
Rest.prototype.addUrlFilter = function(callback)
{
  this.addFilter('url', callback);
};

/**
 * Adds an 'param' filter
 * @name Rest#addParamFilter
 * @param {Function} callback - must return a string in the form of 'name=value'. Parameters: {Object} param, {RestRequest} request
 *
 * param contains _name_ and _value_.
 */
Rest.prototype.addParamFilter = function(callback)
{
  this.addFilter('param', callback);
};

/**
 * Adds an 'params' filter
 * @name Rest#addParamsFilter
 * @param {Function} callback - must return an object. Parameters: {Object} params, {RestRequest} request
 */
Rest.prototype.addParamsFilter = function(callback)
{
  this.addFilter('params', callback);
};

/**
 * Adds an 'options' filter
 * @name Rest#addOptionsFilter
 * @param {Function} callback - must return an options Object. Parameters: {Object} options, {RestRequest} request
 */
Rest.prototype.addOptionsFilter = function(callback)
{
  this.addFilter('options', callback);
};

/**
 * Adds an 'requestData' filter
 * @name Rest#addRequestDataFilter
 * @param {Function} callback - must return modified or unmodified data. Parameters: {mixed} data, {RestRequest} request
 */
Rest.prototype.addRequestDataFilter = function(callback)
{
  this.addFilter('requestData', callback);
};

/**
 * Adds an 'requestHeaders' filter
 * @name Rest#addRequestHeadersFilter
 * @param {Function} callback - must return modified or unmodified data. Parameters: {Object} headers, {RestRequest} response
 */
Rest.prototype.addRequestHeadersFilter = function(callback)
{
  this.addFilter('requestHeaders', callback);
};

/**
 * Adds an 'responseData' filter
 * @name Rest#addResponseDataFilter
 * @param {Function} callback - must return modified or unmodified data. Parameters: {mixed} data, {RestResponse} response
 */
Rest.prototype.addResponseDataFilter = function(callback)
{
  this.addFilter('responseData', callback);
};

/**
 * Adds an 'error' filter
 * @name Rest#addErrorFilter
 * @param {Function} callback - must return an Error. Parameters: {Error} error, {RestResponse} response
 */
Rest.prototype.addErrorFilter = function(callback)
{
  this.addFilter('error', callback);
};

/**
 * Executes a filter chain and returns the transformed value
 * @name Rest#executeFilters
 * @param {String} type - filter type. Can be one of: 'url', 'options', 'data', 'error'
 * @param {mixed} original - the original variable to be transformed.
 * @param [args...] - additional arguments to be passed to the filter callbacks
 */
Rest.prototype.executeFilters = function(/*type, original, [args...] */)
{
  var args = Array.prototype.slice.call(arguments, 0);
  var type = args.shift();
  var original = args.shift();
  var result = original;

  if (this.filters[type] && this.filters[type].length > 0) {
    this.filters[type].forEach(function(filter) {
      var _args = args.slice(0);
      _args.unshift(result);
      result = filter.apply(filter, _args);
    });
  }

  return result;
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
  var callback = args.pop() || function() {};
  var method = args.shift();
  var path = args.shift();
  var options = args.shift() || {};

  // prepare request options
  var requestOpts = utils.copyOptions(this.defaultRequestOptions);

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

  // apply option filters
  requestOpts = this.executeFilters('options', requestOpts, request);
  request.setOptions(requestOpts);
  request.prepare();

  // apply params filters
  request.params = this.executeFilters('params', utils.copyOptions(request.params), request);

  // apply data filter
  request.data = this.executeFilters('requestData', utils.copyOptions(request.data), request);

  // construct url query from request.params
  var urlQuery = [];

  for(var name in request.params)
  {
    var param = {name: name, value: request.params[name]};

    if (typeof param !== 'undefined' && param.value !== null) {
      // apply param filters and append to urlQuery
      urlQuery.push(this.executeFilters('param', param, request));
    }
  }

  var urlParts = request.url.split('?');

  if (urlQuery.length > 0) {
    if (urlParts.length == 1) {
      urlParts.push(urlQuery.join('&'));
    }
    else {
      urlParts[1] += '&' + urlQuery.join('&');
    }
  }

  if (request.format) {
    urlParts[0] += '.' + request.format;
  }

  request.url = urlParts.join('?');

  // apply url filters
  request.url = this.executeFilters('url', request.url, request);

  // apply header filters
  request.headers = this.executeFilters('requestHeaders', utils.copyOptions(request.headers), request);

  var cachedResponse;
  if (!options.noCache && request.method === 'GET' && this.cacheLifetime > 0) {
    cachedResponse = this.getCached(request.url);
  }

  if (cachedResponse) {
    onResponse(cachedResponse);
  }
  else {
    request.send(onResponse);
  }

  function onResponse(response)
  {
    // apply data filters
    response.data = self.executeFilters('responseData', response.data, response);

    // apply error filters
    response.error = self.executeFilters('error', response.error, response);

    // cache response, but do not cache already cached response
    if (self.cacheLifetime > 0 && !cachedResponse) {
      self.setCached(request.url, response);
    }

    callback(response.error, response.data);
  }
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
Rest.prototype.read = function(/*path, [options], callback*/)
{
  this.request.apply(this, ['GET'].concat(Array.prototype.slice.call(arguments, 0)));
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
Rest.prototype.create = function(/*path, [options], callback*/)
{
  this.request.apply(this, ['POST'].concat(Array.prototype.slice.call(arguments, 0)));
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
Rest.prototype.update = function(/*path, [options], callback*/)
{
  this.request.apply(this, ['PUT'].concat(Array.prototype.slice.call(arguments, 0)));
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
Rest.prototype.remove = function(/*path, [options], callback*/)
{
  this.request.apply(this, ['DELETE'].concat(Array.prototype.slice.call(arguments, 0)));
};

module.exports = Rest;