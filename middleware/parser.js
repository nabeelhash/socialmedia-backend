const dataUrlParser = require('dataurl').parser;
const path = require('path')

const getParser = function(file){
    const parser = new dataUrlParser()
    const ext = path.extname(file.originalname)
    return parser.format(ext,file.buffer)
}

module.exports = getParser