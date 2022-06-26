const AWS_S3 = require('../config/aws/s3Config');
const fs = require('fs');

const s3UploadProfileImg = async (name, path) => {
    try {
        const filename = `profile-photo/${name}`;
        const fileContent = fs.readFileSync(path);
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: filename,
            Body: fileContent
          }
        const data = await AWS_S3.upload(params).promise();
        return { url: data.Location };
    } catch (error) {
        return error;
    }
};

const s3UploadPostImg = async (name, path) => {
    if(!name) return;
    try {
        const filename = `post-photo/${name}`;
        const fileContent = fs.readFileSync(path);
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: filename,
            Body: fileContent
          }
        const data = await AWS_S3.upload(params).promise();
        return { url: data.Location };
    } catch (error) {
        return error;
    }
};

module.exports = { 
    s3UploadProfileImg,
    s3UploadPostImg
};