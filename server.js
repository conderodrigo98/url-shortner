'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var dns = require("dns");

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI);

var Schema = mongoose.Schema;
var urlSchema = new Schema({
  original_url: String,
  short_url: String
});
var Url = mongoose.model('Url',urlSchema);

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));


app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});


// POST endpoint
app.post("/api/shorturl/new", function (req, res,next){ //validation / dns lookup
  console.log(req.body);
  req.url = req.body.url.toString();
  console.log(req.url);
  req.url = req.url.replace(/(http:\/\/|https:\/\/)/,"");
  console.log(req.url);
  dns.lookup(req.url, function(err){
    console.log(err);
    if (err !== null) 
      req.err = true
    else
      req.err = false
    next();
  });
},function(req,res,next){ //check existence in database
  console.log("Error?",req.err);
  if (req.err)
    next();
  else{
    Url.find({original_url : req.url}, function(err,data){
      console.log("data=",data);
      if(data.length == 0){
        req.exists = false;
        console.log("existe muy adentro?",req.exists,data);
      }
      else{
        req.exists = true;
        req.data = data;
      } 
      console.log("existe adentro?",req.exists,data);
      next();
    });
    }
},function(req,res){ //add or update
  if(req.err) res.json({"error":"invalid URL"});
  else{
    console.log("nuevo");
    console.log("exists=",req.exists);
    if(!req.exists){
      Url.countDocuments({},function(err,count){
        var obj = {original_url: req.url, short_url: count};
        var newUrl = new Url(obj);
        newUrl.save(function(err,data){});
        res.json(obj);
      });
    }else{
      console.log("Repetido", req.data);
      res.json({original_url: req.data[0].original_url, short_url: req.data[0].short_url});
    }
  }
});


// GET endpoint
app.get("/api/shorturl/:n", function(req,res){
  console.log("get escuchado",req.params.n);
  Url.find({short_url: req.params.n},function(err,data){
    console.log(data);
    if (data.length == 0){
      res.json({ERROR: "invalid url"});
    }else{
      res.redirect("https://"+data[0].original_url);
  }
  });
});

