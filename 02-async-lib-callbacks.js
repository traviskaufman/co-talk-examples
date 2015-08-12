/* jshint node:true */
'use strict';

import fs from 'fs';
import path from 'path';

import async from 'async';
import prompt from 'prompt';
import request from 'request';
import moment from 'moment';

async.waterfall([
  askForUserName,
  fetchRepos
], function(err, name, repos) {
  if (err) {
    return handleError(err);
  }

  console.log(`\n***Ten Most Recently Pushed Repos for ${name} ***\n`);
  printRepos(repos);
  console.log();
});

function askForUserName(cb) {
  prompt.start();
  prompt.get({
    name: 'username',
    description: 'GH Username to fetch repos for',
    required: true
  }, (err, {username}) => cb(err, username));
}

function fetchRepos(name, cb) {
  const url = `https://api.github.com/users/${name}/repos?sort=pushed&direction=desc`;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'request'
  };
  request({ url, headers }, function(err, res, body) {
    var data;
    if (res && res.statusCode >= 400) {
      err = new Error(body);
    }
    if (!err) {
      data = JSON.parse(body);
    }
    cb(err, name, data);
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

function handleError(err) {
  console.error('ERROR!');
  console.error(err.message);
  console.error(err.stack);
  process.exit(1);
}
