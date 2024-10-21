const express = require('express');
const router = express.Router();
const Post = require('../models/postModels')
const User = require('../models/userModel')

const upload = require('../middleware/multer')
const authentication = require('../middleware/authenticate')
const { adminRole, userRole } = require('../middleware/Role')
const getParser = require('../middleware/parser');
const  cloudinary  = require('../middleware/cloudinary');

//create
router.post('/createPost',authentication,upload.single('pic'), async function (req, res) {
    try {
        const currentUser = await User.findById(req.userId)
        if (!currentUser) {
            return res.status(400).json('current User dont exist')
        }
        // if(!req.file){
        //     return res.status(400).json('Img not found')
        // }
        const dataUrl = getParser(req.file);
        console.log('Parsed Content:', dataUrl.content);

        const response = await cloudinary.uploader.upload(dataUrl.content, {
            folder: "postImage"
        });
        
        const create = await Post.create({
            author: req.userId,
            description: req.body.description,
            postImage: response ? response.secure_url : ''
        })
        res.status(200).json({ message: "New post created", create })
        console.log('post create')
    }
    catch (error) {
        return res.status(400).json(error.message)
    }
})
//



//allPosts
router.get('/allPosts', async function (req, res) {
    try {
        const allPosts = await Post.find().populate('author')
        res.status(200).json(allPosts)
    }
    catch (error) {
        return res.status(400).json(error)
    }
})

//singlePost
router.get('/singlePost/:id', async function (req, res) {
    try {
        const allPosts = await Post.findById(req.params.id)
        res.status(200).json(allPosts)
    }
    catch (error) {
        return res.status(400).json(error)
    }
})

//deletePost
router.delete('/deletePost/:id',authentication, async function (req, res) {
    try {
        const checkPost = await Post.findById(req.params.id)
        if(!checkPost){
            return res.status(400).json('post not exists')
        }
        if(checkPost.author.toString() !== req.userId){
            return res.status(400).json('You are not author of this post')
        }
        const deletePost = await Post.findByIdAndDelete(req.params.id)
        res.status(200).json(deletePost)
    }
    catch (error) {
        return res.status(400).json(error)
    }
})

//updatePost
router.patch('/updatePost/:id', upload.single('pic'),async function (req, res) {
    try {
        
        // if (!req.file) {
        //     return res.status(400).json('Img not found')
        // }
        const dataUrl = getParser(req.file);
        console.log('Parsed Content:', dataUrl.content);

        const response = await cloudinary.uploader.upload(dataUrl.content, {
            folder: "postImage"
        });
        
        const updatePost = await Post.findByIdAndUpdate(req.params.id,{
            description: req.body.description,
            postImage: response ? response.secure_url : ''
        },{new: true})
        res.status(200).json(updatePost)
    }
    catch (error) {
        return res.status(400).json(error)
    }
})

//adminPosts
router.get('/adminPosts',authentication, async function (req, res) {
    try {
        const allPosts = await Post.find({author: req.userId}).populate('author')
        res.status(200).json(allPosts)
    }
    catch (error) {
        return res.status(400).json(error)
    }
})

//like
router.get('/like/:id',authentication, async function (req, res) {
    try {
        const postToLike = await Post.findById(req.params.id)
        if (!postToLike) {
            return res.status(400).json('Post to like dont exist')
        }
        const currentUser = await User.findById(req.userId)
        if (!currentUser) {
            return res.status(400).json('current User dont exist')
        }
        if (req.params.id === req.userId) {
            return res.status(400).json('User and post Id are same')
        }

        const check = postToLike.likes.includes(req.userId)
        if (check) {
            return res.status(400).json('User has already like this post')
        }
        postToLike.likes.push(req.userId)
        postToLike.noOfLikes += 1;
        await postToLike.save()

        res.status(200).json({ currentUser, postToLike })
    }
    catch (error) {
        return res.status(400).json(error)
    }
})



//dislike
router.get('/dislike/:id',authentication, async function (req, res) {
    try {
        const postToDislike = await Post.findById(req.params.id)
        if (!postToDislike) {
            return res.status(400).json('Post to dislike dont exist')
        }
        const currentUser = await User.findById(req.userId)
        if (!currentUser) {
            return res.status(400).json('current User dont exist')
        }
        if (req.params.id === req.userId) {
            return res.status(400).json('User and post Id are same')
        }

        const check = postToDislike.likes.includes(req.userId)
        if (!check) {
            return res.status(400).json('User cannot dislike since he not like the post to begin with')
        }
        postToDislike.likes = postToDislike.likes.filter(id => id.toString() !== req.userId)
        postToDislike.noOfLikes -= 1;
        await postToDislike.save()

        res.status(200).json({ currentUser, postToDislike })
    }
    catch (error) {
        return res.status(400).json(error)
    }
})




//comment
router.post('/comment/:postId', authentication, async function (req, res) {
    try {

        const postToComment = await Post.findById(req.params.postId)
        if (!postToComment) {
            return res.status(400).json('Post to comment dont exist')
        }
        const currentUser = await User.findById(req.userId)
        if (!currentUser) {
            return res.status(400).json('current User dont exist')
        }
        if (req.params.postId === req.userId) {
            return res.status(400).json('User and post Id are same')
        }
        // const checkAlreadyComment = postToComment.comments.find(comment => comment.userId.toString() === req.userId);

        // if (checkAlreadyComment) {
        //     // postToComment.comments[checkAlreadyComment].message = req.body.message
        //     // await postToComment.save();
        //     // The user has already commented
        //     return res.status(200).send({message:'user has alredy commented'})

        // }
        if (!req.body.message) {
            return res.status(400).json({ error: 'message are required' });
        }
        postToComment.comments.push({
            userId: req.userId,
            message: req.body.message
        })
        await postToComment.save()

        res.status(200).json({ currentUser, postToComment })
    }
    catch (error) {
        return res.status(400).json(error)
    }
})


//getComment
router.get('/getComment/:postId',async function(req,res){
    try{
        const postToComment = await Post.findById(req.params.postId)
        if (!postToComment) {
            return res.status(400).json('Post to comment dont exist')
        }
        const check =await Post.findById(req.params.postId)
        .populate({
            path: 'comments',
            populate: {
                path: 'userId', // assuming your comment schema has a field named 'userId'
                select: 'name email profileImage' // adjust this to select the fields you need
            }
        });
        res.status(200).json(check.comments)
    }
    catch(error){
        return res.status(400).json(error)
    }
})


//updateComment
router.post('/updateComment/:id/:commentId',authentication, async function (req, res) {
    try {
        const currentUser = await User.findById(req.userId)
        if (!currentUser) {
            return res.status(400).json('current User dont exist')
        }

        const postToComment = await Post.findById(req.params.id)
        if (!postToComment) {
            return res.status(400).json('Post to comment dont exist')
        }
        const comment = postToComment.comments.id(req.params.commentId)
        if(!comment){
            return res.status(400).json('Comment dont exist')
        }
        console.log('Comment userId:', comment.userId.toString());
        console.log('Request userId:', req.userId.toString());
        if(comment.userId.toString() !== req.userId.toString()){
            return res.status(400).json('You are not Owner of this comment')
        }
        comment.message = req.body.message
        
        await postToComment.save()

        res.status(200).json({ post: postToComment })
    }
    catch (error) {
        return res.status(400).json(error)
    }
})

//deleteComment
router.delete('/deleteComment/:id/:commentId',authentication, async function (req, res) {
    try {

        const postToComment = await Post.findById(req.params.id)
        if (!postToComment) {
            return res.status(400).json('Post to comment dont exist')
        }
        const comment = postToComment.comments.id(req.params.commentId)
        if(!comment){
            return res.status(400).json('Comment dont exist')
        }
        
        if(comment.userId.toString() !== req.userId){
            return res.status(400).json('You are not Owner of this comment')
        }
        postToComment.comments.pull(req.params.commentId)
        await postToComment.save()

        res.status(200).json({ post: postToComment })
    }
    catch (error) {
        return res.status(400).json(error)
    }
})

module.exports = router