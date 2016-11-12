'use strict';

var stats = require('download-stats');
var downloads = require('../');

// listen for when repos for the maintainers have been retrieved
downloads.on('repos', function(name, repos) {
  console.log(`Found ${repos.length} repos for ${name}.`);
});

// listen for when downloads for each repo have been retrieved
downloads.on('repo', function(name, results) {
  console.log(`Retrieved ${stats.calc.total(results)} total downloads for ${name}.`);
});

// listen for when downloads for all repos have finished being retrieved
downloads.on('maintainer', function(name, results) {
  console.log(`Finished retrieving downloads for ${name}.`);
});

// start retrieving downloads for `doowb`, limit the amount of requests being
// made to 5 to reduce timeouts
downloads.maintainer('doowb', {limit: 5}, function(err, results) {
  if (err) return console.error(err);
  // timeout to allow showing previous messages from listeners
  // before processing
  setTimeout(function() {
    Object.keys(results).forEach(function(name) {
      var repo = results[name];
      console.log(`${name}: ${stats.calc.total(repo)}.`);
    });
    process.exit();
  }, 1000);
});
