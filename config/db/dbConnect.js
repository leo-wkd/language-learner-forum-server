const mongoose = require('mongoose');

module.exports.dbConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL, 
        {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        });
        console.log('DB is Connected successfully');
    } catch (error) {
        console.log('Error ' + error.message);
    }
};