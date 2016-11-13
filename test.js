'use strict';

require('mocha');
var assert = require('assert');
var downloads = require('./');
var repoCount = 0;
var maintainerCount = 0;

function countRepos(name) {
  repoCount++;
}

function countMaintainerRepos(name, repos) {
  maintainerCount += repos.length;
}

describe('downloads', function() {
  beforeEach(function() {
    repoCount = 0;
    maintainerCount = 0;
    downloads.on('repo', countRepos);
    downloads.on('repos', countMaintainerRepos);
  });

  afterEach(function() {
    downloads.off('repo', countRepos);
    downloads.off('repos', countMaintainerRepos);
  });

  it('should export an object', function() {
    assert(downloads);
    assert.equal(typeof downloads, 'object');
    assert.equal(typeof downloads.repo, 'function');
    assert.equal(typeof downloads.maintainer, 'function');
  });

  it('should throw an error when invalid args are passed', function() {
    return downloads.repo()
      .then(function() {
        throw new Error('expected an error');
      })
      .catch(function(err) {
        assert(err);
        assert.equal(err.message, 'expected `name` to be a string');
      });
  });

  it('should retrieve download counts for a repository', function() {
    this.timeout(0);
    return downloads.repo('micromatch')
      .then(function(results) {
        assert.equal(Array.isArray(results), true);
        assert(results.length > 0);
        assert.equal(repoCount, 1);
      });
  });

  it('should retrieve download counts for all repositories for a maintainer', function() {
    this.timeout(0);
    return downloads.maintainer('doowb', {limit: 5})
      .then(function(results) {
        assert.equal(typeof results, 'object');
        assert.equal(Array.isArray(results), false);
        assert.equal(repoCount, Object.keys(results).length);
        assert.equal(repoCount, maintainerCount);
      });
  });
});
