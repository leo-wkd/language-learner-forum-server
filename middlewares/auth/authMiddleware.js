const { request } = require('express');
const expressAsyncHandler = require("express-async-handler");

const jwt = require('jsonwebtoken');

const User = require('../../model/user/user'); // 路径里是大写的U，直接把User类import过来

const authMiddleware = expressAsyncHandler(async (req, res, next) => {
    let token;

    if(req?.headers?.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            if(token) {
                const decoded = jwt.verify(token, process.env.JWT_KEY);
                //find the user by id
                const user = await User.findById(decoded?.id).select('-password');
                //attatch the user to the request object
                req.user = user;
                next();
            }
            else {
                throw new Error('No token provided for authorization');
            }
        } catch (error) {
            throw new Error('Not authorized or token expired, login again');
        }
    }
    else {
        throw new Error('There is no token attatched to the header');
    }
});

module.exports = { authMiddleware }