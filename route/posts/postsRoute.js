const express = require('express');

const postCtrl = require('../../controllers/posts/postCtrl');
const auth = require('../../middlewares/auth/authMiddleware');
const uploads = require('../../middlewares/uploads/photoUpload');

const postRoutes = express.Router();

postRoutes.post('/', 
    auth.authMiddleware, 
    uploads.photoUpload.single('image'), 
    uploads.postImgResize,
    postCtrl.createPostCtrl);

postRoutes.put('/likes', auth.authMiddleware, postCtrl.toggleAddLikeToPostCtrl);
postRoutes.put('/dislikes', auth.authMiddleware, postCtrl.toggleAddDislikeToPostCtrl);

postRoutes.get('/', postCtrl.fetchPostsCtrl);
postRoutes.get('/:id', postCtrl.fetchPostCtrl);

postRoutes.put('/:id', auth.authMiddleware, postCtrl.updatePostCtrl);

postRoutes.delete('/:id', postCtrl.deletePostCtrl);

module.exports = postRoutes;