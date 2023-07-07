const express = require('express')
const rp = require('request-promise');
const cher = require('cheerio');
const htmlparser2 = require('htmlparser2');
const cors = require('cors')
const setTimeoutP = require('timers/promises').setTimeout;




let boards = [];


async function getJson(numberPage) {
    
    let url = `https://boardgamegeek.com/browse/boardgame/page/${numberPage}`;
    let html = await rp(url);
    let Jsondata = [];
    let wikiUrls = [];
    let wikiID = [];

    
    let dom = htmlparser2.parseDocument(html);
    let $ = cher.load(dom);
    let len = $('td[class *= "collection_thumbnail"] a[href *= "/boardgame"]', html).length;
    
    for (let i = 0; i < len; i++) {
        wikiUrls.push($('td[class *= "collection_thumbnail"] a[href *= "/boardgame"]', html)[i].attribs.href);
        boards.push( { imgUrl: $('td[class *= "collection_thumbnail"] a[href *= "/boardgame"] img', html)[i].attribs.src , imgAlt: $('td[class *= "collection_thumbnail"] a[href *= "/boardgame"] img', html)[i].attribs.alt})
    } 
    
    const re = new RegExp("/[A-Za-z]+/[0-9]+");
    
    for (let i = 0; i < len; i++) {
        
        wikiID.push(re.exec(wikiUrls[i])[0].slice(11))
        
    }
    
    
    Jsondata = [];
    Jsondata = wikiID
    return Jsondata
  
  
}

async function createBoard(num1, num2,numberPage) {
         let Jsondata = await getJson(numberPage)
         let xml;
         console.log("start", num1, num2)
         for(let a = num2; a < num1; a++){
          
         
        console.log(a)
              try {
        xml = await rp(`https://boardgamegeek.com/xmlapi/boardgame/${Jsondata[a]}?stats=1`); }
              catch(e) {console.log(e)}
        const dom = htmlparser2.parseDocument(xml);
        const $ = cher.load(dom);
        boards[a].minplaytime = $("minplaytime", dom).text()
        boards[a].maxplaytime = $("maxplaytime", dom).text()
        let totalvotes = $('poll[name *= "suggested_numplayers"]', dom).attr().totalvotes
        boards[a].totalvotes = totalvotes
        boards[a].rating = $('ratings average', dom).text()
        let len = $('poll[name *= "suggested_numplayers"] results result[value *= "Best"]', dom).length
        for (let i = 0; i< len; i++) {
            boards[a][`player_${i+1}`] = $('poll[name *= "suggested_numplayers"] result[value *= "Best"]', dom)[i].attribs.numvotes }
    } 
    
     console.log(boards.slice(num2,num1))
     return JSON.stringify(boards.slice(num2,num1))
    }





const app = express()
const port = 3000
const corsOptions = {
    origin: '*',
    methods: [],
    allowedHeaders: [],
    exposedHeaders: [],
    credentials: true
};


app.get('/get', cors(corsOptions), async (req, res, next) => {
    numberPage = req.query.id
    num1 = parseInt(req.query.num1)
    num2 = parseInt(req.query.num2)
   
    let a = await createBoard(num1,num2,numberPage)
    boards.splice(0,boards.length)
    res.send(a)
  })


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
