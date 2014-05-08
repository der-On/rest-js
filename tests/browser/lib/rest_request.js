"use strict";

var assert = require('assert')
  , rest = require('../../../index')
  , tests
  , serverUrl = 'http://localhost:3000'
  , path = require('path');

tests = require('../../shared/lib/rest_request');
tests['RestRequest.send() should return a valid RestResponse'] = function(next) {
  var request = new rest.RestRequest('GET', serverUrl + '/tests/fixtures/success.json');

  request.send(function(response) {
    // there should be a response
    assert.ok(response);
    assert.ok(response instanceof rest.RestResponse);

    // there should be no error
    assert.ok(!response.error);

    // response statusCode should be 200
    assert.equal(response.statusCode, 200);

    // data should match our fixture
    assert.equal(response.data, '{\"success\":true}');

    next();
  });
};
module.exports = tests;