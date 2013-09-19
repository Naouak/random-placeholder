var fs = require("fs");
var easyimage = require("easyimage");
var path = require("path");

var util = require("util");
var events = require("events");


var PlaceHolder = function(sourceDir,destDir){
    var that = this;
    var ready = false;
    //This may be a configuration parameter later.
    var acceptedExtensions = [
        ".jpg",
        ".png",
        ".gif"
    ];
    //This is the list of files found in the source file.
    var files = [];

    //Our placeholder Fire events because events are cool (and practical)(and bowties too).
    events.EventEmitter.call(this);

    //This function will simply analyze files so the generator can choose later the right image for the right size.
    this.analyzeFile = function(file){
        var ext = path.extname(file);
        //We only analyze recognized extensions
        if(acceptedExtensions.indexOf(ext.toLowerCase()) == -1){
            return false;
        }
        //Here is simple, we just analyse our file with image magick
        easyimage.info(path.join(sourceDir,file),function(err, info, stderr){
            if(err){
                that.emit("fileAdded", null);
                throw err;
            }
            //This is because we will rely a lot on that statistics so let's calculte once for all
            info.aspectRatio = info.width/info.height;
            files.push(info);
            that.emit("fileAdded", info);
        });

        return true;
    };

    /**
     * Create an image file and pass it to callback.
     * @param width
     * @param height
     * @param callback
     */
    this.getImage = function(width,height,callback){
        if(!ready){
            this.once("ready", function(){
                this.getImage(width, height, callback);
            });
            return;
        }

        var ar = width/height;
        var acceptableFiles = files.filter(function(e){
            if (ar == e.aspectRatio) {
                return true;
            } else if(ar > 1 && e.aspectRatio > 1){
                return true;
            } else if (ar < 1 && e.aspectRatio < 1){
                return true;
            } else if (ar == 1 ){
                return true;
            }
            return false;
        });
        var options = {
            cropwidth: width,
            cropheight: height,
            fill: false,
            dst: path.join(destDir,width+"x"+height+".png")
        };
        var newHeight, newWidth;

        if(acceptableFiles.length < 0){
            acceptableFiles = files;
            if(acceptableFiles.length < 0){
                callback("no files for generation");
            }
        }

        acceptableFiles.sort(function(a , b){
            return Math.abs(a.aspectRatio - ar) - Math.abs(b.aspectRatio - ar);
        });

        var acceptedRatio = acceptableFiles[0].aspectRatio;

        acceptableFiles = acceptableFiles.filter(function(e){
            return e.aspectRatio+0.01 > acceptedRatio && e.aspectRatio-0.01 < acceptedRatio
        });

        var index = Math.floor(Math.random()*acceptableFiles.length);

        //@TODO : randomize the order if there is several images with the same aspectRatio available first.

        options.src = path.join(sourceDir,acceptableFiles[index].name);
        newHeight = acceptableFiles[index].height * width / acceptableFiles[index].width;
        newWidth = acceptableFiles[index].width * height / acceptableFiles[index].height;
        if(newHeight > height){
            options.width = options.cropwidth;
            options.height = newHeight;
        } else {
            options.height = options.cropheight;
            options.width = newWidth;
        }
        easyimage.rescrop(options, callback);
    };

    fs.readdir(sourceDir,function(err, files){
        var filesToAnalyze = 0;
        if(err){
            throw err;
        }
        for(var file in files){
            if(files.hasOwnProperty(file)){
                if(that.analyzeFile(files[file])){
                    filesToAnalyze++;
                }
            }
        }
        //When all files are analyzed, we are ready to go.
        that.on("fileAdded", function(){
           filesToAnalyze--;
            if(filesToAnalyze == 0){
                that.emit("ready");
            }
        });
    });

    this.on("ready", function(){
        ready = true;
    });
};
util.inherits(PlaceHolder,events.EventEmitter);

module.exports = PlaceHolder;
