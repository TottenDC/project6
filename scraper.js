//Required modules
const fs = require('fs');
const cheerio = require('cheerio');
const csvStringer = require('csv-stringify');

/**
* Checks for data file in working directory. Adds one if not found.
*/
if (! fs.existsSync('./data')) {
  fs.mkdirSync('./data');
}
