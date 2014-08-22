function copyOptions(opts)
{
  var copy = {};
  for(var name in opts) {
    copy[name] = opts[name];
  }
  return copy;
};
module.exports.copyOptions = copyOptions;

function mergeOptions(from, to)
{
  for(var name in from)
  {
    if (typeof from[name] !== 'undefined' || from[name] !== null) {
      to[name] = from[name];
    }
  }
};
module.exports.mergeOptions = mergeOptions;

function isString(value) {
  return value != null && typeof value === 'string';
}
module.exports.isString = isString;

function isArray(value) {
  return value != null && typeof value === 'object' && value.constructor.name === 'Array';
}
module.exports.isArray = isArray;

function isDate(value) {
  return value != null && typeof value === 'object' && value.constructor.name === 'Date';
}
module.exports.isDate = isDate;

function isRegExp(value) {
  return value != null && typeof value === 'object' && value.constructor.name === 'RegExp';
}
module.exports.isRegExp = isRegExp;

function isError(value)
{
  return value != null && typeof value === 'object' && value.constructor.name === 'Error';
}
module.exports.isError = isError;

function isObject(value) {
  return value != null && typeof value === 'object';
}
module.exports.isObject = isObject;

function deepCopy(source, destination){
  if (!destination) {
    destination = source;
    if (source) {
      if (isArray(source)) {
        destination = deepCopy(source, []);
      } else if (isDate(source)) {
        destination = new Date(source.getTime());
      } else if (isRegExp(source)) {
        destination = new RegExp(source.source);
      } else if (isError(source)) {
        destination = new Error(source.message, source.code || null);
        destination.stack = source.stack || null;
      } else if (isObject(source)) {
        destination = deepCopy(source, {});
      }
    }
  } else {
    if (source === destination) throw Error("Can't deep copy! Source and destination are identical.");
    if (isArray(source)) {
      destination.length = 0;
      for ( var i = 0; i < source.length; i++) {
        destination.push(deepCopy(source[i]));
      }
    } else {
      for(var key in destination) {
        delete destination[key];
      }
      for ( var key in source) {
        destination[key] = deepCopy(source[key]);
      }
    }
  }
  return destination;
}
module.exports.deepCopy = deepCopy;

/**
 @name paramify

 Taken from https://github.com/mde/utilities

 @public
 @function
 @return {String} Returns a querystring contains the given values
 @description Convert a JS Object to a querystring (key=val&key=val). Values in arrays
 will be added as multiple parameters
 @param {Object} obj An Object containing only scalars and arrays
 @param {Object} o The options to use for formatting
 @param {Boolean} [o.consolidate=false] take values from elements that can return
 multiple values (multi-select, checkbox groups) and collapse into a single,
 comman-delimited value.
 @param {Boolean} [o.includeEmpty=false] include keys in the string for all elements, even
 they have no value set (e.g., even if elemB has no value: elemA=foo&elemB=&elemC=bar).
 Note that some false-y values are always valid even without this option, [0, ''].
 This option extends coverage to [null, undefined, NaN]
 @param {Boolean} [o.snakeize=false] change param names from camelCase to snake_case.
 @param {Boolean} [o.escapeVals=false] escape the values for XML entities.
 @param {Boolean} [o.index=false] use numeric indices for arrays
 */
function paramify(obj, o) {
  var opts = o || {},
    _opts,
    str = '',
    key,
    val,
    isValid,
    itemArray,
    arr = [],
    arrVal,
    prefix = opts.prefix || '',
    self = this;

  function getParamName(key)
  {
    if (opts.prefix) {
      return prefix + '[' + key + ']';
    }
    else {
      return key;
    }
  }

  for (var p in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, p)) {
      val = obj[p];

      // This keeps valid falsy values like false and 0
      // It's duplicated in the array block below. Could
      // put it in a function but don't want the overhead
      isValid = !( val === null || val === undefined ||
        (typeof val === 'number' && isNaN(val)) );

      key = opts.snakeize ? string.snakeize(p) : p;
      if (isValid) {
        // Multiple vals -- array
        if (isArray(val) && val.length) {
          itemArray = [];
          for (var i = 0, ii = val.length; i < ii; i++) {
            arrVal = val[i];
            // This keeps valid falsy values like false and 0
            isValid = !( arrVal === null || arrVal === undefined ||
              (typeof arrVal === 'number' && isNaN(arrVal)) );

            // for index mode, which works recursive
            // objects and array must not be encoded
            if (opts.index && typeof arrVal === 'object') {
              itemArray[i] = arrVal;
            }
            else {
              itemArray[i] = isValid ? encodeURIComponent(arrVal) : '';

              if (opts.escapeVals) {
                itemArray[i] = string.escapeXML(itemArray[i]);
              }
            }
          }
          // Consolidation mode -- single value joined on comma
          if (opts.consolidate) {
            arr.push(getParamName(key) + '=' + itemArray.join(','));
          }
          // Indexed mode -- multiple, same-named params with numeric indices
          else if (opts.index) {
            // {foo: [1, 2, 3]} => 'foo[0]=1&foo[1]=2&foo[2]=3'

            itemArray.forEach(function(item, i) {
              // recursion of arrays
              if (isArray(item) && item.length) {
                _opts = mixin(opts, {});
                item.forEach(function(_item, ii) {

                  if (typeof _item === 'object') {
                    _opts.prefix = getParamName(key) + '[' + i + '][' + ii + ']';
                    arr.push(self.paramify(_item, _opts));
                  }
                  else {
                    arr.push(getParamName(key) + '[' + i + '][' + ii + ']=' + _item);
                  }
                });
              }
              // recursion of object in array
              else if (typeof item === 'object') {
                _opts = mixin(opts, {});
                _opts.prefix = getParamName(key) + '[' + i + ']';
                arr.push(self.paramify(item, _opts));
              }
              // primitive
              else {
                arr.push(getParamName(key) + '[' + i + ']=' + item);
              }
            });
          }
          // Normal mode -- multiple, same-named params with each val
          else {
            // {foo: [1, 2, 3]} => 'foo=1&foo=2&foo=3'
            // Add into results array, as this just ends up getting
            // joined on ampersand at the end anyhow
            arr.push(getParamName(key) + '=' + itemArray.join('&' + getParamName(key) + '='));
          }
        }
        // Object -- recursion
        else if (typeof val === 'object') {
          _opts = mixin(opts, {});
          _opts.prefix = getParamName(key);

          arr.push(this.paramify(val, _opts));
        }
        // Single val -- string
        else {
          if (opts.escapeVals) {
            val = string.escapeXML(val);
          }
          arr.push(getParamName(key) + '=' + encodeURIComponent(val));
        }
        str += '&';
      }
      else {
        if (opts.includeEmpty) { arr.push(getParamName(key) + '='); }
      }
    }
  }
  return arr.join('&');
}
module.exports.paramify = paramify;

/*
 * Taken from https://github.com/mde/utilities
 */
var _mix = function (targ, src, merge, includeProto) {
  for (var p in src) {
    // Don't copy stuff from the prototype
    if (src.hasOwnProperty(p) || includeProto) {
      if (merge &&
        // Assumes the source property is an Object you can
        // actually recurse down into
        (typeof src[p] == 'object') &&
        (src[p] !== null) &&
        !(src[p] instanceof Array)) {
        // Create the source property if it doesn't exist
        // Double-equal to undefined includes both null and undefined
        if (targ[p] == undefined) {
          targ[p] = {};
        }
        _mix(targ[p], src[p], merge, includeProto); // Recurse
      }
      // If it's not a merge-copy, just set and forget
      else {
        targ[p] = src[p];
      }
    }
  }
};

/*
 * Mix in the properties on an object to another object
 * yam.mixin(target, source, [source,] [source, etc.] [merge-flag]);
 * 'merge' recurses, to merge object sub-properties together instead
 * of just overwriting with the source object.
 *
 * Taken from https://github.com/mde/utilities
 */
function mixin() {
  var args = Array.prototype.slice.apply(arguments),
    merge = false,
    targ, sources;
  if (args.length > 2) {
    if (typeof args[args.length - 1] == 'boolean') {
      merge = args.pop();
    }
  }
  targ = args.shift();
  sources = args;
  for (var i = 0, ii = sources.length; i < ii; i++) {
    _mix(targ, sources[i], merge);
  }
  return targ;
}
module.exports.mixin = mixin;

/**
 @name capitalize

 Taken from https://github.com/mde/utilities

 @public
 @function
 @return {String} The string with the first letter capitalized
 @description capitalize returns the given string with the first letter capitalized.
 @param {String} string The string to capitalize
 */
function capitalize(string) {
  var str = string || '';
  str = String(str);
  return str.substr(0, 1).toUpperCase() + str.substr(1);
}
module.exports.capitalize = capitalize;
