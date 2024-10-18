const DataUriParser = require('datauri/parser.js')
const path = require('path');

const getParser = function(file){
    const parser = new DataUriParser()
    const ext = path.extname(file.originalname)
    return parser.format(ext,file.buffer)
}

module.exports = getParser