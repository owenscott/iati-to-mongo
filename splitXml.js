var stream = require('stream');
var through = require('through');
var splitXml = {}




splitXml.parser = function() {
    //defaults
    this._leftOver = '';
    this._onElement = function() {};
    this._readStream = undefined;
    this._splitTag = '';
    this._end = function() {};
    
    //setters
    this.onElement = createSetter('_onElement',this);
    this.setReadStream = createSetter('_readStream',this);
    this.setSplitTag = createSetter('_splitTag',this);
    this.onEnd = createSetter('_end',this);
    
    //execute method (takes input stream, breaks into section by opening/closing tags, calls a function with each section)
    this.execute = function() {
        var that = this;
        
        //create write stream to process XML
        var write = function (buf) {
            buf = this._leftOver + buf.toString();            
            var activity;
            var openTag = '<'+ that._splitTag;
            var closeTag = '</' + that._splitTag + '>';
            while((s = buf.indexOf(openTag)) !== -1 && (f = buf.indexOf(closeTag)) !== -1) {
                //slice out section of XML
                activity = buf.slice(s,f+closeTag.length);
                //delete that section from the  buffer
                buf = buf.replace(activity,'');
                that._onElement(activity);
            }
            //save what's left of the buffer to add to the next chunk
            this._leftOver = buf;
        }
        
        //set writestream's end function
        var end = this._end;
        
        //pipe read stream to write stream
        this._readStream.pipe(through(write,end))
    }
}

//set commonJS exports
module.exports = splitXml;


//creates a simple setter function of the form where this.setReadStream(value) changes this._readStream
function createSetter(prop, self) {
    return function(value) {
        self[prop] = value;
        return self; //allows jquery-like method chaining
    }
}

