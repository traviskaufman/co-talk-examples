'use strict';

import fs from 'fs';
import path from 'path';

import co from 'co';
import prompt from 'prompt';
import request from 'request';
import moment from 'moment';

co(function*() {
  const name = yield askForUserName();
  const repos = yield fetchRepos(name);
  console.log(`\n***Ten Most Recently Pushed Repos for ${name} ***\n`);
  printRepos(repos);
  console.log();
}).catch(handleError);

function askForUserName() {
  const schema = {
    name: 'username',
    description: 'GH Username to fetch repos for',
    required: true
  };
  prompt.start();
  return nodePromise((cb) => prompt.get(schema, cb))
    .then(({username}) => username);
}

function fetchRepos(name, cb) {
  const url = `https://api.github.com/users/${name}/repos?sort=pushed&direction=desc`;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'request'
  };
  return nodePromise((cb) => request({ url, headers }, cb))
    .then(function([res, body]) {
      if (res && res.statusCode >= 400) {
        return Promise.reject(new Error(body));
      }
      return { name, repos: JSON.parse(body) };
    });
}

function printRepos(repos) {
  repos.slice(0, 10).forEach(_print);
  function _print(repo) {
    let s = repo.full_name.cyan;
    if (repo.fork) {
      s += ' [fork]'.magenta;
    }
    s += (` (${repo.stargazers_count} star(s))`).green;
    s += (` Last pushed ${moment(repo.pushed_at, moment.ISO_8601).format("dddd, MMMM Do YYYY, h:mma")}`).yellow;
    console.log(s);
  }
}

function nodePromise(handler) {
  return new Promise(function(resolve, reject) {
    handler(function(err, ...args) {
      if (err) {
        return reject(err);
      }
      resolve(args.length <= 1 ? args[0] : args);
    });
  });
}

function handleError(err) {
  console.error('ERROR!');
  console.error(err.message);
  console.error(err.stack);
  process.exit(1);
}
