const express = require('express');
const router = express.Router();
const Message = require('../models/messageModel')
// const upload = require('../middleware/multer')
const Conversation = require('../models/conversationModel')
const User = require('../models/userModel')
const upload = require('../middleware/multer')
const authentication = require('../middleware/authenticate')
const { adminRole, userRole } = require('../middleware/Role')

//create conversation
router.post('/chat/:chatId',authentication, async function (req, res) {
    try {
        const chattingUser = await User.findById(req.params.chatId)
        if (!chattingUser) {
            return res.status(400).json('User to Chat dont exist')
        }
        const currentUser = await User.findById(req.userId)
        if (!currentUser) {
            return res.status(400).json('current User dont exist')
        }
        if (req.params.chatId === req.userId) {
            return res.status(400).json('user to Chat and current user cannot be same')
        }

        let check = await Conversation.findOne({
            members: { $all: [req.userId, req.params.chatId] }
        })
        if (!check) {
            check = await Conversation.create({
                members: [req.userId, req.params.chatId]
            })
        }

        const chat = await Message.create({
            senderId: req.userId,
            receiverId: req.params.chatId,
            message: req.body.message
        })
        check.messages.push(chat._id)
        await check.save()
        res.status(200).json({ chat, check })
    }
    catch (error) {
        return res.status(400).json(error)
    }
})


//get conversation
router.get('/chats/:id', async function (req, res) {
    try {

        let check = await Conversation.findById(req.params.id).populate("messages")

        res.status(200).json(check.messages)
    }
    catch (error) {
        return res.status(400).json(error)
    }
})



module.exports = router