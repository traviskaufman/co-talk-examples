'use strict';

export default coroutine;

function coroutine(gen) {
  if (typeof gen !== 'function' || typeof gen.prototype.next !== 'function') {
    throw new TypeError('You must provide a generator function');
  }
  return coroutine_(gen());

  function coroutine_(it, val) {
    var res;
    try {
      res = it.next(val);
    } catch (err) {
      // Catch synchronous unhandled errors
      return Promise.reject(err);
    }

    if (res.done) {
      return Promise.resolve(res.value);
    }

    return res.value.then(function(v) { // always return promise
      // Resume generator when value has been retrived
      return coroutine_(it, v);
    }).catch(function(err) {
      // Give generator chance to handle the error
      it.throw(err);
      return coroutine_(it);
    });
  }
}
