//Required modules
const fs = require('fs');
const http = require('http');
const cheerio = require('cheerio');
const d3 = require('d3-dsv');

/**
  * Checks for data file in working directory. Adds one if not found.
*/
if (! fs.existsSync('./data')) {
  fs.mkdirSync('./data');
}

/**
  * Logs error message to console and adds the error to a log file.
  * @param error The error object.
*/
function handleError(error) {
  console.log('Could not connect to shirts4mike.com. Program did not scrape data.')
  fs.appendFile('./scraper-error.log', `[${new Date()}] ` + error.message, () => {
    console.log('The error has been saved to scraper-error.log.')
  }); //end appendFile
}

/**
  * Creates an HTTP request, loads page HTML into cheerio, and stores links to products in an array.
  * If promise is resolved, returns the array.
  *@param string The url of ecommerce site to scrape.
*/
function grabData(url) {
  return new Promise((resolve, reject) => {
    try {
      const request = http.get(url, response => {
        let html = '';
        response.on('data', chunk => {
          html += chunk;
        }); //end response data event
        response.on('end', () => {
          const $home = cheerio.load(html);
          const links = [];
          $home('a', '.products').each(function(index, element) {
            let link = `http://shirts4mike.com/${$home(this).attr('href')}`;
            links.push(link);
          }); //end each
          resolve(links);
        }); //end response
      }); //end get
      request.on('error', handleError);
    } catch (error) {
        reject(error);
    }
  }); //end promise
}

/**
  * Creates an array of scraped data objects.
  * For each link, generates new HTTP request to load page, store HTML data in object, and push to array.
  * Returns the array only once all data has been loaded via Promise.all
  *@param array The array of product links returned from previous function.
*/
function scrapeInfo(links) {
  const dataset = [];
  links.forEach((link, index) => {
    let promise = new Promise((resolve, reject) => {
      try {
        const request = http.get(link, response =>{
          let productHTML = '';
          response.on('data', chunk => {
            productHTML += chunk;
          }); //end response data event
          response.on('end', () => {
            const $product = cheerio.load(productHTML);
            let record = {};
            record.title = $product('img', '.shirt-picture').attr('alt').replace(',', '');
            record.price = $product('.price').text();
            record.img_url = $product('img', '.shirt-picture').attr('src');
            record.url = link;
            record.time = new Date().toTimeString();
            resolve(record);
          }); //end response end event
        }); //end get method
        request.on('error', handleError);
      } catch(error) {
          reject(error);
      }
    }); // end promise
    dataset.push(promise);
  }); //end forEach
  return Promise.all(dataset);
}

/**
  * Takes object array and parses into CSV format. Stores data in a new file named with the date.
  *@param array An array of objects representing all scraped data.
*/
function generateCsvFile(dataset) {
  const csvDataset = d3.csvFormat(dataset);
  fs.writeFile(`./data/${new Date().toISOString().slice(0, 10)}.csv`, csvDataset, () => {
    console.log('Website scraped and file saved successfully.');
  }); //end writeFile
}

grabData('http://shirts4mike.com/shirts.php')
  .then(scrapeInfo)
  .then(generateCsvFile)
  .catch(handleError);
