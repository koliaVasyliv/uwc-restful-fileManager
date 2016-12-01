const userRouter = require('express').Router(),
    passport = require('passport');

module.exports = function (User, Token) {
    'use strict';

    const userController = require('../controllers/userController')(User, Token);

    userRouter.route('/')
        .get(userController.index);

    userRouter.route('/login')
        .get((req, res) => res.render('login'))
        .post(passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/login'
        }));

    userRouter.route('/signup')
        .get((req, res) => res.render('signup'))
        .post(userController.createUser);

    userRouter.route('/token')
        .all(userController.checkAuthentication)
        .get(userController.getToken)
        .post(userController.postToken);

    userRouter.route('/logout')
        .get(userController.logout);

    return userRouter;
};

