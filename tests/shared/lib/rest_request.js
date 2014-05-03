"use strict";

var assert = require('assert')
  , rest = require('../../../index')
  , tests
  , serverUrl = 'http://localhost:3000';

tests = {
  'RestRequest should noramlize the method to uppercase': function() {
    var request = new rest.RestRequest('get');
    assert.equal(request.method, 'GET');
  },

  'RestRequest() should set all options correctly': function() {
    var opts = {
      baseUrl: 'http://base-url.com',
      path: 'foo',
      format: 'json',
      query: {q: 'bar'},
      sort: {title: 'asc'},
      limit: 10,
      offset: 11,
      skip: 2,
      perPage: 20,
      params: {zooby: true},
      nocase: true,
      data: { someProp: 'someValue'},
      headers: {
        'X-Application': 'rest.js'
      },
      forceUncached: false,
      dataType: 'json',
      crossDomain: true
    };

    var request = new rest.RestRequest('GET', 'foo', opts);
    for (var name in opts) {
      assert.ok(typeof request[name] !== 'undefined');
      assert.equal(typeof request[name], typeof opts[name]);
      assert.deepEqual(request[name], opts[name]);
    }
  },
  'RestRequest.prepare() should populate params correctly': function() {
    var opts = {
      forceUncached: true,
      query: {q: 'search term'},
      sort: {title: 'asc'},
      limit: 10,
      offset: 11,
      skip: 20,
      page: 2,
      perPage: 30,
      nocase: true
    };

    var request = new rest.RestRequest('GET', 'foo', opts);

    request.prepare();

    // t param should be populated with a timestamp
    assert.equal(typeof request.params.t, 'number');

    // query, sort, limit, offset, skip, page, perPage and nocase should be moved to the params
    ['query', 'sort', 'limit', 'offset', 'skip', 'page', 'perPage', 'nocase'].forEach(function(name) {
      assert.deepEqual(request.params[name], opts[name]);
    });
  }
};
module.exports = tests;