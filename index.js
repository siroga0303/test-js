const express = require('express')
const rp = require('request-promise');
const cher = require('cheerio');
const htmlparser2 = require('htmlparser2');
const url = 'https://boardgamegeek.com/browse/boardgame';
const app = express()
const port = 3000


async function getJson() {
    const html = await rp(url);
    
    //success!
    const wikiUrls = [];
    const wikiID = [];
    const dom = htmlparser2.parseDocument(html);
    const $ = cher.load(dom);
    let len = $('div[id *= "results_objectname"] a[href *= "/boardgame"]', html).length;
    
    for (let i = 0; i < len; i++) {
        wikiUrls.push($('div[id *= "results_objectname"] a[href *= "/boardgame"]', html)[i].attribs.href);
    }
    
    const re = new RegExp("/[A-Za-z]+/[0-9]+");
    
    for (let i = 0; i < len; i++) {
        
        wikiID.push(re.exec(wikiUrls[i])[0].slice(11))
        
    }
    
    var myJsonString = JSON.stringify(wikiID);
    
    return myJsonString
    
  
  
}


let a;
app.get('/', async (req, res, next) => {
    console.log('ID:')
    a = await getJson()
    
    next()
  }, (req, res, next) => {
    
    res.send(a)
  })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})