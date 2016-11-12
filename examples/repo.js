'use strict';

var downloads = require('../');

downloads.repo('micromatch', function(err, results) {
  if (err) return console.error(err);
  console.log(results);
});
