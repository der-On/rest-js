"use strict";

/**
 * @module lib/adapters/client_rest/rest_request
 */

try {
  var request = require('superagent');
} catch(error) {

}

var RestResponse = require('./rest_response');

/**
 * @class RestRequest
 * @param {String} method
 * @param {String} url
 * @param {Object} opts - Options
 * @param {Function} callback - Called on response. Parameters: {null|Error} error, {RestResponse} response
 * @constructor
 *
 * @options
 * - {String} baseUrl
 * - {String} path
 * - {String} format - file format (will be attached to the URL)
 * - {Object} query - query object
 * - {Object} sort - sort object, keys are property names and values either 'asc' or 'desc'
 * - {Integer} limit
 * - {Integer} offset
 * - {Integer} skip
 * - {Integer} page
 * - {Integer} perPage
 * - {Object} params - all URL parameters to be send with the request. Can include query, sort and limit parameters.
 * - {Object} headers - additional header parameters
 * - {Boolean} nocase - (default = false) if true, case insensitive queries are created
 * - {Object} data - data to be send with the request body (only for POST, PUT, UPDATE requests)
 * - {Boolean} forceUncached - (default = true) if true a timestamp parameter will be attached to the URL to prevent agressive browser caching
 * - {String} dataType - the datatype to expect from the server, it will try to convert to this datatype. Possible values are: 'xml', 'html', 'json', 'jsonp', 'script', 'text', 'binary'
 * - {Boolean} crossDomain - (default = false)
 */
function RestRequest(method, url, opts)
{
  if (typeof opts !== 'object') {
    var opts = {};
  }

  this.method = (method) ? method.toUpperCase() : 'GET';
  this.url = url || null;
  this.setOptions(opts);
};

/**
 * Sets options for the request
 * @name RestRequest#setOptions
 * @param {Object} opts - Options (see constructor)
 */
RestRequest.prototype.setOptions = function(opts)
{
  this.baseUrl = opts.baseUrl || null;
  this.path = opts.path || null;
  this.format = opts.format || null;
  this.query = opts.query || null;
  this.sort = opts.sort || null;
  this.limit = opts.limit || null;
  this.offset = opts.offset || null;
  this.skip = opts.skip || null;
  this.page = opts.page || null;
  this.perPage = opts.perPage || null;
  this.params = opts.params || {};
  this.nocase = opts.nocase || false;
  this.data = opts.data || null;
  this.headers = opts.headers || {};
  this.forceUncached = (typeof opts.forceUncached !== 'undefined') ? opts.forceUncached : true;
  this.dataType = opts.dataType || null;
  this.crossDomain = opts.crossDomain || false;
};

/**
 * Populates request.params with relevant request options and populates headers
 * @name RestRequest#prepareParams
 */
RestRequest.prototype.prepare = function()
{
  var self = this;

  // prevent aggressive browser caching by appending timestamp
  if (this.forceUncached) {
    this.params.t = new Date().getTime();
  }

  // mix some options into request params
  ['query', 'sort', 'limit', 'offset', 'skip', 'page', 'perPage', 'nocase'].forEach(function(name) {
    if (typeof self[name] !== 'undefined' || self[name] !== null) {
      self.params[name] = self[name];
    }
  });

  // populate headers based on some settings
  switch(this.dataType) {
    case 'json':
      this.headers['accept'] = 'application/json';
      this.headers['Content-Type'] = 'application/json';
      break;
  }
};

/**
 * Sends the request
 * @name RestRequest#send
 * @param {Function} callback - Parameters: {RestResponse} response
 */
RestRequest.prototype.send = function(callback)
{
  if (typeof callback !== 'function') {
    callback = function() {};
  }

  if (typeof window !== 'undefined') {
    if (typeof window.jQuery !== 'undefined') {
      this._sendJQuery(callback);
    }
    else {
      this._sendRequest(callback);
    }
  }
  else {
    this._sendRequest(callback);
  }
};

RestRequest.prototype._sendJQuery = function(callback)
{
  var self = this;

  jQuery.ajax({
    type: this.method,
    crossDomain: this.crossDomain,
    dataType: 'text',
    url: this.url,
    data: this.data,
    headers: this.headers,
    success: onSuccess,
    error: onError
  });

  function onSuccess(data, textStatus, xhr)
  {
    var statusCode = xhr.status;
    var headers = xhr.getAllResponseHeaders();
    var response = new RestResponse(self, statusCode, headers, data);

    callback(response);
  }

  function onError(xhr, textStatus, err)
  {
    var statusCode = xhr.status;
    var headers = xhr.getAllResponseHeaders();
    var data = xhr.responseText || xhr.responseXml;
    var err = new Error(err);
    err.statusCode = statusCode;
    var response = new RestResponse(self, statusCode, headers, data, err);

    callback(response);
  }
};

RestRequest.prototype._sendRequest = function (callback) {
  var self = this;
  var methodMap = {
    'GET': 'get',
    'PUT': 'put',
    'PATCH': 'patch',
    'DELETE': 'del',
    'POST': 'post',
    'UPDATE': 'update'
  };

  var req = request[methodMap[this.method]](this.url)
  if (this.data) {
    req.send(this.data);
  }

  if (this.params) {
    req.query(this.params);
  }

  req
    .set(this.headers)
    .end(onResponse);

  function onResponse(err, res) {
    var statusCode = null;
    var headers = {};
    var data = (res) ? (res.text || null) : null;

    if (res) {
      statusCode = res.status || res.statusCode;
      headers = res.headers;
      if (err) {
        err.statusCode = statusCode;
      }
    }

    var response = new RestResponse(self, statusCode, headers, data, err);

    callback(response);
  }
};
module.exports = RestRequest;
