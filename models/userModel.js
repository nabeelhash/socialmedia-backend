// models/Video.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type: String
    },
    email:{
        type: String
    },
    password:{
        type:String
    },
    profileImage:{
        type: String
    },
    coverImage:{
        type: String
    },
    following:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    followers:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    blocklist:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
})
    

const User = mongoose.model('User', userSchema);
module.exports = User