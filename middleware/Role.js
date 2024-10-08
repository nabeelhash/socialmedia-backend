const User = require('../models/userModel')

let adminRole =async function(req,res,next){
    try{
        let currentUser = await User.findById(req.userId);
        if(!currentUser){
            return res.status(400).json({ error: 'User not found' })
        }
        if(currentUser.role !== 'admin'){
            return res.status(400).json('Admin not found')
        }
        next()
    }
    catch(error){
        return res.status(400).json(error)
    }
}

let userRole =async function(req,res,next){
    try{
        let currentUser = await User.findById(req.userId);
        if(!currentUser){
            return res.status(400).json({ error: 'User not found' })
        }
        if(currentUser.role !== 'user'){
            return res.status(400).json('User not found')
        }
        next()
    }
    catch(error){
        return res.status(400).json(error)
    }
}

module.exports = {adminRole, userRole}