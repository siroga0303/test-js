const express = require('express')
const rp = require('request-promise');
const cher = require('cheerio');
const htmlparser2 = require('htmlparser2');
const cors = require('cors')
let numberPage;
const url = `https://boardgamegeek.com/browse/boardgame/page/${numberPage}`;
const app = express()
const port = 3000
let Jsondata;
const corsOptions = {
    origin: '*',
    methods: [],
    allowedHeaders: [],
    exposedHeaders: [],
    credentials: true
};

let boards = [];


async function getJson() {
    const html = await rp(url);
    
    //success!
    const wikiUrls = [];
    const wikiID = [];
    const dom = htmlparser2.parseDocument(html);
    const $ = cher.load(dom);
    let len = $('td[class *= "collection_thumbnail"] a[href *= "/boardgame"]', html).length;
    
    for (let i = 0; i < len; i++) {
        wikiUrls.push($('td[class *= "collection_thumbnail"] a[href *= "/boardgame"]', html)[i].attribs.href);
        boards.push( { imgUrl: $('td[class *= "collection_thumbnail"] a[href *= "/boardgame"] img', html)[i].attribs.src , imgAlt: $('td[class *= "collection_thumbnail"] a[href *= "/boardgame"] img', html)[i].attribs.alt})
    } 
    
    const re = new RegExp("/[A-Za-z]+/[0-9]+");
    
    for (let i = 0; i < len; i++) {
        
        wikiID.push(re.exec(wikiUrls[i])[0].slice(11))
        
    }
    
    
    
    return wikiID
    
  
  
}

async function getGamesData() {
    Jsondata = await getJson();
    let xml;
    for(let a = 0; a < Jsondata.length; a++){
        console.log(a)
        xml = await rp(`https://boardgamegeek.com/xmlapi/boardgame/${Jsondata[a]}?stats=1`);
        const dom = htmlparser2.parseDocument(xml);
        const $ = cher.load(dom);
        boards[a].minplaytime = $("minplaytime", dom).text()
        boards[a].maxplaytime = $("maxplaytime", dom).text()
        let totalvotes = $('poll[name *= "suggested_numplayers"]', dom).attr().totalvotes
        boards[a].totalvotes = totalvotes
        boards[a].rating = $('ratings average', dom).text()
        let len = $('poll[name *= "suggested_numplayers"] results result[value *= "Best"]', dom).length
        for (let i = 0; i< len; i++) {
            boards[a][`player_${i+1}`] = $('poll[name *= "suggested_numplayers"] result[value *= "Best"]', dom)[i].attribs.numvotes
            
        }
    } 
    
    
    
    
    
    
    

    

     return JSON.stringify(boards)
}

app.get('/get', cors(corsOptions), async (req, res) => {
    numberPage = req.query.id
    let a = await getGamesData()
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    res.send(a)
  });


app.use(function (req, res, next) {
    var origins = [
        'http://example.com',
        'http://www.example.com'
    ];

    for(var i = 0; i < origins.length; i++){
        var origin = origins[i];

        if(req.headers.origin.indexOf(origin) > -1){
            res.header('Access-Control-Allow-Origin', req.headers.origin);
        }
    }
    
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
