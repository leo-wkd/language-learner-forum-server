const mongoose = require("mongoose");

const bcrypt = require("bcryptjs");

const crypto = require("crypto");

//create schema
const userSchema = new mongoose.Schema(
    {
        firstName: {
            required: [true, "First name is required"],
            type: String,
        },
        lastName: {
            required: [true, "Last name is required"],
            type: String,
        },
        profilePhoto: {
            type: String,
            default:
                "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
        },
        email: {
            type: String,
            required: [true, "Email is required"],
        },
        bio: {
            type: String,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        postCount: {
            type: Number,
            default: 0,
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        role: {
            type: String,
            enum: ["Admin", "Guest", "Blogger"],
        },
        isFollowing: {
            type: Boolean,
            default: false,
        },
        isUnFollowing: {
            type: Boolean,
            default: false,
        },
        
        isAccountVerified: { 
            type: Boolean, 
            default: false 
        },
        accountVerificationToken: String,
        accountVerificationTokenExpires: Date,

        viewedBy: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId, // 方便插入与查找
                    ref: "User",
                },
            ],
        },

        followers: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            ],
        },
        following: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            ],
        },

        passwordChangeAt: Date,
        passwordResetToken: String,
        passwordResetTokenExpires: Date,

        active: {
            type: Boolean,
            default: false,
        },
    },
    {
        toJSON: {
            virtuals: true,
        },
        toObject: {
            virtuals: true,
        },
        timestamps: true,
    }
);

//virtual method to populate a user's post
userSchema.virtual('posts', {
    ref: 'Post',
    foreignField: 'user',
    localField: "_id"
});

//acount type
userSchema.virtual('accountType').get(function(){
    const totalFollowers = this.followers?.length;
    return totalFollowers >= 1 ? 'Pro Account' : 'Starter Account';
});


//hash password
userSchema.pre('save', async function (next) {
    if(!this.isModified("password")) { // if user didn't change password
        next(); 
    }
    //hash pwd
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

//match password
userSchema.methods.isPasswordMatched = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

//verify account
userSchema.methods.createAccountVerificationToken = async function () {
    //create a token
    const verificationToken = crypto.randomBytes(32).toString('hex'); //random text
    this.accountVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex'); // hash token and store in db
    this.accountVerificationTokenExpires = Date.now() + 10*60*1000; // 10 minutes
    return verificationToken;
};

//password reset
userSchema.methods.createPasswordResetToken = async function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetTokenExpires = Date.now() + 10*60*1000;
    return resetToken;
};

//Compile schema into model
const User = mongoose.model("User", userSchema);

module.exports = User;
