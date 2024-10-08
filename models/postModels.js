const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    author:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // title: {
    //     type: String,
    //     required: true
    // },
    description: {
        type: String,
        required: true
    },
    postImage:{
        type: String,
        required: false
    },

    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    noOfLikes:{
        type: Number,
        default: 0 // Optional: You can set a default value
    },
    comments: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false
        },
        message: {
            type: String
        }
    }]

})


const Post = mongoose.model('Post', postSchema);
module.exports = Post