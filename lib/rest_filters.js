"use strict";

/**
 * @module lib/rest_filters
 */

var utils = require('./utils');

/**
 * Converts a param into a JSON string
 * @name Rest.PARAM_FILTER_JSON
 * @param {Object} param - {name: ..., value: ...}
 * @param {RestRequest} request
 * @returns {string}
 */
module.exports.PARAM_FILTER_JSON = function(param, request)
{
  return param.name + '=' + JSON.stringify(param.value);
};

/**
 * Converts a param into a form-data string
 * @name Rest.PARAM_FILTER_PARAMS
 * @param {Object} param - {name: ..., value: ...}
 * @param {RestRequest} request
 * @returns {string}
 */
module.exports.PARAM_FILTER_PARAMS = function(param, request)
{
  var params = {};
  params[param.name] = param.value;
  return decodeURIComponent(utils.paramify(params, { index: true }));
};

/**
 * compensate for missing browser support of PUT and DELETE
 * @name Rest.PARAMS_FILTER_METHOD_FALLBACK
 * @param {Object} params
 * @param {RestRequest} request
 * @returns {Object}
 */
module.exports.PARAMS_FILTER_METHOD_FALLBACK = function(params, request)
{
  if (request.method === 'PUT' || request.method === 'DELETE') {
    params._method = request.method;
    if (!request.data) {
      request.data = {};
    }
    request.data._method = request.method;
    request.headers['X-HTTP-METHOD-OVERRIDE'] = request.method;
    request.method = 'POST';
  }

  return params;
};

/**
 * Converts respsone data from a JSON string
 * @name Rest.RESPONSE_DATA_FILTER_JSON
 * @param {Object} data
 * @param {RestResponse} response
 * @returns {Object}
 */
module.exports.RESPONSE_DATA_FILTER_JSON = function(data, response)
{
  if (response.request.dataType === 'json' && typeof data === 'string') {
    var _data = data;

    // handle empty strings
    if (data.length === 0) {
      return null;
    }

    try {
      _data = JSON.parse(data);
    }
    catch (err) {}

    return _data;
  }

  return data;
};

/**
 * Converts request data to a JSON string
 * @name Rest.REQUEST_DATA_FILTER_JSON
 * @param {Object} data
 * @param {RestRequest} request
 * @returns {String}
 */
module.exports.REQUEST_DATA_FILTER_JSON = function(data, request)
{
  if (request.dataType === 'json' && typeof data === 'object') {
    var json = null;

    try {
      json = JSON.stringify(data);
    }
    catch(error) {

    }

    return json
  }
  else {
    return data;
  }
}

/**
 * Detects an error for a response
 * @name Rest.ERROR_FILTER
 * @param {null|Error} error
 * @param {RestResponse} response
 * @returns {Error}
 */
module.exports.ERROR_FILTER = function(error, response)
{
  if (!error && response.statusCode >= 400) {
    var err;

    if (typeof response.data === 'object') {
      if (typeof response.data.error === 'string') {
        err = new Error(response.data.error);
      }
      else if(typeof response.data.error === 'object') {
        if (response.data.error.message) {
          err = new Error(response.data.error.message);
        }

        if (response.data.error.stack) {
          err.stack = response.data.error.stack;
        }
      }
      else if(typeof response.data.errors === 'object') {
        var messages = [];

        if (response.data.errors.constructor.name === 'Array') {
          response.data.errors.forEach(function(error) {
            messages.push(error);
          });
        }
        else {
          for(var name in response.data.errors) {
            messages.push(name + ': ' + response.data.errors[name]);
          }
        }

        err = new Error(messages.join('\n'));
      }
    }

    if (!err) {
      if (typeof response.data === 'string') {
        err = new Error(response.data);
      }
      else if (typeof response.data === 'object') {
        if ('message' in response.data) {
          err = new Error(response.data.message);
        }
        else {
          err = new Error('Unknown Error');
        }

        if ('stack' in response.data) {
          err.stack = response.data.stack;
        }

        err.name = response.data.code || response.data.name || null;
      }
    }

    err.statusCode = response.statusCode;

    return err;
  }

  return error;
};