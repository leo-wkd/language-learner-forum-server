const express = require('express');

const userCtrl = require('../../controllers/users/usersCtrl');
const auth = require('../../middlewares/auth/authMiddleware');
const uploads = require('../../middlewares/uploads/photoUpload');

const userRoutes = express.Router();

userRoutes.post('/register', userCtrl.registerUserCtrl); // url 前面一定要有斜杠
userRoutes.post('/login', userCtrl.loginUserCtrl);
userRoutes.put(
    '/profile-photo-upload', 
    auth.authMiddleware, 
    uploads.photoUpload.single("image"),
    uploads.profilePhotoResize,
    userCtrl.ProfilePhotoUploadCtrl);

userRoutes.get('/', auth.authMiddleware, userCtrl.fetchUserCtrl);
userRoutes.get('/:id', userCtrl.fetchUserDetails);
userRoutes.get('/profile/:id', auth.authMiddleware, userCtrl.userProfileCtrl); 

userRoutes.delete('/:id', userCtrl.deleteUserCtrl);

userRoutes.post('/forget-password-token', userCtrl.forgetPasswordTokenCtrl);
userRoutes.put('/reset-password', userCtrl.passwordResetCtrl);
userRoutes.put('/password', auth.authMiddleware, userCtrl.updateUserPasswordCtrl);// 必须要把这个route放在更新profile的前面，不然这个url中的pws会被认为是id，从而指向那一个url
userRoutes.put('/follow', auth.authMiddleware, userCtrl.followingUserCtrl);
userRoutes.put('/unfollow', auth.authMiddleware, userCtrl.unfollowUserCtrl);
userRoutes.post('/generate-verify-email-token', auth.authMiddleware, userCtrl.generateVerificationTokenCtrl);
userRoutes.put('/verify-account', auth.authMiddleware, userCtrl.accountVerificationCtrl);
userRoutes.put('/block-user/:id', auth.authMiddleware, userCtrl.blockUserCtrl);
userRoutes.put('/unblock-user/:id', auth.authMiddleware, userCtrl.unBlockUserCtrl);
userRoutes.put("/", auth.authMiddleware, userCtrl.updateUserCtrl);

module.exports = userRoutes;