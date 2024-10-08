const multer = require('multer');
const path = require('path');
const crypto = require('crypto')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        crypto.randomBytes(10,function(err,bytes){
            const fn=bytes.toString('hex') + path.extname(file.originalname)
            cb(null,fn)
        })
    }
});
const upload = multer({ storage });


module.exports = upload