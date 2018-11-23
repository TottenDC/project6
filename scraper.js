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

const scrapData = [];

  http.get('http://shirts4mike.com/shirts.php', response => {
   let html = '';
   response.on('data', chunk => {
     html += chunk;
   }); //end response data event
   response.on('end', () => {
     const $home = cheerio.load(html);
     const links = [];
     $home('a', '.products').each(function(index, element) {
       let link = $home(this).attr('href');
       links.push(link);
     }); //end each
     links.forEach(link => {
       http.get('http://shirts4mike.com/' + link, response =>{
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
           dataset.push('http://shirts4mike.com/' + link)
           dataset.push(new Date());
           scrapData.push(dataset);
         }); //end response end event
       }); //end get method
     }); //end forEach
   }); //end response end event
 }); //end get method
console.log(scrapData);
