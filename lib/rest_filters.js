"use strict";

/**
 * @module lib/rest_filters
 */

var utils = require('./utils');

/**
 * Converts request params into a JSON string
 * @name Rest.PARAM_FILTER_JSON
 * @param {RestRequest} request
 * @param {Function} next
 */
module.exports.PARAM_FILTER_JSON = function(request, next)
{
  request.params = Object.keys(request.params).map(function (key) {
    var value = request.params[key];
    return key + '=' + ((typeof value === 'string') ?
      value : JSON.stringify(value));
  }).join('&');

  next();
};

/**
 * Converts request params into a form-data string
 * @name Rest.PARAM_FILTER_PARAMS
 * @param {RestRequest} request
 * @param {Function} next
 */
module.exports.PARAM_FILTER_PARAMS = function(request, next)
{
  request.params = decodeURIComponent(
    utils.paramify(request.params, { index: true })
  );

  next();
};

/**
 * compensate for missing browser support of PUT and DELETE
 * @name Rest.PARAM_FILTER_PARAMS
 * @param {RestRequest} request
 * @param {Function} next
 */
module.exports.PARAMS_FILTER_METHOD_FALLBACK = function(request, next)
{
  if (request.method === 'PUT' || request.method === 'DELETE') {
    request.params._method = request.method;

    if (!request.data) {
      request.data = {};
    }
    request.data._method = request.method;
    request.headers['X-HTTP-METHOD-OVERRIDE'] = request.method;
    request.method = 'POST';
  }

  next();
};

/**
 * Converts respsone data from a JSON string
 * @name Rest.RESPONSE_DATA_FILTER_JSON
 * @param {RestRequest} request
 * @param {RestResponse} response
 * @param {Function} next
 */
module.exports.RESPONSE_DATA_FILTER_JSON = function(request, response, next)
{
  if (request.dataType === 'json' && typeof response.data === 'string') {
    var _data = response.data;

    // handle empty strings
    if (response.data.length === 0) {
      response.data = null;
      next();
      return;
    }

    try {
      _data = JSON.parse(response.data);
    }
    catch (err) {
      next(err);
      return;
    }

    response.data = _data;
  }

  next();
};

/**
 * Converts request data to a JSON string
 * @name Rest.REQUEST_DATA_FILTER_JSON
 * @param {RestRequest} request
 * @param {Function} next
 */
module.exports.REQUEST_DATA_FILTER_JSON = function(request, next)
{
  if (request.dataType === 'json' && typeof request.data === 'object' && request.data !== null) {
    var json = null;

    try {
      json = JSON.stringify(request.data);
    }
    catch(error) {
      next(err);
      return;
    }

    request.data = json;
  }

  next();
}

/**
 * Detects an error for a response
 * @name Rest.ERROR_FILTER
 * @param {null|Error} error
 * @param {RestRequest} request
 * @param {RestResponse} response
 * @param {Function} next
 */
module.exports.ERROR_FILTER = function(error, request, response, next)
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

    error = err;
  }

  next(error);
};
