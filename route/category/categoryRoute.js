const express = require('express');

const categoryCtrl = require('../../controllers/category/categoryCtrl');
const auth = require('../../middlewares/auth/authMiddleware');

const categoryRoute = express.Router();

categoryRoute.post('/', auth.authMiddleware, categoryCtrl.createCategoryCtrl);

categoryRoute.get('/', categoryCtrl.fetchAllCategoryCtrl);
categoryRoute.get('/:id', categoryCtrl.fetchCategoryCtrl);

categoryRoute.put('/:id', auth.authMiddleware, categoryCtrl.updateCategoryCtrl);

categoryRoute.delete('/:id', auth.authMiddleware, categoryCtrl.deleteCategoryCtrl);

module.exports = categoryRoute;