const express = require('express');
const router = express.Router();
const User = require('../models/userModel')
const upload = require('../middleware/multer')
const authentication = require('../middleware/authenticate')
const { adminRole, userRole } = require('../middleware/Role');
const getParser = require('../middleware/parser');
const  cloudinary  = require('../middleware/cloudinary');


//allusers
router.get('/allUsers',authentication,async function(req,res){
    try{
        const allUsers =await User.find()
        res.status(200).json(allUsers)
    }
    catch(error){
        return res.status(400).json(error)
    }
})

//allusers only for admin
router.get('/admin',authentication,adminRole ,async function(req,res){
    try{
        const allUsers =await User.find()
        res.status(200).json(allUsers)
    }
    catch(error){
        return res.status(400).json(error)
    }
})

//singleuser
router.get('/single/:id',async function(req,res){
    try{
        const single =await User.findById(req.params.id)
        res.status(200).json(single)
    }
    catch(error){
        return res.status(400).json(error)
    }
})

//currentUser
router.get('/current',authentication,async function(req,res){
    try{
        const single =await User.findById(req.userId)
        res.status(200).json(single)
    }
    catch(error){
        return res.status(400).json(error)
    }
})


//deleteUser
router.delete('/delete/:id',async function(req,res){
    try{
        const deleteUser =await User.findByIdAndDelete(req.params.id)
        res.status(200).json(deleteUser)
    }
    catch(error){
        return res.status(400).json(error)
    }
})

//update
router.patch('/updatePic',authentication,upload.single('pic'),async function(req,res){
    try{
        console.log('User ID:', req.userId); // Log user ID
        console.log('Uploaded File:', req.file); // Log the uploaded file details
        if(!req.file){
            return res.status(400).json('Img not found')
        }
        const dataUrl = getParser(req.file);
        console.log('Parsed Content:', dataUrl.content);

        if (!dataUrl || !dataUrl.content) {
            return res.status(400).json('Invalid image data');
        }

        const response = await cloudinary.uploader.upload(dataUrl.content, {
            folder: "profileImage"
        });
        const updatePic =await User.findByIdAndUpdate(
            req.userId,
            {profileImage: response.secure_url},
            {new: true})
        res.status(200).json(updatePic)
    }
    catch(error){
        console.error('Error updating picture:', error); // Log the error for debugging
        return res.status(400).json({ message: 'Internal Server Error', error: error.message });
    }
})



//coverpic
router.patch('/coverPic',authentication,upload.single('pic'),async function(req,res){
    try{
        if(!req.file){
            return res.status(400).json('Img not found')
        }
        const dataUrl = getParser(req.file);
        console.log('Parsed Content:', dataUrl.content);

        if (!dataUrl || !dataUrl.content) {
            return res.status(400).json('Invalid image data');
        }

        const response = await cloudinary.uploader.upload(dataUrl.content, {
            folder: "profileImage"
        });
        const updatePic =await User.findByIdAndUpdate(
            req.userId,
            {coverImage: response.secure_url},
            {new: true})
        res.status(200).json(updatePic)
    }
    catch(error){
        return res.status(400).json(error)
    }
})

//follow
router.get('/follow/:id',authentication,async function(req,res){
    try{
        const userToFollow = await User.findById(req.params.id)
        if(!userToFollow){
            return res.status(400).json('User to follow dont exist')
        }
        const currentUser = await User.findById(req.userId)
        if(!currentUser){
            return res.status(400).json('current User dont exist')
        }
        if(req.params.id === req.userId){
            return res.status(400).json('user to follow and current user cannot be same')
        }

        const check =currentUser.following.includes(req.params.id)
        if(check){
            return res.status(400).json('You already following this user')
        }
        const checks =currentUser.blocklist.includes(req.params.id)
        if(checks){
            return res.status(400).json('You cant follow since you block this user')
        }
        currentUser.following.push(req.params.id)
        userToFollow.followers.push(req.userId)
        await currentUser.save()
        await userToFollow.save()

        res.status(200).json({currentUser,userToFollow})
    }
    catch(error){
        return res.status(400).json(error)
    }
})

//unfollow
router.get('/unfollow/:id',authentication,async function(req,res){
    try{
        const userToUnfollow = await User.findById(req.params.id)
        if(!userToUnfollow){
            return res.status(400).json('User to Unfollow dont exist')
        }
        const currentUser = await User.findById(req.userId)
        if(!currentUser){
            return res.status(400).json('current User dont exist')
        }
        if(req.params.id === req.userId){
            return res.status(400).json('user to Unfollow and current user cannot be same')
        }

        const check =currentUser.following.includes(req.params.id)
        if(!check){
            return res.status(400).json('You cannot unfollow b/c you didnt follow to begin with')
        }

        // currentUser.following.pull(req.params.id)
        // userToUnfollow.followers.pull(req.body.id)
        currentUser.following = currentUser.following.filter(id=>id.toString()!==req.params.id)
        userToUnfollow.followers = userToUnfollow.followers.filter(id=>id.toString()!==req.userId)

        await currentUser.save()
        await userToUnfollow.save()

        res.status(200).json({currentUser,userToUnfollow})
    }
    catch(error){
        return res.status(400).json(error)
    }
})

//following list
router.get('/following',authentication,async function(req,res){
    try{
        const currentUser = await User.findById(req.userId)
        if(!currentUser){
            return res.status(400).json('current User dont exist')
        }
        const check =await User.findById(req.userId).populate("following")
        res.status(200).json(check.following)
    }
    catch(error){
        return res.status(400).json(error)
    }
})
//block
router.get('/block/:id',authentication,async function(req,res){
    try{
        const userToBlock = await User.findById(req.params.id)
        if(!userToBlock){
            return res.status(400).json('User to block dont exist')
        }
        const currentUser = await User.findById(req.userId)
        if(!currentUser){
            return res.status(400).json('current User dont exist')
        }
        if(req.params.id === req.userId){
            return res.status(400).json('you cannot block yourself')
        }

        const check =currentUser.blocklist.includes(req.params.id)
        if(check){
            return res.status(400).json('You already blocked this user')
        }
        const checks =currentUser.following.includes(req.params.id)
        if(checks){
            currentUser.following = currentUser.following.filter(id=>id.toString()!== req.params.id )
        }

        const checkss =userToBlock.followers.includes(req.userId)
        if(checkss){
            userToBlock.followers = userToBlock.followers.filter(id=>id.toString()!== req.userId )
        }

        currentUser.blocklist.push(req.params.id)
        await currentUser.save()
        await userToBlock.save()

        res.status(200).json({currentUser,userToBlock})
    }
    catch(error){
        return res.status(400).json(error)
    }
})


//unblock
router.get('/unblock/:id',authentication,async function(req,res){
    try{
        const userToUnblock = await User.findById(req.params.id)
        if(!userToUnblock){
            return res.status(400).json('User to Unblock dont exist')
        }
        const currentUser = await User.findById(req.userId)
        if(!currentUser){
            return res.status(400).json('current User dont exist')
        }
        if(req.params.id === req.userId){
            return res.status(400).json('you cannot Unblock yourself')
        }

        const check =currentUser.blocklist.includes(req.params.id)
        if(!check){
            return res.status(400).json('You cannot unblock this user, since you are not blocking it')
        }
        currentUser.blocklist.pull(req.params.id)
        await currentUser.save()

        res.status(200).json({currentUser,userToUnblock})
    }
    catch(error){
        return res.status(400).json(error)
    }
})

//blocklist
router.get('/blocklist',authentication,async function(req,res){
    try{
        const currentUser = await User.findById(req.userId)
        if(!currentUser){
            return res.status(400).json('current User dont exist')
        }
        const check =await User.findById(req.userId).populate("blocklist")
        res.status(200).json(check.blocklist)
    }
    catch(error){
        return res.status(400).json(error)
    }
})


module.exports= router