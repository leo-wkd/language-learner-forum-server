const expressAsyncHandler = require("express-async-handler");

const Category = require("../../model/category/category");

//create a new category
const createCategoryCtrl = expressAsyncHandler(async (req, res) => {
    try {
        const category = await Category.create({
            user: req.user.id,
            title: req.body.title,
        });
        res.json(category);
    } catch (error) {
        res.json(error);
    }
});

//fetch all category
const fetchAllCategoryCtrl = expressAsyncHandler(async (req, res) => {
    try {
        const categories = await Category.find({}).populate("user").sort("-createdAt");
        res.json(categories);
    } catch (error) {
        res.json(error);
    }
});

//fetch a category
const fetchCategoryCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req?.params;
    //console.log(id);
    try {
        const category = await Category.findById(id).populate('user');
        res.json(category);
    } catch (error) {
        res.json(error);
    }
});

//update a category
const updateCategoryCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req?.params;
    try {
        const category = await Category.findByIdAndUpdate(id, {
            title: req.body?.title
        }, {
            new: true,
            runValidators: true
        });
        res.json(category);
    } catch (error) {
        res.json(error);
    }
});

//delete a category
const deleteCategoryCtrl = expressAsyncHandler(async (req, res) => {
    const { id } = req?.params;
    try {
        const category = await Category.findByIdAndDelete(id);
        res.json(category);
    } catch (error) {
        res.json(error);
    }
});

module.exports = {
    createCategoryCtrl,
    fetchAllCategoryCtrl,
    fetchCategoryCtrl,
    updateCategoryCtrl,
    deleteCategoryCtrl
};