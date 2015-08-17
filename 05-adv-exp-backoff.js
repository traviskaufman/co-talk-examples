'use strict';

import co from 'co';

export default retry;

function retry(fn, maxAttempts=3, backoffTime=1000) {
  let attempt = 0;
  return co(function*() {
    var v, err;
    while (attempt++ < maxAttempts) {
      err = null;
      try {
        v = fn();
        if (typeof v.then === 'function') {
          v = yield v;
        }
        break;
      } catch(e) {
        err = e;
        if (attempt < maxAttempts) {
          yield sleep(Math.pow(backoffTime, attempt) + Math.random()*0.4*backoffTime);
        }
      }
    }

    if (err) {
      throw err;
    }
    return v;
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let fail = true;
let weird = function() {
  return new Promise(function(resolve, reject) {
    if (fail) {
      let err = new Error("I'm failing!");
      fail = false;
      console.error(err.message);
      return reject(err);
    }
    resolve("I succeeded!");
  });
};

retry(weird).then((msg) => console.log(msg));
