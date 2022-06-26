const expressAsyncHandler = require("express-async-handler");

const Comment = require("../../model/comment/comment");
const validateMongodbId = require("../../utils/validateMongodbID");

//create a comment
const createCommentCtrl = expressAsyncHandler(async (req, res) => {
    //get the user
    const user = req?.user;
    //get the post ID
    const { postId, description } = req?.body;
    try {
        const comment = await Comment.create({
            post: postId,
            user: user,
            description: description
        });
        res.json(comment);
    } catch (error) {
        res.json(error);
    };
});

//fetch all comments
const fetchAllCommentsCtrl = expressAsyncHandler(async (req, res) => {
    try {
        const comments = await Comment.find({}).sort('-created');
        res.json(comments);
    } catch (error) {
        res.json(error);
    };
});

//comment details
const fetchCommentCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req?.params;
    validateMongodbId.validateMongodbId(id);
    try {
        const comment = await Comment.findById(id);
        res.json(comment);
    } catch (error) {
        res.json(error);
    }
});

//update comment
const updateCommentCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req?.params;
    validateMongodbId.validateMongodbId(id);
    try {
        const comment = await Comment.findByIdAndUpdate(id, {
            user: req?.user,
            description: req?.body?.description
        }, {
            new: true,
            runValidators: true
        });
        res.json(comment);
    } catch (error) {
        res.json(error);
    }
});

//delete comment
const deleteCommentCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req?.params;
    validateMongodbId.validateMongodbId(id);
    try {
        const comment = await Comment.findByIdAndDelete(id);
        res.json(comment);
    } catch (error) {
        res.json(error);
    }
});


module.exports = {
    createCommentCtrl,
    fetchAllCommentsCtrl,
    fetchCommentCtrl,
    updateCommentCtrl,
    deleteCommentCtrl
}