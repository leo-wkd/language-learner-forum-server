const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Post title is required'],
        trim: true,
    },
    category: {
        type: String,
        required: [true, 'Post category is required'],
        //default: "All"
    },
    isLiked: {
        type: Boolean,
        default: false
    },
    isDisliked: {
        type: Boolean,
        default: false
    },
    numViews: {
        type: Number,
        default: 0
    },
    likes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
    ],
    dislikes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
    ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Author is required"]
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: "https://cdn.pixabay.com/photo/2016/11/21/03/56/landscape-1844226_960_720.png"
    }
},{
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    },
    timestamps: true
});

//populate comments of a post
postSchema.virtual('comments', {
    ref: 'Comment',
    foreignField: 'post',
    localField: '_id'
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;

