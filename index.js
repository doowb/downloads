'use strict';

var co = require('co');
var npm = require('npm-api')();
var extend = require('extend-shallow');

module.exports = function(options, cb) {
  return co(function*() {
    if (typeof options === 'string') {
      options = {repo: options};
    }

    var opts = extend({}, options);
    if (!opts.repo && !opts.maintainer) {
      throw new Error('expected "options.repo" or "options.maintainer" to be set');
    }

    if (opts.repo) {
      return yield npm.repo(opts.repo).downloads();
    }

    var maintainer = npm.maintainer(opts.maintainer);
    var repos = yield maintainer.repos();
    return repos.map(function(name) {
      var repo = npm.repo(name);
      return repo.downloads();
    });
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
