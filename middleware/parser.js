const dataUrlParser = require('dataurl'); // Import the dataurl module directly
const path = require('path');

const getParser = function(file) {
    const ext = path.extname(file.originalname);
    return dataUrlParser.format(ext, file.buffer); // Call format directly without 'new'
};

module.exports = getParser;