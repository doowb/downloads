'use strict';

var co = require('co');
var npm = require('npm-api')();
var limiter = require('co-limiter');
var extend = require('extend-shallow');
var Emitter = require('component-emitter');

var downloads = Emitter({});

downloads.repo = function(name, options, cb) {
  return co(function*() {
    if (typeof name !== 'string') {
      throw new TypeError('expected `name` to be a string');
    }

    if (typeof options === 'function') {
      cb = options;
      options = {};
    }

    var opts = extend({}, options);
    var results = yield npm.repo(name).downloads();
    downloads.emit('repo', name, results);
    return results;
  })
  .then(function(result) {
    if (typeof cb === 'function') {
      cb(null, result);
      return;
    }
    return result;
  }, function(err) {
    if (typeof cb === 'function') {
      cb(err);
      return;
    }
    throw err;
  });
};

downloads.maintainer = function(name, options, cb) {
  return co(function*() {
    if (typeof name !== 'string') {
      throw new TypeError('expected `name` to be a string');
    }

    if (typeof options === 'function') {
      cb = options;
      options = {};
    }

    var opts = extend({limit: 1}, options);
    var limit = limiter(opts.limit);

    var maintainer = npm.maintainer(name);
    var repos = yield maintainer.repos();
    downloads.emit('repos', name, repos);

    var results = {};
    yield repos.map(function(repo) {
      return co(function*() {
        results[repo] = yield limit(run(repo));
      });
    });
    downloads.emit('maintainer', name, results);
    return results;
  })
  .then(function(result) {
    if (typeof cb === 'function') {
      cb(null, result);
      return;
    }
    return result;
  }, function(err) {
    if (typeof cb === 'function') {
      cb(err);
      return;
    }
    throw err;
  });
};

function* run(name) {
  return yield downloads.repo(name);
}

module.exports = downloads;
