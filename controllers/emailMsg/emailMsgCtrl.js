const expressAsyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const badFilter = require('bad-words');

const EmailMsg = require("../../model/emailMsg/emailMsg");
const Email = require("../../config/mail/mail");

//send email
const sendEmailMsgCtrl = expressAsyncHandler(async (req, res) => {
    const { to, subject, message } = req?.body;
    //prevent bad word
    const filter = new badFilter();
    const isProfane = filter.isProfane(subject + " " + message);
    if(isProfane) throw new Error("Email sent failed, because it contains profane words");

    const newMessage = `From user ${req?.user?.email} \n` + message;
    try {
        const msg = {
            to,
            subject,
            text: newMessage,
            from: "leo97wang@gmail.com"
        }

        await EmailMsg.create({
            sentBy: req?.user?.id,
            fromEmail: req?.user?.email,
            toEmail: to,
            message: newMessage,
            subject: subject
        });

        await Email.sendEmail(msg);

        res.json("Email sent successfully");
    } catch (error) {
        res.json(error);
    };
});

module.exports = {
    sendEmailMsgCtrl
};
