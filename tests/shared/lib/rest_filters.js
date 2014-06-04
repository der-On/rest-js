'use strict';

var assert = require('assert');
var rest = require('../../../index');
var tests;

tests = {
  'RESPONSE_DATA_FILTER_JSON should return an object': function() {
    var data = {
      something: 'foo'
    };
    var dataJSON = JSON.stringify(data);

    var request = new rest.RestRequest('GET', 'foo', { dataType: 'json' });
    var response = new rest.RestResponse(request, 200, {}, dataJSON);
    assert.deepEqual(rest.RestFilters.RESPONSE_DATA_FILTER_JSON(dataJSON, response), data);
  },

  'RESPONSE_DATA_FILTER_JSON should return null if given empty string': function() {
    var dataJSON = '';

    var request = new rest.RestRequest('GET', 'foo', { dataType: 'json' });
    var response = new rest.RestResponse(request, 200, {}, dataJSON);
    assert.strictEqual(rest.RestFilters.RESPONSE_DATA_FILTER_JSON(dataJSON, response), null);
  },

  'RESPONSE_DATA_FILTER_JSON should return same string if its an invalid JSON string': function() {
    var invalidJson = '{"very:"invalid"}}';

    var request = new rest.RestRequest('GET', 'foo', { dataType: 'json' });
    var response = new rest.RestResponse(request, 200, {}, invalidJson);
    assert.equal(rest.RestFilters.RESPONSE_DATA_FILTER_JSON(invalidJson, response), invalidJson);
  },

  'REQUEST_DATA_FILTER_JSON should return a JSON string': function() {
    var data = {
      something: 'foo'
    };
    var dataJSON = JSON.stringify(data);

    var request = new rest.RestRequest('GET', 'foo', { dataType: 'json' });
    assert.deepEqual(rest.RestFilters.REQUEST_DATA_FILTER_JSON(data, request), dataJSON);
  },

  'REQUEST_DATA_FILTER_JSON should return null string if given null': function() {
    var data = null;

    var request = new rest.RestRequest('GET', 'foo', { dataType: 'json' });
    assert.strictEqual(rest.RestFilters.REQUEST_DATA_FILTER_JSON(data, request), 'null');
  },

  'REQUEST_DATA_FILTER_JSON should return same string if its a string already': function() {
    var json = '{"some:"data"}';

    var request = new rest.RestRequest('GET', 'foo', { dataType: 'json' });
    assert.strictEqual(rest.RestFilters.REQUEST_DATA_FILTER_JSON(json, request), json);
  },

  'ERROR_FILTER should not return an error when statusCode < 400 and no error in response data': function() {
    var data = {
      something: 'foo'
    };

    var request = new rest.RestRequest('GET', 'foo');
    var response = new rest.RestResponse(request, 200, {}, data);

    var error = rest.RestFilters.ERROR_FILTER(null, response);
    assert.equal(error, null);
  },

  'ERROR_FILTER should return an error when response data contains errors = Object': function() {
    var data = {
      errors: {
        first: 'Should be first.',
        second: 'Should be second.'
      }
    };

    var request = new rest.RestRequest('GET', 'foo');
    var response = new rest.RestResponse(request, 400, {}, data);

    var error = rest.RestFilters.ERROR_FILTER(null, response);
    assert.equal(error.toString(), (new Error('first: Should be first.\nsecond: Should be second.')).toString());
  },

  'ERROR_FILTER should return an error when response data contains errors = Array': function() {
    var data = {
      errors: [
        'Should be first.',
        'Should be second.'
      ]
    };

    var request = new rest.RestRequest('GET', 'foo');
    var response = new rest.RestResponse(request, 400, {}, data);

    var error = rest.RestFilters.ERROR_FILTER(null, response);
    assert.equal(error.toString(), (new Error('Should be first.\nShould be second.')).toString());
  },

  'ERROR_FILTER should return an error when response data contains error = Object': function() {
    var data = {
      error: { message: 'Should be there.' }
    };

    var request = new rest.RestRequest('GET', 'foo');
    var response = new rest.RestResponse(request, 400, {}, data);

    var error = rest.RestFilters.ERROR_FILTER(null, response);
    assert.equal(error.toString(), (new Error('Should be there.')).toString());
  },

  'ERROR_FILTER should return an error when response data contains error = String': function() {
    var data = {
      error: 'Should be there.'
    };

    var request = new rest.RestRequest('GET', 'foo');
    var response = new rest.RestResponse(request, 400, {}, data);

    var error = rest.RestFilters.ERROR_FILTER(null, response);
    assert.equal(error.toString(), (new Error('Should be there.')).toString());
  },

  'PARAM_FILTER_JSON should return a json string': function() {
    var param = {foo: 'bar', list: [2, 3, 4], obj: {a: 2, b: {c: 2}}};
    var jsonized = 'name=' + JSON.stringify(param);

    var request = new rest.RestRequest('GET', 'foo');
    assert.equal(rest.RestFilters.PARAM_FILTER_JSON({name: 'name', value: param} ,request), jsonized);
  },

  'PARAM_FILTER_PARAMS should return paramified object': function() {
    var param = {foo: 'bar', list: [2, 3, 4], obj: {a: 2, b: {c: 2}}};
    var paramified = 'name[foo]=bar&name[list][0]=2&name[list][1]=3&name[list][2]=4&name[obj][a]=2&name[obj][b][c]=2';

    var request = new rest.RestRequest('GET', 'foo');
    assert.equal(rest.RestFilters.PARAM_FILTER_PARAMS({name: 'name', value: param} ,request), paramified);
  },

  'PARAMS_FILTER_METHOD_FALLBACK should insert URL and request body param _method': function() {
    ['DELETE', 'PUT'].forEach(function(method) {
      var request = new rest.RestRequest(method, 'foo');
      var params = rest.RestFilters.PARAMS_FILTER_METHOD_FALLBACK({}, request);
      assert.ok(params['_method']);
      assert.equal(params._method, method);
      assert.ok(request.data['_method']);
      assert.equal(request.data._method, method);
      assert.equal(request.headers['X-HTTP-METHOD-OVERRIDE'], method);
    });
  }
};
module.exports = tests;