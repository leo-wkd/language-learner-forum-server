const express = require('express');

const emailMsgCtrl = require('../../controllers/emailMsg/emailMsgCtrl');
const auth = require('../../middlewares/auth/authMiddleware');

const emailMsgRoute = express.Router();

emailMsgRoute.post('/', auth.authMiddleware, emailMsgCtrl.sendEmailMsgCtrl);

module.exports = emailMsgRoute;