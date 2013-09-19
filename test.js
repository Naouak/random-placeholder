var PlaceHolder = require("./index.js");

console.log(PlaceHolder);

var ph = new PlaceHolder("source","dest");

ph.getImage(1024,768,function(err,info){});
ph.getImage(768,1024,function(err,info){});
ph.getImage(1920,1080,function(err,info){});
ph.getImage(1080,1920,function(err,info){});
ph.getImage(800,800,function(err,info){ console.log("800x800 done"); });

