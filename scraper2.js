//Required modules
const fs = require('fs');
const http = require('http');
const cheerio = require('cheerio');
const csvStringer = require('csv-stringify');

/**
* Checks for data file in working directory. Adds one if not found.
*/
if (! fs.existsSync('./data')) {
  fs.mkdirSync('./data');
}

function grabData(url) {
  return new Promise((resolve, reject) => {
    try {
      http.get(url, response => {
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
        });
      });
    } catch (error) {
        reject(error);
    }
  });
}

function scrapeInfo(links) {
  const scrapData = [];
  links.forEach(link => {
    http.get(link, response =>{
      let productHTML = '';
      response.on('data', chunk => {
        productHTML += chunk;
      }); //end response data event
      response.on('end', () =>{
        const $product = cheerio.load(productHTML);
        let dataset = [];
        dataset.push($product('img', '.shirt-picture').attr('alt'));
        dataset.push($product('.price').text());
        dataset.push($product('img', '.shirt-picture').attr('src'));
        dataset.push(link)
        dataset.push(new Date());
        scrapData.push(dataset);
      }); //end response end event
    }); //end get method
  }); //end forEach
  return scrapData;
}

grabData('http://shirts4mike.com/shirts.php')
  .then(scrapeInfo)
  .then(console.log());
