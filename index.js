"use strict";

var Rest = require('./lib/rest');

// provide public API
module.exports = function (baseUrl, opts) {
  return new Rest(baseUrl, opts);
};
module.exports.Rest = Rest;
module.exports.RestRequest = require('./lib/rest_request');
module.exports.RestResponse = require('./lib/rest_response');
module.exports.RestFilters = require('./lib/rest_filters');
