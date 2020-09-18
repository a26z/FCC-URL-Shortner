'use strict';

const express = require('express');
const app = express();
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const shortId = require('shortid');
const validUrl = require('valid-url')
const cors = require('cors');
const DB_URI = require('./db-uri/db_uri.js');

// Basic Configuration
const PORT = process.env.PORT || 3000;
const ROOT_URL = process.env.ROOT_URL || `http://localhost:${PORT}`;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}/api/shorturl`;

app.use(cors());
app.use(bodyParser.urlencoded({
  extended: false
}));

/** this project needs a db !! **/
// mongoose.connect(process.env.DB_URI);

const connectDB = async function(){
    try{
        await mongoose.connect(DB_URI, {
            useNewURLParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to DB");
    } catch(err){
        console.error(err.message);
    }
};
connectDB();

const urlSchema = new mongoose.Schema({
    url_code: String,
    original_url: String
});
let Url = mongoose.model('Url', urlSchema);


app.use('/public', express.static(process.cwd() + '/public'));
app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// POST endpoint
app.post("/api/shorturl/new", async function(req, res){
  const originalUrl = req.body.url;
  const urlCode = shortId.generate();
  if(validUrl.isUri(originalUrl)){
    try{
      let url = await Url.findOne({original_url: originalUrl});
      if(url){
        return res.status(200).json({'original_url': url.original_url, 'short_url': url.url_code});
      } else {
        const shortUrl = BASE_URL + "/" + urlCode;
        url = new Url({
          url_code: urlCode,
          original_url: originalUrl
        });
        await url.save();
        return res.status(201).json({'original_url': url.original_url, 'short_url': url.url_code});
      }
    }
    catch(err){
      console.error(err.message);
      return res.status(500).json('Server error ' + err.message);
    }
  } else {
      return res.status(400).json({'error': 'invalid URL'});
    }
});

// GET endpoint

app.get("/api/shorturl/:shortUrl", async function(req, res){
  const shortUrl = req.params.shortUrl;
  let url = await Url.findOne({url_code: shortUrl});
  try{
    if(url) {
      return res.status(200).redirect(url.original_url);
    } else {
      return res.status(400).json({'error': 'invalid URL'});
    }
  } catch {
      return res.status(500).json('Server error ' + err.message);
    }
});


app.listen(PORT, function () {
  console.log(`Node.js listening on port ${PORT}... -------> ${ROOT_URL}`);
});
