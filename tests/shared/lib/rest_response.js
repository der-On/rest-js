"use strict";

var assert = require('assert')
  , rest = require('../../../index')
  , tests
;

tests = {
  'RestResponse() should contain correct properties': function() {
    var request = new rest.RestRequest();
    var headers = {'headerField': 'value'};
    var data = {'dataField': 'value'};
    var error = new Error('Test error');
    var response = new rest.RestResponse(request, 200, headers, data, error);
    assert.strictEqual(response.request, request);
    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.headers, headers);
    assert.strictEqual(response.data, data);
    assert.strictEqual(response.error, error);
  }
};
module.exports = tests;