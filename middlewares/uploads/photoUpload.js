const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
//storage
const multerStorage = multer.memoryStorage();

//file type checking
const multerFilter = (req, file, callback) => {
    if(file.mimetype.startsWith("image")) {
        callback(null, true);
    }
    else {
        //reject file
        callback({
            message: "Unsupported file type"
        }, 
        false);
    }
};

const photoUpload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: {fileSize: 1000000}
});

//image resizing
const profilePhotoResize = async (req, res, next) => {
    //check if there is no file
    if(!req.file) return next();
    req.file.filename = `user-${Date.now()}-${req.file.originalname}`;

    await sharp(req.file.buffer).
        resize({ width: 250, height: 250 }).
        toFormat('jpeg').
        jpeg({ quality: 90}).
        toFile(path.join(`public/images/profile/${req.file.filename}`));
    next();
};

//image resizing
const postImgResize = async (req, res, next) => {
    //check if there is no file
    if(!req.file) return next();
    req.file.filename = `user-${Date.now()}-${req.file.originalname}`;

    await sharp(req.file.buffer).
        resize({ width: 500, height: 500 }).
        toFormat('jpeg').
        jpeg({ quality: 90}).
        toFile(path.join(`public/images/posts/${req.file.filename}`));
    next();
};

module.exports = { 
    photoUpload,
    profilePhotoResize,
    postImgResize
};
