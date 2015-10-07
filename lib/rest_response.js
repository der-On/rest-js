"use strict";

/**
 * @module lib/rest_response
 */

/**
 * @class RestResponse
 * @param {RestRequest} request - corresponding request to this response
 * @param {Integer} statusCode
 * @param {Object} headers - Response headers
 * @param {mixed} data - converted body data
 * @param {Error} error - (optional)
 * @constructor
 */
function RestResponse(request, statusCode, headers, data, error)
{
  this.request = request;
  this.statusCode = statusCode;
  this.headers = headers || {};
  this.data = data || null;
  this.error = error || null;
};
module.exports = RestResponse;
