const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const db = require("./config/db/dbConnect");
const userRoutes = require("./route/users/usersRoute");
const postRoutes = require("./route/posts/postsRoute");
const commentRoutes = require("./route/comments/commentsRoute");
const emailMsgRoutes = require("./route/emailMsg/emailMsgRoute");
const categoryRoutes = require("./route/category/categoryRoute");
const errorHandler = require("./middlewares/error/errorHandler");
const app = express();

//DB
db.dbConnect();

//Middleware
app.use(express.json());
//cors
app.use(cors());
//route to user controller
app.use("/api/users", userRoutes);
//route to post controller
app.use("/api/posts", postRoutes);
//route to comment controller
app.use("/api/comments", commentRoutes);
//route to email message controller
app.use("/api/messages", emailMsgRoutes);
//route to category controlloer
app.use("/api/category", categoryRoutes);


//err handler
app.use(errorHandler.notFound);
app.use(errorHandler.errorHandler);

// server
const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`Server is running ${PORT}`));