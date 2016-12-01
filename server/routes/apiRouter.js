const apiRouter = require('express').Router(),
    passport = require('passport');

module.exports = function (User, File) {
    'use strict';

    const apiController = require('../controllers/apiController')(User, File);

    apiRouter.use(apiController.handleIncomeData);

    apiRouter.route('/search')
        .get(passport.authenticate('bearer', { session: false }), apiController.search);

    apiRouter.route('/*')
        .all(apiController.checkParams)
        .all(passport.authenticate('bearer', { session: false }))
        .get(apiController.get)
        .post(apiController.post)
        .put(apiController.put)
        .patch(apiController.patch)
        .head(apiController.head)
        .delete(apiController.remove);

    return apiRouter;
};