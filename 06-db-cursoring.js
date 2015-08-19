'use strict';

import co from 'co';
import Promise from 'bluebird';
import pg from 'pg';
import Cursor from 'pg-cursor';
import mkDebugger from 'debug';
import pkgInfo from './package.json';

const debug = mkDebugger(pkgInfo.name);

debug('Promisifying pg modules');
Promise.promisifyAll(pg);
Promise.promisifyAll(Cursor.prototype);

Promise.using(getConnection('postgres://localhost/usda'), co.wrap(printFoods))
  .then(() => process.exit(0))
  .catch((err) => console.error(err) || process.exit(1));

function* printFoods(client) {
  var numRead = 0, results;
  const sql = 'SELECT shrt_desc FROM food_des ORDER BY shrt_desc ASC;';
  const pageAmt = 250;

  debug('Execute: %s', sql);
  const cursor = client.query(new Cursor(sql));

  while (results = yield cursor.readAsync(pageAmt)) {
    if (!results.length) {
      break;
    }
    results.forEach((r, i) => console.log(`(${numRead+i}): ${r.shrt_desc}`));
    numRead += results.length;
  }

  debug('Finished!');
}

function getConnection(connString) {
  var close;
  return pg.connectAsync(connString).spread(function(client, done) {
    close = done;
    return client;
  }).disposer(function() {
    if (close) {
      close();
    }
  });
}
