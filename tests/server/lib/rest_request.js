"use strict";

var assert = require('assert')
  , rest = require('../../../index')
  , tests
  , serverUrl = 'http://localhost:3000'
  , path = require('path')
  , fs = require('fs');

var fixturesPath = path.normalize(path.join(__dirname, '..', '..', 'fixtures'));

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
    var fixture = fs.readFileSync(path.join(fixturesPath, 'success.json'));
    var fixtureJson = require(path.join(fixturesPath, 'success.json'));
    assert.equal(response.data, fixture);

    next();
  });
};
/*tests['RestRequest.send() should return a Response with an error when called with invalid URL'] = function(next) {
  var request = new rest.RestRequest('GET', serverUrl + '/should-be-invalid');

  request.send(function(response) {
    // there should be a response
    assert.ok(response);
    assert.ok(response instanceof rest.RestResponse);

    // there should an error
    assert.ok(response.error);

    // response statusCode should be 404
    assert.equal(response.statusCode, 404);
    assert.equal(response.error.message, 'Not found');

    next();
  });
};*/
module.exports = tests;