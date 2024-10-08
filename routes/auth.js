const express = require('express');
const router = express.Router();
const User = require('../models/userModel')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator');
const authentication = require('../middleware/authenticate')
const { adminRole, userRole } = require('../middleware/Role')

//register
const registerValidate = [
    body('name').isLength({ min: 1 }).withMessage('Type Full Name'),
    body('email').isEmail().withMessage('Email is invalid'),
    body('password').isLength({ min: 5 }).withMessage('Password is short'),
]
router.post('/register', registerValidate, async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        const checkUser = await User.findOne({ email: req.body.email })
        if (checkUser) {
            return res.status(400).json('User already exists')
        }
        if (!req.body.confirmPassword) {
            return res.status(400).json('ConfirmPassword field not exist')

        }
        if (req.body.confirmPassword !== req.body.password) {
            return res.status(400).json('Password Not match')
        }
        //brcypt
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(req.body.password, salt)

        const register = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: hashPassword,
        })
        res.status(200).json({ message: "New user registered", register })
    }
    catch (error) {
        return res.status(400).json(error.message)
    }
})



//login
const loginValidate = [
    body('email').isEmail().withMessage('Email is invalid'),
    body('password').isLength({ min: 5 }).withMessage('Password is short'),
]
router.post('/login', loginValidate, async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        const checkUser = await User.findOne({ email: req.body.email })
        if (!checkUser) {
            return res.status(400).json('Email not found. Try another email')
        }

        const comparePassword = await bcrypt.compare(req.body.password, checkUser.password)
        if (!comparePassword) {
            return res.status(400).json('Password is Incorrect')
        }
        const token = jwt.sign({ id: checkUser._id }, process.env.KEY, { expiresIn: '5h' })
        res.cookie('token', token, {
            sameSite: 'None',
            secure: true
        });
        res.status(200).json({ message: "Login successful", checkUser, token })
    }
    catch (error) {
        return res.status(400).json(error.message)
    }
})


//logout
router.get('/logout', function (req, res) {
    try {
        res.clearCookie('token')
        res.status(200).json('cookie removed')
    }
    catch (error) {
        return res.status(400).json(error.message)
    }
})

//reset Password
router.post('/send-otp',async function (req, res) {
    try {
        const checkUser = await User.findOne({ email: req.body.email })
        if (!checkUser) {
            return res.status(400).json('Email not found. Try another email')
        }
        //create otp
        checkUser.otp= '1234'
        await checkUser.save()

        res.status(200).json(checkUser)

    }
    catch (error) {
        return res.status(400).json(error.message)
    }

})
router.post('/submit-otp',async function (req, res) {
    try {
        const checkUser = await User.findOne({ otp: req.body.otp })
        if (!checkUser) {
            return res.status(400).json('User Otp not found')
        }
        //update Password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(req.body.updatePassword, salt)

        checkUser.password = hashPassword
        await checkUser.save()
        res.status(200).json(checkUser)

    }
    catch (error) {
        return res.status(400).json(error.message)
    }
})

// Update Password
const updatePasswordValidate = [
    body('oldPassword').isLength({ min: 5 }).withMessage('Old password is short'),
    body('newPassword').isLength({ min: 5 }).withMessage('New password is short'),
];

router.post('/update-password', authentication, updatePasswordValidate, async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(400).json('User not found');
        }

        const comparePassword = await bcrypt.compare(req.body.oldPassword, user.password)
        if (!comparePassword) {
            return res.status(400).json('Old Password is Incorrect');
        }
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(req.body.newPassword, salt)

        user.password = hashPassword
        await user.save()

        res.status(200).json('Password updated successfully');
    } catch (error) {
        return res.status(400).json(error.message);
    }
});

//authenticate
router.get('/', function (req, res) {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(400).json('No cookies Found')
        }
        const decoded = jwt.verify(token, process.env.KEY);
        if (!decoded) {
            return res.status(400).json('Token is invalid')
        }
        req.userId = decoded.id
        res.status(200).json(req.userId)
    }
    catch (error) {
        return res.status(400).json(error)
    }
})


router.get('/check', authentication, function (req, res) {
    res.json(`Hello user ${req.userId}`)
})

module.exports = router
