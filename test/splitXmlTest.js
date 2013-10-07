
var splitXml = require('./../splitXml.js');
var assert = require('assert');
var Stream = require('stream');
var request = require('request');

var parser,shortXml,longXml, badXml;

function createTestStream (data) {
    var stream = new Stream();
    stream.pipe = function(dest) {
        dest.write(data);
        dest.end();
    }
    return stream;
        
}


describe('splitXml', function() {
    
    beforeEach(function() {
        parser = new splitXml.parser();
        shortXml = '<xml><item>foo</item></xml>';
        longXml = '<xml><item>foo</item><item>bar</item></xml>';
        badXml = '<xml><item>foo</itm></xml>';
        
    })
    it('should be required properly', function() {
        assert.notEqual(parser,undefined);
        assert.notEqual(parser,null);
        assert.notEqual(parser,{});
    })
    it('should end', function(done) {
        var stream = createTestStream(shortXml);
        parser.setReadStream(stream).setSplitTag('item').onEnd(done).execute();
    })
    it('should parse a single element correctly', function(done) {
        var stream = createTestStream(shortXml);
        var verifyElement = function(data) {
            assert.equal(data,'<item>foo</item>');
        }
        parser.setReadStream(stream).setSplitTag('item').onElement(verifyElement).onEnd(done).execute();
    })
    it('should parse multiple elements correctly', function(done) {
        //checks that it ran twice and got proper values
        var stream = createTestStream(longXml);
        var counter = 0;
        var verifyElement = function(data) {
            counter++;
            if (counter === 1) assert.equal(data,'<item>foo</item>');
            if (counter === 2) assert.equal(data,'<item>bar</item>');
        } 
        var checkDone = function() {
            assert.equal(counter,2);
            done();
        }
        parser.setReadStream(stream).setSplitTag('item').onElement(verifyElement).onEnd(checkDone).execute();
    })
    it('should not crash when closing tag missing', function(done) {
        var stream = createTestStream(badXml);
        parser.setReadStream(stream).setSplitTag('item').onEnd(done).execute();
    })
    it('should not crash when it tries to pipe from a non-existent stream', function(done) {
        var stream = request('http://www.asdfasdgjaskdgjaksjdgkasdgas.com/')
        parser.setReadStream(stream).setSplitTag('item').onEnd(done).execute();
    })
        
});