const expressAsyncHandler = require('express-async-handler');
const badFilter = require('bad-words');
const fs = require('fs');

const Post = require('../../model/post/post');
const User = require('../../model/user/user'); //一定注意！这个地方路径里的U是大写，直接把User类import过来
const validateMongodbId = require("../../utils/validateMongodbID");
const s3 = require("../../utils/s3");
const exp = require('constants');

//create a post
const createPostCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req?.user;
    //validateMongodbId.validateMongodbId(req.body.user);
    //check for bad words
    const filter = new badFilter();
    const isProfane = filter.isProfane(req.body.title, req.body.description);

    //block a user
    if(isProfane) {
        const user = await User.findByIdAndUpdate(id, {
            isBlocked: true
        });
        throw new Error('Creating failed because it contains profane words and you have been labelled as Dangerous User');
    }

    const localPath = `public/images/posts/${req?.file?.filename}`;
    const fileName = req?.file?.filename;
    // 2 upload to S3 and get url
    const imgUploaded = await s3.s3UploadPostImg(fileName, localPath);

    //store blog
    try {
        const post = await Post.create({
            ...req.body, 
            image: imgUploaded?.url,
            user: id,
        });
        //remove local img
        if(fileName) fs.unlinkSync(localPath);

        res.json(post);
    } catch (error) {
        res.json(error);
    }
});

//fetch all posts
const fetchPostsCtrl = expressAsyncHandler(async (req, res) => {
    const hasCategory = req?.query?.category;

    try {
        if(hasCategory) {
            const posts = await Post.find({category: hasCategory}).populate('user').populate('comments').sort('-createdAt'); //把user id展开成user信息
            res.json(posts);
        }
        else {
            const posts = await Post.find({}).populate('user').populate('comments').sort('-createdAt'); //把user id展开成user信息
            res.json(posts);
        }
    } catch (error) {
        res.json(error);
    }
    
});

//fetch a single post
const fetchPostCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req?.params;
    validateMongodbId.validateMongodbId(id);
    try {
        const post = await Post.findById(id).populate('user').populate('likes').populate('dislikes').populate('comments');
        //update number of views
        await Post.findByIdAndUpdate(id, {
            $inc: {numViews: 1}
        },{
            new: true
        });
        res.json(post);
    } catch (error) {
        res.json(error);
    }
});

//update post
const updatePostCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req?.params;
    validateMongodbId.validateMongodbId(id);
    try {
        const post = await Post.findByIdAndUpdate(id, {
            ...req.body,
        },
        {
            new: true
        });
        res.json(post)
    } catch (error) {
        res.json(error);
    }
});

//delete post
const deletePostCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req?.params;
    validateMongodbId.validateMongodbId(id);
    try {
        const post = await Post.findByIdAndDelete(id);
        res.json(post);
    } catch (error) {
        res.json(error);
    };
});

//like a post
const toggleAddLikeToPostCtrl = expressAsyncHandler(async (req, res) => {
    //find the post to be liked
    const { postId } = req.body;
    const post = await Post.findById(postId);
    //find the login user
    const loginUserId = req?.user?.id;
    //find if this user already like or dislike
    const isLiked = post?.isLiked;
    const alreadyDisliked = post?.dislikes?.find(userId => userId?.toString() === loginUserId.toString());
    //remove the user from dislikes if exists
    if(alreadyDisliked) {
        const post = await Post.findByIdAndUpdate(postId, {
            $pull: {dislikes: loginUserId},
            isDisliked: false
        }, {
            new: true
        });
    }
    //toggle
    //remove the user if he has liked the post
    if(isLiked) {
        const post = await Post.findByIdAndUpdate(postId, {
            $pull: { likes: loginUserId},
            isLiked: false
        }, {
            new: true
        });
        res.json(post);
    }
    else {
        const post = await Post.findByIdAndUpdate(postId, {
            $push: { likes: loginUserId},
            isLiked: true
        }, {
            new: true
        });
        res.json(post);
    }
});

//dislike a post
const toggleAddDislikeToPostCtrl = expressAsyncHandler(async (req, res, next) => {
    //find the post to be disliked
    const { postId } = req.body;
    const post = await Post.findById(postId);
    //find the login user
    const loginUserId = req?.user?.id;
    //check if this user has already dislike
    const isDisliked = post?.isDisliked;
    //check if already like this post
    const alreadyLiked = post?.likes?.find(userId => userId.toString() === loginUserId.toString());
    //remove this user from likes array if exists
    if(alreadyLiked) {
        const post = await Post.findByIdAndUpdate(postId, {
            $pull: {likes: loginUserId},
            isLiked: false
        }, {
            new: true
        });
    }
    //toggle
    //remove this user from dislikes if already exists
    if(isDisliked) {
        const post = await Post.findByIdAndUpdate(postId, {
            $pull: {dislikes: loginUserId},
            isDisliked: false
        }, {
            new: true
        });
        res.json(post);
    }
    else {
        const post = await Post.findByIdAndUpdate(postId, {
            $push: {dislikes: loginUserId},
            isDisliked: true
        }, {
            new: true
        });
        res.json(post);
    }
});



module.exports = {
    createPostCtrl,
    fetchPostsCtrl,
    fetchPostCtrl,
    updatePostCtrl,
    deletePostCtrl,
    toggleAddLikeToPostCtrl,
    toggleAddDislikeToPostCtrl
};