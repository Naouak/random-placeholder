# PlaceHolder

A placeholder generator. It would index images in a dir and use them to generate placeholder. It will try to always take the best one.

Usage :
    var  PlaceHolder = require("placeholder");
    var ph = new PlaceHolder("sourceDir/","destDir/");
    ph.getImage(1920,1080,function(){
        console.log("Image generated!");
    })