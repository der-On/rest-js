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