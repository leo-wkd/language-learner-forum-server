const express = require('express');

const commentCtrl = require('../../controllers/comments/commentCtrl');
const auth = require('../../middlewares/auth/authMiddleware');

const commentRoutes = express.Router();

commentRoutes.post('/', auth.authMiddleware, commentCtrl.createCommentCtrl);

commentRoutes.get('/', commentCtrl.fetchAllCommentsCtrl);

commentRoutes.get('/:id', auth.authMiddleware, commentCtrl.fetchCommentCtrl);

commentRoutes.put('/:id', auth.authMiddleware, commentCtrl.updateCommentCtrl);

commentRoutes.delete('/:id', auth.authMiddleware, commentCtrl.deleteCommentCtrl);

module.exports = commentRoutes;