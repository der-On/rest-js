"use strict";

var assert = require('assert')
  , rest = require('../../index')
  , tests;

tests = {
  'RestRequest shouuld noramlize the method to uppercase': function() {
    var request = new rest.RestRequest('get');
    assert.equal(request.method, 'GET');
  }
};
module.exports = tests;