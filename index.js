'use strict';

var co = require('co');
var npm = require('npm-api')();
var limiter = require('co-limiter');
var extend = require('extend-shallow');
var Emitter = require('component-emitter');

var downloads = Emitter({});

/**
 * Retieve the download stats for the specified repository.
 * The results are an array of download object that contain the `day` and `downloads` count for that day: `[{day: '2016-11-12', downloads: 12345}]`.
 * This method will also emit a `repo` event on the `downloads` object when the downloads are available.
 *
 * ```js
 * downloads.repo('micromatch', function(err, results) {
 *   if (err) return console.error(err);
 *   console.log(results);
 * });
 * //=> [
 * //=>   { day: '2016-11-12', downloads: 94699 },
 * //=>   { day: '2016-11-11', downloads: 264382 },
 * //=>   { day: '2016-11-10', downloads: 309356 },
 * //=>   { day: '2016-11-09', downloads: 290557 },
 * //=>   { day: '2016-11-08', downloads: 316004 },
 * //=>   ...
 * //=> ]
 * ```
 * @param  {String} `name` Name of the repository to get download counts for.
 * @param  {Object} `options` Additional options.
 * @param  {Function} `cb` Optional callback function to get the results. If not provided, a promise is returned.
 * @return {Promise} If no callback function is provided, a promise is returned that will yield the results array.
 * @emits `repo` Emits `repo` event when downloads are available. Emits the repo name and download count array.
 * @api public
 */

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

/**
 * Retrieve the download stats for all of the repositories maintained by the specified maintainer.
 * The results are an object where the key is the repository name and the value is an array of download counts. This is the same array returned by the [repo](#repo) method.
 * This method will also emit a `repos` event when the `repos` have been retrieved for the maintainer and a `maintainer` event when
 * all of the downloads have been retrieved and the final results object is available.
 *
 * ```js
 * downloads.maintainer('doowb', function(err, results) {
 *   if (err) return console.error(err);
 *   console.log(results);
 * });
 * //=> {
 * //=>   "add-collaborator": [...],
 * //=>   "accountdown-token": [...],
 * //=>   "add-banner": [...],
 * //=>   "align-text": [...],
 * //=>   "JSONStream": [...],
 * //=>   "anchors": [...],
 * //=>   "announcement": [...],
 * //=>   ...
 * //=> }
 * ```
 * @param  {String} `name` Name of the maintainer to retrieve download counts for.
 * @param  {Object} `options` Additional options to control how the downloads are gathered.
 * @param  {Number} `options.limit` Specify how many repositories can be processed concurrently. Defaults to 1.
 * @param  {Function} `cb` Optional callback function to get the results. If not provied, a promise is returned.
 * @return {Promise} If no callback function is provied, a promise is returned that with yield the results object.
 * @emits `repos` Emits `repos` event when the maintainers repositories have been retrieved. Emits the maintainer name and the repository array.
 * @emits `repo` Emits `repo` event for each repository after the repository's download counts are available.
 * @emits `maintainer` Emits `maintainer` event when all of the download counts for all of the maintainer's repositories are available.
 * @api public
 */

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

/**
 * Expose `downloads`
 */

module.exports = downloads;
