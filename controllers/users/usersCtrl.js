const expressAsyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const fs = require("fs");

const User = require("../../model/user/user") //这个地方import过来的直接是User类（大写的U）
const token = require("../../config/token/generateToken");
const validateMongodbId = require("../../utils/validateMongodbID");
const s3 = require("../../utils/s3");
const Email = require("../../config/mail/mail");

// register a new user
const registerUserCtrl = expressAsyncHandler(async(req, res) => { 
    // check if the user is already registered
    const userExists = await User.findOne({email: req?.body?.email});
    if(userExists) throw new Error("User already exists!");
    
    try {
        const user = await User.create( { // create方法传进去的是个json而不是firstName等这些属性
            firstName: req?.body?.firstName,
            lastName: req?.body?.lastName,
            email: req?.body?.email,
            password: req?.body?.password
        });
        res.json(user);
    } catch (error) {
        res.json(error);
    }
});


// login a user
const loginUserCtrl = expressAsyncHandler(async (req, res) => {
    //check if user exists
    const { email, password } = req.body;
    const userFound = await User.findOne({ email });
    if(!userFound) {
        throw new Error(`User not found`);
    }
    //check if password is correct
    if(userFound && (await userFound.isPasswordMatched(password))) {
        res.json({
            _id: userFound?._id,
            firstName: userFound?.firstName,
            lastName: userFound?.lastName,
            email: userFound?.email,
            profilePhoto: userFound?.profilePhoto,
            isAdmin: userFound?.isAdmin,
            token: token.generateToken(userFound?._id),
            isVerified: userFound?.isAccountVerified
        });
    }
    else {
        res.status(401);
        throw new Error(`Invalid Login credentials`);
    }
});

// fetch all users
const fetchUserCtrl = expressAsyncHandler(async (req, res) => {
    try {
        const users = await User.find({}).populate('posts');
        res.json(users);
    } catch (error) {
        res.status(error);
    }
});

//delete user
const deleteUserCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req.params; // param是个object，所以这么取出id属性的值
    // check if id is valid
    validateMongodbId.validateMongodbId(id);

    try {
        const deletedUser = await User.findByIdAndDelete(id);
        res.json(deletedUser);
    } catch (error) {
        res.json(error);
    }
});

//user details
const fetchUserDetails = expressAsyncHandler(async (req, res) => {
    const { id } = req.params; // param是从url中直接拿信息，而body是通过json形式传信息
    validateMongodbId.validateMongodbId(id);

    try {
        const user = await User.findById(id);
        res.json(user);
    } catch (error) {
        res.json(error);
    }
});

//user profile for login user to see their own profile
const userProfileCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req?.params; // authMiddleware insert user into req, we get user id from token
    validateMongodbId.validateMongodbId(id);
    //viewedBy implemented here
    //1 find the login use
    //2 check if the user exists in ViewedBy
    const loginUserId = req?.user?._id?.toString();

    try {
        const myProfile = await User.findById(id).populate('posts').populate('viewedBy');
        const alreadyViewed = myProfile?.viewedBy?.find(user => {
            return user?._id?.toString() === loginUserId;
        })
        if(alreadyViewed || loginUserId.toString() === id) {
            res.json(myProfile);
        }
        else {
            const profile = await User.findByIdAndUpdate(id, {
                $push: {viewedBy: loginUserId}
            },
            {
                new: true
            });
            res.json(profile);
        }
        
    } catch (error) {
        res.json(error);
    }
});

//update user profile
const updateUserCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req?.user; // authMiddleware insert user into req, we get user id from token
    validateMongodbId.validateMongodbId(id);

    const user = await User.findByIdAndUpdate( id, 
    {
        firstName: req?.body?.firstName,
        lastName: req?.body?.lastName,
        email: req?.body?.email,
        bio: req?.body?.bio,
    }, 
    {
        new: true, 
        runValidators: true
    }
    );
    res.json(user);
});

//change pwd
const updateUserPasswordCtrl = expressAsyncHandler(async (req, res) => {
    //destructure the login user
    const { id } = req?.user; // get user id from token
    const { password } = req?.body; // the new password

    validateMongodbId.validateMongodbId(id);
    //find user by id
    const user = await User.findById(id);

    if(password) {
        user.password = password;
        const updatedUser = await user.save();
        res.json(updatedUser);
    }
    else {
        throw new Error("No password provided");
    }
});

// follow a user
const followingUserCtrl = expressAsyncHandler(async (req, res) => {
    // 1. find the user you want to follow and update its followers field
    // 2. update the login user following field
    const { followId } = req?.body;
    const loginUserId = req?.user?.id; // 这里为了把user里面的id属性改名成loginUserId所以不能直接用{id}取出id的值
    validateMongodbId.validateMongodbId(followId);
    validateMongodbId.validateMongodbId(loginUserId);

    // find the target user and check if already follow
    const targetUser = await User.findById(followId);
    const alreadyFollowing = targetUser?.followers?.find(
        user => user?.toString() === loginUserId.toString()
    );
    if(alreadyFollowing) throw new Error('You have already followed this user');

    await User.findByIdAndUpdate(followId, {
        $push:{followers: loginUserId},
        isFollowing: true
    },
    {
        new: true
    });
    await User.findByIdAndUpdate(loginUserId, {
        $push:{following: followId}
    },
    {
        new: true
    });
    res.json("You have successfully followed this user");
});
//unfollow a user
const unfollowUserCtrl = expressAsyncHandler(async (req, res) => {
    //logic is same as follow
    const { unFollowId } = req?.body;
    const loginUserId = req?.user?.id; // 这里为了把user里面的id属性改名成loginUserId所以不能直接用{id}取出id属性的值
    validateMongodbId.validateMongodbId(unFollowId);
    validateMongodbId.validateMongodbId(loginUserId);

    await User.findByIdAndUpdate(unFollowId, {
        $pull:{followers: loginUserId},
        isFollowing: false
    },
    {
        new: true
    });
    await User.findByIdAndUpdate(loginUserId, {
        $pull:{following: unFollowId}
    },
    {
        new: true
    });
    res.json("You have successfully unfollowed this user");
});

//block a user
const blockUserCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req?.params;
    validateMongodbId.validateMongodbId(id);
    const user = await User.findByIdAndUpdate(id, {
        isBlocked: true
    },
    {
        new: true
    });
    res.json(user);
});
//unblock a user
const unBlockUserCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req?.params;
    validateMongodbId.validateMongodbId(id);
    const user = await User.findByIdAndUpdate(id, {
        isBlocked: false
    },
    {
        new: true
    });
    res.json(user);
});

//generate email verification token
const generateVerificationTokenCtrl = expressAsyncHandler(async (req, res) => {
    const loginUserId = req?.user?.id;
    const user = await User.findById(loginUserId);
    //console.log(user);
    try {
        // generate token for this user
        const verificationToken = await user.createAccountVerificationToken();
        await user.save();
        // build msg and send email 
        // console.log(verificationToken);
        const resetURL = `If you were requested to verify your account, verify now within 10 minutes, \
                            otherwise ignore this message. <a href="https://blog-app-kaiduo.netlify.app/verify-account/${verificationToken}">Click to verify your account</a>`;
        const msg = {
            from: "leo97wang@gmail.com", // Sender email
            to: user.email, // Receiver email
            subject: "Account Verification", // Title email
            text: "This is a verification message", // Text in email
            html: resetURL, // Html in email
        }

        await Email.sendEmail(msg);

        res.json(verificationToken);
    } catch (error) {
        res.json(error);
    }
});
//account verification
const accountVerificationCtrl = expressAsyncHandler(async (req, res) => {
    const { token } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // find user by token
    const userFound = await User.findOne({
        accountVerificationToken: hashedToken,
        accountVerificationTokenExpires: { $gt: new Date() }
    })
    if(!userFound) throw new Error("Token expired, try again later");
    // else update the property to true
    userFound.isAccountVerified = true;
    userFound.accountVerificationToken = undefined;
    userFound.accountVerificationTokenExpires = undefined;
    await userFound.save();

    res.json(userFound);
});

// forget password, generate token
const forgetPasswordTokenCtrl = expressAsyncHandler(async (req, res) => {
    // find the user by email
    const { email } = req.body;
    const user = await User.findOne({ email });
    if(!user) throw new Error("User not found");

    try {
        // generate pwd reset token for this user
        const token = await user.createPasswordResetToken();
        await user.save();

        // build msg and send by email
        
        const resetURL = `If you were requested to reset your password, reset now within 10 minutes, \
                            otherwise ignore this message. <a href="https://blog-app-kaiduo.netlify.app/reset-password/${token}">Click to reset your password</a>`;
        const msg = {
            from: "leo97wang@gmail.com", // Sender email
            to: email, // Receiver email
            subject: "Reset Password", // Title email
            text: "This is a password reset message", // Text in email
            html: resetURL, // Html in email
        }

        await Email.sendEmail(msg);

        res.send(msg);
    } catch (error) {
        res.send(error);
    }
});
//password reset
const passwordResetCtrl = expressAsyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // find this user by token
    const userFound = await User.findOne({ 
        passwordResetToken: hashedToken,
        passwordResetTokenExpires: { $gt: new Date() }
     });
    if(!userFound) throw new Error("Token expired, try again later");
    // change the password
    userFound.password = password;
    userFound.passwordResetToken = undefined;
    userFound.passwordResetTokenExpires = undefined;
    await userFound.save();
    
    res.json(userFound);
});

//profile photo upload
const ProfilePhotoUploadCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req?.user;
    // 1 get the path to the image
    const localPath = `public/images/profile/${req.file.filename}`;
    const fileName = req.file.filename;
    // 2 upload to S3 and get url
    const imgUploaded = await s3.s3UploadProfileImg(fileName, localPath);
    
    const userFound = await User.findByIdAndUpdate(id, {
        profilePhoto: imgUploaded.url
    },
    {
        new: true
    });
    //remove local img
    fs.unlinkSync(localPath);

    res.json(userFound);
});



module.exports = { 
    registerUserCtrl, 
    loginUserCtrl, 
    fetchUserCtrl, 
    deleteUserCtrl, 
    fetchUserDetails, 
    userProfileCtrl,
    updateUserCtrl,
    updateUserPasswordCtrl,
    followingUserCtrl,
    unfollowUserCtrl,
    blockUserCtrl,
    unBlockUserCtrl,
    generateVerificationTokenCtrl,
    accountVerificationCtrl,
    forgetPasswordTokenCtrl,
    passwordResetCtrl,
    ProfilePhotoUploadCtrl
 };