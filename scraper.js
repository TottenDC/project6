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
        }); //end response
      }); //end get
    } catch (error) {
        reject(error);
    }
  }); //end promise
}

function scrapeInfo(links) {
  const dataset = [];
  links.forEach((link, index) => {
    let promise = new Promise((resolve, reject) => {
      try {
        http.get(link, response =>{
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
            record.time = new Date().getTime();
            resolve(record);
          }); //end response end event
        }); //end get method
      } catch(error) {
          reject(error);
      }
    }); // end promise
    dataset.push(promise);
  }); //end forEach
  return Promise.all(dataset);
}

function generateCsvFile(dataset) {
  const csvDataset = d3.csvFormat(dataset);
  const fileName = `${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()}`
  fs.writeFile(`./data/${fileName}.csv`, csvDataset, (error) => {
    if (error) throw error;
    console.log('Website scraped and file saved successfully.');
  }); //end writeFile

}
grabData('http://shirts4mike.com/shirts.php')
  .then(scrapeInfo)
  .then(generateCsvFile);
